#!/usr/bin/env bash
# Smoke test for the JSandy MCP server.
# Usage: ./scripts/smoke-test.sh [base_url]
# Default: https://mcp.jsandy.com

set -euo pipefail

BASE_URL="${1:-https://mcp.jsandy.com}"
MCP_URL="${BASE_URL}/mcp"
HEALTH_URL="${BASE_URL}/health"
PASS=0
FAIL=0

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
bold()  { printf "\033[1m%s\033[0m\n" "$1"; }

check() {
  local name="$1"
  local ok="$2"
  if [ "$ok" = "true" ]; then
    green "  PASS: $name"
    PASS=$((PASS + 1))
  else
    red "  FAIL: $name"
    FAIL=$((FAIL + 1))
  fi
}

# Timed curl: returns body and prints elapsed time
timed_post() {
  local url="$1"
  local data="$2"
  local start end elapsed
  start=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1e9))')
  body=$(curl -s -X POST "$url" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d "$data")
  end=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1e9))')
  elapsed=$(( (end - start) / 1000000 ))
  echo "$body"
  echo "  (${elapsed}ms)" >&2
}

# Extract text from SSE or plain JSON response
extract_json() {
  local input="$1"
  # If SSE, extract first data line
  if echo "$input" | grep -q "^data:"; then
    echo "$input" | grep "^data:" | head -1 | sed 's/^data: *//'
  else
    echo "$input"
  fi
}

bold "JSandy MCP Server Smoke Test"
echo "Target: $BASE_URL"
echo ""

# --- Test 1: Health endpoint ---
bold "1. Health Endpoint"
health_resp=$(curl -s "$HEALTH_URL")
health_status=$(echo "$health_resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
check "GET /health returns status ok" "$([ "$health_status" = "ok" ] && echo true || echo false)"

# --- Test 2: MCP Initialize ---
bold "2. MCP Initialize"
init_raw=$(timed_post "$MCP_URL" '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-03-26",
    "clientInfo": {"name": "smoke-test", "version": "1.0.0"},
    "capabilities": {}
  }
}')
init_resp=$(extract_json "$init_raw")

server_name=$(echo "$init_resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('serverInfo',{}).get('name',''))" 2>/dev/null || echo "")
check "Initialize returns server name" "$([ "$server_name" = "jsandy-mcp" ] && echo true || echo false)"

has_tools=$(echo "$init_resp" | python3 -c "import sys,json; caps=json.load(sys.stdin).get('result',{}).get('capabilities',{}); print('true' if 'tools' in caps else 'false')" 2>/dev/null || echo "false")
check "Initialize advertises tool capabilities" "$has_tools"

# --- Test 3: Tools List ---
bold "3. Tools List"
list_raw=$(timed_post "$MCP_URL" '{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}')
list_resp=$(extract_json "$list_raw")

tool_count=$(echo "$list_resp" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('result',{}).get('tools',[])))" 2>/dev/null || echo "0")
check "tools/list returns 20 tools" "$([ "$tool_count" -ge 20 ] && echo true || echo false)"
echo "  (found $tool_count tools)"

# Check specific tools exist
for tool in create_procedure validate_procedure lookup_api analyze_code search_docs hello; do
  has_tool=$(echo "$list_resp" | python3 -c "
import sys,json
tools=json.load(sys.stdin).get('result',{}).get('tools',[])
names=[t['name'] for t in tools]
print('true' if '$tool' in names else 'false')
" 2>/dev/null || echo "false")
  check "Tool '$tool' registered" "$has_tool"
done

# --- Test 4: Codegen Tool Call ---
bold "4. Codegen: create_procedure"
codegen_raw=$(timed_post "$MCP_URL" '{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "create_procedure",
    "arguments": {
      "name": "getUser",
      "type": "query",
      "inputSchema": "id: string (required)"
    }
  }
}')
codegen_resp=$(extract_json "$codegen_raw")

