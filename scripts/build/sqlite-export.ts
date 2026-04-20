import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";

const DB_PATH = "dist/palestine-datasets.sqlite";

function collectKeys(rows: Record<string, unknown>[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) keys.add(k);
  }
  return [...keys];
}

function inferType(v: unknown): string {
  if (typeof v === "number") return Number.isInteger(v) ? "INTEGER" : "REAL";
  return "TEXT";
}

function toSQLite(v: unknown): string | number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

function buildTable(
  db: Database,
  tableName: string,
  rows: Record<string, unknown>[],
  primaryKey?: string
) {
  const keys = collectKeys(rows);

  const typeMap: Record<string, string> = {};
  for (const key of keys) {
    for (const row of rows) {
      if (row[key] != null) {
        typeMap[key] = inferType(row[key]);
        break;
      }
    }
    typeMap[key] ??= "TEXT";
  }

  const pkClause = primaryKey ? `, PRIMARY KEY (${primaryKey})` : "";
  const colDefs = keys.map((k) => `"${k}" ${typeMap[k]}`).join(", ");

  db.run(`DROP TABLE IF EXISTS "${tableName}"`);
  db.run(`CREATE TABLE "${tableName}" (${colDefs}${pkClause})`);

  const placeholders = keys.map(() => "?").join(", ");
  const insert = db.prepare(
    `INSERT OR REPLACE INTO "${tableName}" (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${placeholders})`
  );

  db.transaction((items: Record<string, unknown>[]) => {
    for (const row of items) {
      insert.run(keys.map((k) => toSQLite(row[k])));
    }
  })(rows);

  console.log(`  ✓ ${tableName}: ${rows.length} rows, ${keys.length} cols`);
}

async function loadPressKilled(db: Database) {
  const rows: Record<string, unknown>[] = await Bun.file("press_killed_in_gaza.json").json();
  buildTable(db, "press_killed_in_gaza", rows);
}

async function loadCasualtiesDaily(db: Database) {
  const rows: Record<string, unknown>[] = await Bun.file("casualties_daily.json").json();
  buildTable(db, "casualties_daily", rows, "report_date");
}

async function loadWestBankDaily(db: Database) {
  const raw: Record<string, unknown>[] = await Bun.file("west_bank_daily.json").json();

  // flatten nested "verified" object → verified_* prefix
  const rows = raw.map((row) => {
    const flat: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (k === "verified" && typeof v === "object" && v !== null) {
        for (const [vk, vv] of Object.entries(v as Record<string, unknown>)) {
          flat[`verified_${vk}`] = vv;
        }
      } else {
        flat[k] = v;
      }
    }
    return flat;
  });

  buildTable(db, "west_bank_daily", rows, "report_date");
}

async function loadKilledInGaza(db: Database) {
  const raw: unknown[][] = await Bun.file("killed-in-gaza-v3.json").json();

  // format: row 0 = headers, rows 1+ = data
  const [header, ...dataRows] = raw;
  const keys = header as string[];

  const rows = dataRows.map((row) => {
    const obj: Record<string, unknown> = {};
    keys.forEach((k, i) => { obj[k] = (row as unknown[])[i]; });
    return obj;
  });

  buildTable(db, "killed_in_gaza", rows, "id");
}

async function loadInfrastructureDamaged(db: Database) {
  const raw: Record<string, unknown>[] = await Bun.file("infrastructure-damaged.json").json();

  // flatten nested category objects → category_field prefix
  const rows = raw.map((row) => {
    const flat: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        for (const [vk, vv] of Object.entries(v as Record<string, unknown>)) {
          flat[`${k}_${vk}`] = vv;
        }
      } else {
        flat[k] = v;
      }
    }
    return flat;
  });

  buildTable(db, "infrastructure_damaged", rows, "report_date");
}

function writeMetadata(db: Database) {
  db.run(`DROP TABLE IF EXISTS _meta`);
  db.run(`CREATE TABLE _meta (key TEXT PRIMARY KEY, value TEXT)`);

  const insert = db.prepare(`INSERT INTO _meta (key, value) VALUES (?, ?)`);
  db.transaction(() => {
    insert.run("built_at", new Date().toISOString());
    insert.run("source", "https://github.com/TechForPalestine/palestine-datasets");
    insert.run("script_version", "1.0.0");
  })();

  console.log(`  ✓ _meta`);
}

async function main() {
  mkdirSync("dist", { recursive: true });

  const db = new Database(DB_PATH);
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA synchronous = NORMAL");

  try {
    await loadPressKilled(db);
    await loadCasualtiesDaily(db);
    await loadWestBankDaily(db);
    await loadKilledInGaza(db);
    await loadInfrastructureDamaged(db);
    writeMetadata(db);
    console.log(`✅ ${DB_PATH}`);
  } finally {
    db.run("PRAGMA wal_checkpoint(TRUNCATE)");
    db.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});