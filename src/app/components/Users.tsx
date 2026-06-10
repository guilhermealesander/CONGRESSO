import { useEffect, useState, useMemo } from "react";
import { useData, TeamRole, TeamUser, ArenaId } from "./data-context";
import { UserPlus, Users, PencilLine, Trash2, Shield, CheckCircle2, Search, Filter, X, ChevronDown, CheckSquare, Square, Trash } from "lucide-react";
import { generateTemporaryPassword } from "../lib/password";

type FormState = {
  authUserId: string;
  nome: string;
  email: string;
  telefone: string;
  role: TeamRole;
  arena: string;
  observacoes: string;
  senha: string;
};

const emptyForm: FormState = {
  authUserId: "",
  nome: "",
  email: "",
  telefone: "",
  role: "lider",
  arena: "",
  observacoes: "",
  senha: "",
};

export function UsersPage() {
  const { arenas, teamUsers, addTeamUser, updateTeamUser, deleteTeamUser, currentUserRole } = useData();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters
  const [busca, setBusca] = useState("");
  const [roleFiltro, setRoleFiltro] = useState<TeamRole | "todos">("todos");
  const [arenaFiltro, setArenaFiltro] = useState<ArenaId | "todas" | "nenhuma">("todas");
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const filtrados = useMemo(() => {
    let res = [...teamUsers];

    if (busca) {
      const b = busca.toLowerCase();
      res = res.filter(u =>
        u.nome.toLowerCase().includes(b) ||
        u.email.toLowerCase().includes(b) ||
        (u.telefone && u.telefone.includes(b))
      );
    }

    if (roleFiltro !== "todos") res = res.filter(u => u.role === roleFiltro);
    if (arenaFiltro === "nenhuma") res = res.filter(u => !u.arena);
    else if (arenaFiltro !== "todas") res = res.filter(u => u.arena === arenaFiltro);

    return res;
  }, [teamUsers, busca, roleFiltro, arenaFiltro]);

  useEffect(() => {
    if (!editingId) {
      setForm(emptyForm);
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      nome: form.nome.trim(),
      authUserId: form.authUserId.trim(),
      email: form.email.trim(),
      telefone: form.telefone.trim(),
      role: form.role,
      arena: form.arena ? (form.arena as TeamUser["arena"]) : null,
      observacoes: form.observacoes.trim(),
      senha: form.senha.trim(),
    };

    if (!payload.nome || !payload.email) {
      return;
    }

    if (!payload.senha && !editingId) {
      return;
    }

    if (editingId) {
      await updateTeamUser(editingId, {
        nome: payload.nome,
        authUserId: payload.authUserId,
        email: payload.email,
        telefone: payload.telefone,
        role: payload.role,
        arena: payload.arena,
        observacoes: payload.observacoes,
        senha: payload.senha || undefined,
      });
      setEditingId(null);
    } else {
      await addTeamUser(payload);
    }

    setForm(emptyForm);
  };

  const editarUsuario = (user: TeamUser) => {
    setEditingId(user.id);
    setForm({
      nome: user.nome,
      authUserId: user.authUserId ?? "",
      email: user.email,
      telefone: user.telefone,
      role: user.role,
      arena: user.arena ?? "",
      observacoes: user.observacoes,
      senha: "",
    });
  };

  const toggleSelecionar = (id: string) => {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelecionarTodos = () => {
    if (filtrados.length > 0 && filtrados.every(u => selecionados.includes(u.id))) {
      setSelecionados(prev => prev.filter(id => !filtrados.some(u => u.id === id)));
    } else {
      setSelecionados(prev => [...new Set([...prev, ...filtrados.map(u => u.id)])]);
    }
  };

  const lidarAcaoEmMassa = async (acao: "arena" | "role" | "excluir", valor?: string) => {
    if (selecionados.length === 0) return;

    if (acao === "excluir") {
      if (!window.confirm(`Excluir ${selecionados.length} usuários permanentemente?`)) return;
      for (const id of selecionados) {
        await deleteTeamUser(id);
      }
    } else if (acao === "arena") {
      for (const id of selecionados) {
        await updateTeamUser(id, { arena: (valor as ArenaId) || null });
      }
    } else if (acao === "role") {
      for (const id of selecionados) {
        await updateTeamUser(id, { role: valor as TeamRole });
      }
    }

    setSelecionados([]);
  };

  if (currentUserRole !== "admin") {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-3xl">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="text-slate-800">Acesso restrito</h3>
        </div>
        <p className="text-slate-500" style={{ fontSize: "0.875rem" }}>
          Apenas administradores podem criar ou alterar usuários e suas senhas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header & Stats */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-slate-800 text-lg font-semibold">Gestão de Equipe</h2>
            <p className="text-slate-500" style={{ fontSize: "0.875rem" }}>
              Cadastre lideres, administradores e colaboradores por arena.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 text-slate-600" style={{ fontSize: "0.8125rem" }}>
            <Users className="w-4 h-4" />
            {teamUsers.length} usuários
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selecionados.length > 0 && (
        <div className="bg-blue-600 rounded-2xl p-3 shadow-lg flex items-center gap-4 text-white animate-in fade-in slide-in-from-top-2">
          <span className="font-medium ml-2">{selecionados.length} selecionados</span>
          <div className="h-6 w-px bg-white/20 mx-2" />
          
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-80">Mudar Arena:</span>
            <div className="flex gap-1">
              {arenas.map(a => (
                <button
                  key={a.id}
                  onClick={() => lidarAcaoEmMassa("arena", a.id)}
                  className="w-6 h-6 rounded-full border border-white/40 hover:scale-110 transition-transform"
                  style={{ backgroundColor: a.cor }}
                />
              ))}
              <button
                onClick={() => lidarAcaoEmMassa("arena", "")}
                className="px-2 py-0.5 rounded-lg border border-white/40 hover:bg-white/10 text-xs"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="h-6 w-px bg-white/20 mx-2" />

          <button
            onClick={() => lidarAcaoEmMassa("excluir")}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 transition-colors text-sm"
          >
            <Trash className="w-4 h-4" />
            Excluir Equipe
          </button>
          
          <button
            onClick={() => setSelecionados([])}
            className="p-1 px-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-5">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <h3 className="text-slate-800">{editingId ? "Editar usuário" : "Novo usuário"}</h3>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-1.5">
                <span className="text-slate-500" style={{ fontSize: "0.75rem" }}>Nome</span>
                <input
                  value={form.nome}
                  onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400"
                  placeholder="Nome completo"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-slate-500" style={{ fontSize: "0.75rem" }}>E-mail</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400"
                  placeholder="email@exemplo.com"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-slate-500" style={{ fontSize: "0.75rem" }}>ID Auth Supabase</span>
                <input
                  value={form.authUserId}
                  onChange={e => setForm(prev => ({ ...prev, authUserId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400"
                  placeholder="UUID do usuário em Authentication > Users"
                />
                <span className="block text-slate-400" style={{ fontSize: "0.6875rem" }}>
                  Necessário para login em produção com Supabase Auth.
                </span>
              </label>

              <label className="block space-y-1.5">
                <span className="text-slate-500" style={{ fontSize: "0.75rem" }}>Telefone</span>
                <input
                  value={form.telefone}
                  onChange={e => setForm(prev => ({ ...prev, telefone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400"
                  placeholder="(11) 99999-9999"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-slate-500" style={{ fontSize: "0.75rem" }}>Perfil</span>
                  <select
                    value={form.role}
                    onChange={e => setForm(prev => ({ ...prev, role: e.target.value as TeamRole }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400"
                  >
                    <option value="lider">Líder</option>
                    <option value="colaborador">Colaborador</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-slate-500" style={{ fontSize: "0.75rem" }}>Arena</span>
                  <select
                    value={form.arena}
                    onChange={e => setForm(prev => ({ ...prev, arena: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400"
                  >
                    <option value="">Sem arena</option>
                    {arenas.map(arena => (
                      <option key={arena.id} value={arena.id}>{arena.nome}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-slate-500" style={{ fontSize: "0.75rem" }}>Observações</span>
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 min-h-24"
                  placeholder="Informações adicionais"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-slate-500" style={{ fontSize: "0.75rem" }}>
                  {editingId ? "Nova senha (deixe em branco para manter)" : "Senha inicial"}
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.senha}
                    onChange={e => setForm(prev => ({ ...prev, senha: e.target.value }))}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400"
                    placeholder={editingId ? "Opcional" : "Senha temporária"}
                  />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, senha: generateTemporaryPassword() }))}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 whitespace-nowrap"
                  >
                    Gerar
                  </button>
                </div>
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-white transition-all hover:opacity-90 font-medium"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                >
                  {editingId ? "Salvar alterações" : "Adicionar usuário"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  className="bg-transparent outline-none text-slate-700 flex-1 min-w-0"
                  style={{ fontSize: "0.875rem" }}
                />
                {busca && (
                  <button onClick={() => setBusca("")} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Role filter */}
              <div className="relative">
                <select
                  value={roleFiltro}
                  onChange={e => setRoleFiltro(e.target.value as any)}
                  className="appearance-none pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer text-sm"
                >
                  <option value="todos">Todos os perfis</option>
                  <option value="admin">Administradores</option>
                  <option value="lider">Líderes</option>
                  <option value="colaborador">Colaboradores</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Arena filter */}
              <div className="relative">
                <select
                  value={arenaFiltro}
                  onChange={e => setArenaFiltro(e.target.value as any)}
                  className="appearance-none pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer text-sm"
                >
                  <option value="todas">Todas as arenas</option>
                  <option value="nenhuma">Sem arena atribuída</option>
                  {arenas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <div className="ml-auto text-slate-400 text-sm">
                {filtrados.length} resultados
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <button
                        onClick={toggleSelecionarTodos}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500"
                      >
                        {filtrados.length > 0 && filtrados.every(u => selecionados.includes(u.id)) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Equipe</th>
                    <th className="text-left px-4 py-3 text-slate-500" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Perfil</th>
                    <th className="text-left px-4 py-3 text-slate-500" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Arena</th>
                    <th className="text-left px-4 py-3 text-slate-500" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>E-mail</th>
                    <th className="text-left px-4 py-3 text-slate-500" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                    <th className="text-left px-4 py-3 text-slate-500" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">Nenhum usuário encontrado</td>
                    </tr>
                  ) : filtrados.map(user => {
                    const arena = user.arena ? arenas.find(item => item.id === user.arena) : null;
                    const estaSelecionado = selecionados.includes(user.id);
                    return (
                      <tr key={user.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${estaSelecionado ? "bg-blue-50/50" : ""}`}>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleSelecionar(user.id)}
                            className="p-1 rounded hover:opacity-80 transition-opacity"
                          >
                            {estaSelecionado ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                              {user.nome.charAt(0)}
                            </div>
                            <div>
                              <p className="text-slate-700 font-medium" style={{ fontSize: "0.875rem" }}>{user.nome}</p>
                              <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>{user.telefone || "Sem telefone"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin" ? "bg-slate-800 text-white" : 
                            user.role === "lider" ? "bg-blue-50 text-blue-600" : 
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {user.role === "admin" ? "Admin" : user.role === "lider" ? "Líder" : "Equipe"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {arena ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: arena.cor }} />
                              <span className="text-slate-600" style={{ fontSize: "0.8125rem" }}>{arena.nome}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400" style={{ fontSize: "0.8125rem" }}>Sem arena</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500" style={{ fontSize: "0.8125rem" }}>
                          {user.email}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={async () => {
                              await updateTeamUser(user.id, { ativo: !user.ativo });
                            }}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                              user.ativo ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                          >
                            {user.ativo ? "Ativo" : "Inativo"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => editarUsuario(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                              title="Editar usuário"
                            >
                              <PencilLine className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Excluir ${user.nome}?`)) {
                                  await deleteTeamUser(user.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                              title="Excluir usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

