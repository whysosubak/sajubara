import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // If Supabase env vars are missing, skip auth (so dev still works without setup)
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  const response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session if expired (sets new cookies on response).
  // When the Supabase project URL is wrong/deleted, do not let every page crash.
  try {
    await supabase.auth.getUser();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[sajubara] Supabase session refresh skipped:", error);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\..*).*)",
  ],
};
