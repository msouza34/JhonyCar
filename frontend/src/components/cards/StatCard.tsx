import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
}

export default function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card p-5 shadow transition hover:scale-[1.01]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-100">{value}</h2>
        </div>
        <Icon className="text-blue-400" size={22} />
      </div>
    </div>
  );
}
