import { useState, useMemo } from "react";
import { useData, ARENAS, Arenado, ArenaId } from "./data-context";
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, Eye, X } from "lucide-react";

const PAGE_SIZE = 10;

export function ArenadosTable({
  filtroArenaInicial,
  onVerDetalhe,
}: {
  filtroArenaInicial?: string;
  onVerDetalhe: (id: string) => void;
}) {
  const { arenados } = useData();
  const [busca, setBusca] = useState("");
  const [arenaFiltro, setArenaFiltro] = useState<ArenaId | "todas">(
    (filtroArenaInicial as ArenaId) || "todas"
  );
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "ativo" | "inativo" | "pendente">("todos");
  const [pagina, setPagina] = useState(1);
  const [ordenar, setOrdenar] = useState<{ campo: keyof Arenado; asc: boolean }>({ campo: "nome", asc: true });

  const filtrados = useMemo(() => {
    let res = [...arenados];

    if (busca) {
      const b = busca.toLowerCase();
      res = res.filter(a =>
        a.nome.toLowerCase().includes(b) ||
        a.cpf.includes(b) ||
        a.email.toLowerCase().includes(b) ||
        a.id.toLowerCase().includes(b)
      );
    }

    if (arenaFiltro !== "todas") res = res.filter(a => a.arena === arenaFiltro);
    if (statusFiltro !== "todos") res = res.filter(a => a.status === statusFiltro);

    res.sort((a, b) => {
      const va = String(a[ordenar.campo] ?? "");
      const vb = String(b[ordenar.campo] ?? "");
      return ordenar.asc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    return res;
  }, [arenados, busca, arenaFiltro, statusFiltro, ordenar]);

  const totalPaginas = Math.ceil(filtrados.length / PAGE_SIZE);
  const pagina_atual = filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  const toggleOrdenar = (campo: keyof Arenado) => {
    setOrdenar(prev => ({ campo, asc: prev.campo === campo ? !prev.asc : true }));
    setPagina(1);
  };

  const getStatusBadge = (status: Arenado["status"]) => {
    const map = {
      ativo: "bg-green-100 text-green-700",
      inativo: "bg-red-100 text-red-700",
      pendente: "bg-yellow-100 text-yellow-700",
    };
    const labels = { ativo: "Ativo", inativo: "Inativo", pendente: "Pendente" };
    return (
      <span className={`px-2.5 py-0.5 rounded-full ${map[status]}`} style={{ fontSize: "0.75rem" }}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              value={busca}
              onChange={e => { setBusca(e.target.value); setPagina(1); }}
              placeholder="Buscar por nome, CPF ou email..."
              className="bg-transparent outline-none text-slate-700 flex-1 min-w-0"
              style={{ fontSize: "0.875rem" }}
            />
            {busca && (
              <button onClick={() => setBusca("")} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Arena filter */}
          <div className="relative">
            <select
              value={arenaFiltro}
              onChange={e => { setArenaFiltro(e.target.value as ArenaId | "todas"); setPagina(1); }}
              className="appearance-none pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer"
              style={{ fontSize: "0.875rem" }}
            >
              <option value="todas">Todas as arenas</option>
              {ARENAS.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFiltro}
              onChange={e => { setStatusFiltro(e.target.value as typeof statusFiltro); setPagina(1); }}
              className="appearance-none pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer"
              style={{ fontSize: "0.875rem" }}
            >
              <option value="todos">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="pendente">Pendente</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400" style={{ fontSize: "0.875rem" }}>{filtrados.length} resultados</span>
          </div>
        </div>

        {/* Arena quick filters */}
        <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setArenaFiltro("todas")}
            className={`px-3 py-1.5 rounded-lg transition-all ${arenaFiltro === "todas" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            style={{ fontSize: "0.8125rem" }}
          >
            Todas
          </button>
          {ARENAS.map(a => (
            <button
              key={a.id}
              onClick={() => setArenaFiltro(a.id)}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${arenaFiltro === a.id ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              style={arenaFiltro === a.id ? { backgroundColor: a.cor, fontSize: "0.8125rem" } : { fontSize: "0.8125rem" }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: arenaFiltro === a.id ? "white" : a.cor }} />
              {a.nome.replace("Arena ", "")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {[
                  { campo: "id" as keyof Arenado, label: "ID" },
                  { campo: "nome" as keyof Arenado, label: "Nome" },
                  { campo: "cpf" as keyof Arenado, label: "CPF" },
                  { campo: "arena" as keyof Arenado, label: "Arena" },
                  { campo: "cidade" as keyof Arenado, label: "Cidade" },
                  { campo: "status" as keyof Arenado, label: "Status" },
                  { campo: "dataImportacao" as keyof Arenado, label: "Importado em" },
                ].map(col => (
                  <th
                    key={col.campo}
                    onClick={() => toggleOrdenar(col.campo)}
                    className="text-left px-4 py-3 text-slate-500 cursor-pointer hover:text-slate-700 transition-colors select-none"
                    style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {ordenar.campo === col.campo && (
                        <ChevronDown className={`w-3 h-3 transition-transform ${!ordenar.asc ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-slate-500" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagina_atual.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400" style={{ fontSize: "0.9375rem" }}>
                    Nenhum arenado encontrado
                  </td>
                </tr>
              ) : pagina_atual.map(arenado => {
                const arena = ARENAS.find(a => a.id === arenado.arena)!;
                return (
                  <tr key={arenado.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-slate-400" style={{ fontSize: "0.8125rem", fontFamily: "monospace" }}>{arenado.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: arena.cor, fontSize: "0.75rem" }}
                        >
                          {arenado.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="text-slate-700" style={{ fontSize: "0.875rem" }}>{arenado.nome}</p>
                          <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>{arenado.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500" style={{ fontSize: "0.8125rem" }}>{arenado.cpf}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-white flex items-center gap-1.5 w-fit"
                        style={{ backgroundColor: arena.cor, fontSize: "0.75rem" }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                        {arena.nome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500" style={{ fontSize: "0.875rem" }}>
                      {arenado.cidade}{arenado.estado ? `, ${arenado.estado}` : ""}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(arenado.status)}</td>
                    <td className="px-4 py-3 text-slate-400" style={{ fontSize: "0.8125rem" }}>{arenado.dataImportacao}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onVerDetalhe(arenado.id)}
                        className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-slate-400" style={{ fontSize: "0.8125rem" }}>
            Exibindo {Math.min((pagina - 1) * PAGE_SIZE + 1, filtrados.length)}–{Math.min(pagina * PAGE_SIZE, filtrados.length)} de {filtrados.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="p-2 rounded-lg text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              const pg = pagina <= 3 ? i + 1 : pagina + i - 2;
              if (pg < 1 || pg > totalPaginas) return null;
              return (
                <button
                  key={pg}
                  onClick={() => setPagina(pg)}
                  className={`w-8 h-8 rounded-lg transition-all ${pg === pagina ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-white"}`}
                  style={{ fontSize: "0.875rem" }}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas || totalPaginas === 0}
              className="p-2 rounded-lg text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
