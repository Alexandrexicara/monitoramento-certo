import express from "express";
import cors from "cors";
import pg from "pg";
import crypto from "node:crypto";

const { Pool } = pg;
const app = express();
app.set("trust proxy", 1);
const allowedOrigins = (process.env.WEB_ORIGIN || "").split(",").map(x => x.trim()).filter(Boolean);
app.use(cors({ origin(origin, cb) { if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return cb(null, true); return cb(new Error("origin_not_allowed")); }, allowedHeaders: ["Content-Type", "Authorization", "X-Collector-Token"], methods: ["GET", "POST", "PATCH", "OPTIONS"] }));
app.use(express.json({ limit: "256kb" }));

const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false } }) : null;
const collectorToken = process.env.COLLECTOR_TOKEN || "";
const adminPassword = process.env.ADMIN_PASSWORD || "";
const sessionSecret = process.env.ADMIN_SESSION_SECRET || "";
const memory = [];
const now = () => new Date().toISOString();
const tokenFor = payload => { const body = Buffer.from(JSON.stringify(payload)).toString("base64url"); const sig = crypto.createHmac("sha256", sessionSecret).update(body).digest("base64url"); return body + "." + sig; };
function requireAdmin(req, res, next) {
  if (!sessionSecret) return res.status(503).json({ error: "admin_session_secret_not_configured" });
  const raw = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const [body, signature] = raw.split(".");
  if (!body || !signature) return res.status(401).json({ error: "admin_auth_required" });
  const expected = crypto.createHmac("sha256", sessionSecret).update(body).digest();
  let actual; try { actual = Buffer.from(signature, "base64url"); } catch { return res.status(401).json({ error: "invalid_admin_session" }); }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return res.status(401).json({ error: "invalid_admin_session" });
  try { const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")); if (p.role !== "admin" || !p.exp || p.exp < Date.now()) return res.status(401).json({ error: "admin_session_expired" }); req.admin = true; next(); } catch { return res.status(401).json({ error: "invalid_admin_session" }); }
}
async function queryRounds(where, params = [], limit = 500) {
  if (pool) return (await pool.query(`select id,multiplier,source,occurred_at as "occurredAt",is_public as "isPublic",published_at as "publishedAt" from rounds ${where} order by occurred_at desc limit ${limit}`, params)).rows;
  return memory.filter(where.includes("is_public = true") ? x => x.isPublic : () => true).slice(0, limit);
}
function metrics(rows) {
  const a = rows.map(x => Number(x.multiplier));
  if (!a.length) return { count: 0, average: null, median: null, above2: 0, above10: 0, last: null };
  const sorted = [...a].sort((x,y)=>x-y);
  return { count: a.length, average: Number((a.reduce((x,y)=>x+y,0)/a.length).toFixed(2)), median: sorted[Math.floor(sorted.length/2)], above2: a.filter(x=>x>=2).length, above10: a.filter(x=>x>=10).length, last: a[0] };
}
async function insertRound(v, source, occurredAt) {
  const row = { id: crypto.randomUUID(), multiplier: Number(v.toFixed(2)), source: String(source || "manual").slice(0,40), occurredAt: occurredAt && Number.isFinite(Date.parse(occurredAt)) ? new Date(occurredAt).toISOString() : now(), isPublic: false, publishedAt: null };
  if (pool) {
    const r = await pool.query('insert into rounds(id,multiplier,source,occurred_at,is_public) values($1,$2,$3,$4,false) returning id,multiplier,source,occurred_at as "occurredAt",is_public as "isPublic",published_at as "publishedAt"', [row.id,row.multiplier,row.source,row.occurredAt]);
    return r.rows[0];
  }
  memory.unshift(row); memory.splice(5000); return row;
}
app.get("/api/health", async (_q,s) => { let database="not_configured"; if(pool){try{await pool.query("select 1");database="connected"}catch{database="error"}} s.json({ok:true,service:"monitor-aviator-api",database,adminConfigured:Boolean(adminPassword&&sessionSecret),time:now()}); });
app.get("/api/status", async (_q,s) => { try { const n=pool?(await pool.query("select count(*)::int n from rounds where is_public=true")).rows[0].n:memory.filter(x=>x.isPublic).length; s.json({ok:true,totalRounds:n,mode:pool?"postgres":"memory-demo"}); } catch { s.status(500).json({error:"database_error"}); } });

app.post("/api/admin/login", (req,res) => {
  if (!adminPassword || !sessionSecret) return res.status(503).json({error:"admin_not_configured_in_render"});
  const supplied = String(req.body?.password || "");
  const a = Buffer.from(supplied), b = Buffer.from(adminPassword);
  if (a.length !== b.length || !crypto.timingSafeEqual(a,b)) return res.status(401).json({error:"invalid_password"});
  res.json({ok:true,token:tokenFor({role:"admin",exp:Date.now()+8*60*60*1000}),expiresIn:28800});
});
app.get("/api/admin/me", requireAdmin, (_q,s) => s.json({ok:true,role:"admin"}));
app.get("/api/admin/rounds", requireAdmin, async (q,s) => { try { const limit=Math.min(500,Math.max(1,Number(q.query.limit)||200)); const rows=pool?(await pool.query('select id,multiplier,source,occurred_at as "occurredAt",is_public as "isPublic",published_at as "publishedAt" from rounds order by occurred_at desc limit $1',[limit])).rows:memory.slice(0,limit); s.json({rounds:rows}); } catch { s.status(500).json({error:"admin_read_failed"}); } });
app.get("/api/admin/metrics", requireAdmin, async (_q,s) => { try { const rows=pool?(await pool.query("select multiplier from rounds")).rows:memory; s.json(metrics(rows)); } catch { s.status(500).json({error:"admin_metrics_failed"}); } });
app.post("/api/admin/rounds", requireAdmin, async (q,s) => { const v=Number(q.body?.multiplier); if(!Number.isFinite(v)||v<1||v>1000000) return s.status(400).json({error:"multiplier_must_be_number_gte_1"}); try { const round=await insertRound(v,q.body?.source||"admin-manual",q.body?.occurredAt); s.status(201).json({ok:true,round}); } catch { s.status(500).json({error:"save_failed"}); } });
app.patch("/api/admin/rounds/:id/publication", requireAdmin, async (q,s) => { const publish=q.body?.isPublic; if(typeof publish!=="boolean") return s.status(400).json({error:"isPublic_boolean_required"}); try { if(pool) { const r=await pool.query('update rounds set is_public=$1,published_at=case when $1 then now() else null end where id=$2 returning id,is_public as "isPublic",published_at as "publishedAt"', [publish,q.params.id]); if(!r.rowCount) return s.status(404).json({error:"round_not_found"}); return s.json({ok:true,round:r.rows[0]}); } const row=memory.find(x=>x.id===q.params.id); if(!row) return s.status(404).json({error:"round_not_found"}); row.isPublic=publish; row.publishedAt=publish?now():null; s.json({ok:true,round:row}); } catch { s.status(500).json({error:"publication_update_failed"}); } });

app.post("/api/rounds", async(q,s) => {
  if(process.env.NODE_ENV==="production"&&!collectorToken) return s.status(503).json({error:"collector_token_not_configured"});
  if(collectorToken&&q.header("x-collector-token")!==collectorToken) return s.status(401).json({error:"invalid_collector_token"});
  const v=Number(q.body?.multiplier); if(!Number.isFinite(v)||v<1||v>1000000) return s.status(400).json({error:"multiplier_must_be_number_gte_1"});
  try { const round=await insertRound(v,q.body?.source,q.body?.occurredAt); s.status(201).json({ok:true,round}); } catch { s.status(500).json({error:"save_failed"}); }
});
app.get("/api/rounds", async(q,s) => { const n=Math.min(500,Math.max(1,Number(q.query.limit)||100)); try { const rows=pool?(await pool.query('select id,multiplier,source,occurred_at as "occurredAt" from rounds where is_public=true order by occurred_at desc limit $1',[n])).rows:memory.filter(x=>x.isPublic).slice(0,n); s.json({rounds:rows}); } catch { s.status(500).json({error:"read_failed"}); } });
app.get("/api/metrics", async(_q,s) => { try { const rows=pool?(await pool.query("select multiplier from rounds where is_public=true order by occurred_at desc limit 500")).rows:memory.filter(x=>x.isPublic); s.json(metrics(rows)); } catch { s.status(500).json({error:"metrics_failed"}); } });
app.get("/",(_q,s)=>s.redirect("/api/health"));
const start=async()=>{
  if(pool) await pool.query("create table if not exists rounds(id uuid primary key,multiplier numeric(12,2) not null check(multiplier>=1),source varchar(40) not null default 'manual',occurred_at timestamptz not null default now()); alter table rounds add column if not exists is_public boolean not null default false; alter table rounds add column if not exists published_at timestamptz; create index if not exists rounds_occurred_at_idx on rounds(occurred_at desc); create index if not exists rounds_public_occurred_at_idx on rounds(is_public,occurred_at desc)");
  const port=process.env.PORT||3000; app.listen(port,()=>console.log("Monitor Aviator API listening on "+port));
};
start().catch(e=>{console.error("Startup failed",e);process.exit(1)});
