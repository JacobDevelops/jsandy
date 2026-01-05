import { z } from "zod";
import { j } from "./jsandy.mock";
import { authMiddleware, loggingMiddleware } from "./middleware.mock";

const CreateUserSchema = z.object({
	age: z.number().min(0).optional(),
	email: z.string().email(),
	name: z.string().min(1),
});

const GetUserSchema = z.object({
	id: z.string(),
});

const UpdateUserSchema = z.object({
	age: z.number().min(0).optional(),
	email: z.string().email().optional(),
	id: z.string(),
	name: z.string().optional(),
});

const ChatMessageSchema = z.object({
	message: z.string(),
	timestamp: z.number(),
	userId: z.string(),
});

const UserJoinedSchema = z.object({
	userId: z.string(),
	username: z.string(),
});

export const health = j.procedure.query(() => {
	return Response.json({ status: "ok", timestamp: Date.now() });
});

export const getUser = j.procedure.input(GetUserSchema).query(({ input }) => {
	const user = {
		age: 30,
		email: "john@example.com",
		id: input.id,
		name: "John Doe",
	};
	return Response.json(user);
});

// Query with middleware
export const getProfile = j.procedure.use(authMiddleware).query(({ ctx }) => {
	return Response.json(ctx.user);
});

// Mutation with input validation
export const createUser = j.procedure
	.input(CreateUserSchema)
	.mutation(({ input }) => {
		const newUser = {
			id: `user-${Date.now()}`,
			...input,
		};
		return Response.json(newUser, { status: 201 });
	});

// Mutation with middleware and input
export const updateUser = j.procedure
	.use(authMiddleware)
	.input(UpdateUserSchema)
	.mutation(({ input, ctx }) => {
		const updatedUser = {
			...input,
			updatedAt: Date.now(),
			updatedBy: ctx.user.id,
		};
		return Response.json(updatedUser);
	});

// Mutation with complex logic
export const deleteUser = j.procedure
	.use(authMiddleware)
	.input(GetUserSchema)
	.mutation(({ input, ctx }) => {
		if (input.id === ctx.user.id) {
			throw new Error("Cannot delete your own account");
		}
		return Response.json({ deletedId: input.id, success: true });
	});

// WebSocket procedure
export const chat = j.procedure
	.incoming(ChatMessageSchema)
	.outgoing(UserJoinedSchema)
	.ws(({ io }) => {
		return {
			onConnect: async () => {
				console.log("User connected to chat");
				await io.emit("username", "Test User");
			},
			onDisconnect: async () => {
				console.log("User disconnected from chat");
			},
		};
	});

// Multiple middleware example
export const adminOnly = j.procedure
	.use(loggingMiddleware)
	.use(authMiddleware)
	.use(
		j.middleware(async ({ ctx, next }) => {
			if (ctx.user.id !== "admin") {
				throw new Error("Admin access required");
			}
			return next({ isAdmin: true });
		}),
	)
	.query(({ ctx }) => {
		return Response.json({
			isAdmin: ctx.isAdmin,
			message: "Admin access granted",
			user: ctx.user,
		});
	});

// Procedure that returns different response types
export const getUsers = j.procedure
	.input(
		z.object({
			limit: z.number().default(10),
			page: z.number().default(1),
			search: z.string().optional(),
		}),
	)
	.query(({ input }) => {
		const users = Array.from({ length: input.limit }, (_, i) => ({
			email: `user${input.page * input.limit + i}@example.com`,
			id: `user-${(input.page - 1) * input.limit + i}`,
			name: `User ${input.page * input.limit + i}`,
		}));

		return Response.json({
			pagination: {
				hasNext: input.page * input.limit < 100,
				limit: input.limit,
				page: input.page,
				total: 100,
			},
			users,
		});
	});

// Error handling example
export const errorExample = j.procedure
	.input(z.object({ shouldError: z.boolean() }))
	.query(({ input }) => {
		if (input.shouldError) {
			throw new Error("Intentional error for testing");
		}
		return Response.json({ success: true });
	});

// File upload simulation
export const uploadFile = j.procedure
	.input(
		z.object({
			contentType: z.enum([
				"image/jpeg",
				"image/jpg",
				"image/png",
				"image/gif",
				"image/webp",
				"image/svg+xml",
				"application/pdf",
				"text/plain",
			]),
			filename: z.string(),
			size: z.number(),
		}),
	)
	.mutation(({ input }) => {
		return Response.json({
			fileId: `file-${Date.now()}`,
			url: `/files/${input.filename}`,
			...input,
			uploadedAt: new Date().toISOString(),
		});
	});
