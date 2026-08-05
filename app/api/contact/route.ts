import { NextResponse } from "next/server";

/**
 * POST /api/contact
 * Persists a demo-request submission to Neon (Postgres) via Prisma.
 *
 * Graceful degradation: if DATABASE_URL is not configured, returns a clear
 * 503 so the form can still give the visitor useful feedback — the landing
 * page itself never depends on the database.
 */
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, message: "Database is not configured yet — set DATABASE_URL (Neon) to enable submissions." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const company = String(body.company ?? "").trim() || null;
  const message = String(body.message ?? "").trim() || null;

  if (!name || !email) {
    return NextResponse.json({ ok: false, message: "Name and email are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, message: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    // Dynamic import so the app builds & runs even before `prisma generate`
    // (postinstall) has run or when Prisma isn't configured at all.
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    try {
      const record = await prisma.contactSubmission.create({
        data: { name, email, company, message },
        select: { id: true, createdAt: true },
      });
      return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("[/api/contact] failed to save submission:", error);
    return NextResponse.json(
      { ok: false, message: "Could not save your request right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
