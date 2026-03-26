/**
 * Optional HTTP Basic Auth for Cloudflare Pages (set BASIC_AUTH_USER + BASIC_AUTH_PASSWORD in project settings).
 * For email-based access control, use Cloudflare Access instead.
 */
function parseBasicAuth(header) {
  if (!header || !header.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6));
    const i = decoded.indexOf(":");
    if (i < 0) return null;
    return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
  } catch {
    return null;
  }
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const user = env.BASIC_AUTH_USER;
  const pass = env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) {
    return next();
  }
  const parsed = parseBasicAuth(request.headers.get("Authorization"));
  if (!parsed || parsed.user !== user || parsed.pass !== pass) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Site"',
      },
    });
  }
  return next();
}
