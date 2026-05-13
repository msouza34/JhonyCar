import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Car,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileText,
  Filter,
  Package,
  PackageSearch,
  Plus,
  Search,
  Upload,
  Wrench,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import { getErrorMessage } from "@/services/api";
import {
  createEstoqueItem,
  deleteEstoqueItem,
  listEstoqueItems,
  registrarEntradaEstoque,
  registrarSaidaEstoque,
  updateEstoqueItem,
} from "@/services/estoque.service";
import type { EstoqueFiltroStatus, EstoqueItem, EstoqueItemPayload } from "@/types/estoque";
import { cn } from "@/utils/cn";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface ItemFormState {
  codigo: string;
  peca: string;
  categoria: EstoqueItem["categoria"];
  fornecedor: string;
  estoque: string;
  minimo: string;
  precoUnitario: string;
  visual: EstoqueItem["visual"];
  imagemUrl: string;
}

interface MoveFormState {
  itemId: string;
  quantidade: string;
}

const defaultItemForm: ItemFormState = {
  codigo: "",
  peca: "",
  categoria: "Eletrica",
  fornecedor: "",
  estoque: "0",
  minimo: "3",
  precoUnitario: "0",
  visual: "bateria",
  imagemUrl: "",
};

const defaultMoveForm: MoveFormState = {
  itemId: "",
  quantidade: "1",
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Conteudo da imagem invalido."));
    };
    reader.onerror = () => reject(new Error("Falha ao ler imagem."));
    reader.readAsDataURL(file);
  });
}

function buildVisiblePages(currentPage: number, totalPages: number) {
  const pages: number[] = [];
  const from = Math.max(1, currentPage - 1);
  const to = Math.min(totalPages, currentPage + 2);

  for (let p = from; p <= to; p += 1) {
    pages.push(p);
  }

  if (!pages.includes(1)) pages.unshift(1);
  if (!pages.includes(totalPages)) pages.push(totalPages);
  return [...new Set(pages)];
}

function estoqueLabel(estoque: number, minimo: number) {
  if (estoque === 0) return "Sem estoque";
  if (estoque <= minimo) return "Estoque baixo";
  return "Disponivel";
}

function categoryClass(categoria: EstoqueItem["categoria"]) {
  if (categoria === "Ignicao") {
    return "border-violet-400/35 bg-violet-500/18 text-violet-100";
  }
  if (categoria === "Injecao") {
    return "border-amber-400/35 bg-amber-500/18 text-amber-100";
  }
  return "border-blue-400/35 bg-blue-500/18 text-blue-100";
}

function stockClass(estoque: number, minimo: number) {
  if (estoque === 0) return "text-rose-300";
  if (estoque <= minimo) return "text-amber-300";
  return "text-emerald-300";
}

function visualIcon(visual: EstoqueItem["visual"]) {
  if (visual === "bateria") return Car;
  if (visual === "alternador") return Wrench;
  if (visual === "motor") return Activity;
  if (visual === "vela") return FileText;
  if (visual === "cabo") return Package;
  if (visual === "fusivel") return AlertTriangle;
  if (visual === "rele") return PackageSearch;
  if (visual === "sensor") return Search;
  if (visual === "bobina") return Wrench;
  return Activity;
}

function visualTone(visual: EstoqueItem["visual"]) {
  if (visual === "bateria") return "from-blue-500/35 to-cyan-500/20 text-blue-100";
  if (visual === "alternador") return "from-slate-500/35 to-slate-500/20 text-slate-100";
  if (visual === "motor") return "from-amber-500/35 to-orange-500/20 text-amber-100";
  if (visual === "vela") return "from-violet-500/35 to-violet-500/20 text-violet-100";
  if (visual === "cabo") return "from-cyan-500/35 to-blue-500/20 text-cyan-100";
  if (visual === "fusivel") return "from-rose-500/35 to-rose-500/20 text-rose-100";
  if (visual === "rele") return "from-emerald-500/35 to-emerald-500/20 text-emerald-100";
  if (visual === "sensor") return "from-amber-500/35 to-orange-500/20 text-amber-100";
  if (visual === "bobina") return "from-violet-500/35 to-fuchsia-500/20 text-violet-100";
  return "from-blue-500/35 to-indigo-500/20 text-blue-100";
}

