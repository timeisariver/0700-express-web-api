import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });

// log: ["query"] で実行した SQL を標準出力に出す
export const prisma = new PrismaClient({ adapter, log: ["query"] });
