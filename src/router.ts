import type { Env } from "./env";

export type Handler = (request: Request, env: Env, params: Record<string, string>) => Promise<Response> | Response;

interface Route {
  method: string;
  path: string;
  segments: string[];
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  private add(method: string, path: string, handler: Handler): void {
    this.routes.push({ method, path, segments: path.split("/").filter(Boolean), handler });
  }

  get(path: string, handler: Handler): void {
    this.add("GET", path, handler);
  }
  post(path: string, handler: Handler): void {
    this.add("POST", path, handler);
  }
  put(path: string, handler: Handler): void {
    this.add("PUT", path, handler);
  }
  patch(path: string, handler: Handler): void {
    this.add("PATCH", path, handler);
  }
  delete(path: string, handler: Handler): void {
    this.add("DELETE", path, handler);
  }

  match(method: string, pathname: string): { handler: Handler; params: Record<string, string>; path: string } | null {
    const segments = pathname.split("/").filter(Boolean);
    for (const route of this.routes) {
      if (route.method !== method) continue;
      if (route.segments.length !== segments.length) continue;
      const params: Record<string, string> = {};
      let ok = true;
      for (let i = 0; i < route.segments.length; i++) {
        const routeSeg = route.segments[i];
        const actualSeg = segments[i];
        if (routeSeg.startsWith(":")) {
          params[routeSeg.slice(1)] = decodeURIComponent(actualSeg);
        } else if (routeSeg !== actualSeg) {
          ok = false;
          break;
        }
      }
      if (ok) return { handler: route.handler, params, path: route.path };
    }
    return null;
  }
}
