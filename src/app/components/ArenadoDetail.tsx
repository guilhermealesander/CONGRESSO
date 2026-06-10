import { useEffect, useState } from "react";
import { useData, Arenado } from "./data-context";
import { ArrowLeft, User, Mail, Phone, MapPin, Briefcase, Calendar, Hash, Shield, Save, Trash2 } from "lucide-react";

export function ArenadoDetail({ id, onVoltar }: { id: string; onVoltar: () => void }) {
  const { arenas, arenados, updateArenado, deleteArenado, currentUserRole } = useData();
  const arenado = arenados.find(a => a.id === id);
  const [form, setForm] = useState<Arenado | null>(null);
  const [salvando, setSalvando] = useState(false);
  const canManageArenado = currentUserRole === "admin";

  useEffect(() => {
    setForm(arenado ? { ...arenado } : null);
  }, [arenado]);

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

  const arena = arenas.find(a => a.id === arenado.arena) ?? arenas[0] ?? {
    id: "sem-arena",
    nome: "Sem arena",
    cor: "#64748b",
    corBg: "bg-slate-100",
    corText: "text-slate-700",
    corBorder: "border-slate-300",
    corBadge: "bg-slate-500",
  };

  const salvarAlteracoes = async () => {
    if (!canManageArenado) return;
    if (!form) return;
    setSalvando(true);
    try {
      await updateArenado(id, {
        nome: form.nome,
        cpf: form.cpf,
        email: form.email,
        telefone: form.telefone,
        cidade: form.cidade,
        estado: form.estado,
        profissao: form.profissao,
        idade: form.idade,
        arena: form.arena,
        status: form.status,
      });
    } finally {
      setSalvando(false);
    }
  };

  const statusMap = {
    ativo: { label: "Ativo", classes: "bg-green-100 text-green-700 border-green-200" },
    inativo: { label: "Inativo", classes: "bg-red-100 text-red-700 border-red-200" },
    pendente: { label: "Pendente", classes: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  };

  const alterarStatus = async (novoStatus: "ativo" | "inativo" | "pendente") => {
    if (!canManageArenado) return;
    setForm(prev => prev ? { ...prev, status: novoStatus } : prev);
    await updateArenado(id, { status: novoStatus });
  };

  const alterarArena = async (novaArena: string) => {
    if (!canManageArenado) return;
    setForm(prev => prev ? { ...prev, arena: novaArena as any } : prev);
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
          <div className="flex items-center justify-between gap-3 mb-5">
            <h3 className="text-slate-800">Dados Pessoais</h3>
            {canManageArenado && (
              <button
                onClick={salvarAlteracoes}
                disabled={salvando || !form}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white disabled:opacity-60"
                style={{ backgroundColor: arena.cor }}
              >
                <Save className="w-4 h-4" />
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: User, label: "Nome Completo", value: arenado.nome },
              { icon: Hash, label: "CPF", value: arenado.cpf || "Não informado" },
              { icon: Mail, label: "E-mail", value: arenado.email },
              { icon: Phone, label: "Telefone", value: arenado.telefone || "Não informado" },
              { icon: MapPin, label: "Cidade / Estado", value: `${arenado.cidade || "—"}${arenado.estado ? `, ${arenado.estado}` : ""}` },
              { icon: Briefcase, label: "Profissão", value: arenado.profissao || "Não informado" },
              { icon: User, label: "Idade", value: arenado.idade ?? "Não informada" },
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

          {canManageArenado && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h4 className="text-slate-700 mb-4">Editar informações</h4>
              {form && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Nome", key: "nome" as const, type: "text" },
                  { label: "CPF", key: "cpf" as const, type: "text" },
                  { label: "E-mail", key: "email" as const, type: "email" },
                  { label: "Telefone", key: "telefone" as const, type: "text" },
                  { label: "Cidade", key: "cidade" as const, type: "text" },
                  { label: "Estado", key: "estado" as const, type: "text" },
                  { label: "Profissão", key: "profissao" as const, type: "text" },
                  { label: "Idade", key: "idade" as const, type: "number" },
                ].map(field => (
                  <label key={field.key} className="space-y-1.5">
                    <span className="text-slate-500" style={{ fontSize: "0.75rem" }}>{field.label}</span>
                    <input
                      type={field.type}
                      value={form[field.key] ?? ""}
                      onChange={e => setForm(prev => prev ? {
                        ...prev,
                        [field.key]: field.type === "number"
                          ? (e.target.value === "" ? null : Number(e.target.value))
                          : e.target.value,
                      } as Arenado : prev)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 text-slate-700"
                    />
                  </label>
                ))}
              </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Status */}
          {canManageArenado && (
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
          )}

          {canManageArenado && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h4 className="text-slate-700 mb-3">Alterar Arena</h4>
              <div className="space-y-2">
              {arenas.map(a => (
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
          )}

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

          {canManageArenado && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
              <h4 className="text-red-700 mb-2">Excluir arenado</h4>
              <p className="text-slate-500 mb-4" style={{ fontSize: "0.875rem" }}>
                A exclusão remove o registro da lista e preserva o histórico no banco.
              </p>
              <button
                onClick={async () => {
                  if (window.confirm(`Excluir ${arenado.nome}?`)) {
                    await deleteArenado(arenado.id);
                    onVoltar();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir definitivamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
