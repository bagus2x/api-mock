import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EndpointForm from "@/components/EndpointForm";
import type { MockEndpoint } from "@/lib/types";

export default async function EditEndpointPage({ params }: { params: { id: string } }) {
  const endpoint = await prisma.mockEndpoint.findUnique({ where: { id: params.id } });
  if (!endpoint) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Edit endpoint</h1>
        <p className="text-sm text-muted mt-0.5 font-mono">
          {endpoint.method} {endpoint.path}
        </p>
      </div>
      <EndpointForm initial={endpoint as unknown as MockEndpoint} />
    </div>
  );
}
