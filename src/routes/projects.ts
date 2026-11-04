import { Router } from "express";
import { getProject, listProjects } from "../controllers/projectsController";
import { requireAuth } from "../middlewares/requireAuth";

export const projectsRouter: Router = Router();

projectsRouter.use(requireAuth);
projectsRouter.get("/", listProjects);
projectsRouter.get("/:slug", getProject);
