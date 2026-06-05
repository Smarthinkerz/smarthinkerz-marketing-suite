import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";

/**
 * Refreshes the Supabase session on every request and returns the response
 * plus the resolved user. When Supabase is unconfigured it is a no-op pass.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!config.supabase.isConfigured) {
    return { response, user: null };
  }

  const supabase = createServerClient(config.supabase.url!, config.supabase.anonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
