.PHONY: build dev deploy test clean check-size

# Build WASM binary
build:
	go run github.com/syumai/workers/cmd/workers-assets-gen@v0.31.0 -mode=go
	GOOS=js GOARCH=wasm go build -ldflags="-s -w" -trimpath -o ./build/app.wasm .

# Check binary size (target: < 8MB, hard limit: 10MB)
check-size: build
	@size=$$(stat -f%z ./build/app.wasm 2>/dev/null || stat -c%s ./build/app.wasm); \
	mb=$$(echo "scale=2; $$size / 1048576" | bc); \
	echo "Binary size: $${mb}MB"; \
	if [ $$size -gt 10485760 ]; then echo "ERROR: Exceeds 10MB limit!"; exit 1; fi; \
	if [ $$size -gt 8388608 ]; then echo "WARNING: Exceeds 8MB target"; fi

# Run tests (native, not WASM)
test:
	go test ./internal/...

# Local development
dev: build
	npx wrangler dev

# Deploy to Cloudflare
deploy: check-size
	npx wrangler deploy

# Clean build artifacts
clean:
	rm -rf ./build
