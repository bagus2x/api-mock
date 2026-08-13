import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigins = [
  `http://localhost:5173`,
    `http://localhost:5174`,
    `http://localhost:3000`,
  'https://*.netlify.app',
];

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  const res = NextResponse.next();

  // cek apakah origin ada di daftar
  const isAllowed = allowedOrigins.some((allowed) => {
    if (allowed.includes('*')) {
      // wildcard match untuk netlify
      const regex = new RegExp('^https://[a-z0-9-]+\\.netlify\\.app$');
      return regex.test(origin);
    }
    return origin === allowed;
  });

  res.headers.set('Access-Control-Allow-Origin', isAllowed ? origin : 'null');
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: res.headers });
  }

  return res;
}
