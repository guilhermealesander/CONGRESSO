import { useData, ARENAS } from "./data-context";
import { Users, TrendingUp, CheckCircle } from "lucide-react";

export function Arenas({ onVerArenados }: { onVerArenados: (arena: string) => void }) {
  const { arenados } = useData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500" style={{ fontSize: "0.875rem" }}>Gerencie as 6 arenas do sistema com suas cores e arenados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {ARENAS.map(arena => {
          const membros = arenados.filter(a => a.arena === arena.id);
          const ativos = membros.filter(a => a.status === "ativo").length;
          const pct = membros.length > 0 ? (ativos / membros.length) * 100 : 0;

          return (
            <div key={arena.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Header colorido */}
              <div className="h-3" style={{ backgroundColor: arena.cor }} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: arena.cor + "22", border: `2px solid ${arena.cor}44` }}
                  >
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: arena.cor }} />
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: arena.cor, fontSize: "0.75rem" }}
                  >
                    {membros.length} membros
                  </span>
                </div>

                <h3 className="text-slate-800 mb-1">{arena.nome}</h3>
                <p className="text-slate-400" style={{ fontSize: "0.875rem" }}>
                  Arena de classificação: <span className="capitalize" style={{ color: arena.cor }}>{arena.id}</span>
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 my-5">
                  <div className="text-center">
                    <p className="text-slate-800" style={{ fontSize: "1.5rem", lineHeight: 1.2 }}>{membros.length}</p>
                    <p className="text-slate-400" style={{ fontSize: "0.6875rem" }}>Total</p>
                  </div>
                  <div className="text-center border-x border-slate-100">
                    <p className="text-green-600" style={{ fontSize: "1.5rem", lineHeight: 1.2 }}>{ativos}</p>
                    <p className="text-slate-400" style={{ fontSize: "0.6875rem" }}>Ativos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-yellow-500" style={{ fontSize: "1.5rem", lineHeight: 1.2 }}>
                      {membros.filter(a => a.status === "pendente").length}
                    </p>
                    <p className="text-slate-400" style={{ fontSize: "0.6875rem" }}>Pendentes</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-400" style={{ fontSize: "0.75rem" }}>Taxa de ativação</span>
                    <span style={{ fontSize: "0.75rem", color: arena.cor }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: arena.cor }}
                    />
                  </div>
                </div>

                {/* Recent members */}
                {membros.length > 0 && (
                  <div className="mb-4">
                    <p className="text-slate-400 mb-2" style={{ fontSize: "0.75rem" }}>Últimos arenados</p>
                    <div className="space-y-1.5">
                      {membros.slice(0, 3).map(m => (
                        <div key={m.id} className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: arena.cor, fontSize: "0.6875rem" }}
                          >
                            {m.nome.charAt(0)}
                          </div>
                          <span className="text-slate-600 truncate" style={{ fontSize: "0.8125rem" }}>{m.nome}</span>
                          <span className={`ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full ${m.status === "ativo" ? "bg-green-500" : m.status === "pendente" ? "bg-yellow-500" : "bg-red-500"}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onVerArenados(arena.id)}
                  className="w-full py-2.5 rounded-xl text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: arena.cor }}
                >
                  <Users className="w-4 h-4" />
                  <span style={{ fontSize: "0.875rem" }}>Ver Arenados</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h3 className="text-slate-800">Visão Geral das Arenas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 pr-4 text-slate-400" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Arena</th>
                <th className="text-center py-3 px-4 text-slate-400" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</th>
                <th className="text-center py-3 px-4 text-slate-400" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ativos</th>
                <th className="text-center py-3 px-4 text-slate-400" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pendentes</th>
                <th className="text-center py-3 pl-4 text-slate-400" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Inativos</th>
              </tr>
            </thead>
            <tbody>
              {ARENAS.map(arena => {
                const membros = arenados.filter(a => a.arena === arena.id);
                return (
                  <tr key={arena.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: arena.cor }} />
                        <span className="text-slate-700" style={{ fontSize: "0.875rem" }}>{arena.nome}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-slate-800" style={{ fontSize: "0.875rem" }}>{membros.length}</td>
                    <td className="text-center py-3 px-4">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full" style={{ fontSize: "0.75rem" }}>
                        {membros.filter(a => a.status === "ativo").length}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full" style={{ fontSize: "0.75rem" }}>
                        {membros.filter(a => a.status === "pendente").length}
                      </span>
                    </td>
                    <td className="text-center py-3 pl-4">
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full" style={{ fontSize: "0.75rem" }}>
                        {membros.filter(a => a.status === "inativo").length}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
