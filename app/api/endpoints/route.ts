import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const method = searchParams.get("method")?.trim();

  const endpoints = await prisma.mockEndpoint.findMany({
    where: {
      AND: [
        q ? { path: { contains: q, mode: "insensitive" } } : {},
        method ? { method } : {},
      ],
    },
    orderBy: [{ path: "asc" }, { method: "asc" }],
  });

  return NextResponse.json(endpoints);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.path || !body.method) {
    return NextResponse.json({ error: "path dan method wajib diisi" }, { status: 400 });
  }

  try {
    const endpoint = await prisma.mockEndpoint.create({
      data: {
        path: body.path,
        method: body.method.toUpperCase(),
        summary: body.summary ?? "",
        tags: body.tags ?? [],
        params: body.params ?? [],
        requestBody: body.requestBody ?? undefined,
        responseBody: body.responseBody ?? undefined,
        statusCode: body.statusCode ?? 200,
      },
    });
    return NextResponse.json(endpoint, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: `Endpoint ${body.method.toUpperCase()} ${body.path} sudah ada` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Gagal membuat endpoint" }, { status: 500 });
  }
}
