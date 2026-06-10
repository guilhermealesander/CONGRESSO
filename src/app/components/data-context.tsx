import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  getStoredAuthSession,
  isSupabaseConfigured,
  supabaseDelete,
  supabaseInsert,
  supabaseRefreshSession,
  supabaseSelect,
  supabaseSignIn,
  supabaseSignOut,
  supabaseUpdate,
} from "../lib/supabase";
import { hashPassword } from "../lib/password";

export type ArenaId = string;

export interface Arena {
  id: ArenaId;
  nome: string;
  cor: string;
  corBg: string;
  corText: string;
  corBorder: string;
  corBadge: string;
}

export const ARENAS: Arena[] = [
  { id: "azul", nome: "Arena Azul", cor: "#3b82f6", corBg: "bg-blue-100", corText: "text-blue-700", corBorder: "border-blue-400", corBadge: "bg-blue-500" },
  { id: "verde", nome: "Arena Verde", cor: "#22c55e", corBg: "bg-green-100", corText: "text-green-700", corBorder: "border-green-400", corBadge: "bg-green-500" },
  { id: "vermelho", nome: "Arena Vermelha", cor: "#ef4444", corBg: "bg-red-100", corText: "text-red-700", corBorder: "border-red-400", corBadge: "bg-red-500" },
  { id: "amarelo", nome: "Arena Amarela", cor: "#eab308", corBg: "bg-yellow-100", corText: "text-yellow-700", corBorder: "border-yellow-400", corBadge: "bg-yellow-500" },
  { id: "roxo", nome: "Arena Roxa", cor: "#a855f7", corBg: "bg-purple-100", corText: "text-purple-700", corBorder: "border-purple-400", corBadge: "bg-purple-500" },
  { id: "laranja", nome: "Arena Laranja", cor: "#f97316", corBg: "bg-orange-100", corText: "text-orange-700", corBorder: "border-orange-400", corBadge: "bg-orange-500" },
];

export interface Arenado {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  arena: ArenaId;
  dataImportacao: string;
  status: "ativo" | "inativo" | "pendente";
  cidade: string;
  estado: string;
  profissao: string;
  idade: number | null;
}

export type TeamRole = "admin" | "lider" | "colaborador";

export interface TeamUser {
  id: string;
  authUserId?: string | null;
  nome: string;
  email: string;
  telefone: string;
  role: TeamRole;
  arena: ArenaId | null;
  ativo: boolean;
  criadoEm: string;
  observacoes: string;
  passwordHash: string;
}

type ImportFileType = "csv" | "xlsx" | "xls";

interface ImportOptions {
  fileName?: string;
  fileType?: ImportFileType;
}

interface UpdateArenadoInput {
  nome?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  status?: Arenado["status"];
  arena?: ArenaId;
  cidade?: string;
  estado?: string;
  profissao?: string;
  idade?: number | null;
}

interface NewTeamUserInput {
  authUserId?: string;
  nome: string;
  email: string;
  telefone?: string;
  role: TeamRole;
  arena: ArenaId | null;
  observacoes?: string;
  senha: string;
}

interface UpdateTeamUserInput {
  authUserId?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  role?: TeamRole;
  arena?: ArenaId | null;
  ativo?: boolean;
  observacoes?: string;
  senha?: string;
}

interface DataContextType {
  arenas: Arena[];
  arenados: Arenado[];
  teamUsers: TeamUser[];
  ultimaImportacao: string | null;
  isAuthenticated: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  currentUser: string;
  currentUserRole: TeamRole | null;
  isLoadingData: boolean;
  usingSupabase: boolean;
  addArena: (input: { nome: string; cor: string }) => Promise<void>;
  removeArena: (id: ArenaId) => Promise<void>;
  refreshArenados: () => Promise<void>;
  addArenados: (a: Arenado[], options?: ImportOptions) => Promise<void>;
  updateArenado: (id: string, updates: UpdateArenadoInput) => Promise<void>;
  deleteArenado: (id: string) => Promise<void>;
  refreshTeamUsers: () => Promise<void>;
  addTeamUser: (user: NewTeamUserInput) => Promise<void>;
  updateTeamUser: (id: string, updates: UpdateTeamUserInput) => Promise<void>;
  deleteTeamUser: (id: string) => Promise<void>;
}

