import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

// 作成日時を明示して、一覧の並び順を毎回同じにする（今より前の固定日時から 1 秒ずつ）
const BASE_TIME = new Date("2024-01-01T00:00:00Z").getTime();
const at = (seconds: number): Date => new Date(BASE_TIME + seconds * 1000);

const projectSeeds = [
  { slug: "programming", name: "Programming" },
  { slug: "english", name: "English" },
  { slug: "design", name: "Design" },
];

const taskSeeds = [
  { title: "Read the TypeScript handbook", status: "scheduled", deadline: "2025-01-31T00:00:00Z" },
  { title: "Build a REST API with Express", status: "scheduled", deadline: "2025-02-28T00:00:00Z" },
  { title: "Write tests with Vitest", status: "scheduled", deadline: "2025-03-31T00:00:00Z" },
  { title: "Set up the development environment", status: "completed", deadline: "2024-12-31T00:00:00Z" },
] as const;

const main = async (): Promise<void> => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      username: "Test User",
      email: "test@example.com",
      passwordHash: await bcrypt.hash("password", 10),
      status: "active",
    },
  });

  const projects = [];
  for (const [i, p] of projectSeeds.entries()) {
    projects.push(
      await prisma.project.create({
        data: { ...p, userId: user.id, createdAt: at(i) },
      }),
    );
  }
  const programming = projects[0]!;

  for (const [i, t] of taskSeeds.entries()) {
    await prisma.task.create({
      data: {
        userId: user.id,
        projectId: programming.id,
        title: t.title,
        kind: "task",
        description: `${t.title}.`,
        status: t.status,
        deadline: new Date(t.deadline),
        createdAt: at(i),
      },
    });
  }

  console.log(`Seeded: 1 user, ${projects.length} projects, ${taskSeeds.length} tasks`);
};

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
