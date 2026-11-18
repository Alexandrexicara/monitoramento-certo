import express from "express";
import cors from "cors";
import pg from "pg";
import crypto from "node:crypto";

const { Pool } = pg;
const app = express();
app.use(cors());
app.use(express.json({ limit: "256kb" }));

const databaseUrl = process.env.DATABASE_URL || "";
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
    })
  : null;
const collectorToken = process.env.COLLECTOR_TOKEN || "";
const agentToken = process.env.JARVIS_AGENT_TOKEN || "";
const memory = [];
const stamp = () => new Date().toISOString();

function requireAgent(req, res, next) {
  const supplied = req.header("authorization")?.replace(/^Bearer\s+/i, "").trim()
    || req.header("x-agent-token") || "";
  if (!agentToken) return res.status(503).json({ error: "jarvis_agent_token_not_configured" });
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(agentToken);
  if (!supplied || suppliedBuffer.length !== expectedBuffer.length
      || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return res.status(401).json({ error: "invalid_agent_token" });
  }
  next();
}

app.get("/api/health", async (_req, res) => {
  let database = "not_configured";
  if (pool) {
    try { await pool.query("select 1"); database = "connected"; }
    catch { database = "error"; }
  }
  res.json({ ok: true, service: "monitor-aviator-api", database, time: stamp() });
});

app.get("/api/status", async (_req, res) => {
  try {
    const totalRounds = pool
      ? (await pool.query("select count(*)::int as n from rounds")).rows[0].n
      : memory.length;
    res.json({ ok: true, totalRounds, mode: pool ? "postgres" : "memory-demo" });
  } catch { res.status(500).json({ error: "database_error" }); }
});

app.post("/api/rounds", async (req, res) => {
  if (process.env.NODE_ENV === "production" && !collectorToken) {
    return res.status(503).json({ error: "collector_token_not_configured" });
  }
  if (collectorToken && req.header("x-collector-token") !== collectorToken) {
    return res.status(401).json({ error: "invalid_collector_token" });
  }
  const value = Number(req.body?.multiplier);
  if (!Number.isFinite(value) || value < 1 || value > 1000000) {
    return res.status(400).json({ error: "multiplier_must_be_number_gte_1" });
  }
  const row = {
    id: crypto.randomUUID(),
    multiplier: Number(value.toFixed(2)),
    source: String(req.body?.source || "manual").slice(0, 40),
    occurredAt: req.body?.occurredAt && Number.isFinite(Date.parse(req.body.occurredAt))
      ? new Date(req.body.occurredAt).toISOString() : stamp(),
  };
  try {
    if (pool) {
      const result = await pool.query(
        'insert into rounds(id,multiplier,source,occurred_at) values($1,$2,$3,$4) returning id,multiplier,source,occurred_at as "occurredAt"',
        [row.id, row.multiplier, row.source, row.occurredAt],
      );
      return res.status(201).json({ ok: true, round: result.rows[0] });
    }
    memory.unshift(row);
    memory.splice(5000);
    res.status(201).json({ ok: true, round: row, warning: "memory_mode_not_persistent" });
  } catch { res.status(500).json({ error: "save_failed" }); }
});

app.get("/api/rounds", async (req, res) => {
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
  try {
    if (pool) {
      const result = await pool.query(
        'select id,multiplier,source,occurred_at as "occurredAt" from rounds order by occurred_at desc limit $1',
        [limit],
      );
      return res.json({ rounds: result.rows });
    }
    res.json({ rounds: memory.slice(0, limit), warning: "memory_mode_not_persistent" });
  } catch { res.status(500).json({ error: "read_failed" }); }
});

