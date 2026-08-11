import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber" | "red";
};

const toneClass = {
  neutral: "border-border bg-muted text-muted-foreground",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-medium", toneClass[tone])}>
      {children}
    </Badge>
  );
}
