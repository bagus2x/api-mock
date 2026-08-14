import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  const res = NextResponse.next();

  const regexLocalhost = /^http:\/\/localhost:\d+$/;
  const regexNetlify = /^https:\/\/[a-z0-9-]+\.netlify\.app$/;

  const isAllowed =
    regexLocalhost.test(origin) || regexNetlify.test(origin);

  if (isAllowed) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Credentials', 'true'); // penting untuk cookie/authorization
  } else {
    res.headers.set('Access-Control-Allow-Origin', 'null');
  }

  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: res.headers });
  }

  return res;
}
