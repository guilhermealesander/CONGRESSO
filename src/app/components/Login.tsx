import { useState } from "react";
import { useData } from "./data-context";
import { Shield, Eye, EyeOff, LogIn } from "lucide-react";

export function Login() {
  const { login } = useData();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const ok = await login(usuario, senha);
    if (!ok) setErro("Usuário ou senha inválidos.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-white" style={{ fontSize: "2rem", letterSpacing: "-0.02em" }}>ARENA CJU</h1>
          <p className="text-slate-400 mt-1">Sistema de Gerenciamento de Arenados</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white mb-6" style={{ fontSize: "1.25rem" }}>Acesso ao Sistema</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 mb-2" style={{ fontSize: "0.875rem" }}>Usuário ou e-mail</label>
              <input
                type="text"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                placeholder="Digite seu nome ou e-mail"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-2" style={{ fontSize: "0.875rem" }}>Senha</label>
              <div className="relative">
                <input
                  type={showSenha ? "text" : "password"}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {erro && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-red-300" style={{ fontSize: "0.875rem" }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>
              O acesso é feito com a senha definida pelo administrador.
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 mt-6" style={{ fontSize: "0.75rem" }}>
          © 2025 ARENA CJU · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
