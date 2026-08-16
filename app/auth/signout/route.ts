import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("dealroom_session")?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
  cookieStore.delete("dealroom_session");

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}