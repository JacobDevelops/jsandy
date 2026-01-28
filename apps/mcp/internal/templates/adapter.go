package templates

import (
	"fmt"
	"strings"
)

// AdapterParams defines parameters for generating a PubSubAdapter.
type AdapterParams struct {
	Name        string // adapter class/variable name
	Platform    string // "upstash", "cloudflare-queue", or "custom"
	Description string // description comment
}

// RenderPubSubAdapter generates a PubSubAdapter implementation.
func RenderPubSubAdapter(p AdapterParams) string {
	var b strings.Builder

	switch p.Platform {
	case "upstash":
		renderUpstashAdapter(&b, p)
	case "cloudflare-queue":
		renderCloudflareQueueAdapter(&b, p)
	default:
		renderCustomAdapter(&b, p)
	}

	return b.String()
}

func renderUpstashAdapter(b *strings.Builder, p AdapterParams) {
	b.WriteString("import { UpstashRestPubSub } from \"@jsandy/rpc/adapters\";\n\n")

	if p.Description != "" {
		fmt.Fprintf(b, "/** %s */\n", p.Description)
	}

	fmt.Fprintf(b, "export const %s = new UpstashRestPubSub(\n", p.Name)
	b.WriteString("\tprocess.env.UPSTASH_REDIS_REST_URL!,\n")
	b.WriteString("\tprocess.env.UPSTASH_REDIS_REST_TOKEN!,\n")
	b.WriteString(");\n\n")

	b.WriteString("// Configure with router:\n")
	b.WriteString("// const myRouter = router({ ... }).config({\n")
	fmt.Fprintf(b, "//   getPubSubAdapter: () => %s,\n", p.Name)
	b.WriteString("// });\n")
}

func renderCloudflareQueueAdapter(b *strings.Builder, p AdapterParams) {
	b.WriteString("import { CloudflareQueuePubSub } from \"@jsandy/rpc/adapters\";\n")
	b.WriteString("import type { CFQueuesBinding } from \"@jsandy/rpc/adapters\";\n\n")

	if p.Description != "" {
		fmt.Fprintf(b, "/** %s */\n", p.Description)
	}

	fmt.Fprintf(b, "export function create%s(queue: CFQueuesBinding) {\n", strings.Title(p.Name))
	b.WriteString("\treturn new CloudflareQueuePubSub(queue);\n")
	b.WriteString("}\n\n")

	b.WriteString("// Configure with router:\n")
	b.WriteString("// const myRouter = router({ ... }).config({\n")
	fmt.Fprintf(b, "//   getPubSubAdapter: (c) => create%s(c.env.MY_QUEUE),\n", strings.Title(p.Name))
	b.WriteString("// });\n")
}

func renderCustomAdapter(b *strings.Builder, p AdapterParams) {
	b.WriteString("import type { PubSubAdapter, SubscribeOptions } from \"@jsandy/rpc/adapters\";\n\n")

	if p.Description != "" {
		fmt.Fprintf(b, "/** %s */\n", p.Description)
	}

	fmt.Fprintf(b, "export class %s implements PubSubAdapter {\n", strings.Title(p.Name))
	b.WriteString("\tasync publish(topic: string, payload: unknown): Promise<void> {\n")
	b.WriteString("\t\t// TODO: Implement publish logic\n")
	b.WriteString("\t\t// Send the payload to all subscribers of the topic\n")
	b.WriteString("\t}\n\n")
	b.WriteString("\tasync subscribe(\n")
	b.WriteString("\t\ttopic: string,\n")
	b.WriteString("\t\tonMessage: (payload: unknown) => void,\n")
	b.WriteString("\t\toptions?: SubscribeOptions,\n")
	b.WriteString("\t): Promise<void> {\n")
	b.WriteString("\t\t// TODO: Implement subscribe logic\n")
	b.WriteString("\t\t// Listen for messages on the topic and call onMessage\n")
	b.WriteString("\t}\n")
	b.WriteString("}\n")
}
