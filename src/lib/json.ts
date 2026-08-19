export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
}

export function notFound(message = "not found"): Response {
  return json({ error: message }, { status: 404 });
}

export function badRequest(message: string): Response {
  return json({ error: message }, { status: 400 });
}

export function unauthorized(message = "yetkisiz"): Response {
  return json({ error: message }, { status: 401 });
}

export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}
