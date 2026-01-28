# Notification System Pattern

Real-time notifications using WebSocket with PubSub adapter for cross-instance delivery.

## Notification WebSocket Procedure

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";
import { authMiddleware } from "./middleware/auth";

const { procedure } = jsandy.init();

const wsNotifications = procedure
	.use(authMiddleware)
	.incoming({
		markRead: z.object({
			notificationId: z.string(),
		}),
		markAllRead: z.object({}),
	})
	.outgoing({
		newNotification: z.object({
			id: z.string(),
			type: z.enum(["message", "mention", "follow", "like", "system"]),
			title: z.string(),
			body: z.string(),
			link: z.optional(z.string()),
			timestamp: z.number(),
		}),
		notificationRead: z.object({
			notificationId: z.string(),
		}),
		unreadCount: z.object({
			count: z.number(),
		}),
	})
	.ws(({ socket, io, ctx }) => {
		// Join user-specific room for targeted notifications
		socket.join(`user:${ctx.user.id}`);

		// Send initial unread count
		db.notifications.countUnread(ctx.user.id).then((count) => {
			socket.emit("unreadCount", { count });
		});

		socket.on("markRead", async ({ notificationId }) => {
			await db.notifications.markRead(notificationId);
			socket.emit("notificationRead", { notificationId });
			const count = await db.notifications.countUnread(ctx.user.id);
			socket.emit("unreadCount", { count });
		});

		socket.on("markAllRead", async () => {
			await db.notifications.markAllRead(ctx.user.id);
			socket.emit("unreadCount", { count: 0 });
		});
	});

export { wsNotifications };
```

## Sending Notifications from Procedures

Send notifications from any procedure using `io.to()`:

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";
import { authMiddleware } from "./middleware/auth";

const { procedure } = jsandy.init();

const followUser = procedure
	.use(authMiddleware)
	.input(z.object({ targetUserId: z.string() }))
	.output(z.object({ success: z.boolean() }))
	.mutation(async ({ c, ctx, input }) => {
		await db.follows.create({
			followerId: ctx.user.id,
			followingId: input.targetUserId,
		});

		// Create notification record
		const notification = await db.notifications.create({
			userId: input.targetUserId,
			type: "follow",
			title: "New follower",
			body: `${ctx.user.name} started following you`,
			link: `/profile/${ctx.user.id}`,
		});

		// Push real-time notification via WebSocket
		// The IO instance is available through the router context
		c.get("io")?.to(`user:${input.targetUserId}`).emit("newNotification", {
			id: notification.id,
			type: "follow",
			title: notification.title,
			body: notification.body,
			link: notification.link,
			timestamp: Date.now(),
		});

		return c.superjson({ success: true });
	});

export { followUser };
```

## Notification Router with PubSub

```typescript
import { Hono } from "hono";
import { jsandy, mergeRouters } from "@jsandy/rpc";
import { UpstashRestPubSub } from "@jsandy/rpc/adapters";
import { wsNotifications } from "./procedures/notifications";

const { defaults } = jsandy.init();

const pubsub = new UpstashRestPubSub({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const notificationsRouter = new Hono()
	.use(defaults.cors)
	.onError(defaults.errorHandler);

mergeRouters(notificationsRouter, { wsNotifications }, { pubsub });

export { notificationsRouter };
```

## Client-Side Hook

```typescript
import { useWebSocket } from "@jsandy/rpc/client";
import type { AppRouter } from "./server/router";

function useNotifications() {
	const [unreadCount, setUnreadCount] = useState(0);
	const [notifications, setNotifications] = useState([]);

	const { socket, connected } = useWebSocket<
		AppRouter["notifications"]["wsNotifications"]
	>({
		url: "ws://localhost:3000/api/notifications/wsNotifications",
	});

	useEffect(() => {
		if (\!socket || \!connected) return;

		socket.on("newNotification", (notification) => {
			setNotifications((prev) => [notification, ...prev]);
		});

		socket.on("unreadCount", ({ count }) => {
			setUnreadCount(count);
		});

		socket.on("notificationRead", ({ notificationId }) => {
			setNotifications((prev) =>
				prev.filter((n) => n.id \!== notificationId)
			);
		});
	}, [socket, connected]);

	const markRead = (id: string) => socket?.emit("markRead", { notificationId: id });
	const markAllRead = () => socket?.emit("markAllRead", {});

	return { notifications, unreadCount, markRead, markAllRead, connected };
}
```
