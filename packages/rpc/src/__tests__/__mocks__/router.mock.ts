import { j } from "./jsandy.mock";
import * as procedures from "./procedures.mock";

// Basic user router
export const userRouter = j.router({
	createUser: procedures.createUser,
	deleteUser: procedures.deleteUser,
	getProfile: procedures.getProfile,
	getUser: procedures.getUser,
	getUsers: procedures.getUsers,
	health: procedures.health,
	updateUser: procedures.updateUser,
});

// Admin router with restricted procedures
export const adminRouter = j.router({
	adminOnly: procedures.adminOnly,
	deleteUser: procedures.deleteUser,
	getUsers: procedures.getUsers,
});

// Chat router for WebSocket functionality
export const chatRouter = j.router({
	chat: procedures.chat,
});

// Complete app router combining all routes
export const combinedRouter = j.router({
	admin: procedures.adminOnly,
	chat: procedures.chat,
	createUser: procedures.createUser,
	files: procedures.uploadFile,
	getUser: procedures.getUser,
	getUsers: procedures.getUsers,
	health: procedures.health,
	profile: procedures.getProfile,
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
