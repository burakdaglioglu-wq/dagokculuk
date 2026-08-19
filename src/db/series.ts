import type { Env } from "../env";
import { resolveAthleteRedirect } from "./moves";

export interface SeriesDTO {
  seriId: string;
  grup: string;
  ad: string;
  oklar: string[];
  puan: number;
  tarih: string;
  cihazId: string | null;
  t: number;
  iptal: boolean;
  // Ardışık ok tıklamaları arası süre (ms) — "Atış Ritmi" tutarlılık trendi için. Eski serilerde yok (null).
  okAraliklari: number[] | null;
}

interface SeriesRow {
  seriId: string;
  grup: string;
  ad: string;
  oklar_json: string;
  puan: number;
  tarih: string;
  cihazId: string | null;
  t: number;
  iptal: number;
  okAraliklari_json: string | null;
}

function toDTO(row: SeriesRow): SeriesDTO {
  return {
    seriId: row.seriId,
    grup: row.grup,
    ad: row.ad,
    oklar: JSON.parse(row.oklar_json || "[]"),
    puan: row.puan,
    tarih: row.tarih,
    cihazId: row.cihazId,
    t: row.t,
    iptal: !!row.iptal,
    okAraliklari: row.okAraliklari_json ? JSON.parse(row.okAraliklari_json) : null,
  };
}

export interface ListSeriesFilter {
  grup?: string;
  ad?: string;
  tarih?: string;
  since?: number;
  includeIptal?: boolean;
}

export async function listSeries(env: Env, filter: ListSeriesFilter): Promise<SeriesDTO[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (filter.grup) {
    clauses.push("grup = ?");
    values.push(filter.grup);
  }
  if (filter.ad) {
    clauses.push("ad = ?");
    values.push(filter.ad);
  }
  if (filter.tarih) {
    clauses.push("tarih = ?");
    values.push(filter.tarih);
  }
  if (filter.since) {
    clauses.push("t >= ?");
    values.push(filter.since);
  }
  if (!filter.includeIptal) {
    clauses.push("iptal = 0");
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { results } = await env.DB.prepare(`SELECT * FROM series ${where} ORDER BY t ASC`)
    .bind(...values)
    .all<SeriesRow>();
  return results.map(toDTO);
}

export interface CreateSeriesInput {
  seriId: string;
  grup: string;
  ad: string;
  oklar: string[];
  puan: number;
  tarih: string;
  cihazId: string | null;
  t: number;
  okAraliklari?: number[] | null;
}

/** INSERT OR IGNORE on seriId — this is the natural replacement for the old client-side seriId union. */
export async function createSeries(env: Env, input: CreateSeriesInput): Promise<{ applied: boolean; athlete: { grup: string; ad: string } }> {
  const target = await resolveAthleteRedirect(env, { grup: input.grup, ad: input.ad });

  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO series (seriId, grup, ad, oklar_json, puan, tarih, cihazId, t, iptal, received_at, okAraliklari_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  )
    .bind(
      input.seriId,
      target.grup,
      target.ad,
      JSON.stringify(input.oklar),
      input.puan,
      input.tarih,
      input.cihazId,
      input.t,
      Date.now(),
      input.okAraliklari && input.okAraliklari.length ? JSON.stringify(input.okAraliklari) : null
    )
    .run();

  return { applied: (result.meta.changes ?? 0) > 0, athlete: target };
}

export async function updateSeries(env: Env, seriId: string, oklar: string[], puan: number): Promise<{ applied: boolean }> {
  const result = await env.DB.prepare("UPDATE series SET oklar_json = ?, puan = ? WHERE seriId = ?")
    .bind(JSON.stringify(oklar), puan, seriId)
    .run();
  return { applied: (result.meta.changes ?? 0) > 0 };
}

export async function cancelSeries(env: Env, seriIds: string[]): Promise<{ cancelled: number }> {
  if (seriIds.length === 0) return { cancelled: 0 };
  const placeholders = seriIds.map(() => "?").join(",");
  const result = await env.DB.prepare(`UPDATE series SET iptal = 1 WHERE seriId IN (${placeholders})`)
    .bind(...seriIds)
    .run();
  return { cancelled: result.meta.changes ?? 0 };
}
