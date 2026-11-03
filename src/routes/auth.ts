import { Router } from "express";
import { login, signup } from "../controllers/authController";

// 認証不要
export const authRouter: Router = Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
