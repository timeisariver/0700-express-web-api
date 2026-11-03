import { Router } from "express";
import { getProject, listProjects } from "../controllers/projectsController";
import { requireAuth } from "../middlewares/requireAuth";

// /users/projects に mount する。すべてのルートで認証が要る
export const projectsRouter: Router = Router();

projectsRouter.use(requireAuth);
projectsRouter.get("/", listProjects);
projectsRouter.get("/:slug", getProject);
