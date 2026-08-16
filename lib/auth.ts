import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const token = (await cookies()).get("dealroom_session")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date()) return null;
  return session.user;
}