# Mockstack — Dashboard Mock API

Dashboard Next.js (App Router) untuk mengelola data mock endpoint yang disimpan di PostgreSQL.
Tidak ada auth — langsung bisa dipakai.

## Fitur

- CRUD endpoint mock: **path**, **method**, **parameter** (query/path/header), **request body**, **response body**, status code.
- **Import dari OpenAPI/Swagger JSON** — upload/paste file spec, otomatis membuat/mengupdate semua endpoint di dalamnya (mendukung OpenAPI 3.x dan Swagger 2.0). Contoh/nilai request & response digenerate otomatis dari JSON Schema kalau spec tidak menyertakan `example`.
- Search & filter by method di halaman utama.

## Struktur data

Satu tabel `MockEndpoint` (lihat `prisma/schema.prisma`):

| kolom        | keterangan                                    |
|--------------|------------------------------------------------|
| path         | mis. `/api/users/:id`                          |
| method       | GET / POST / PUT / PATCH / DELETE              |
| params       | array `{ name, in, type, required, example }`  |
| requestBody  | contoh payload (JSON, boleh kosong)            |
| responseBody | contoh respons mock (JSON, boleh kosong)       |
| statusCode   | status code respons, default 200               |

## Menjalankan secara lokal

1. **Siapkan PostgreSQL.** Paling gampang pakai Docker:

   ```bash
   docker compose up -d
   ```

   Ini akan menjalankan Postgres di `localhost:5432` dengan kredensial di `docker-compose.yml`.
   Kalau sudah punya Postgres sendiri, lewati langkah ini dan sesuaikan `DATABASE_URL`.

2. **Salin file env:**

   ```bash
   cp .env.example .env
   ```

3. **Install dependency:**

   ```bash
   npm install
   ```

4. **Buat tabel di database:**

   ```bash
   npm run db:push
   ```

   (atau `npm run db:migrate` kalau mau pakai migration history Prisma)

5. **(Opsional) isi data contoh:**

   ```bash
   npm run db:seed
   ```

6. **Jalankan dashboard:**

   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000).

## Memanggil endpoint yang tersimpan

Setiap endpoint yang kamu simpan bisa dipanggil sungguhan lewat:

```
{method} /api/mock<path-yang-kamu-simpan>
```

Contoh: kalau kamu simpan `GET /api/users/:id` (atau `/api/users/{id}`), maka:

```bash
curl http://localhost:3000/api/mock/api/users/5
```

akan mencocokkan path tersebut (`5` jadi nilai `id`) dan mengembalikan `responseBody` yang kamu simpan, dengan status code sesuai `statusCode`. Kalau ada query parameter yang ditandai **wajib**, request tanpa parameter itu akan dibalas `400`. Kalau tidak ada endpoint yang cocok, dibalas `404`.

Tombol **"Salin URL mock"** di setiap baris dashboard akan menyalin URL siap-pakai ini ke clipboard.

## Import dari Swagger/OpenAPI

Di halaman utama, klik **"Import OpenAPI / Swagger"**, lalu upload file `.json` (contoh: hasil export dari Swagger UI / `swagger.json` / `openapi.json`) atau tempel isinya langsung. Sistem akan:

- Membaca setiap `path` + `method` di dalam `paths`.
- Mengambil `parameters` (query/path/header).
- Mengambil `requestBody`/`responses` — pakai `example`/`examples` kalau ada di spec, kalau tidak ada akan digenerate otomatis dari `schema`.
- Endpoint yang path+method-nya sudah ada akan **diupdate**, yang belum ada akan **ditambahkan**.

## Struktur project

```
app/
  page.tsx                     # dashboard (list + search + filter)
  endpoints/new/page.tsx        # form tambah endpoint
  endpoints/[id]/edit/page.tsx  # form edit endpoint
  api/endpoints/route.ts        # GET (list) & POST (create)
  api/endpoints/[id]/route.ts   # GET/PUT/DELETE per endpoint
  api/import-openapi/route.ts   # import bulk dari OpenAPI/Swagger JSON
  api/mock/[...path]/route.ts   # mock server: melayani request sungguhan sesuai data tersimpan
components/
  EndpointTable.tsx
  EndpointForm.tsx
  ImportOpenApiModal.tsx
  MethodBadge.tsx
lib/
  prisma.ts
  openapi-parser.ts             # parser OpenAPI 3 / Swagger 2 -> endpoint list
  types.ts
prisma/
  schema.prisma
  seed.ts
```

## Catatan

- Matching path mendukung parameter dinamis dengan format `:id` maupun `{id}` (mis. `/api/users/:id` akan cocok dengan `/api/mock/api/users/5`).
- Kalau ada dua endpoint dengan path template yang tumpang tindih, yang cocok pertama (urutan dari database) yang dipakai.
