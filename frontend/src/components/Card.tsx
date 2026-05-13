import { ReactNode } from "react";

interface CardProps {
  title: string;
  value: ReactNode;
  caption?: string;
  accent?: string;
}

export default function Card({ title, value, caption, accent }: CardProps) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-card to-[#172033] p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
      <header className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</h3>
        {accent ? <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} /> : null}
      </header>
      <p className="font-title text-3xl font-bold text-slate-50">{value}</p>
      {caption ? <p className="mt-2 text-xs text-slate-400">{caption}</p> : null}
    </article>
  );
}
