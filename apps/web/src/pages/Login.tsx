import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button, Card } from "@/components/ui";

export function Login() {
  const { signInEmail, signInGoogle, configured } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInEmail(email, password);
      nav("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <Card className="p-6">
        <h1 className="text-xl font-bold">Sign in to HastOS</h1>
        {!configured && (
          <p className="mt-2 rounded-lg border border-warn/40 bg-warn/10 p-2 text-sm text-warn">
            Firebase isn't configured yet. You can still browse in demo mode.
          </p>
        )}
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-bad">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy || !configured}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <Button
          variant="outline"
          className="mt-2 w-full"
          disabled={!configured}
          onClick={() => void signInGoogle().then(() => nav("/"))}
        >
          Continue with Google
        </Button>
        <p className="mt-4 text-center text-sm text-muted">
          No account? <Link to="/signup" className="text-accent">Sign up</Link>
        </p>
      </Card>
    </div>
  );
}
