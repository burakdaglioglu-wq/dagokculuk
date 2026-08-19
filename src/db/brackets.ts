import type { Env } from "../env";

export interface BracketMatchDTO {
  id: number;
  tip: "bireysel" | "takim";
  lig: string;
  tur: number;
  data: unknown;
  lastModified: number;
}

interface BracketMatchRow {
  id: number;
  tip: string;
  lig: string;
  tur: number;
  data_json: string;
  lastModified: number;
}

function toDTO(row: BracketMatchRow): BracketMatchDTO {
  return { id: row.id, tip: row.tip as "bireysel" | "takim", lig: row.lig, tur: row.tur, data: JSON.parse(row.data_json), lastModified: row.lastModified };
}

export async function listBracketMatches(env: Env, tip: string, lig?: string, tur?: number): Promise<BracketMatchDTO[]> {
  const clauses = ["tip = ?"];
  const values: unknown[] = [tip];
  if (lig) {
    clauses.push("lig = ?");
    values.push(lig);
  }
  if (tur !== undefined) {
    clauses.push("tur = ?");
    values.push(tur);
  }
  const { results } = await env.DB.prepare(`SELECT * FROM bracket_matches WHERE ${clauses.join(" AND ")}`)
    .bind(...values)
    .all<BracketMatchRow>();
  return results.map(toDTO);
}

/** Whole-round replace — matches the original "elemeEslesmeleri = p.elemeEslesmeleri" bulk overwrite semantics. */
export async function replaceBracketRound(env: Env, tip: string, lig: string, tur: number, matches: unknown[]): Promise<void> {
  const now = Date.now();
  const statements = [
    env.DB.prepare("DELETE FROM bracket_matches WHERE tip = ? AND lig = ? AND tur = ?").bind(tip, lig, tur),
    ...matches.map((m) =>
      env.DB.prepare("INSERT INTO bracket_matches (tip, lig, tur, data_json, lastModified) VALUES (?, ?, ?, ?, ?)").bind(
        tip,
        lig,
        tur,
        JSON.stringify(m),
        now
      )
    ),
  ];
  await env.DB.batch(statements);
}
