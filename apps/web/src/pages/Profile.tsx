import { useAuth } from "@/lib/auth";
import { allProblems, modules, triviaBank } from "@/lib/content";
import { getProblemProgress } from "@/lib/progress";
import { Card, Button, Badge } from "@/components/ui";

export function Profile() {
  const { user, logout, configured } = useAuth();
  const solved = allProblems.filter((p) => getProblemProgress(p.id).status === "solved").length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card className="p-5">
        <p className="text-sm text-muted">Account</p>
        {user ? (
          <div className="mt-2 space-y-1">
            <p className="font-medium">{user.email}</p>
            <p className="text-xs text-muted">uid: {user.uid}</p>
          </div>
        ) : (
          <p className="mt-2 text-muted">
            {configured ? "Not signed in." : "Demo mode — Firebase is not configured."}
          </p>
        )}
        {user && (
          <Button className="mt-4" variant="outline" onClick={() => void logout()}>
            Sign out
          </Button>
        )}
      </Card>

      <Card className="p-5">
        <p className="text-sm text-muted">Progress</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="accent">{solved}/{allProblems.length} problems solved</Badge>
          <Badge>{modules.length} modules</Badge>
          <Badge>{triviaBank.length} trivia facts</Badge>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-sm text-muted">Preferences</p>
        <div className="mt-3 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const r = document.documentElement;
              r.classList.toggle("light");
              r.classList.toggle("dark");
            }}
          >
            Toggle theme
          </Button>
        </div>
      </Card>
    </div>
  );
}
