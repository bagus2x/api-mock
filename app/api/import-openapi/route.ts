import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseOpenApiSpec } from "@/lib/openapi-parser";

export async function POST(req: NextRequest) {
  let spec: any;

  try {
    spec = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON yang valid" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseOpenApiSpec(spec);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Gagal parsing dokumen" }, { status: 400 });
  }

  if (parsed.length === 0) {
    return NextResponse.json({ error: "Tidak ada endpoint yang ditemukan di dokumen ini" }, { status: 400 });
  }

  const results = await prisma.$transaction(
    parsed.map((ep) =>
      prisma.mockEndpoint.upsert({
        where: { path_method: { path: ep.path, method: ep.method } },
        create: {
          path: ep.path,
          method: ep.method,
          summary: ep.summary ?? "",
          tags: ep.tags,
          params: ep.params as any,
          requestBody: (ep.requestBody ?? undefined) as any,
          responseBody: (ep.responseBody ?? undefined) as any,
          statusCode: ep.statusCode,
        },
        update: {
          summary: ep.summary ?? "",
          tags: ep.tags,
          params: ep.params as any,
          requestBody: (ep.requestBody ?? undefined) as any,
          responseBody: (ep.responseBody ?? undefined) as any,
          statusCode: ep.statusCode,
        },
      })
    )
  );

  return NextResponse.json({ imported: results.length, endpoints: results });
}