has_import=$(echo "$codegen_resp" | python3 -c "
import sys,json
r=json.load(sys.stdin).get('result',{})
content=r.get('content',[])
text=''.join(c.get('text','') for c in content)
print('true' if '@jsandy/rpc' in text else 'false')
" 2>/dev/null || echo "false")
check "create_procedure returns @jsandy/rpc import" "$has_import"

has_query=$(echo "$codegen_resp" | python3 -c "
import sys,json
r=json.load(sys.stdin).get('result',{})
content=r.get('content',[])
text=''.join(c.get('text','') for c in content)
print('true' if '.query(' in text else 'false')
" 2>/dev/null || echo "false")
check "create_procedure generates .query() handler" "$has_query"

# --- Test 5: Validation Tool Call ---
bold "5. Validate: check_zod_v4_compliance"
validate_raw=$(timed_post "$MCP_URL" '{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "check_zod_v4_compliance",
    "arguments": {
      "code": "const schema = z.object({}).strict();\nconst x = z.nativeEnum(Foo);"
    }
  }
}')
validate_resp=$(extract_json "$validate_raw")

has_issues=$(echo "$validate_resp" | python3 -c "
import sys,json
r=json.load(sys.stdin).get('result',{})
content=r.get('content',[])
text=''.join(c.get('text','') for c in content)
print('true' if 'deprecated' in text.lower() or 'error' in text.lower() else 'false')
" 2>/dev/null || echo "false")
check "check_zod_v4_compliance detects anti-patterns" "$has_issues"

# --- Test 6: Lookup Tool Call ---
bold "6. Lookup: lookup_api"
lookup_raw=$(timed_post "$MCP_URL" '{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "lookup_api",
    "arguments": {
      "name": "procedure"
    }
  }
}')
lookup_resp=$(extract_json "$lookup_raw")

has_content=$(echo "$lookup_resp" | python3 -c "
import sys,json
r=json.load(sys.stdin).get('result',{})
content=r.get('content',[])
text=''.join(c.get('text','') for c in content)
print('true' if len(text) > 50 else 'false')
" 2>/dev/null || echo "false")
check "lookup_api returns documentation" "$has_content"

# --- Test 7: Analysis Tool Call ---
bold "7. Analysis: analyze_code"
analysis_raw=$(timed_post "$MCP_URL" '{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "analyze_code",
    "arguments": {
      "code": "import { jsandy } from \"@jsandy/rpc\";\nconst { procedure } = jsandy.init();\nexport const getUser = procedure.input(z.object({ id: z.string() })).query(async ({ c }) => c.superjson({}));"
    }
  }
}')
analysis_resp=$(extract_json "$analysis_raw")

has_analysis=$(echo "$analysis_resp" | python3 -c "
import sys,json
r=json.load(sys.stdin).get('result',{})
content=r.get('content',[])
text=''.join(c.get('text','') for c in content)
print('true' if 'Analysis' in text or 'Recommend' in text else 'false')
" 2>/dev/null || echo "false")
check "analyze_code returns analysis" "$has_analysis"

# --- Test 8: Error handling ---
bold "8. Error Handling"
error_raw=$(timed_post "$MCP_URL" '{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "create_procedure",
    "arguments": {}
  }
}')
error_resp=$(extract_json "$error_raw")

has_error=$(echo "$error_resp" | python3 -c "
import sys,json
r=json.load(sys.stdin)
result=r.get('result',{})
is_err=result.get('isError', False)
content=result.get('content',[])
text=''.join(c.get('text','') for c in content).lower()
print('true' if is_err or 'required' in text or 'error' in r else 'false')
" 2>/dev/null || echo "false")
check "Missing required param returns error" "$has_error"

# --- Summary ---
echo ""
bold "Results"
TOTAL=$((PASS + FAIL))
echo "  $PASS/$TOTAL passed"
if [ "$FAIL" -gt 0 ]; then
  red "  $FAIL failed"
  exit 1
else
  green "  All tests passed!"
fi
