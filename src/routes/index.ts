import { Router } from "express";
import { authRouter } from "./auth";
import { projectsRouter } from "./projects";
import { tasksRouter } from "./tasks";
import { usersRouter } from "./users";

export const apiRouter: Router = Router();

apiRouter.use("/auth", authRouter);
// /users/projects と /users/tasks は /users より先に登録する。
// 後に回すと、/users 側の /:id などのパスに先に一致してしまうおそれがあるため。
apiRouter.use("/users/projects", projectsRouter);
apiRouter.use("/users/tasks", tasksRouter);
apiRouter.use("/users", usersRouter);
