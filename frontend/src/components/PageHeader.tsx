interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-[linear-gradient(130deg,rgba(12,30,65,0.78),rgba(8,21,45,0.95))] px-4 py-3 shadow-[0_10px_30px_rgba(3,10,24,0.35)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-blue-200/75">JhonyCar</p>
          <h1 className="font-title text-2xl font-bold text-white">{title}</h1>
          {subtitle ? <p className="mt-1 text-[13px] text-slate-300">{subtitle}</p> : null}
        </div>
        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
    </div>
  );
}
