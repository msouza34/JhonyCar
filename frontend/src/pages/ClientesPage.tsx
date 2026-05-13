import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Mail, Phone, UserPlus } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import SearchInput from "@/components/SearchInput";
import Table from "@/components/Table";
import { createCliente, deleteCliente, listClientes, updateCliente } from "@/services/clientes.service";
import { getErrorMessage } from "@/services/api";
import type { Cliente, ClientePayload } from "@/types/cliente";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatorio"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ invalido"),
  telefone: z.string().min(8, "Telefone invalido"),
  email: z.string().email("Email invalido"),
  ativo: z.boolean(),
  dataCadastro: z.string().min(1, "Data de cadastro obrigatoria"),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  complemento: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function ClientesPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const isAdmin = role === "ADMIN";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ativo: true,
      dataCadastro: todayInputDate(),
      cep: "",
      endereco: "",
      numero: "",
      bairro: "",
      cidade: "",
      uf: "",
      complemento: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    void loadClientes();
  }, []);

  const filteredClientes = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
    if (!query) return clientes;
    return clientes.filter((item) => item.nome.toLowerCase().includes(query));
  }, [clientes, debouncedSearch]);

  const resumo = useMemo(() => {
    const total = clientes.length;
    const ativos = clientes.filter((item) => item.ativo !== false).length;
    const comEmail = clientes.filter((item) => item.email?.trim()).length;
    const comTelefone = clientes.filter((item) => item.telefone?.trim()).length;
    const filtrados = filteredClientes.length;
    return { total, ativos, comEmail, comTelefone, filtrados };
  }, [clientes, filteredClientes]);

  const openCreateModal = () => {
    setEditingCliente(null);
    reset({
      nome: "",
      cpfCnpj: "",
      telefone: "",
      email: "",
      ativo: true,
      dataCadastro: todayInputDate(),
      cep: "",
      endereco: "",
      numero: "",
      bairro: "",
      cidade: "",
      uf: "",
      complemento: "",
      observacoes: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cliente: Cliente) => {
    setEditingCliente(cliente);
    reset({
      nome: cliente.nome,
      cpfCnpj: cliente.cpfCnpj,
      telefone: cliente.telefone,
      email: cliente.email,
      ativo: cliente.ativo ?? true,
      dataCadastro: cliente.dataCadastro ? cliente.dataCadastro.slice(0, 10) : todayInputDate(),
      cep: cliente.cep ?? "",
      endereco: cliente.endereco ?? "",
      numero: cliente.numero ?? "",
      bairro: cliente.bairro ?? "",
      cidade: cliente.cidade ?? "",
      uf: cliente.uf ?? "",
      complemento: cliente.complemento ?? "",
      observacoes: cliente.observacoes ?? "",
    });
    setIsModalOpen(true);
  };

  const loadClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listClientes(0, 500);
      setClientes(response.content);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: FormData) => {
    try {
      const payload: ClientePayload = {
        ...values,
        dataCadastro: values.dataCadastro?.trim() ? values.dataCadastro : undefined,
        uf: values.uf?.trim().toUpperCase() || undefined,
        cep: values.cep?.trim() || undefined,
        endereco: values.endereco?.trim() || undefined,
        numero: values.numero?.trim() || undefined,
        bairro: values.bairro?.trim() || undefined,
        cidade: values.cidade?.trim() || undefined,
        complemento: values.complemento?.trim() || undefined,
        observacoes: values.observacoes?.trim() || undefined,
      };
      if (editingCliente) {
        await updateCliente(editingCliente.id, payload);
      } else {
        await createCliente(payload);
      }
      setIsModalOpen(false);
      await loadClientes();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (cliente: Cliente) => {
    const confirm = window.confirm(`Excluir cliente ${cliente.nome}?`);
    if (!confirm) return;

    try {
      await deleteCliente(cliente.id);
      await loadClientes();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Clientes"
        subtitle={isAdmin ? "Cadastro e acompanhamento de clientes" : "Lista de clientes cadastrados"}
      />

      {isAdmin ? (
        <div className="jc-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total de clientes", value: resumo.total, icon: Building2, tone: "text-blue-200" },
            { label: "Clientes ativos", value: resumo.ativos, icon: UserPlus, tone: "text-emerald-200" },
            { label: "Com email", value: resumo.comEmail, icon: Mail, tone: "text-cyan-200" },
            { label: "Com telefone", value: resumo.comTelefone, icon: Phone, tone: "text-emerald-200" },
            { label: "Resultado da busca", value: resumo.filtrados, icon: Building2, tone: "text-violet-200" },
          ].map((item) => (
            <article key={item.label} className="rounded-2xl border border-white/10 bg-[#081631]/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">{item.label}</p>
                <div className={`rounded-xl bg-[#0f2142] p-2 ${item.tone}`}>
                  <item.icon size={16} />
                </div>
              </div>
              <p className="mt-3 font-title text-3xl font-bold text-white">{item.value.toLocaleString("pt-BR")}</p>
            </article>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#081631]/65 p-4 md:flex-row md:items-center md:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar cliente por nome" />
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => void loadClientes()} loading={loading}>
            Atualizar
          </Button>
          {isAdmin ? <Button onClick={openCreateModal}>Novo cliente</Button> : null}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-[#081631]/65 p-3">
        <Table
          data={filteredClientes}
          keyExtractor={(item) => item.id}
          emptyMessage="Nenhum cliente encontrado"
          columns={[
            { header: "Nome", render: (item) => item.nome },
            { header: "CPF/CNPJ", render: (item) => item.cpfCnpj },
            { header: "Telefone", render: (item) => item.telefone },
            { header: "Email", render: (item) => item.email },
            {
              header: "Status",
              render: (item) => (
                <span className={item.ativo !== false ? "text-emerald-300" : "text-rose-300"}>
                  {item.ativo !== false ? "Ativo" : "Inativo"}
                </span>
              ),
            },
            {
              header: "Acoes",
              render: (item) => (
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => navigate(`/clientes/${item.id}`)}>
                    Ver central
                  </Button>
                  {isAdmin ? (
                    <>
                      <Button variant="secondary" onClick={() => openEditModal(item)}>
                        Editar
                      </Button>
                      <Button variant="danger" onClick={() => void handleDelete(item)}>
                        Excluir
                      </Button>
                    </>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        title={editingCliente ? "Editar cliente" : "Novo cliente"}
        onClose={() => setIsModalOpen(false)}
      >
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <label className="md:col-span-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0f2142]/45 px-3 py-2.5">
            <input type="checkbox" {...register("ativo")} className="h-4 w-4 accent-blue-500" />
            <span className="text-sm text-slate-200">Cliente ativo</span>
          </label>

          <div className="md:col-span-2">
            <Input label="Nome" {...register("nome")} error={errors.nome?.message} />
          </div>
          <Input label="CPF/CNPJ" {...register("cpfCnpj")} error={errors.cpfCnpj?.message} />
          <Input label="Telefone" {...register("telefone")} error={errors.telefone?.message} />
          <div className="md:col-span-2">
            <Input label="Email" {...register("email")} error={errors.email?.message} />
          </div>
          <Input type="date" label="Data de cadastro" {...register("dataCadastro")} error={errors.dataCadastro?.message} />
          <Input label="CEP" {...register("cep")} error={errors.cep?.message} placeholder="00000-000" />
          <div className="md:col-span-2">
            <Input label="Endereco" {...register("endereco")} error={errors.endereco?.message} />
          </div>
          <Input label="Numero" {...register("numero")} error={errors.numero?.message} />
          <Input label="Bairro" {...register("bairro")} error={errors.bairro?.message} />
          <Input label="Cidade" {...register("cidade")} error={errors.cidade?.message} />
          <Input
            label="UF"
            {...register("uf")}
            onBlur={(event) => {
              setValue("uf", event.target.value.toUpperCase());
            }}
            error={errors.uf?.message}
            maxLength={2}
          />
          <div className="md:col-span-2">
            <Input label="Complemento" {...register("complemento")} error={errors.complemento?.message} />
          </div>
          <label className="md:col-span-2 flex w-full flex-col gap-1.5 text-sm text-slate-200">
            <span className="font-medium tracking-wide text-slate-300">Observacoes</span>
            <textarea
              {...register("observacoes")}
              rows={3}
              className="w-full rounded-xl border border-white/15 bg-[#0c1933]/80 px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
              placeholder="Informacoes importantes para atendimento"
            />
            {errors.observacoes?.message ? <span className="text-xs text-red-300">{errors.observacoes.message}</span> : null}
          </label>

          <div className="md:col-span-2 mt-2 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingCliente ? "Salvar alteracoes" : "Criar cliente"}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
