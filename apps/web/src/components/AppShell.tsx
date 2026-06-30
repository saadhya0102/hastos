import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui";
import { SlavaPanel } from "./SlavaPanel";

const NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/learn", label: "Curriculum" },
  { to: "/problems", label: "Problems" },
  { to: "/interview", label: "Interview Track" },
  { to: "/tests", label: "Tests" },
  { to: "/review", label: "Review" },
  { to: "/playground", label: "Playground" },
];

function toggleTheme() {
  const root = document.documentElement;
  root.classList.toggle("light");
  root.classList.toggle("dark");
}

export function AppShell() {
  const { user, logout, configured } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-fg">H</span>
            HastOS
          </NavLink>
          {!configured && (
            <span className="rounded-md border border-warn/40 bg-warn/10 px-2 py-0.5 text-xs text-warn">
              demo mode (no Firebase)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={toggleTheme}>
            Theme
          </Button>
          {user ? (
            <>
              <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
              <Button size="sm" variant="outline" onClick={() => void logout()}>
                Sign out
              </Button>
            </>
          ) : (
            <NavLink to="/login">
              <Button size="sm">Sign in</Button>
            </NavLink>
          )}
        </div>
      </header>

      <div className="flex pt-14">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto border-r border-border bg-surface px-3 py-4 md:block">
          <nav className="space-y-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    "block rounded-lg px-3 py-2 text-sm font-medium",
                    isActive ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface2 hover:text-fg",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 border-t border-border pt-4">
            <NavLink
              to="/profile"
              className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface2 hover:text-fg"
            >
              Profile
            </NavLink>
            <NavLink
              to="/admin"
              className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface2 hover:text-fg"
            >
              Admin
            </NavLink>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>

      <SlavaPanel />
    </div>
  );
}
