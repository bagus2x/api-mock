// Parses an OpenAPI 3.x or Swagger 2.0 JSON document into a flat list of
// endpoint definitions that map directly onto the MockEndpoint model.

export type ParsedParam = {
  name: string;
  in: string; // "query" | "path" | "header" | "cookie"
  type: string;
  required: boolean;
  example?: unknown;
};

export type ParsedEndpoint = {
  path: string;
  method: string;
  summary?: string;
  tags: string[];
  params: ParsedParam[];
  requestBody: unknown | null;
  responseBody: unknown | null;
  statusCode: number;
};

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "options", "head"];

function resolveRef(spec: any, ref: string): any {
  // "#/components/schemas/User" -> spec.components.schemas.User
  const parts = ref.replace(/^#\//, "").split("/");
  let node = spec;
  for (const p of parts) node = node?.[p];
  return node ?? {};
}

// Turns a (possibly $ref'd) JSON Schema into a representative example value.
function schemaToExample(spec: any, schema: any, depth = 0): unknown {
  if (!schema || depth > 6) return null;

  if (schema.$ref) return schemaToExample(spec, resolveRef(spec, schema.$ref), depth + 1);
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];

  const combinator = schema.allOf || schema.oneOf || schema.anyOf;
  if (combinator?.length) {
    if (schema.allOf) {
      return combinator.reduce(
        (acc: any, sub: any) => ({ ...acc, ...(schemaToExample(spec, sub, depth + 1) as object) }),
        {}
      );
    }
    return schemaToExample(spec, combinator[0], depth + 1);
  }

  const type = schema.type ?? (schema.properties ? "object" : undefined);

  switch (type) {
    case "object": {
      const out: Record<string, unknown> = {};
      const props = schema.properties ?? {};
      for (const key of Object.keys(props)) {
        out[key] = schemaToExample(spec, props[key], depth + 1);
      }
      return out;
    }
    case "array":
      return [schemaToExample(spec, schema.items ?? {}, depth + 1)];
    case "string":
      if (schema.format === "date-time") return new Date().toISOString();
      if (schema.format === "date") return new Date().toISOString().slice(0, 10);
      if (schema.format === "email") return "user@example.com";
      if (schema.format === "uuid") return "00000000-0000-0000-0000-000000000000";
      return "string";
    case "integer":
      return 0;
    case "number":
      return 0;
    case "boolean":
      return true;
    default:
      return null;
  }
}

function extractRequestBody(spec: any, operation: any): unknown | null {
  const rb = operation.requestBody;
  if (!rb) return null;
  const content = rb.content;
  if (!content) return null;
  const jsonKey = Object.keys(content).find((k) => k.includes("json")) ?? Object.keys(content)[0];
  if (!jsonKey) return null;
  const media = content[jsonKey];
  if (media.example !== undefined) return media.example;
  if (media.examples) {
    const first = Object.values(media.examples)[0] as any;
    if (first?.value !== undefined) return first.value;
  }
  if (media.schema) return schemaToExample(spec, media.schema);
  return null;
}

function extractResponseBody(spec: any, operation: any): { body: unknown | null; status: number } {
  const responses = operation.responses ?? {};
  const codes = Object.keys(responses);
  const successCode = codes.find((c) => c.startsWith("2")) ?? codes[0];
  if (!successCode) return { body: null, status: 200 };

  const response = responses[successCode];
  const status = successCode === "default" ? 200 : parseInt(successCode, 10) || 200;
  const content = response.content;
  if (!content) return { body: null, status };

  const jsonKey = Object.keys(content).find((k) => k.includes("json")) ?? Object.keys(content)[0];
  if (!jsonKey) return { body: null, status };
  const media = content[jsonKey];

  if (media.example !== undefined) return { body: media.example, status };
  if (media.examples) {
    const first = Object.values(media.examples)[0] as any;
    if (first?.value !== undefined) return { body: first.value, status };
  }
  if (media.schema) return { body: schemaToExample(spec, media.schema), status };
  return { body: null, status };
}

function extractParams(spec: any, pathItemParams: any[], operationParams: any[]): ParsedParam[] {
  const merged = [...(pathItemParams ?? []), ...(operationParams ?? [])];
  return merged.map((raw) => {
    const p = raw.$ref ? resolveRef(spec, raw.$ref) : raw;
    const schema = p.schema ?? { type: p.type ?? "string" };
    return {
      name: p.name,
      in: p.in,
      type: schema.type ?? "string",
      required: !!p.required || p.in === "path",
      example: p.example ?? schema.example ?? schemaToExample(spec, schema),
    };
  });
}

// Swagger 2.0 body/formData params are handled separately from OpenAPI 3 requestBody.
function extractSwagger2Body(spec: any, operationParams: any[]): unknown | null {
  const bodyParam = (operationParams ?? []).find((p) => p.in === "body");
  if (!bodyParam) return null;
  return schemaToExample(spec, bodyParam.schema);
}

export function parseOpenApiSpec(spec: any): ParsedEndpoint[] {
  if (!spec?.paths) throw new Error("Dokumen tidak punya properti 'paths'. Pastikan ini file OpenAPI/Swagger yang valid.");

  const isSwagger2 = !!spec.swagger && spec.swagger.startsWith("2");
  const results: ParsedEndpoint[] = [];

  for (const rawPath of Object.keys(spec.paths)) {
    const pathItem = spec.paths[rawPath];
    const pathLevelParams = pathItem.parameters ?? [];

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      const params = extractParams(spec, pathLevelParams, operation.parameters ?? []);
      const nonBodyParams = params.filter((p) => p.in !== "body" && p.in !== "formData");

      let requestBody: unknown | null = null;
      let responseBody: unknown | null = null;
      let statusCode = 200;

      if (isSwagger2) {
        requestBody = extractSwagger2Body(spec, operation.parameters ?? []);
        const responses = operation.responses ?? {};
        const codes = Object.keys(responses);
        const successCode = codes.find((c) => c.startsWith("2")) ?? codes[0];
        if (successCode) {
          statusCode = parseInt(successCode, 10) || 200;
          const respSchema = responses[successCode]?.schema;
          responseBody = respSchema ? schemaToExample(spec, respSchema) : null;
        }
      } else {
        requestBody = extractRequestBody(spec, operation);
        const resp = extractResponseBody(spec, operation);
        responseBody = resp.body;
        statusCode = resp.status;
      }

      results.push({
        path: rawPath,
        method: method.toUpperCase(),
        summary: operation.summary ?? operation.operationId ?? "",
        tags: operation.tags ?? [],
        params: nonBodyParams,
        requestBody,
        responseBody,
        statusCode,
      });
    }
  }

  return results;
}
