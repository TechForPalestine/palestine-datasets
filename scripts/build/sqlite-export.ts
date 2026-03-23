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

async function loadInfrastructureDamaged(db: Database) {
  const raw: Record<string, unknown>[] = await Bun.file("infrastructure-damaged.json").json();

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

  const colDefs = keys.map((k) => `"${k}" ${typeMap[k]}`).join(", ");
  db.run(`DROP TABLE IF EXISTS infrastructure_damaged`);
  db.run(`CREATE TABLE infrastructure_damaged (${colDefs}, PRIMARY KEY (report_date))`);

  const placeholders = keys.map(() => "?").join(", ");
  const insert = db.prepare(
    `INSERT OR REPLACE INTO infrastructure_damaged (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${placeholders})`
  );

  db.transaction((items: Record<string, unknown>[]) => {
    for (const row of items) {
      insert.run(keys.map((k) => toSQLite(row[k])));
    }
  })(rows);

  console.log(`  ✓ infrastructure_damaged: ${rows.length} rows, ${keys.length} cols`);
}

async function loadKilledInGaza(db: Database) {
  const raw: unknown[][] = await Bun.file("killed-in-gaza-v3.json").json();

  const [header, ...dataRows] = raw;
  const keys = header as string[];

  const rows = dataRows.map((row) => {
    const obj: Record<string, unknown> = {};
    keys.forEach((k, i) => { obj[k] = (row as unknown[])[i]; });
    return obj;
  });

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

  const colDefs = keys.map((k) => `"${k}" ${typeMap[k]}`).join(", ");
  db.run(`DROP TABLE IF EXISTS killed_in_gaza`);
  db.run(`CREATE TABLE killed_in_gaza (${colDefs}, PRIMARY KEY (id))`);

  const placeholders = keys.map(() => "?").join(", ");
  const insert = db.prepare(
    `INSERT OR REPLACE INTO killed_in_gaza (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${placeholders})`
  );

  db.transaction((items: Record<string, unknown>[]) => {
    for (const row of items) {
      insert.run(keys.map((k) => toSQLite(row[k])));
    }
  })(rows);

  console.log(`  ✓ killed_in_gaza: ${rows.length} rows, ${keys.length} cols`);
}

async function loadWestBankDaily(db: Database) {
  const raw: Record<string, unknown>[] = await Bun.file("west_bank_daily.json").json();

  // flatten: { report_date, verified: { killed, ... }, killed_cum, ... }
  // → { report_date, verified_killed, ..., killed_cum, ... }
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

  const colDefs = keys.map((k) => `"${k}" ${typeMap[k]}`).join(", ");
  db.run(`DROP TABLE IF EXISTS west_bank_daily`);
  db.run(`CREATE TABLE west_bank_daily (${colDefs}, PRIMARY KEY (report_date))`);

  const placeholders = keys.map(() => "?").join(", ");
  const insert = db.prepare(
    `INSERT OR REPLACE INTO west_bank_daily (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${placeholders})`
  );

  db.transaction((items: Record<string, unknown>[]) => {
    for (const row of items) {
      insert.run(keys.map((k) => toSQLite(row[k])));
    }
  })(rows);

  console.log(`  ✓ west_bank_daily: ${rows.length} rows, ${keys.length} cols`);
}

async function loadCasualtiesDaily(db: Database) {
  const rows: Record<string, unknown>[] = await Bun.file("casualties_daily.json").json();

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

  const colDefs = keys.map((k) => `"${k}" ${typeMap[k]}`).join(", ");
  db.run(`DROP TABLE IF EXISTS casualties_daily`);
  db.run(`CREATE TABLE casualties_daily (${colDefs}, PRIMARY KEY (report_date))`);

  const placeholders = keys.map(() => "?").join(", ");
  const insert = db.prepare(
    `INSERT OR REPLACE INTO casualties_daily (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${placeholders})`
  );

  const insertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const row of items) {
      insert.run(keys.map((k) => toSQLite(row[k])));
    }
  });

  insertMany(rows);
  console.log(`  ✓ casualties_daily: ${rows.length} rows, ${keys.length} cols`);
}

async function loadPressKilled(db: Database) {
  const raw = Bun.file("press_killed_in_gaza.json");
  const rows: Record<string, unknown>[] = await raw.json();

  if (!rows.length) return;

  const keys = Object.keys(rows[0]);
  const colDefs = keys.map((k) => `"${k}" TEXT`).join(", ");

  db.run(`DROP TABLE IF EXISTS press_killed_in_gaza`);
  db.run(`CREATE TABLE press_killed_in_gaza (${colDefs})`);

  const placeholders = keys.map(() => "?").join(", ");
  const insert = db.prepare(
    `INSERT INTO press_killed_in_gaza (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${placeholders})`
  );

  const insertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const row of items) {
      insert.run(keys.map((k) => String(row[k] ?? "")));
    }
  });

  insertMany(rows);
  console.log(`  ✓ press_killed_in_gaza: ${rows.length} rows`);
};

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
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    console.log("  tables:", tables.map((t) => t.name).join(", "));
  } finally {
    db.run("PRAGMA wal_checkpoint(TRUNCATE)");
    db.close();
  }

  console.log(`✅ ${DB_PATH}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});