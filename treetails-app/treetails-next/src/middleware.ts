
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// For prototypes, we simply allow everything.
// You can keep this file in case you later add cookie-based auth.
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/my-plants/:path*',
    '/green-map/:path*', // Renamed from /map to be consistent with layout.tsx
    '/feeding-spots/:path*',
    '/community/:path*',
    '/profile/:path*',
  ],
}