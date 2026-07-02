import clsx from "clsx";
import { activityHeatmap } from "@/lib/progress";

/**
 * GitHub-style activity heatmap. Renders the last `weeks` weeks of activity as a
 * grid of day cells, colored by event count. Purely local (no network).
 */
export function Heatmap({ weeks = 12 }: { weeks?: number }) {
  const days = activityHeatmap(weeks * 7);

  // Group into columns of 7 (one week each).
  const columns: { date: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) columns.push(days.slice(i, i + 7));

  const level = (c: number) => (c === 0 ? 0 : c < 2 ? 1 : c < 4 ? 2 : c < 7 ? 3 : 4);
  const cls = [
    "bg-surface2",
    "bg-accent/25",
    "bg-accent/45",
    "bg-accent/70",
    "bg-accent",
  ];

  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} event${d.count === 1 ? "" : "s"}`}
                className={clsx("h-3 w-3 rounded-sm", cls[level(d.count)])}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>{total} events in the last {weeks} weeks</span>
        <span className="flex items-center gap-1">
          less
          {cls.map((c, i) => (
            <span key={i} className={clsx("h-3 w-3 rounded-sm", c)} />
          ))}
          more
        </span>
      </div>
    </div>
  );
}
