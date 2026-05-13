import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, UserCog, Users, Wrench } from "lucide-react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { login } from "@/services/auth.service";
import { getErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  username: z.string().min(1, "Usuario e obrigatorio"),
  password: z.string().min(1, "Senha e obrigatoria"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "admin",
      password: "admin123",
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: FormData) => {
    setError(null);
    try {
      const data = await login(values);
      setAuth(data.token, data.username, data.role);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#040b1d] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(37,99,235,0.36),transparent_38%),radial-gradient(circle_at_88%_8%,rgba(56,189,248,0.17),transparent_32%),linear-gradient(180deg,#040b1d_0%,#060f23_48%,#07142b_100%)]" />

      <div className="jc-page-enter relative w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#081631]/70 shadow-[0_22px_55px_rgba(2,8,20,0.58)] backdrop-blur-sm">
        <div className="grid md:grid-cols-2">
          <div className="hidden border-r border-white/10 bg-[linear-gradient(150deg,rgba(18,58,132,0.9),rgba(10,29,71,0.92))] p-9 md:block">
            <p className="text-xs uppercase tracking-[0.28em] text-blue-100/90">Gestao de atendimento</p>
            <h1 className="mt-3 font-title text-5xl font-bold text-white">
              Jhony<span className="text-blue-200">Car</span>
            </h1>
            <p className="mt-4 text-sm text-blue-100/90">
              Plataforma para acompanhar clientes, servicos e agendamentos com clareza.
            </p>

            <div className="jc-stagger mt-8 space-y-3">
              {[
                { icon: Wrench, text: "Acompanhamento simples das ordens de servico" },
                { icon: Users, text: "Historico completo por cliente" },
                { icon: ShieldCheck, text: "Controle de pagamentos e notas fiscais" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#0e2553]/70 px-3 py-2 text-sm text-blue-50">
                  <item.icon size={16} />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-white/15 bg-[#0d224b]/75 p-4">
              <div className="flex items-center gap-2 text-blue-100">
                <Sparkles size={15} />
                <p className="text-sm font-semibold">Ambiente de demonstracao</p>
              </div>
              <p className="mt-2 text-xs text-blue-100/80">
                Use os acessos de teste ao lado para conhecer a plataforma.
              </p>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Entrar</p>
            <p className="mt-1 font-title text-3xl font-bold text-white">Acesse sua conta</p>
            <p className="mt-2 text-sm text-slate-300">Use as credenciais de teste para experimentar o sistema.</p>

            <div className="jc-stagger mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setValue("username", "admin");
                  setValue("password", "admin123");
                }}
                className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-blue-300/45 hover:text-blue-100"
              >
                <p className="font-semibold">Acesso admin</p>
                <p className="text-xs text-slate-400">admin / admin123</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue("username", "funcionario");
                  setValue("password", "func123");
                }}
                className="rounded-xl border border-white/10 bg-[#0f2142]/75 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-blue-300/45 hover:text-blue-100"
              >
                <p className="font-semibold">Acesso equipe</p>
                <p className="text-xs text-slate-400">funcionario / func123</p>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
              <Input label="Usuario" {...register("username")} error={errors.username?.message} placeholder="admin" />
              <Input
                label="Senha"
                type="password"
                {...register("password")}
                error={errors.password?.message}
                placeholder="********"
              />

              {error ? <p className="text-sm text-red-300">{error}</p> : null}

              <Button type="submit" loading={isSubmitting} className="w-full">
                <span className="inline-flex items-center gap-2">
                  Entrar
                  {!isSubmitting ? <ArrowRight size={15} /> : null}
                </span>
              </Button>
            </form>

            <div className="mt-5 rounded-xl border border-white/10 bg-[#0a1b38]/65 p-3 text-xs text-slate-300">
              <p className="inline-flex items-center gap-2 font-semibold text-slate-200">
                <UserCog size={14} />
                Acesso rapido de testes
              </p>
              <p className="mt-1">Admin: gestao completa | Equipe: visao simplificada.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
