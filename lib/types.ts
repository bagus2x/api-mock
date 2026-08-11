export type EndpointParam = {
  name: string;
  in: string;
  type: string;
  required: boolean;
  example?: unknown;
};

export type MockEndpoint = {
  id: string;
  path: string;
  method: string;
  summary: string | null;
  tags: string[];
  params: EndpointParam[];
  requestBody: unknown | null;
  responseBody: unknown | null;
  statusCode: number;
  createdAt: string;
  updatedAt: string;
};
