import { ReactNode } from "react";

interface Column<T> {
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
}

export default function Table<T>({ data, columns, keyExtractor, emptyMessage }: TableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#081631]/70 shadow-[0_8px_28px_rgba(2,8,25,0.35)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-[13px]">
          <thead className="bg-[#0b1834]/95 text-slate-300">
            <tr>
              {columns.map((column) => (
                <th key={column.header} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em]">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-400">
                  {emptyMessage ?? "Nenhum registro encontrado."}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={keyExtractor(item)} className="odd:bg-[#0b1731]/78 even:bg-[#0a152d]/72 hover:bg-blue-500/10">
                  {columns.map((column) => (
                    <td key={column.header} className={`px-3 py-2.5 ${column.className ?? ""}`}>
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
