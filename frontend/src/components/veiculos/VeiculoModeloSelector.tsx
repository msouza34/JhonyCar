import { useEffect, useMemo, useRef, useState } from "react";
import { CarFront, ChevronDown, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/services/api";
import { listMarcasVeiculo, listModelosPorMarca, uploadVeiculoModeloImagem } from "@/services/veiculos.service";
import type { VeiculoModeloOption } from "@/types/veiculo";

const FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'>
  <defs>
    <linearGradient id='bg' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0%' stop-color='#0b1730'/>
      <stop offset='100%' stop-color='#13294f'/>
    </linearGradient>
  </defs>
  <rect width='640' height='360' fill='url(#bg)' rx='20'/>
  <text x='320' y='190' text-anchor='middle' fill='#dbeafe' font-size='26' font-family='Arial'>Imagem do veiculo</text>
</svg>`)}`;

interface VeiculoModeloSelectorProps {
  marca: string;
  modelo: string;
  disabled?: boolean;
  errorMarca?: string;
  errorModelo?: string;
  onChangeMarca: (marca: string) => void;
  onChangeModelo: (modelo: string, option?: VeiculoModeloOption) => void;
}

export default function VeiculoModeloSelector({
  marca,
  modelo,
  disabled,
  errorMarca,
  errorModelo,
  onChangeMarca,
  onChangeModelo,
}: VeiculoModeloSelectorProps) {
  const [marcas, setMarcas] = useState<string[]>([]);
  const [modelos, setModelos] = useState<VeiculoModeloOption[]>([]);
  const [loadingMarcas, setLoadingMarcas] = useState(false);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [uploadingImagem, setUploadingImagem] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [manualModelMode, setManualModelMode] = useState(false);
  const [marcaDropdownOpen, setMarcaDropdownOpen] = useState(false);
  const marcaDropdownRef = useRef<HTMLDivElement | null>(null);
  const debouncedMarca = useDebounce(marca.trim(), 250);

  useEffect(() => {
    let active = true;

    const carregarMarcas = async () => {
      setLoadingMarcas(true);
      setLoadError(null);
      try {
        const response = await listMarcasVeiculo();
        if (active) {
          setMarcas(response);
        }
      } catch (error) {
        if (active) {
          setLoadError(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setLoadingMarcas(false);
        }
      }
    };

    void carregarMarcas();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!debouncedMarca) {
      setModelos([]);
      return () => {
        active = false;
      };
    }

    const carregarModelos = async () => {
      setLoadingModelos(true);
      setLoadError(null);
      try {
        const response = await listModelosPorMarca(debouncedMarca);
        if (active) {
          setModelos(response);

          if (modelo) {
            const existeModelo = response.some((item) => item.modelo.toLowerCase() === modelo.trim().toLowerCase());
            setManualModelMode(!existeModelo);
          } else {
            setManualModelMode(false);
          }
        }
      } catch (error) {
        if (active) {
          setModelos([]);
          setLoadError(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setLoadingModelos(false);
        }
      }
    };

    void carregarModelos();

    return () => {
      active = false;
    };
  }, [debouncedMarca]);

  useEffect(() => {
    if (!modelo.trim()) {
      return;
    }
    const existeModelo = modelos.some((item) => item.modelo.toLowerCase() === modelo.trim().toLowerCase());
    setManualModelMode(!existeModelo);
  }, [modelos, modelo]);

  const selectedModelo = useMemo(() => {
    const modeloKey = modelo.trim().toLowerCase();
    if (!modeloKey) {
      return undefined;
    }
    return modelos.find((item) => item.modelo.toLowerCase() === modeloKey);
  }, [modelo, modelos]);

  const filteredMarcas = useMemo(() => {
    const query = marca.trim().toLowerCase();
    const base = query
      ? marcas.filter((item) => item.toLowerCase().includes(query))
      : marcas;
    return base.slice(0, 10);
  }, [marcas, marca]);

  const imageUrl = selectedModelo?.imagemUrl || FALLBACK_IMAGE;

  const handleMarcaInputChange = (value: string) => {
    onChangeMarca(value);
    onChangeModelo("");
    setManualModelMode(false);
    setMarcaDropdownOpen(true);
  };

  const handleSelectMarca = (selectedMarca: string) => {
    onChangeMarca(selectedMarca);
    onChangeModelo("");
    setManualModelMode(false);
    setMarcaDropdownOpen(false);
  };

  const onUploadImagem = async (file?: File) => {
    if (!file || !selectedModelo) {
      return;
    }

    setUploadingImagem(true);
    setLoadError(null);
    try {
      const response = await uploadVeiculoModeloImagem(selectedModelo.id, file);
      setModelos((prev) =>
        prev.map((item) =>
          item.id === selectedModelo.id
            ? {
                ...item,
                imagemUrl: response.imagemUrl,
              }
            : item,
        ),
      );
      setImageError(false);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setUploadingImagem(false);
    }
  };

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!marcaDropdownRef.current?.contains(event.target as Node)) {
        setMarcaDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="md:col-span-2 rounded-2xl border border-white/10 bg-[#0a1a37]/70 p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm text-slate-200">
          <span className="font-medium tracking-wide text-slate-300">Marca</span>
          <div ref={marcaDropdownRef} className="relative">
            <input
              value={marca}
              disabled={disabled || loadingMarcas}
              onFocus={() => setMarcaDropdownOpen(true)}
              onChange={(event) => handleMarcaInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setMarcaDropdownOpen(false);
                }
                if (event.key === "ArrowDown") {
                  setMarcaDropdownOpen(true);
                }
              }}
              placeholder={loadingMarcas ? "Carregando marcas..." : "Ex: Fiat"}
              className={`w-full rounded-xl border bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 ${
                errorMarca ? "border-red-400/70 focus:border-red-400 focus:ring-red-500/30" : "border-white/10"
              }`}
            />
            {loadingMarcas ? (
              <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-slate-400" />
            ) : (
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-5 w-5 text-slate-500" />
            )}

            {marcaDropdownOpen && !disabled ? (
              <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0f2142] shadow-[0_18px_40px_rgba(2,8,23,0.65)]">
                <ul className="max-h-56 overflow-y-auto py-1">
                  {filteredMarcas.length > 0 ? (
                    filteredMarcas.map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelectMarca(item)}
                          className="w-full px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-[#173160] hover:text-white"
                        >
                          {item}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-sm text-slate-400">Nenhuma marca encontrada</li>
                  )}
                </ul>
              </div>
            ) : null}
          </div>
          {errorMarca ? <span className="text-xs text-red-300">{errorMarca}</span> : null}
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-slate-200">
          <span className="font-medium tracking-wide text-slate-300">Modelo</span>
          {manualModelMode || modelos.length === 0 ? (
            <div className="space-y-2">
              <input
                value={modelo}
                disabled={disabled || !marca.trim() || loadingModelos}
                onChange={(event) => onChangeModelo(event.target.value)}
                placeholder="Digite o modelo"
                className={`w-full rounded-xl border bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 ${
                  errorModelo ? "border-red-400/70 focus:border-red-400 focus:ring-red-500/30" : "border-white/10"
                }`}
              />
              {modelos.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setManualModelMode(false)}
                  className="text-xs text-blue-300 transition hover:text-blue-200"
                >
                  Voltar para lista de modelos
                </button>
              ) : null}
            </div>
          ) : (
            <div className="relative">
              <select
                value={modelo}
                disabled={disabled || !marca.trim() || loadingModelos}
                onChange={(event) => {
                  const selectedValue = event.target.value;
                  if (selectedValue === "__manual__") {
                    setManualModelMode(true);
                    onChangeModelo("");
                    return;
                  }
                  const option = modelos.find((item) => item.modelo === selectedValue);
                  onChangeModelo(selectedValue, option);
                }}
                className={`w-full rounded-xl border bg-[#0f2142]/75 px-3 py-2.5 text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 ${
                  errorModelo ? "border-red-400/70 focus:border-red-400 focus:ring-red-500/30" : "border-white/10"
                }`}
              >
                <option value="">{loadingModelos ? "Carregando modelos..." : "Selecione o modelo"}</option>
                {modelos.map((item) => (
                  <option key={item.id} value={item.modelo}>
                    {item.modelo}
                  </option>
                ))}
                <option value="__manual__">Outro (digitar manualmente)</option>
              </select>
              {loadingModelos ? <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-slate-400" /> : null}
            </div>
          )}
          {errorModelo ? <span className="text-xs text-red-300">{errorModelo}</span> : null}
        </label>

        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-[#07142b]/70 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Preview do veiculo</p>
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <CarFront size={14} />
              Card dinamico
            </span>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0b1d3d]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(56,189,248,0.18),transparent_36%),radial-gradient(circle_at_82%_0%,rgba(59,130,246,0.22),transparent_34%)]" />
            <div className="relative grid min-h-44 place-items-center p-3">
              {!imageError ? (
                <img
                  src={imageUrl}
                  alt={selectedModelo ? `${selectedModelo.marca} ${selectedModelo.modelo}` : "Preview do veiculo"}
                  onError={() => setImageError(true)}
                  className="h-40 w-full max-w-[30rem] rounded-lg object-cover shadow-[0_10px_28px_rgba(15,23,42,0.45)]"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-40 w-full max-w-[30rem] place-items-center rounded-lg border border-dashed border-white/15 bg-[#0e2247]/80 text-slate-300">
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <CarFront size={32} />
                    <span>Imagem indisponivel. Placeholder aplicado.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!disabled && selectedModelo ? (
            <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-[#0f2142]/65 px-3 py-2 text-xs text-slate-300 transition hover:border-blue-300/40 hover:text-blue-100">
              {uploadingImagem ? "Enviando imagem..." : "Enviar nova imagem do modelo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImagem}
                onChange={(event) => {
                  void onUploadImagem(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          ) : null}
        </div>
      </div>

      {loadError ? <p className="mt-3 text-xs text-amber-300">{loadError}</p> : null}
    </div>
  );
}
