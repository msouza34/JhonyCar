import { ChangeEvent } from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export default function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <label className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-[#0c1933]/75 px-3 py-2 text-slate-200 transition focus-within:border-blue-300/45">
      <Search size={15} className="text-slate-400" />
      <input
        value={value}
        onChange={handleChange}
        placeholder={placeholder ?? "Buscar..."}
        className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
      />
      <kbd className="hidden rounded-md border border-white/10 bg-[#112448] px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-slate-400 md:block">
        busca
      </kbd>
    </label>
  );
}
