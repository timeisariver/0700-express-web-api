import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "../controllers/tasksController";
import { requireAuth } from "../middlewares/requireAuth";

// /users/tasks に mount する。すべてのルートで認証が要る
export const tasksRouter: Router = Router();

tasksRouter.use(requireAuth);
tasksRouter.get("/", listTasks);
tasksRouter.post("/", createTask);
tasksRouter.get("/:id", getTask);
tasksRouter.patch("/:id", updateTask);
tasksRouter.delete("/:id", deleteTask);
