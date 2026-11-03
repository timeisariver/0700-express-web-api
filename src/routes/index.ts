import { Router } from "express";
import { authRouter } from "./auth";
import { projectsRouter } from "./projects";
import { tasksRouter } from "./tasks";
import { usersRouter } from "./users";

export const apiRouter: Router = Router();

apiRouter.use("/auth", authRouter);
// /users/projects と /users/tasks は /users より先に登録する。
// usersRouter は /me だけで、requireAuth もルートごとに付けているので、順番を変えても動作は変わらない。
// URL の具体的なものから並べて、読みやすくするため。
apiRouter.use("/users/projects", projectsRouter);
apiRouter.use("/users/tasks", tasksRouter);
apiRouter.use("/users", usersRouter);
