import { Router } from "express";
import { authRouter } from "./auth";
import { projectsRouter } from "./projects";
import { tasksRouter } from "./tasks";
import { usersRouter } from "./users";

export const apiRouter: Router = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users/projects", projectsRouter);
apiRouter.use("/users/tasks", tasksRouter);
apiRouter.use("/users", usersRouter);
