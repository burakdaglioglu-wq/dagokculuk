import type { Env } from "./env";
import { oturumBul, type Oturum } from "./lib/giris";

// Yazma isteklerinin gerçekten giriş yapmış birinden geldiğini doğrular (2026-09-27). Eskiden istemci PIN'in
// SHA-256 özetini "X-Dagsk-Auth" başlığında gönderiyordu — ama o özet herkese açık bir GET ile de
// dağıtıldığı için PIN'i bilmeyen biri de yazabiliyordu. Artık yalnızca /api/giris ile alınan oturum
// anahtarı ("X-Dagsk-Oturum") geçerli; eski başlık hiçbir koşulda kabul edilmez.
export async function yetkiliOturum(request: Request, env: Env, milo: boolean): Promise<Oturum | null> {
  return oturumBul(request, milo ? env.DB_MILO : env.DB);
}
