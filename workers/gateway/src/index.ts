import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { executeRoute } from "./routes/execute";
import { slavaRoute } from "./routes/slava";

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  const origin = c.env.ALLOWED_ORIGIN || "*";
  return cors({
    origin: origin === "*" ? "*" : origin.split(",").map((o) => o.trim()),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["x-slava-provider", "x-slava-degraded", "retry-after"],
    maxAge: 86400,
  })(c, next);
});

app.get("/health", (c) =>
  c.json({ status: "ok", service: "hastos-gateway", time: new Date().toISOString() }),
);

app.post("/execute", executeRoute);
app.post("/slava", slavaRoute);

app.notFound((c) => c.json({ error: "not_found" }, 404));

export default app;
