import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = "agujonas13@gmail.com";
const password = "batman_001";
const salt = randomBytes(16).toString("hex");
const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;

try {
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: "Agujonas", passwordHash },
    create: { email, name: "Agujonas", passwordHash },
  });

  console.log(`Seeded test user ${user.email}`);
} finally {
  await prisma.$disconnect();
}