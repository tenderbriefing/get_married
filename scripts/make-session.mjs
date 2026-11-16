import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

const prisma = new PrismaClient();
const user = await prisma.user.findUnique({ where: { email: "you@resona.app" } });
if (!user) throw new Error("no user");
const token = createHash("sha256").update(randomBytes(32)).digest("hex");
const expiresAt = new Date(Date.now() + 86400000);
await prisma.session.create({ data: { token, userId: user.id, expiresAt } });
process.stdout.write(token);
await prisma.$disconnect();
