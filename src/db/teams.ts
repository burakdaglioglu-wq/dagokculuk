import type { Env } from "../env";

export interface TeamRow {
  id: number;
  lig: string;
  ad: string;
  size: string | null;
  p1: string | null;
  p2: string | null;
  p3: string | null;
  renk: string | null;
  lastModified: number;
}

export async function listTeams(env: Env, lig?: string): Promise<TeamRow[]> {
  const stmt = lig ? env.DB.prepare("SELECT * FROM teams WHERE lig = ?").bind(lig) : env.DB.prepare("SELECT * FROM teams");
  const { results } = await stmt.all<TeamRow>();
  return results;
}

export async function createTeam(env: Env, team: Omit<TeamRow, "id">): Promise<number> {
  const result = await env.DB.prepare(
    "INSERT INTO teams (lig, ad, size, p1, p2, p3, renk, lastModified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(team.lig, team.ad, team.size, team.p1, team.p2, team.p3, team.renk, team.lastModified)
    .run();
  return result.meta.last_row_id as number;
}

export const TEAM_UPDATABLE_FIELDS = ["lig", "ad", "size", "p1", "p2", "p3", "renk", "lastModified"] as const;

export async function updateTeam(env: Env, id: number, fields: Partial<Omit<TeamRow, "id">>): Promise<{ applied: boolean }> {
  const columns = Object.keys(fields);
  if (columns.length === 0) return { applied: false };
  const setClause = columns.map((c) => `${c} = ?`).join(", ");
  const values = columns.map((c) => (fields as Record<string, unknown>)[c]);
  const result = await env.DB.prepare(`UPDATE teams SET ${setClause} WHERE id = ?`)
    .bind(...values, id)
    .run();
  return { applied: (result.meta.changes ?? 0) > 0 };
}

export async function deleteTeam(env: Env, id: number): Promise<{ applied: boolean }> {
  const result = await env.DB.prepare("DELETE FROM teams WHERE id = ?").bind(id).run();
  return { applied: (result.meta.changes ?? 0) > 0 };
}
