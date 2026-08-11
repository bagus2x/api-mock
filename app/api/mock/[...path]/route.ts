import { findMatchingEndpoint } from "@/lib/match-endpoint";
import { NextRequest, NextResponse } from "next/server";

async function handle(req: NextRequest, path: string[]) {
  const pathname = "/" + path.join("/");
  const match = await findMatchingEndpoint(pathname, req.method);

  if (!match) {
    return NextResponse.json(
      { error: "Mock tidak ditemukan", path: pathname, method: req.method },
      { status: 404 },
    );
  }

  const { endpoint, pathParams } = match;

  return NextResponse.json(endpoint.responseBody ?? {}, {
    status: endpoint.statusCode,
    headers: {
      "x-mock-endpoint-id": endpoint.id,
      "x-mock-path-params": JSON.stringify(pathParams),
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handle(req, params.path);
}
export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handle(req, params.path);
}
export async function PUT(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handle(req, params.path);
}
export async function PATCH(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handle(req, params.path);
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handle(req, params.path);
}
