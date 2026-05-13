interface EmptyStateProps {
  title: string;
  description?: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-blue-400/25 bg-[#081631]/65 p-8 text-center">
      <h3 className="font-title text-lg font-semibold text-slate-100">{title}</h3>
      {description ? <p className="mt-2 text-sm text-slate-300">{description}</p> : null}
    </div>
  );
}
