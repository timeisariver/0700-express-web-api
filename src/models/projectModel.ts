import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import type { Pagination } from "../lib/pagination";

// レスポンスに出す項目だけを取り出す（userId は出さない）
const projectSelect = {
  id: true,
  name: true,
  slug: true,
  goal: true,
  shouldbe: true,
  color: true,
  createdAt: true,
  updatedAt: true,
  deadline: true,
  startingAt: true,
  startedAt: true,
  finishedAt: true,
} satisfies Prisma.ProjectSelect;

export type ProjectResponse = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;

// 作成日時の昇順 → id の昇順。作成日時が同じでもページをまたいで重ならない
export const findProjectsByUser = async (
  userId: string,
  pagination: Pagination,
): Promise<{ projects: ProjectResponse[]; totalCount: number }> => {
  const where = { userId } satisfies Prisma.ProjectWhereInput;
  const [projects, totalCount] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      select: projectSelect,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
    prisma.project.count({ where }),
  ]);
  return { projects, totalCount };
};

// slug はユーザーごとに一意。他のユーザーの slug は見つからない扱いになる
export const findProjectBySlug = (
  userId: string,
  slug: string,
): Promise<ProjectResponse | null> =>
  prisma.project.findUnique({
    where: { userId_slug: { userId, slug } },
    select: projectSelect,
  });
