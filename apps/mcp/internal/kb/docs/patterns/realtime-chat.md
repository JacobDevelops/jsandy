# Real-time Chat Pattern

WebSocket procedure for chat with rooms, broadcasting, and event schemas.

## Chat WebSocket Procedure

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";
import { authMiddleware } from "./middleware/auth";

const { procedure } = jsandy.init();

const wsChat = procedure
	.use(authMiddleware)
	.incoming({
		sendMessage: z.object({
			room: z.string(),
			text: z.string().min(1).max(2000),
		}),
		joinRoom: z.object({
			room: z.string(),
		}),
		leaveRoom: z.object({
			room: z.string(),
		}),
		startTyping: z.object({
			room: z.string(),
		}),
		stopTyping: z.object({
			room: z.string(),
		}),
	})
	.outgoing({
		newMessage: z.object({
			id: z.string(),
			room: z.string(),
			text: z.string(),
			userId: z.string(),
			username: z.string(),
			timestamp: z.number(),
		}),
		userJoined: z.object({
			room: z.string(),
			userId: z.string(),
			username: z.string(),
		}),
		userLeft: z.object({
			room: z.string(),
			userId: z.string(),
			username: z.string(),
		}),
		userTyping: z.object({
			room: z.string(),
			userId: z.string(),
			username: z.string(),
			isTyping: z.boolean(),
		}),
	})
	.ws(({ socket, io, ctx }) => {
		socket.on("joinRoom", async ({ room }) => {
			socket.join(room);
			io.to(room).emit("userJoined", {
				room,
				userId: ctx.user.id,
				username: ctx.user.name,
			});
		});

		socket.on("leaveRoom", async ({ room }) => {
			io.to(room).emit("userLeft", {
				room,
				userId: ctx.user.id,
				username: ctx.user.name,
			});
			socket.leave(room);
		});

		socket.on("sendMessage", async ({ room, text }) => {
			const message = {
				id: crypto.randomUUID(),
				room,
				text,
				userId: ctx.user.id,
				username: ctx.user.name,
				timestamp: Date.now(),
			};
			await db.messages.create(message);
			io.to(room).emit("newMessage", message);
		});

		socket.on("startTyping", async ({ room }) => {
			io.to(room).emit("userTyping", {
				room,
				userId: ctx.user.id,
				username: ctx.user.name,
				isTyping: true,
			});
		});

		socket.on("stopTyping", async ({ room }) => {
			io.to(room).emit("userTyping", {
				room,
				userId: ctx.user.id,
				username: ctx.user.name,
				isTyping: false,
			});
		});

		socket.on("disconnect", async () => {
			console.log(`User ${ctx.user.id} disconnected`);
		});
	});

export { wsChat };
```

## Chat Router with PubSub

```typescript
import { Hono } from "hono";
import { jsandy, mergeRouters } from "@jsandy/rpc";
import { UpstashRestPubSub } from "@jsandy/rpc/adapters";
import { wsChat } from "./procedures/chat";

const { defaults } = jsandy.init();

const pubsub = new UpstashRestPubSub({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const chatRouter = new Hono()
	.use(defaults.cors)
	.onError(defaults.errorHandler);

mergeRouters(chatRouter, { wsChat }, { pubsub });

export { chatRouter };
```

## Client-Side Chat Component

```typescript
import { useWebSocket } from "@jsandy/rpc/client";
import type { AppRouter } from "./server/router";

function ChatRoom({ room }: { room: string }) {
	const [messages, setMessages] = useState([]);
	const { socket, connected } = useWebSocket<AppRouter["chat"]["wsChat"]>({
		url: "ws://localhost:3000/api/chat/wsChat",
	});

	useEffect(() => {
		if (\!socket || \!connected) return;

		socket.emit("joinRoom", { room });

		socket.on("newMessage", (msg) => {
			setMessages((prev) => [...prev, msg]);
		});

		socket.on("userJoined", (data) => {
			console.log(`${data.username} joined ${data.room}`);
		});

		return () => {
			socket.emit("leaveRoom", { room });
		};
	}, [socket, connected, room]);

	const sendMessage = (text: string) => {
		socket?.emit("sendMessage", { room, text });
	};

	return (
		<div>
			{messages.map((msg) => (
				<div key={msg.id}>{msg.username}: {msg.text}</div>
			))}
		</div>
	);
}
```
