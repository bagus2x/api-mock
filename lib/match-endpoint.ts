import { prisma } from "@/lib/prisma";

// Converts a stored path template like "/api/users/:id" or "/api/users/{id}"
// into a regex plus the list of param names it captures.
function compilePattern(template: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const normalized = template.replace(/^\/+/, "").replace(/\/+$/, "");
  const segments = normalized.split("/").filter(Boolean);

  const regexParts = segments.map((seg) => {
    const colonMatch = seg.match(/^:(.+)$/);
    const braceMatch = seg.match(/^\{(.+)\}$/);
    const name = colonMatch?.[1] ?? braceMatch?.[1];
    if (name) {
      paramNames.push(name);
      return "([^/]+)";
    }
    return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  });

  return { regex: new RegExp(`^${regexParts.join("/")}$`), paramNames };
}

export async function findMatchingEndpoint(pathname: string, method: string) {
  const normalizedIncoming = pathname.replace(/^\/+/, "").replace(/\/+$/, "");

  const candidates = await prisma.mockEndpoint.findMany({
    where: { method: method.toUpperCase() },
  });

  for (const candidate of candidates) {
    const { regex, paramNames } = compilePattern(candidate.path);
    const match = normalizedIncoming.match(regex);
    if (match) {
      const pathParams: Record<string, string> = {};
      paramNames.forEach((name, i) => {
        pathParams[name] = match[i + 1];
      });
      return { endpoint: candidate, pathParams };
    }
  }

  return null;
}
