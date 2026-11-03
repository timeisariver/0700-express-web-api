import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });

// クエリログ（実行した SQL）を出すのは課題の要件なので、log: ["query"] を外さない
export const prisma = new PrismaClient({ adapter, log: ["query"] });
