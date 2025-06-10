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

// Complete app router combining all routes
export const combinedRouter = j.router({
	health: procedures.health,
	getUser: procedures.getUser,
	getUsers: procedures.getUsers,
	createUser: procedures.createUser,
	profile: procedures.getProfile,
	admin: procedures.adminOnly,
	chat: procedures.chat,
	files: procedures.uploadFile,
	testing: procedures.errorExample,
});

const api = j
	.router()
	.basePath("/api")
	.use(j.defaults.cors)
	.onError(j.defaults.errorHandler);

export const mockAppRouter = j.mergeRouters(api, {
	combined: combinedRouter,
});