type RemoteArenado = {
  codigo: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  profissao: string | null;
  idade: number | null;
  arena_id: ArenaId;
  status: Arenado["status"];
  created_at: string;
  updated_at: string | null;
};

type RemoteImportBatch = {
  imported_at: string;
};

type RemoteArena = {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
};

type RemoteTeamUser = {
  id: string;
  auth_user_id: string | null;
  nome: string;
  email: string;
  telefone: string | null;
  role: TeamRole;
  arena_id: ArenaId | null;
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string | null;
};

const DataContext = createContext<DataContextType | null>(null);

type LocalSession = {
  currentUser: string;
  currentUserRole: TeamRole;
};

const LOCAL_KEYS = {
  arenas: "arena-cju:arenas",
  arenados: "arena-cju:arenados",
  teamUsers: "arena-cju:team-users",
  ultimaImportacao: "arena-cju:ultima-importacao",
  session: "arena-cju:session",
} as const;

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readLocal<T>(key: string, fallback: T): T {
  if (!canUseLocalStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeLocal(key: string) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(key);
}

function gerarArenadosMock(): Arenado[] {
  const arenaIds: ArenaId[] = ["azul", "verde", "vermelho", "amarelo", "roxo", "laranja"];
  const nomes = [
    "Ana Clara Silva", "Bruno Costa", "Carla Mendes", "Diego Ferreira", "Elena Santos",
    "Felipe Rocha", "Gabriela Lima", "Henrique Alves", "Isabela Nunes", "João Pedro Gomes",
    "Karla Oliveira", "Lucas Martins", "Marina Souza", "Nicolas Barbosa", "Olivia Cardoso",
    "Pedro Henrique", "Queila Ribeiro", "Rafael Torres", "Sabrina Castro", "Thiago Moreira",
    "Ursula Pinto", "Victor Hugo", "Wanda Correia", "Xavier Duarte", "Yasmin Freitas",
    "Zara Monteiro", "Augusto Ramos", "Beatriz Lopes", "Caio Andrade", "Daniela Vieira",
    "Eduardo Nascimento", "Fernanda Cruz", "Gustavo Pereira", "Helena Rodrigues", "Igor Carvalho",
  ];
  const cidades = ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Curitiba", "Manaus", "Recife", "Belém", "Porto Alegre"];
  const estados = ["SP", "RJ", "DF", "BA", "CE", "PR", "AM", "PE", "PA", "RS"];
  const profissoes = ["Advogado", "Médico", "Engenheiro", "Professor", "Empresário", "Contador", "Nutricionista", "Arquiteto", "Psicólogo", "Jornalista"];
  const statuses: Arenado["status"][] = ["ativo", "ativo", "ativo", "inativo", "pendente"];

  return nomes.map((nome, i) => ({
    id: `ARE-${String(i + 1).padStart(4, "0")}`,
    nome,
    cpf: `${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}.${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}.${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}-${String(Math.floor(Math.random() * 90) + 10)}`,
    email: `${nome.split(" ")[0].toLowerCase()}@email.com`,
    telefone: `(${String(Math.floor(Math.random() * 90) + 10)}) 9${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    arena: arenaIds[i % 6],
    dataImportacao: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString("pt-BR"),
    status: statuses[i % 5],
    cidade: cidades[i % 10],
    estado: estados[i % 10],
    profissao: profissoes[i % 10],
    idade: 22 + (i % 24),
  }));
}

function gerarUsuariosMock(): TeamUser[] {
  return [
    {
      id: "USR-001",
      authUserId: null,
      nome: "Michele Silva",
      email: "michele@example.com",
      telefone: "(11) 99999-0001",
      role: "admin",
      arena: null,
      ativo: true,
      criadoEm: new Date().toLocaleDateString("pt-BR"),
      observacoes: "Administradora do sistema",
      passwordHash: hashPassword("Admin@1234"),
    },
    {
      id: "USR-002",
      authUserId: null,
      nome: "Carlos Lima",
      email: "carlos.lima@example.com",
      telefone: "(11) 99999-0002",
      role: "lider",
      arena: "azul",
      ativo: true,
      criadoEm: new Date().toLocaleDateString("pt-BR"),
      observacoes: "Lider da Arena Azul",
      passwordHash: hashPassword("Lider@1234"),
    },
  ];
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString("pt-BR");
}

function normalizeAge(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return Math.max(0, Math.trunc(value));
}

function buildCounts(arenados: Arenado[], arenas: Arena[]) {
  return arenas.reduce((acc, arena) => {
    acc[arena.id] = arenados.filter(item => item.arena === arena.id).length;
    return acc;
  }, {} as Record<ArenaId, number>);
}

function chooseBalancedArena(arenas: Arena[], counts: Record<ArenaId, number>, preferredArena?: ArenaId) {
  return [...arenas]
    .sort((a, b) => {
      const diff = counts[a.id] - counts[b.id];
      if (diff !== 0) return diff;
      if (preferredArena) {
        if (a.id === preferredArena) return -1;
        if (b.id === preferredArena) return 1;
      }
      return arenas.findIndex(arena => arena.id === a.id) - arenas.findIndex(arena => arena.id === b.id);
    })[0]?.id ?? ARENAS[0].id;
}

function buildCodigo(index: number) {
  return `ARE-${String(Date.now()).slice(-6)}-${String(index + 1).padStart(2, "0")}`;
}

function mapRemoteArenado(record: RemoteArenado): Arenado {
  return {
    id: record.codigo,
    nome: record.nome,
    cpf: record.cpf ?? "",
    email: record.email ?? "",
    telefone: record.telefone ?? "",
    arena: record.arena_id,
    dataImportacao: formatDateTime(record.updated_at ?? record.created_at) ?? new Date(record.created_at).toLocaleDateString("pt-BR"),
    status: record.status,
    cidade: record.cidade ?? "",
    estado: record.estado ?? "",
    profissao: record.profissao ?? "",
    idade: normalizeAge(record.idade),
  };
}

function mapRemoteTeamUser(record: RemoteTeamUser): TeamUser {
  return {
    id: record.id,
    authUserId: record.auth_user_id,
    nome: record.nome,
    email: record.email,
    telefone: record.telefone ?? "",
    role: record.role,
    arena: record.arena_id,
    ativo: record.ativo,
    criadoEm: formatDateTime(record.created_at) ?? new Date(record.created_at).toLocaleDateString("pt-BR"),
    observacoes: record.observacoes ?? "",
    passwordHash: "",
  };
}

function mapRemoteArena(record: RemoteArena): Arena {
  return {
    id: record.id,
    nome: record.nome,
    cor: record.cor,
    corBg: "bg-slate-100",
    corText: "text-slate-700",
    corBorder: "border-slate-300",
    corBadge: "bg-slate-500",
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const initialLocalSession = readLocal<LocalSession | null>(LOCAL_KEYS.session, null);
  const initialSupabaseSession = getStoredAuthSession();
  const [arenas, setArenas] = useState<Arena[]>(() => readLocal(LOCAL_KEYS.arenas, ARENAS));
  const [arenados, setArenados] = useState<Arenado[]>(() => readLocal(LOCAL_KEYS.arenados, gerarArenadosMock()));
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>(() => readLocal(LOCAL_KEYS.teamUsers, gerarUsuariosMock()));
  const [ultimaImportacao, setUltimaImportacao] = useState<string | null>(() => readLocal(LOCAL_KEYS.ultimaImportacao, "09/06/2025 14:30"));
  const [isAuthenticated, setIsAuthenticated] = useState(() => isSupabaseConfigured() ? Boolean(initialSupabaseSession) : Boolean(initialLocalSession));
  const [currentUser, setCurrentUser] = useState(() => isSupabaseConfigured() ? initialSupabaseSession?.user.email ?? "" : initialLocalSession?.currentUser ?? "");
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(() => isSupabaseConfigured() ? null : initialLocalSession?.currentUserRole ?? null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [usingSupabase, setUsingSupabase] = useState(false);

  const refreshArenas = async () => {
    if (!isSupabaseConfigured()) {
      setArenas(readLocal(LOCAL_KEYS.arenas, ARENAS));
      return;
    }

    try {
      const remoteArenas = await supabaseSelect<RemoteArena[]>(
        "/arenas?select=id,nome,cor,ordem&order=ordem.asc"
      );
      setArenas(remoteArenas.map(mapRemoteArena));
      setUsingSupabase(true);
    } catch (error) {
      console.error("Erro ao carregar arenas do Supabase:", error);
      setUsingSupabase(false);
    }
  };

  const addArena = async (input: { nome: string; cor: string }) => {
    const nome = input.nome.trim();
    const cor = input.cor.trim();

    if (!nome || !cor) {
      return;
    }

    const buildArena = (prev: Arena[]) => {
      const baseId = nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `arena-${Date.now()}`;
      const existingIds = new Set(prev.map(item => item.id));
      let id = baseId;
      let suffix = 2;

      while (existingIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }

      return {
        id,
        nome,
        cor,
        corBg: "bg-slate-100",
        corText: "text-slate-700",
        corBorder: "border-slate-300",
        corBadge: "bg-slate-500",
      };
    };

    if (!isSupabaseConfigured()) {
      setArenas(prev => {
        const next = [...prev, buildArena(prev)];
        writeLocal(LOCAL_KEYS.arenas, next);
        return next;
      });
      return;
    }

    try {
      const arena = buildArena(arenas);
      await supabaseInsert("/arenas", {
        id: arena.id,
        nome: arena.nome,
        cor: arena.cor,
        ordem: arenas.length + 1,
      });
      await refreshArenas();
    } catch (error) {
      console.error("Erro ao criar arena no Supabase:", error);
      throw error;
    }
  };

  const removeArena = async (id: ArenaId) => {
    const remaining = arenas.filter(arena => arena.id !== id);

    if (remaining.length === 0) {
      return;
    }

    const fallbackArena = remaining[0].id;
    setArenas(remaining);

    setArenados(prev => {
      const next = prev.map(arenado =>
        arenado.arena === id ? { ...arenado, arena: fallbackArena } : arenado
      );
      if (!isSupabaseConfigured()) {
        writeLocal(LOCAL_KEYS.arenados, next);
      }
      return next;
    });

    setTeamUsers(prev => {
      const next = prev.map(user =>
        user.arena === id ? { ...user, arena: fallbackArena } : user
      );
      if (!isSupabaseConfigured()) {
        writeLocal(LOCAL_KEYS.teamUsers, next);
      }
      return next;
    });

    if (!isSupabaseConfigured()) {
      writeLocal(LOCAL_KEYS.arenas, remaining);
      return;
    }

    try {
      await supabaseUpdate(`/arenados?arena_id=eq.${encodeURIComponent(id)}&deleted_at=is.null`, {
        arena_id: fallbackArena,
      });
      await supabaseUpdate(`/team_users?arena_id=eq.${encodeURIComponent(id)}`, {
        arena_id: fallbackArena,
      });
      await supabaseDelete(`/arenas?id=eq.${encodeURIComponent(id)}`);
      await Promise.all([refreshArenas(), refreshArenados(), refreshTeamUsers()]);
    } catch (error) {
      console.error("Erro ao remover arena no Supabase:", error);
      await Promise.all([refreshArenas(), refreshArenados(), refreshTeamUsers()]);
      throw error;
    }
  };

  const refreshArenados = async () => {
    if (!isSupabaseConfigured()) {
      setUsingSupabase(false);
      setArenados(readLocal(LOCAL_KEYS.arenados, gerarArenadosMock()));
      setUltimaImportacao(readLocal(LOCAL_KEYS.ultimaImportacao, "09/06/2025 14:30"));
      return;
    }

    setIsLoadingData(true);

    try {
      const remoteArenados = await supabaseSelect<RemoteArenado[]>(
        "/arenados?select=codigo,nome,cpf,email,telefone,cidade,estado,profissao,idade,arena_id,status,created_at,updated_at&deleted_at=is.null&order=created_at.desc"
      );
      const importacoes = await supabaseSelect<RemoteImportBatch[]>(
        "/import_batches?select=imported_at&order=imported_at.desc&limit=1"
      ).catch(() => []);

      setArenados(remoteArenados.map(mapRemoteArenado));
      setUltimaImportacao(importacoes[0]?.imported_at ? formatDateTime(importacoes[0].imported_at) : null);
      setUsingSupabase(true);
    } catch (error) {
      console.error("Erro ao carregar dados do Supabase:", error);
      setUsingSupabase(false);
      setArenados(gerarArenadosMock());
      setUltimaImportacao("09/06/2025 14:30");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      if (isSupabaseConfigured()) {
        const session = getStoredAuthSession();

        if (!session) {
          setIsAuthenticated(false);
          setCurrentUser("");
          setCurrentUserRole(null);
          return;
        }

        try {
          await supabaseRefreshSession();
          await Promise.all([refreshArenas(), refreshArenados(), refreshTeamUsers()]);
        } catch (error) {
          console.error("Erro ao restaurar sessao do Supabase:", error);
          await supabaseSignOut();
          setIsAuthenticated(false);
          setCurrentUser("");
          setCurrentUserRole(null);
        }
        return;
      }

      void refreshArenas();
      void refreshArenados();
      void refreshTeamUsers();
    };

    void loadInitialData();
  }, []);

  const refreshTeamUsers = async () => {
    if (!isSupabaseConfigured()) {
      setTeamUsers(readLocal(LOCAL_KEYS.teamUsers, gerarUsuariosMock()));
      return;
    }

    try {
      const remoteUsers = await supabaseSelect<RemoteTeamUser[]>(
        "/team_users?select=id,auth_user_id,nome,email,telefone,role,arena_id,ativo,observacoes,created_at,updated_at&order=created_at.desc"
      );

      setTeamUsers(remoteUsers.map(mapRemoteTeamUser));
      const session = getStoredAuthSession();
      const current = remoteUsers.find(remoteUser => remoteUser.auth_user_id === session?.user.id && remoteUser.ativo);

      if (current) {
        setIsAuthenticated(true);
        setCurrentUser(current.nome);
        setCurrentUserRole(current.role);
      }
    } catch (error) {
      console.error("Erro ao carregar usuarios do Supabase:", error);
      setTeamUsers([]);
    }
  };

  const login = async (user: string, pass: string) => {
    const normalizedUser = user.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      try {
        const session = await supabaseSignIn(normalizedUser, pass);
        const records = await supabaseSelect<RemoteTeamUser[]>(
          `/team_users?select=id,auth_user_id,nome,email,telefone,role,arena_id,ativo,observacoes,created_at,updated_at&auth_user_id=eq.${encodeURIComponent(session.user.id)}&ativo=eq.true&limit=1`
        );
        const match = records[0];

        if (!match) {
          await supabaseSignOut();
          return false;
        }

        setIsAuthenticated(true);
        setCurrentUser(match.nome);
        setCurrentUserRole(match.role);
        await Promise.all([refreshArenas(), refreshArenados(), refreshTeamUsers()]);
        return true;
      } catch (error) {
        console.error("Erro ao autenticar no Supabase:", error);
        await supabaseSignOut();
        return false;
      }
    }

    const passwordHash = hashPassword(pass);

    const match = teamUsers.find(item => {
      const identifier = item.email.toLowerCase() === normalizedUser || item.nome.toLowerCase() === normalizedUser;
      return identifier && item.ativo && item.passwordHash === passwordHash;
    });

    if (match) {
      setIsAuthenticated(true);
      setCurrentUser(match.nome);
      setCurrentUserRole(match.role);
      writeLocal(LOCAL_KEYS.session, {
        currentUser: match.nome,
        currentUserRole: match.role,
      });
      return true;
    }

    if ((normalizedUser === "admin" || normalizedUser === "arena") && pass === "123456") {
      const fallbackUser = normalizedUser === "admin" ? "Administrador" : "Coordenador Arena";
      setIsAuthenticated(true);
      setCurrentUser(fallbackUser);
      setCurrentUserRole("admin");
      writeLocal(LOCAL_KEYS.session, {
        currentUser: fallbackUser,
        currentUserRole: "admin",
      });
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser("");
    setCurrentUserRole(null);
    removeLocal(LOCAL_KEYS.session);
    void supabaseSignOut();
  };

  const addArenados = async (novos: Arenado[], options?: ImportOptions) => {
    const agora = new Date().toLocaleString("pt-BR");

    const normalized = novos.map((arenado, index) => ({
      ...arenado,
      id: arenado.id || buildCodigo(index),
    }));

    if (!isSupabaseConfigured()) {
      const counts = buildCounts(arenados, arenas);
      const fallback = normalized.map((arenado, index) => {
        const arena = chooseBalancedArena(arenas, counts, index === 0 ? arenado.arena : undefined);
        counts[arena] += 1;
        return { ...arenado, arena, dataImportacao: agora };
      });

      setArenados(prev => {
        const next = [...prev, ...fallback];
        writeLocal(LOCAL_KEYS.arenados, next);
        return next;
      });
      setUltimaImportacao(agora);
      writeLocal(LOCAL_KEYS.ultimaImportacao, agora);
      return;
    }

    try {
      const counts = buildCounts(arenados, arenas);
      const payload = normalized.map((arenado, index) => {
        const arena = chooseBalancedArena(arenas, counts, index === 0 ? arenado.arena : undefined);
        counts[arena] += 1;

        return {
          codigo: arenado.id,
          nome: arenado.nome,
          cpf: arenado.cpf || null,
          email: arenado.email || null,
          telefone: arenado.telefone || null,
          cidade: arenado.cidade || null,
          estado: arenado.estado || null,
          profissao: arenado.profissao || null,
          idade: arenado.idade ?? null,
          arena_id: arena,
          status: arenado.status || "pendente",
          source_row: arenado,
        };
      });

      await supabaseInsert("/import_batches", {
        file_name: options?.fileName ?? "importacao_manual",
        file_type: options?.fileType ?? "csv",
        total_rows: payload.length,
        total_imported: payload.length,
        total_errors: 0,
        default_arena_id: null,
        notes: null,
      });

      await supabaseInsert("/arenados", payload);
      await refreshArenados();
      setUltimaImportacao(agora);
    } catch (error) {
      console.error("Erro ao importar arenados no Supabase:", error);
      throw error;
    }
  };

  const updateArenado = async (id: string, updates: UpdateArenadoInput) => {
    setArenados(prev => {
      const next = prev.map(arenado =>
        arenado.id === id ? { ...arenado, ...updates } : arenado
      );
      if (!isSupabaseConfigured()) {
        writeLocal(LOCAL_KEYS.arenados, next);
      }
      return next;
    });

    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      const patch: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) continue;
        if (key === "arena") {
          patch.arena_id = value;
        } else {
          patch[key] = value;
        }
      }

      if (Object.keys(patch).length > 0) {
        await supabaseUpdate(`/arenados?codigo=eq.${encodeURIComponent(id)}`, patch);
      }

      await refreshArenados();
    } catch (error) {
      console.error("Erro ao atualizar arenado no Supabase:", error);
      await refreshArenados();
      throw error;
    }
  };

  const deleteArenado = async (id: string) => {
    setArenados(prev => {
      const next = prev.filter(arenado => arenado.id !== id);
      if (!isSupabaseConfigured()) {
        writeLocal(LOCAL_KEYS.arenados, next);
      }
      return next;
    });

    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      await supabaseUpdate(`/arenados?codigo=eq.${encodeURIComponent(id)}`, {
        deleted_at: new Date().toISOString(),
      });

      await refreshArenados();
    } catch (error) {
      console.error("Erro ao excluir arenado no Supabase:", error);
      await refreshArenados();
      throw error;
    }
  };

  const addTeamUser = async (user: NewTeamUserInput) => {
    const novoUsuario: TeamUser = {
      id: `USR-${Date.now()}`,
      authUserId: user.authUserId || null,
      nome: user.nome,
      email: user.email,
      telefone: user.telefone ?? "",
      role: user.role,
      arena: user.arena,
      ativo: true,
      criadoEm: new Date().toLocaleDateString("pt-BR"),
      observacoes: user.observacoes ?? "",
      passwordHash: hashPassword(user.senha),
    };

    if (!isSupabaseConfigured()) {
      setTeamUsers(prev => {
        const next = [novoUsuario, ...prev];
        writeLocal(LOCAL_KEYS.teamUsers, next);
        return next;
      });
      return;
    }

    try {
      await supabaseInsert("/team_users", {
        auth_user_id: novoUsuario.authUserId || null,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        telefone: novoUsuario.telefone || null,
        role: novoUsuario.role,
        arena_id: novoUsuario.arena,
        ativo: novoUsuario.ativo,
        observacoes: novoUsuario.observacoes || null,
      });

      await refreshTeamUsers();
    } catch (error) {
      console.error("Erro ao criar usuario no Supabase:", error);
      throw error;
    }
  };

  const updateTeamUser = async (id: string, updates: UpdateTeamUserInput) => {
    setTeamUsers(prev => {
      const next = prev.map(user => {
        if (user.id !== id) return user;

        return {
          ...user,
          ...(updates.nome !== undefined ? { nome: updates.nome } : {}),
          ...(updates.authUserId !== undefined ? { authUserId: updates.authUserId || null } : {}),
          ...(updates.email !== undefined ? { email: updates.email } : {}),
          ...(updates.telefone !== undefined ? { telefone: updates.telefone } : {}),
          ...(updates.role !== undefined ? { role: updates.role } : {}),
          ...(updates.arena !== undefined ? { arena: updates.arena } : {}),
          ...(updates.ativo !== undefined ? { ativo: updates.ativo } : {}),
          ...(updates.observacoes !== undefined ? { observacoes: updates.observacoes } : {}),
          ...(updates.senha ? { passwordHash: hashPassword(updates.senha) } : {}),
        };
      });
      if (!isSupabaseConfigured()) {
        writeLocal(LOCAL_KEYS.teamUsers, next);
      }
      return next;
    });

    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      await supabaseUpdate(`/team_users?id=eq.${encodeURIComponent(id)}`, {
        nome: updates.nome,
        auth_user_id: updates.authUserId,
        email: updates.email,
        telefone: updates.telefone ?? null,
        role: updates.role,
        arena_id: updates.arena,
        ativo: updates.ativo,
        observacoes: updates.observacoes ?? null,
      });

      await refreshTeamUsers();
    } catch (error) {
      console.error("Erro ao atualizar usuário no Supabase:", error);
    }
  };

  const deleteTeamUser = async (id: string) => {
    setTeamUsers(prev => {
      const next = prev.filter(user => user.id !== id);
      if (!isSupabaseConfigured()) {
        writeLocal(LOCAL_KEYS.teamUsers, next);
      }
      return next;
    });

    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      await supabaseUpdate(`/team_users?id=eq.${encodeURIComponent(id)}`, {
        ativo: false,
      });

      await refreshTeamUsers();
    } catch (error) {
      console.error("Erro ao excluir usuário no Supabase:", error);
    }
  };

  return (
    <DataContext.Provider
      value={{
        arenas,
        arenados,
        teamUsers,
        ultimaImportacao,
        isAuthenticated,
        login,
        logout,
        currentUser,
        currentUserRole,
        isLoadingData,
        usingSupabase,
        addArena,
        removeArena,
        refreshArenados,
        addArenados,
        updateArenado,
        deleteArenado,
        refreshTeamUsers,
        addTeamUser,
        updateTeamUser,
        deleteTeamUser,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be inside DataProvider");
  return ctx;
}



