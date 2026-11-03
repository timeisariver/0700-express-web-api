import type { RequestHandler } from "express";
import { z } from "zod";
import { TaskKind, TaskStatus } from "../generated/prisma/client";
import { badRequest, notFound, unauthorized } from "../lib/httpError";
import { parsePagination, toPageInfo } from "../lib/pagination";
import {
  createTask as createTaskRecord,
  deleteTask as deleteTaskRecord,
  findTaskById,
  findTasksByUser,
  projectBelongsToUser,
  updateTask as updateTaskRecord,
} from "../models/taskModel";

// new Date(value) で読める文字列（2024-12-31 や ISO 8601 の日時）だけを受け付け、Date にする
const dateString = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()))
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

// 更新は作成と同じ項目ですべて任意
const updateTaskSchema = createTaskSchema.partial();

// 配列（status=a&status=b）は文字列でないので 400 になる
const listQuerySchema = z.object({
  status: z.enum(TaskStatus).optional(),
});

const idSchema = z.uuid();

// UUID の形でない ID は DB に問い合わせる前に 404 にする（DB の UUID 型に渡すと 500 になるため）
const parseTaskId = (id: string): string => {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) throw notFound("Task not found");
  return parsed.data;
};

// 存在しない・他のユーザーのプロジェクトは 400
const assertProjectUsable = async (userId: string, projectId: string): Promise<void> => {
  if (!(await projectBelongsToUser(userId, projectId))) throw badRequest();
};

export const listTasks: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw unauthorized();

  // limit・page・status が不正なら 400 を投げる
  const pagination = parsePagination(req.query);
  const parsed = listQuerySchema.safeParse({ status: req.query["status"] });
  if (!parsed.success) throw badRequest();

  const { tasks, totalCount } = await findTasksByUser(userId, {
    ...pagination,
    status: parsed.data.status,
  });

  res.status(200).json({ data: tasks, pageInfo: toPageInfo(totalCount, pagination) });
};

export const createTask: RequestHandler = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw unauthorized();

  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest();
  await assertProjectUsable(userId, parsed.data.projectId);

  const task = await createTaskRecord(userId, parsed.data);
  res.status(201).json({ data: task });
};

export const getTask: RequestHandler<{ id: string }> = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw unauthorized();

  const task = await findTaskById(userId, parseTaskId(req.params.id));
  if (!task) throw notFound("Task not found");

  res.status(200).json({ data: task });
};

export const updateTask: RequestHandler<{ id: string }> = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw unauthorized();

  // :id の 404 をボディの 400 より先に判定する
  const id = parseTaskId(req.params.id);
  if (!(await findTaskById(userId, id))) throw notFound("Task not found");

  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest();
  if (parsed.data.projectId !== undefined) {
    await assertProjectUsable(userId, parsed.data.projectId);
  }

  // 送られなかった項目は undefined になり、Prisma はその列を更新しない
  const task = await updateTaskRecord(userId, id, parsed.data);
  if (!task) throw notFound("Task not found");

  res.status(200).json({ data: task });
};

export const deleteTask: RequestHandler<{ id: string }> = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw unauthorized();

  const task = await deleteTaskRecord(userId, parseTaskId(req.params.id));
  if (!task) throw notFound("Task not found");

  res.status(200).json({ data: task });
};
