import type { RequestHandler } from "express";
import { z } from "zod";
import { TaskKind, TaskStatus } from "../generated/prisma/client";
import { badRequest, notFound } from "../lib/httpError";
import { parsePagination, toPageInfo } from "../lib/pagination";
import { parseOrThrow } from "../lib/validation";
import { getUserId } from "../middlewares/requireAuth";
import {
  createTask as createTaskRecord,
  deleteTask as deleteTaskRecord,
  findTaskById,
  findTasksByUser,
  projectBelongsToUser,
  updateTask as updateTaskRecord,
} from "../models/taskModel";

// 日付（2024-12-31）か、タイムゾーン付きの ISO 8601 の日時（2024-12-31T09:00:00Z、+09:00 など）だけを受け付け、Date にする。
// 2024-02-31 のような存在しない日付や、タイムゾーンの無い日時（サーバーの時刻で解釈されてしまう）は 400
const dateString = z
  .union([z.iso.date(), z.iso.datetime({ offset: true })])
  .transform((value) => new Date(value));

const createTaskSchema = z.object({
  title: z.string().min(1),
  kind: z.enum(TaskKind),
  description: z.string(),
  status: z.enum(TaskStatus),
  projectId: z.uuid(),
  startingAt: dateString.optional(),
  deadline: dateString,
});

const updateTaskSchema = createTaskSchema.partial();

// 配列（status=a&status=b）は文字列でないので 400 になる
const listQuerySchema = z.object({
  status: z.enum(TaskStatus).optional(),
});

const idSchema = z.uuid();

// UUID の形でない ID は DB に問い合わせる前に 404 にする（DB の UUID 型に渡すと 500 になるため）
const parseTaskId = (id: string): string =>
  parseOrThrow(idSchema, id, () => notFound("Task not found"));

const assertProjectUsable = async (userId: string, projectId: string): Promise<void> => {
  if (!(await projectBelongsToUser(userId, projectId))) throw badRequest();
};

export const listTasks: RequestHandler = async (req, res) => {
  const userId = getUserId(req);

  const pagination = parsePagination(req.query);
  const { status } = parseOrThrow(listQuerySchema, { status: req.query["status"] });

  const { tasks, totalCount } = await findTasksByUser(userId, { ...pagination, status });

  res.status(200).json({ data: tasks, pageInfo: toPageInfo(totalCount, pagination) });
};

export const createTask: RequestHandler = async (req, res) => {
  const userId = getUserId(req);

  const input = parseOrThrow(createTaskSchema, req.body);
  await assertProjectUsable(userId, input.projectId);

  const task = await createTaskRecord(userId, input);
  res.status(201).json({ data: task });
};

export const getTask: RequestHandler<{ id: string }> = async (req, res) => {
  const userId = getUserId(req);

  const task = await findTaskById(userId, parseTaskId(req.params.id));
  if (!task) throw notFound("Task not found");

  res.status(200).json({ data: task });
};

export const updateTask: RequestHandler<{ id: string }> = async (req, res) => {
  const userId = getUserId(req);

  const id = parseTaskId(req.params.id);
  if (!(await findTaskById(userId, id))) throw notFound("Task not found");

  const input = parseOrThrow(updateTaskSchema, req.body);
  if (input.projectId !== undefined) {
    await assertProjectUsable(userId, input.projectId);
  }

  // 送られなかった項目は undefined のまま渡す。Prisma は undefined の列を更新しないので、送られた項目だけが変わる
  const task = await updateTaskRecord(userId, id, input);
  if (!task) throw notFound("Task not found");

  res.status(200).json({ data: task });
};

export const deleteTask: RequestHandler<{ id: string }> = async (req, res) => {
  const userId = getUserId(req);

  const task = await deleteTaskRecord(userId, parseTaskId(req.params.id));
  if (!task) throw notFound("Task not found");

  res.status(200).json({ data: task });
};
