import { useData, ARENAS } from "./data-context";
import { ArrowLeft, User, Mail, Phone, MapPin, Briefcase, Calendar, Hash, Shield } from "lucide-react";

export function ArenadoDetail({ id, onVoltar }: { id: string; onVoltar: () => void }) {
  const { arenados, updateArenado } = useData();
  const arenado = arenados.find(a => a.id === id);

  if (!arenado) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Arenado não encontrado.</p>
        <button onClick={onVoltar} className="mt-4 text-blue-600 hover:underline" style={{ fontSize: "0.875rem" }}>
          Voltar à lista
        </button>
      </div>
    );
  }

  const arena = ARENAS.find(a => a.id === arenado.arena)!;

  const statusMap = {
    ativo: { label: "Ativo", classes: "bg-green-100 text-green-700 border-green-200" },
    inativo: { label: "Inativo", classes: "bg-red-100 text-red-700 border-red-200" },
    pendente: { label: "Pendente", classes: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  };

  const alterarStatus = async (novoStatus: "ativo" | "inativo" | "pendente") => {
    await updateArenado(id, { status: novoStatus });
  };

  const alterarArena = async (novaArena: string) => {
    await updateArenado(id, { arena: novaArena as any });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <button
        onClick={onVoltar}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
        style={{ fontSize: "0.9375rem" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para lista
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-2" style={{ backgroundColor: arena.cor }} />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: arena.cor, fontSize: "2rem" }}
            >
              {arenado.nome.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-3 justify-between">
                <div>
                  <h2 className="text-slate-800">{arenado.nome}</h2>
                  <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.875rem" }}>ID: {arenado.id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`px-3 py-1 rounded-full border ${statusMap[arenado.status].classes}`}
                    style={{ fontSize: "0.8125rem" }}
                  >
                    {statusMap[arenado.status].label}
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: arena.cor, fontSize: "0.8125rem" }}
                  >
                    {arena.nome}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-slate-500" style={{ fontSize: "0.875rem" }}>
                  <Mail className="w-4 h-4" />
                  {arenado.email}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500" style={{ fontSize: "0.875rem" }}>
                  <Phone className="w-4 h-4" />
                  {arenado.telefone}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info cards */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-slate-800 mb-5">Dados Pessoais</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: User, label: "Nome Completo", value: arenado.nome },
              { icon: Hash, label: "CPF", value: arenado.cpf || "Não informado" },
              { icon: Mail, label: "E-mail", value: arenado.email },
              { icon: Phone, label: "Telefone", value: arenado.telefone || "Não informado" },
              { icon: MapPin, label: "Cidade / Estado", value: `${arenado.cidade || "—"}${arenado.estado ? `, ${arenado.estado}` : ""}` },
              { icon: Briefcase, label: "Profissão", value: arenado.profissao || "Não informado" },
              { icon: Calendar, label: "Data de Importação", value: arenado.dataImportacao },
              { icon: Shield, label: "Arena", value: arena.nome },
            ].map(field => {
              const Icon = field.icon;
              return (
                <div key={field.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>{field.label}</p>
                    <p className="text-slate-700 mt-0.5" style={{ fontSize: "0.9375rem" }}>{field.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h4 className="text-slate-700 mb-3">Alterar Status</h4>
            <div className="space-y-2">
              {(["ativo", "inativo", "pendente"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => alterarStatus(s)}
                  className={`w-full py-2.5 px-4 rounded-xl border-2 transition-all text-left ${
                    arenado.status === s
                      ? s === "ativo" ? "border-green-400 bg-green-50 text-green-700"
                        : s === "inativo" ? "border-red-400 bg-red-50 text-red-700"
                        : "border-yellow-400 bg-yellow-50 text-yellow-700"
                      : "border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                  style={{ fontSize: "0.875rem" }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      s === "ativo" ? "bg-green-500" : s === "inativo" ? "bg-red-500" : "bg-yellow-500"
                    }`} />
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    {arenado.status === s && <span className="ml-auto text-xs">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Arena */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h4 className="text-slate-700 mb-3">Alterar Arena</h4>
            <div className="space-y-2">
              {ARENAS.map(a => (
                <button
                  key={a.id}
                  onClick={() => alterarArena(a.id)}
                  className={`w-full py-2.5 px-4 rounded-xl border-2 transition-all text-left flex items-center gap-2.5`}
                  style={
                    arenado.arena === a.id
                      ? { borderColor: a.cor, backgroundColor: a.cor + "15", color: a.cor, fontSize: "0.875rem" }
                      : { borderColor: "#f1f5f9", color: "#64748b", fontSize: "0.875rem" }
                  }
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.cor }} />
                  {a.nome}
                  {arenado.arena === a.id && <span className="ml-auto text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h4 className="text-slate-700 mb-3">Histórico</h4>
            <div className="space-y-3">
              {[
                { label: "Importado ao sistema", data: arenado.dataImportacao, cor: "bg-blue-500" },
                { label: `Alocado na ${arena.nome}`, data: arenado.dataImportacao, cor: arena.cor },
                { label: `Status: ${statusMap[arenado.status].label}`, data: "Atual", cor: arenado.status === "ativo" ? "#22c55e" : arenado.status === "pendente" ? "#eab308" : "#ef4444" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: typeof item.cor === "string" && item.cor.startsWith("bg-") ? undefined : item.cor, background: item.cor.startsWith("bg-") ? undefined : item.cor }} />
                  <div>
                    <p className="text-slate-600" style={{ fontSize: "0.8125rem" }}>{item.label}</p>
                    <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>{item.data}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
