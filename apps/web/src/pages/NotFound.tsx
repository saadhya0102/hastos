import { Link } from "react-router-dom";
import { Button } from "@/components/ui";

export function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-5xl font-bold text-accent">404</p>
      <p className="mt-2 text-muted">This page wandered off into unmapped memory.</p>
      <Link to="/" className="mt-6 inline-block">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
