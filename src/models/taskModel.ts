import type { Prisma, TaskKind, TaskStatus } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import type { Pagination } from "../lib/pagination";

// レスポンスに出す項目だけを取り出す（userId・projectId は出さない）
const taskSelect = {
  id: true,
  title: true,
  kind: true,
  description: true,
  status: true,
  startingAt: true,
  deadline: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TaskSelect;

export type TaskResponse = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;

export type TaskCreateInput = {
  title: string;
  kind: TaskKind;
  description: string;
  status: TaskStatus;
  projectId: string;
  startingAt?: Date;
  deadline: Date;
};

// 作成日時の昇順 → id の昇順。status を省略するとすべての status を返す
export const findTasksByUser = async (
  userId: string,
  query: Pagination & { status?: TaskStatus },
): Promise<{ tasks: TaskResponse[]; totalCount: number }> => {
  const where = {
    userId,
    ...(query.status ? { status: query.status } : {}),
  } satisfies Prisma.TaskWhereInput;
  const [tasks, totalCount] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      select: taskSelect,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.task.count({ where }),
  ]);
  return { tasks, totalCount };
};

// ID とユーザー ID で絞る。他のユーザーのタスクは見つからない扱いになる
export const findTaskById = (userId: string, id: string): Promise<TaskResponse | null> =>
  prisma.task.findFirst({ where: { id, userId }, select: taskSelect });

export const createTask = (userId: string, input: TaskCreateInput): Promise<TaskResponse> =>
  prisma.task.create({ data: { ...input, userId }, select: taskSelect });

// 送られた項目だけを更新する。見つからなければ null
export const updateTask = async (
  userId: string,
  id: string,
  input: Partial<TaskCreateInput>,
): Promise<TaskResponse | null> => {
  const { count } = await prisma.task.updateMany({ where: { id, userId }, data: input });
  if (count === 0) return null;
  return findTaskById(userId, id);
};

// 削除前の Task を返す。見つからなければ null
export const deleteTask = async (userId: string, id: string): Promise<TaskResponse | null> => {
  const task = await findTaskById(userId, id);
  if (!task) return null;
  const { count } = await prisma.task.deleteMany({ where: { id, userId } });
  return count === 0 ? null : task;
};

export const projectBelongsToUser = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  const count = await prisma.project.count({ where: { id: projectId, userId } });
  return count > 0;
};
