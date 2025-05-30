import { j } from "./jsandy.mock";
import * as procedures from "./procedures.mock";

// Basic user router
export const userRouter = j.router({
	health: procedures.health,
	getUser: procedures.getUser,
	getProfile: procedures.getProfile,
	createUser: procedures.createUser,
	updateUser: procedures.updateUser,
	deleteUser: procedures.deleteUser,
	getUsers: procedures.getUsers,
});

// Admin router with restricted procedures
export const adminRouter = j.router({
	adminOnly: procedures.adminOnly,
	getUsers: procedures.getUsers,
	deleteUser: procedures.deleteUser,
});

// Chat router for WebSocket functionality
export const chatRouter = j.router({
	chat: procedures.chat,
});

// File router for file operations
export const fileRouter = j.router({
	uploadFile: procedures.uploadFile,
});

// Testing router for error scenarios
export const testingRouter = j.router({
	health: procedures.health,
	errorExample: procedures.errorExample,
});

// Nested router structure
export const apiRouter = j.router({
	user: userRouter,
	admin: adminRouter,
	chat: chatRouter,
	files: fileRouter,
});

// Complete app router combining all routes
export const combinedRouter = j.router({
	health: procedures.health,
	user: procedures.getUser,
	profile: procedures.getProfile,
	users: {
		create: procedures.createUser,
		update: procedures.updateUser,
		delete: procedures.deleteUser,
		list: procedures.getUsers,
	},
	admin: {
		adminOnly: procedures.adminOnly,
	},
	chat: procedures.chat,
	files: {
		upload: procedures.uploadFile,
	},
	testing: {
		error: procedures.errorExample,
	},
});

// Minimal router for basic testing
export const minimalRouter = j.router({
	health: procedures.health,
	getUser: procedures.getUser,
});

// Router with only mutations
export const mutationRouter = j.router({
	createUser: procedures.createUser,
	updateUser: procedures.updateUser,
	deleteUser: procedures.deleteUser,
	uploadFile: procedures.uploadFile,
});

// Router with only queries
export const queryRouter = j.router({
	health: procedures.health,
	getUser: procedures.getUser,
	getProfile: procedures.getProfile,
	getUsers: procedures.getUsers,
	adminOnly: procedures.adminOnly,
	errorExample: procedures.errorExample,
});

// WebSocket only router
export const wsRouter = j.router({
	chat: procedures.chat,
});

export type UserRouter = typeof userRouter;
export type AdminRouter = typeof adminRouter;
export type ChatRouter = typeof chatRouter;
export type FileRouter = typeof fileRouter;
export type TestingRouter = typeof testingRouter;
export type ApiRouter = typeof apiRouter;
export type CombinedRouter = typeof combinedRouter;
export type MinimalRouter = typeof minimalRouter;
export type MutationRouter = typeof mutationRouter;
export type QueryRouter = typeof queryRouter;
export type WsRouter = typeof wsRouter;
