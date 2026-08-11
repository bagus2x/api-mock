import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.mockEndpoint.createMany({
    data: [
      {
        path: "/api/users",
        method: "GET",
        summary: "List all users",
        tags: ["users"],
        params: [
          {
            name: "page",
            in: "query",
            type: "integer",
            required: false,
            example: 1,
          },
          {
            name: "limit",
            in: "query",
            type: "integer",
            required: false,
            example: 20,
          },
        ],
        requestBody: null as any,
        responseBody: {
          data: [{ id: 1, name: "Budi Santoso", email: "budi@example.com" }],
          page: 1,
          total: 1,
        },
        statusCode: 200,
      },
      {
        path: "/api/users/:id",
        method: "GET",
        summary: "Get a single user",
        tags: ["users"],
        params: [
          {
            name: "id",
            in: "path",
            type: "string",
            required: true,
            example: "1",
          },
        ],
        requestBody: null as any,
        responseBody: {
          id: 1,
          name: "Budi Santoso",
          email: "budi@example.com",
        },
        statusCode: 200,
      },
      {
        path: "/api/users",
        method: "POST",
        summary: "Create a user",
        tags: ["users"],
        params: [],
        requestBody: { name: "Budi Santoso", email: "budi@example.com" },
        responseBody: {
          id: 2,
          name: "Budi Santoso",
          email: "budi@example.com",
        },
        statusCode: 201,
      },
    ],
    skipDuplicates: true,
  });
  console.log("Seed selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
