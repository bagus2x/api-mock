import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const endpoint = await prisma.mockEndpoint.findUnique({ where: { id: params.id } });
  if (!endpoint) return NextResponse.json({ error: "Endpoint tidak ditemukan" }, { status: 404 });
  return NextResponse.json(endpoint);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  try {
    const endpoint = await prisma.mockEndpoint.update({
      where: { id: params.id },
      data: {
        path: body.path,
        method: body.method?.toUpperCase(),
        summary: body.summary ?? "",
        tags: body.tags ?? [],
        params: body.params ?? [],
        requestBody: body.requestBody ?? undefined,
        responseBody: body.responseBody ?? undefined,
        statusCode: body.statusCode ?? 200,
      },
    });
    return NextResponse.json(endpoint);
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Endpoint tidak ditemukan" }, { status: 404 });
    }
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: `Endpoint ${body.method?.toUpperCase()} ${body.path} sudah ada` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Gagal mengubah endpoint" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.mockEndpoint.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Endpoint tidak ditemukan" }, { status: 404 });
  }
}
