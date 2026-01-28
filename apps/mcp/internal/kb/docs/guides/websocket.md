# WebSocket Guide

Create real-time WebSocket procedures with typed incoming and outgoing events.

## Creating a WebSocket Procedure

Use `.incoming()` and `.outgoing()` to define event schemas, then `.ws()` for the handler:

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";

const { procedure } = jsandy.init();

const wsChat = procedure
	.incoming({
		sendMessage: z.object({
			room: z.string(),
			text: z.string().min(1).max(1000),
		}),
		joinRoom: z.object({
			room: z.string(),
		}),
		leaveRoom: z.object({
			room: z.string(),
		}),
	})
	.outgoing({
		newMessage: z.object({
			room: z.string(),
			text: z.string(),
			userId: z.string(),
			timestamp: z.number(),
		}),
		userJoined: z.object({
			room: z.string(),
			userId: z.string(),
		}),
		userLeft: z.object({
			room: z.string(),
			userId: z.string(),
		}),
	})
	.ws(({ socket, io, ctx }) => {
		socket.on("sendMessage", async ({ room, text }) => {
			io.to(room).emit("newMessage", {
				room,
				text,
				userId: ctx.connectionId,
				timestamp: Date.now(),
			});
		});

		socket.on("joinRoom", async ({ room }) => {
			socket.join(room);
			io.to(room).emit("userJoined", { room, userId: ctx.connectionId });
		});

		socket.on("leaveRoom", async ({ room }) => {
			socket.leave(room);
			io.to(room).emit("userLeft", { room, userId: ctx.connectionId });
		});
	});

export { wsChat };
```

## Server-Side: ServerSocket and IO

Inside the `.ws()` handler:

- `socket` — the individual client connection (ServerSocket)
- `io` — the broadcast controller for rooms
- `ctx` — middleware context including `connectionId`

### ServerSocket Events

```typescript
.ws(({ socket, io, ctx }) => {
	// Listen for incoming events
	socket.on("eventName", async (data) => {
		// data is typed from .incoming() schema
	});

	// Handle disconnect
	socket.on("disconnect", async () => {
		console.log(`Client ${ctx.connectionId} disconnected`);
	});
});
```

### IO Broadcasting

```typescript
// Broadcast to a room
io.to("room-name").emit("eventName", { ... });

// Broadcast to multiple rooms
io.to(["room-1", "room-2"]).emit("eventName", { ... });

// Join a room
socket.join("room-name");

// Leave a room
socket.leave("room-name");
```

## Client-Side: ClientSocket

```typescript
import { createClient } from "@jsandy/rpc/client";
import type { AppRouter } from "./server/router";

const client = createClient<AppRouter>({
	baseUrl: "http://localhost:3000/api",
});

const socket = client.chat.wsChat.$ws();

// Listen for outgoing events (server-to-client)
socket.on("newMessage", (data) => {
	console.log(`[${data.room}] ${data.userId}: ${data.text}`);
});

socket.on("userJoined", (data) => {
	console.log(`${data.userId} joined ${data.room}`);
});

// Emit incoming events (client-to-server)
socket.emit("joinRoom", { room: "general" });
socket.emit("sendMessage", { room: "general", text: "Hello\!" });
```

## useWebSocket React Hook

```typescript
import { useWebSocket } from "@jsandy/rpc/client";
import type { AppRouter } from "./server/router";

function ChatRoom({ room }: { room: string }) {
	const { socket, connected } = useWebSocket<AppRouter["chat"]["wsChat"]>({
		url: "ws://localhost:3000/api/chat/wsChat",
	});

	useEffect(() => {
		if (\!socket || \!connected) return;

		socket.emit("joinRoom", { room });

		socket.on("newMessage", (msg) => {
			setMessages((prev) => [...prev, msg]);
		});

		return () => {
			socket.emit("leaveRoom", { room });
		};
	}, [socket, connected, room]);

	return <div>{connected ? "Connected" : "Connecting..."}</div>;
}
```

## Heartbeat and Reconnection

The client socket handles heartbeat and reconnection automatically. Configure via options:

```typescript
const socket = client.chat.wsChat.$ws({
	heartbeatInterval: 30000,  // ms between heartbeats (default: 30s)
	reconnect: true,           // auto-reconnect on disconnect
	reconnectInterval: 1000,   // ms between reconnection attempts
	maxReconnectAttempts: 10,  // max retry attempts
});

socket.on("disconnect", () => console.log("Disconnected"));
socket.on("reconnect", () => console.log("Reconnected"));
```
