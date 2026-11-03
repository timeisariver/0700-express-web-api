import { Router } from "express";
import { getMe } from "../controllers/usersController";
import { requireAuth } from "../middlewares/requireAuth";

// /users に mount しても /users/projects などに影響しないよう、ルートごとに requireAuth を付ける
export const usersRouter: Router = Router();

usersRouter.get("/me", requireAuth, getMe);