app.get("/api/metrics", async (_req, res) => {
  try {
    const values = pool
      ? (await pool.query("select multiplier from rounds order by occurred_at desc limit 500")).rows.map((row) => Number(row.multiplier))
      : memory.map((row) => row.multiplier);
    if (!values.length) return res.json({ count: 0, average: null, median: null, above2: 0, above10: 0, last: null });
    const sorted = [...values].sort((a, b) => a - b);
    res.json({
      count: values.length,
      average: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)),
      median: sorted[Math.floor(sorted.length / 2)],
      above2: values.filter((value) => value >= 2).length,
      above10: values.filter((value) => value >= 10).length,
      last: values[0],
    });
  } catch { res.status(500).json({ error: "metrics_failed" }); }
});

// Endpoints exclusivos do supervisor Jarvis. Não expõem tokens nem permitem escrita no projeto.
app.get("/api/agent/summary", requireAgent, async (_req, res) => {
  try {
    let totalRounds = memory.length;
    let lastRound = memory[0] || null;
    let roundsLastHour = memory.filter((row) => Date.now() - Date.parse(row.occurredAt) <= 3600000).length;
    let database = pool ? "connected" : "memory-demo";
    if (pool) {
      const result = await pool.query(`
        select count(*)::int as total,
          count(*) filter (where occurred_at >= now() - interval '1 hour')::int as last_hour
        from rounds
      `);
      const latest = await pool.query(
        'select id,multiplier,source,occurred_at as "occurredAt" from rounds order by occurred_at desc limit 1'
      );
      totalRounds = result.rows[0].total;
      roundsLastHour = result.rows[0].last_hour;
      lastRound = latest.rows[0] || null;
    }
    res.json({
      ok: true,
      service: "monitor-aviator-api",
      database,
      totalRounds,
      roundsLastHour,
      lastRound,
      collectorTokenConfigured: Boolean(collectorToken),
      checkedAt: stamp(),
    });
  } catch {
    res.status(503).json({ ok: false, service: "monitor-aviator-api", database: "error", checkedAt: stamp() });
  }
});

app.post("/api/agent/events", requireAgent, async (req, res) => {
  const allowed = new Set(["supervisor_online", "supervisor_degraded", "supervisor_recovered", "manual_note"]);
  const event = String(req.body?.event || "");
  if (!allowed.has(event)) return res.status(400).json({ error: "event_not_allowed" });
  const message = String(req.body?.message || "").slice(0, 500);
  const details = req.body?.details && typeof req.body.details === "object" && !Array.isArray(req.body.details)
    ? JSON.stringify(req.body.details).slice(0, 4000) : "{}";
  try {
    if (pool) {
      const result = await pool.query(
        "insert into jarvis_agent_events(event,message,details) values($1,$2,$3::jsonb) returning id,created_at",
        [event, message, details],
      );
      return res.status(201).json({ ok: true, event: result.rows[0] });
    }
    res.status(201).json({ ok: true, event: { event, message, created_at: stamp() }, warning: "event_not_persisted_database_unavailable" });
  } catch { res.status(500).json({ error: "event_save_failed" }); }
});

app.get("/api/agent/events", requireAgent, async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
  if (!pool) return res.json({ events: [], warning: "database_not_configured" });
  try {
    const result = await pool.query(
      "select id,event,message,details,created_at from jarvis_agent_events order by created_at desc limit $1",
      [limit],
    );
    res.json({ events: result.rows });
  } catch { res.status(500).json({ error: "events_read_failed" }); }
});

app.get("/", (_req, res) => res.redirect("/api/health"));

const start = async () => {
  if (pool) {
    await pool.query(`
      create table if not exists rounds(
        id uuid primary key,
        multiplier numeric(12,2) not null check(multiplier >= 1),
        source varchar(40) not null default 'manual',
        occurred_at timestamptz not null default now()
      );
      create index if not exists rounds_occurred_at_idx on rounds(occurred_at desc);
      create table if not exists jarvis_agent_events(
        id bigserial primary key,
        event varchar(40) not null,
        message varchar(500) not null default '',
        details jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      );
      create index if not exists jarvis_agent_events_created_idx on jarvis_agent_events(created_at desc);
    `);
  }
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log("Monitor Aviator API listening on " + port));
};
start().catch((error) => { console.error("Startup failed", error); process.exit(1); });