export default function EstoquePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<EstoqueItem["categoria"] | "TODAS">("TODAS");
  const [fornecedorFilter, setFornecedorFilter] = useState("TODOS");
  const [estoqueFilter, setEstoqueFilter] = useState<EstoqueFiltroStatus>("TODOS");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EstoqueItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(defaultItemForm);
  const [imageViewer, setImageViewer] = useState<{ url: string; title: string } | null>(null);
  const [invalidImages, setInvalidImages] = useState<Record<number, true>>({});

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveType, setMoveType] = useState<"ENTRADA" | "SAIDA">("ENTRADA");
  const [moveForm, setMoveForm] = useState<MoveFormState>(defaultMoveForm);

  useEffect(() => {
    void loadItems();
  }, []);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "nova-peca") {
      openCreate();
      const next = new URLSearchParams(searchParams);
      next.delete("action");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [searchText, categoriaFilter, fornecedorFilter, estoqueFilter, minPrice, maxPrice, pageSize]);

  const loadItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listEstoqueItems();
      setItems(response);
      setInvalidImages({});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const categorias = useMemo(
    () => [...new Set(items.map((item) => item.categoria))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [items],
  );

  const fornecedores = useMemo(
    () => [...new Set(items.map((item) => item.fornecedor))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [items],
  );

  const monthlyNewItems = useMemo(() => {
    const now = new Date();
    return items.filter((item) => {
      const createdAt = new Date(item.criadoEm);
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;
  }, [items]);

  const totalStockValue = useMemo(
    () => items.reduce((acc, item) => acc + item.estoque * Number(item.precoUnitario), 0),
    [items],
  );

  const lowStockCount = useMemo(
    () => items.filter((item) => item.estoque > 0 && item.estoque <= item.minimo).length,
    [items],
  );

  const outOfStockCount = useMemo(() => items.filter((item) => item.estoque === 0).length, [items]);

  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return items.filter((item) => {
      if (
        query &&
        !item.codigo.toLowerCase().includes(query) &&
        !item.peca.toLowerCase().includes(query) &&
        !item.categoria.toLowerCase().includes(query) &&
        !item.fornecedor.toLowerCase().includes(query)
      ) {
        return false;
      }

      if (categoriaFilter !== "TODAS" && item.categoria !== categoriaFilter) {
        return false;
      }

      if (fornecedorFilter !== "TODOS" && item.fornecedor !== fornecedorFilter) {
        return false;
      }

      if (estoqueFilter === "SEM_ESTOQUE" && item.estoque !== 0) {
        return false;
      }
      if (estoqueFilter === "ESTOQUE_BAIXO" && !(item.estoque > 0 && item.estoque <= item.minimo)) {
        return false;
      }
      if (estoqueFilter === "EM_ESTOQUE" && item.estoque <= 0) {
        return false;
      }

      if (minPrice && Number(item.precoUnitario) < Number(minPrice)) {
        return false;
      }
      if (maxPrice && Number(item.precoUnitario) > Number(maxPrice)) {
        return false;
      }

      return true;
    });
  }, [items, searchText, categoriaFilter, fornecedorFilter, estoqueFilter, minPrice, maxPrice]);

  const totalRows = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const pagedItems = filteredItems.slice(pageStart, pageEnd);
  const firstItem = totalRows === 0 ? 0 : pageStart + 1;
  const lastItem = totalRows === 0 ? 0 : Math.min(pageEnd, totalRows);
  const visiblePages = buildVisiblePages(currentPage, totalPages);

  const openCreate = () => {
    setEditingItem(null);
    setItemForm(defaultItemForm);
    setItemModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const openEdit = (item: EstoqueItem) => {
    setEditingItem(item);
    setItemForm({
      codigo: item.codigo,
      peca: item.peca,
      categoria: item.categoria,
      fornecedor: item.fornecedor,
      estoque: String(item.estoque),
      minimo: String(item.minimo),
      precoUnitario: String(item.precoUnitario),
      visual: item.visual,
      imagemUrl: item.imagemUrl ?? "",
    });
    setItemModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const openMovement = (type: "ENTRADA" | "SAIDA") => {
    setMoveType(type);
    setMoveForm({
      itemId: String(pagedItems[0]?.id ?? items[0]?.id ?? ""),
      quantidade: "1",
    });
    setMoveModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem valido.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Imagem maior que 5MB. Escolha um arquivo menor.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setItemForm((prev) => ({ ...prev, imagemUrl: dataUrl }));
      setError(null);
    } catch {
      setError("Nao foi possivel carregar a imagem selecionada.");
    }
  };

  const handleSaveItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: EstoqueItemPayload = {
      codigo: itemForm.codigo.trim().toUpperCase(),
      peca: itemForm.peca.trim(),
      categoria: itemForm.categoria,
      fornecedor: itemForm.fornecedor.trim(),
      estoque: Number(itemForm.estoque),
      minimo: Number(itemForm.minimo),
      precoUnitario: Number(itemForm.precoUnitario),
      visual: itemForm.visual,
      imagemUrl: itemForm.imagemUrl.trim() || undefined,
    };

    if (!payload.codigo || !payload.peca || !payload.fornecedor) {
      setError("Preencha codigo, peca e fornecedor.");
      return;
    }
    if (!Number.isFinite(payload.estoque) || payload.estoque < 0) {
      setError("Estoque invalido.");
      return;
    }
    if (!Number.isFinite(payload.minimo) || payload.minimo < 0) {
      setError("Minimo invalido.");
      return;
    }
    if (!Number.isFinite(payload.precoUnitario) || payload.precoUnitario < 0) {
      setError("Preco unitario invalido.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingItem) {
        await updateEstoqueItem(editingItem.id, payload);
        setSuccess("Peca atualizada com sucesso.");
      } else {
        const codigoExists = items.some((item) => item.codigo.toLowerCase() === payload.codigo.toLowerCase());
        if (codigoExists) {
          setError("Codigo ja cadastrado.");
          setSaving(false);
          return;
        }
        await createEstoqueItem(payload);
        setSuccess("Peca cadastrada com sucesso.");
      }

      setItemModalOpen(false);
      await loadItems();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: EstoqueItem) => {
    const confirm = window.confirm(`Excluir a peca ${item.codigo} - ${item.peca}?`);
    if (!confirm) return;

    setError(null);
    setSuccess(null);
    try {
      await deleteEstoqueItem(item.id);
      setSuccess("Peca removida com sucesso.");
      await loadItems();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSubmitMovement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const itemId = Number(moveForm.itemId);
    const quantidade = Number(moveForm.quantidade);

    if (!itemId || !Number.isFinite(quantidade) || quantidade <= 0) {
      setError("Informe item e quantidade validos.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (moveType === "ENTRADA") {
        await registrarEntradaEstoque(itemId, quantidade);
        setSuccess("Entrada registrada com sucesso.");
      } else {
        await registrarSaidaEstoque(itemId, quantidade);
        setSuccess("Saida registrada com sucesso.");
      }

      setMoveModalOpen(false);
      await loadItems();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-title text-[2.25rem] font-bold text-white">Estoque</h1>
        <p className="text-slate-300">Controle de pecas e materiais</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      <div className="jc-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/15 ring-1 ring-blue-300/25 text-blue-200">
              <PackageSearch size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-300">Total de itens</p>
              <p className="font-title text-4xl font-bold leading-none text-white">{items.length}</p>
              <p className="mt-1 text-sm text-slate-400">+{monthlyNewItems} este mes</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-300/25 text-emerald-200">
              <CircleDollarSign size={20} />
            </div>
            <div>
              <p className="text-sm text-emerald-300">Valor total em estoque</p>
              <p className="font-title text-[2rem] font-bold leading-none text-white">{money.format(totalStockValue)}</p>
              <p className="mt-1 text-sm text-slate-400">atualizado agora</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/15 ring-1 ring-amber-300/25 text-amber-200">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm text-amber-300">Estoque baixo</p>
              <p className="font-title text-4xl font-bold leading-none text-white">{lowStockCount}</p>
              <p className="mt-1 text-sm text-slate-400">precisando reposicao</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(11,22,45,0.98),rgba(7,14,30,0.96))] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose-500/15 ring-1 ring-rose-300/25 text-rose-200">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-sm text-rose-300">Sem estoque</p>
              <p className="font-title text-4xl font-bold leading-none text-white">{outOfStockCount}</p>
              <p className="mt-1 text-sm text-slate-400">itens em falta</p>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(11,23,46,0.98),rgba(7,15,33,0.96))] p-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_0.9fr_1fr_0.9fr_auto_auto_auto] xl:items-end">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c1933]/75 px-3 py-2.5 text-slate-200">
            <Search size={16} className="text-slate-400" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Buscar peca, codigo..."
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-300">
            <span>Categoria</span>
            <select
              value={categoriaFilter}
              onChange={(event) => setCategoriaFilter(event.target.value as EstoqueItem["categoria"] | "TODAS")}
              className="rounded-xl border border-white/10 bg-[#0c1933]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="TODAS">Todas</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-300">
            <span>Fornecedor</span>
            <select
              value={fornecedorFilter}
              onChange={(event) => setFornecedorFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#0c1933]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="TODOS">Todos</option>
              {fornecedores.map((fornecedor) => (
                <option key={fornecedor} value={fornecedor}>
                  {fornecedor}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-300">
            <span>Estoque</span>
            <select
              value={estoqueFilter}
              onChange={(event) => setEstoqueFilter(event.target.value as EstoqueFiltroStatus)}
              className="rounded-xl border border-white/10 bg-[#0c1933]/75 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="TODOS">Todos</option>
              <option value="EM_ESTOQUE">Com estoque</option>
              <option value="ESTOQUE_BAIXO">Estoque baixo</option>
              <option value="SEM_ESTOQUE">Sem estoque</option>
            </select>
          </label>

          <Button
            variant="secondary"
            className="h-11 border-emerald-300/30 bg-emerald-600/20 text-emerald-100 hover:bg-emerald-500/30"
            onClick={() => openMovement("ENTRADA")}
          >
            <span className="inline-flex items-center gap-2">
              <Download size={15} />
              Entrada
            </span>
          </Button>

          <Button
            variant="secondary"
            className="h-11 border-rose-300/30 bg-rose-600/20 text-rose-100 hover:bg-rose-500/30"
            onClick={() => openMovement("SAIDA")}
          >
            <span className="inline-flex items-center gap-2">
              <Upload size={15} />
              Saida
            </span>
          </Button>

          <Button variant="secondary" className="h-11" onClick={() => setShowMoreFilters((prev) => !prev)}>
            <span className="inline-flex items-center gap-2">
              <Filter size={15} />
              Mais filtros
            </span>
          </Button>
        </div>

        {showMoreFilters ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Preco minimo"
              type="number"
              min={0}
              step="0.01"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
            />
            <Input
              label="Preco maximo"
              type="number"
              min={0}
              step="0.01"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
            <div className="flex items-end">
              <Button
                variant="ghost"
                className="h-11 w-full"
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                  setCategoriaFilter("TODAS");
                  setFornecedorFilter("TODOS");
                  setEstoqueFilter("TODOS");
                  setSearchText("");
                }}
              >
                Limpar filtros
              </Button>
            </div>
            <div className="flex items-end">
              <Button className="h-11 w-full" onClick={openCreate}>
                <span className="inline-flex items-center gap-2">
                  <Plus size={16} />
                  Nova peca
                </span>
              </Button>
            </div>
          </div>
        ) : null}
      </article>

      <article className="rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(10,22,45,0.98),rgba(6,14,30,0.96))] p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1220px]">
            <thead className="bg-white/[0.02]">
              <tr className="border-b border-white/10 text-left text-sm text-slate-400">
                <th className="px-6 py-3 font-medium">Imagem</th>
                <th className="px-4 py-3 font-medium">Codigo</th>
                <th className="px-4 py-3 font-medium">Peca</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Fornecedor</th>
                <th className="px-4 py-3 font-medium">Estoque</th>
                <th className="px-4 py-3 font-medium">Preco unitario</th>
                <th className="px-4 py-3 font-medium">Valor total</th>
                <th className="px-4 py-3 font-medium">Acoes</th>
              </tr>
            </thead>

            <tbody>
              {pagedItems.length > 0 ? (
                pagedItems.map((item) => {
                  const Icon = visualIcon(item.visual);
                  const total = Number(item.precoUnitario) * item.estoque;
                  const imageUrl = item.imagemUrl ?? "";
                  const showImage = Boolean(imageUrl) && !invalidImages[item.id];
                  return (
                    <tr key={item.id} className="border-b border-white/5 text-sm text-slate-100 last:border-0 hover:bg-blue-500/[0.06]">
                      <td className="px-6 py-2">
                        {showImage ? (
                          <button
                            type="button"
                            onClick={() => setImageViewer({ url: imageUrl, title: `${item.codigo} - ${item.peca}` })}
                            className="overflow-hidden rounded-xl border border-white/20 transition hover:border-blue-300/45"
                            aria-label={`Visualizar imagem de ${item.codigo}`}
                          >
                            <img
                              src={imageUrl}
                              alt={`Imagem da peca ${item.peca}`}
                              className="h-14 w-14 object-cover"
                              onError={() => setInvalidImages((prev) => ({ ...prev, [item.id]: true }))}
                            />
                          </button>
                        ) : (
                          <div
                            className={cn(
                              "grid h-14 w-14 place-items-center rounded-xl border border-white/15 bg-gradient-to-br",
                              visualTone(item.visual),
                            )}
                          >
                            <Icon size={24} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-200">{item.codigo}</td>
                      <td className="px-4 py-2">{item.peca}</td>
                      <td className="px-4 py-2">
                        <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs", categoryClass(item.categoria))}>
                          {item.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-200">{item.fornecedor}</td>
                      <td className="px-4 py-2">
                        <div className={cn("font-semibold", stockClass(item.estoque, item.minimo))}>{item.estoque}</div>
                        <div className="text-xs text-slate-500">{estoqueLabel(item.estoque, item.minimo)}</div>
                      </td>
                      <td className="px-4 py-2 text-slate-200">{money.format(Number(item.precoUnitario))}</td>
                      <td className="px-4 py-2 text-slate-100">{money.format(total)}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-blue-300/25 bg-blue-500/12 text-blue-200 transition hover:bg-blue-500/22"
                            aria-label={`Editar ${item.codigo}`}
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-rose-300/25 bg-rose-500/12 text-rose-200 transition hover:bg-rose-500/22"
                            aria-label={`Excluir ${item.codigo}`}
                          >
                            <XCircle size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-slate-400">
                    Nenhum item encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 px-5 py-4 md:flex-row md:items-center">
          <p className="text-sm text-slate-300">
            Mostrando {firstItem} a {lastItem} de {totalRows.toLocaleString("pt-BR")} itens
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="h-10 rounded-xl border border-white/10 bg-[#0c1933]/75 px-3 text-sm text-slate-100 outline-none focus:border-blue-400"
            >
              <option value={10}>10 por pagina</option>
              <option value={25}>25 por pagina</option>
              <option value={50}>50 por pagina</option>
            </select>

            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#0c1933]/75 text-slate-200 transition hover:border-blue-300/35 disabled:opacity-50"
              disabled={currentPage <= 1}
              aria-label="Pagina anterior"
            >
              <ChevronLeft size={16} />
            </button>

            {visiblePages.map((p, index) => {
              const prev = visiblePages[index - 1];
              const hasGap = prev && p - prev > 1;
              return (
                <div key={p} className="flex items-center gap-2">
                  {hasGap ? <span className="text-slate-500">...</span> : null}
                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn(
                      "h-10 min-w-10 rounded-xl border px-3 text-sm transition",
                      p === currentPage
                        ? "border-blue-300/35 bg-blue-600/75 text-white"
                        : "border-white/10 bg-[#0c1933]/75 text-slate-300 hover:border-blue-300/35",
                    )}
                  >
                    {p}
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#0c1933]/75 text-slate-200 transition hover:border-blue-300/35 disabled:opacity-50"
              disabled={currentPage >= totalPages}
              aria-label="Proxima pagina"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </article>

      <Modal
        isOpen={itemModalOpen}
        title={editingItem ? "Editar peca" : "Nova peca"}
        description={editingItem ? "Atualize os dados da peca no estoque." : "Cadastre uma nova peca no estoque."}
        onClose={() => setItemModalOpen(false)}
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSaveItem}>
          <Input
            label="Codigo"
            value={itemForm.codigo}
            onChange={(event) => setItemForm((prev) => ({ ...prev, codigo: event.target.value }))}
            required
          />
          <Input
            label="Peca"
            value={itemForm.peca}
            onChange={(event) => setItemForm((prev) => ({ ...prev, peca: event.target.value }))}
            required
          />

          <label className="flex flex-col gap-1.5 text-sm text-slate-200">
            <span className="font-medium tracking-wide text-slate-300">Categoria</span>
            <select
              value={itemForm.categoria}
              onChange={(event) =>
                setItemForm((prev) => ({ ...prev, categoria: event.target.value as EstoqueItem["categoria"] }))
              }
              className="rounded-xl border border-white/10 bg-[#0c1933]/80 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="Eletrica">Eletrica</option>
              <option value="Ignicao">Ignicao</option>
              <option value="Injecao">Injecao</option>
            </select>
          </label>

          <Input
            label="Fornecedor"
            value={itemForm.fornecedor}
            onChange={(event) => setItemForm((prev) => ({ ...prev, fornecedor: event.target.value }))}
            required
          />

          <Input
            label="Estoque inicial"
            type="number"
            min={0}
            value={itemForm.estoque}
            onChange={(event) => setItemForm((prev) => ({ ...prev, estoque: event.target.value }))}
            required
          />

          <Input
            label="Nivel minimo"
            type="number"
            min={0}
            value={itemForm.minimo}
            onChange={(event) => setItemForm((prev) => ({ ...prev, minimo: event.target.value }))}
            required
          />

          <Input
            label="Preco unitario"
            type="number"
            min={0}
            step="0.01"
            value={itemForm.precoUnitario}
            onChange={(event) => setItemForm((prev) => ({ ...prev, precoUnitario: event.target.value }))}
            required
          />

          <label className="flex flex-col gap-1.5 text-sm text-slate-200">
            <span className="font-medium tracking-wide text-slate-300">Visual da peca</span>
            <select
              value={itemForm.visual}
              onChange={(event) =>
                setItemForm((prev) => ({ ...prev, visual: event.target.value as EstoqueItem["visual"] }))
              }
              className="rounded-xl border border-white/10 bg-[#0c1933]/80 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              <option value="bateria">Bateria</option>
              <option value="alternador">Alternador</option>
              <option value="motor">Motor</option>
              <option value="vela">Vela</option>
              <option value="cabo">Cabo</option>
              <option value="fusivel">Fusivel</option>
              <option value="rele">Rele</option>
              <option value="sensor">Sensor</option>
              <option value="bobina">Bobina</option>
              <option value="interruptor">Interruptor</option>
            </select>
          </label>

          <Input
            label="URL da imagem (opcional)"
            value={itemForm.imagemUrl}
            onChange={(event) => setItemForm((prev) => ({ ...prev, imagemUrl: event.target.value }))}
            placeholder="https://... ou use upload abaixo"
          />

          <label className="flex flex-col gap-1.5 text-sm text-slate-200">
            <span className="font-medium tracking-wide text-slate-300">Upload de imagem</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => void handleImageUpload(event)}
              className={cn(
                "w-full rounded-xl border border-white/15 bg-[#0c1933]/80 px-3 py-2 text-slate-100 outline-none transition",
                "file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-600/75 file:px-3 file:py-1.5 file:text-sm file:text-white",
                "focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30",
              )}
            />
            <span className="text-xs text-slate-400">Formatos comuns de imagem (maximo 5MB).</span>
          </label>

          <div className="md:col-span-2 rounded-xl border border-white/10 bg-[#0b1933]/50 p-3">
            <p className="text-sm font-medium text-slate-200">Pre-visualizacao</p>
            {itemForm.imagemUrl ? (
              <div className="mt-2 flex flex-wrap items-start gap-3">
                <img
                  src={itemForm.imagemUrl}
                  alt="Pre-visualizacao da peca"
                  className="h-20 w-20 rounded-xl border border-white/15 object-cover"
                />
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">A miniatura da tabela fica clicavel para ampliar a imagem.</p>
                  <Button
                    variant="ghost"
                    type="button"
                    className="h-9"
                    onClick={() => setItemForm((prev) => ({ ...prev, imagemUrl: "" }))}
                  >
                    Remover imagem
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Sem imagem. A tabela vai mostrar o icone padrao da categoria.</p>
            )}
          </div>

          <div className="md:col-span-2 mt-3 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setItemModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingItem ? "Salvar alteracoes" : "Cadastrar peca"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={moveModalOpen}
        title={moveType === "ENTRADA" ? "Registrar entrada" : "Registrar saida"}
        description={
          moveType === "ENTRADA"
            ? "Adicione quantidade ao item selecionado."
            : "Remova quantidade do item selecionado."
        }
        onClose={() => setMoveModalOpen(false)}
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSubmitMovement}>
          <label className="md:col-span-2 flex flex-col gap-1.5 text-sm text-slate-200">
            <span className="font-medium tracking-wide text-slate-300">Item</span>
            <select
              value={moveForm.itemId}
              onChange={(event) => setMoveForm((prev) => ({ ...prev, itemId: event.target.value }))}
              className="rounded-xl border border-white/10 bg-[#0c1933]/80 px-3 py-2.5 text-slate-100 outline-none focus:border-blue-400"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.codigo} - {item.peca} ({item.estoque})
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Quantidade"
            type="number"
            min={1}
            value={moveForm.quantidade}
            onChange={(event) => setMoveForm((prev) => ({ ...prev, quantidade: event.target.value }))}
            required
          />

          <div className="flex items-end">
            <Button variant="ghost" className="h-11 w-full" type="button" onClick={() => setMoveModalOpen(false)}>
              Cancelar
            </Button>
          </div>

          <div className="md:col-span-2 mt-2 flex justify-end">
            <Button type="submit" loading={saving}>
              {moveType === "ENTRADA" ? "Confirmar entrada" : "Confirmar saida"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(imageViewer)}
        title={imageViewer?.title ?? "Imagem da peca"}
        description="Visualizacao ampliada da imagem cadastrada."
        onClose={() => setImageViewer(null)}
      >
        {imageViewer ? (
          <div className="rounded-xl border border-white/10 bg-[#081428] p-3">
            <img
              src={imageViewer.url}
              alt={imageViewer.title}
              className="max-h-[52vh] w-full rounded-lg border border-white/10 object-contain"
            />
          </div>
        ) : null}
      </Modal>

      <div className="flex justify-end">
        <Button onClick={openCreate} className="fixed bottom-6 right-6 z-20 h-12 rounded-full px-5 shadow-[0_14px_28px_rgba(37,99,235,0.45)] xl:hidden">
          <span className="inline-flex items-center gap-2">
            <Plus size={16} />
            Nova peca
          </span>
        </Button>
      </div>
    </section>
  );
}
