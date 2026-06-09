import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { isSupabaseConfigured, supabaseInsert, supabaseSelect, supabaseUpdate } from "../lib/supabase";

export type ArenaId = "azul" | "verde" | "vermelho" | "amarelo" | "roxo" | "laranja";

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
}

type ImportFileType = "csv" | "xlsx" | "xls";

interface ImportOptions {
  fileName?: string;
  fileType?: ImportFileType;
}

interface UpdateArenadoInput {
  status?: Arenado["status"];
  arena?: ArenaId;
}

interface DataContextType {
  arenados: Arenado[];
  ultimaImportacao: string | null;
  isAuthenticated: boolean;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  currentUser: string;
  isLoadingData: boolean;
  usingSupabase: boolean;
  refreshArenados: () => Promise<void>;
  addArenados: (a: Arenado[], options?: ImportOptions) => Promise<void>;
  updateArenado: (id: string, updates: UpdateArenadoInput) => Promise<void>;
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
  arena_id: ArenaId;
  status: Arenado["status"];
  created_at: string;
  updated_at: string | null;
};

type RemoteImportBatch = {
  imported_at: string;
};

const DataContext = createContext<DataContextType | null>(null);

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
  }));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString("pt-BR");
}

function buildCounts(arenados: Arenado[]) {
  return ARENAS.reduce((acc, arena) => {
    acc[arena.id] = arenados.filter(item => item.arena === arena.id).length;
    return acc;
  }, {} as Record<ArenaId, number>);
}

function chooseBalancedArena(counts: Record<ArenaId, number>, preferredArena?: ArenaId) {
  return [...ARENAS]
    .sort((a, b) => {
      const diff = counts[a.id] - counts[b.id];
      if (diff !== 0) return diff;
      if (preferredArena) {
        if (a.id === preferredArena) return -1;
        if (b.id === preferredArena) return 1;
      }
      return ARENAS.findIndex(arena => arena.id === a.id) - ARENAS.findIndex(arena => arena.id === b.id);
    })[0].id;
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
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [arenados, setArenados] = useState<Arenado[]>(gerarArenadosMock());
  const [ultimaImportacao, setUltimaImportacao] = useState<string | null>("09/06/2025 14:30");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [usingSupabase, setUsingSupabase] = useState(false);

  const refreshArenados = async () => {
    if (!isSupabaseConfigured()) {
      setUsingSupabase(false);
      setArenados(gerarArenadosMock());
      setUltimaImportacao("09/06/2025 14:30");
      return;
    }

    setIsLoadingData(true);

    try {
      const [remoteArenados, importacoes] = await Promise.all([
        supabaseSelect<RemoteArenado[]>(
          "/arenados?select=codigo,nome,cpf,email,telefone,cidade,estado,profissao,arena_id,status,created_at,updated_at&deleted_at=is.null&order=created_at.desc"
        ),
        supabaseSelect<RemoteImportBatch[]>("/import_batches?select=imported_at&order=imported_at.desc&limit=1"),
      ]);

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
    void refreshArenados();
  }, []);

  const login = (user: string, pass: string) => {
    if ((user === "admin" || user === "arena") && pass === "123456") {
      setIsAuthenticated(true);
      setCurrentUser(user === "admin" ? "Administrador" : "Coordenador Arena");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser("");
  };

  const addArenados = async (novos: Arenado[], options?: ImportOptions) => {
    const agora = new Date().toLocaleString("pt-BR");

    const normalized = novos.map((arenado, index) => ({
      ...arenado,
      id: arenado.id || buildCodigo(index),
    }));

    if (!isSupabaseConfigured()) {
      const counts = buildCounts(arenados);
      const fallback = normalized.map((arenado, index) => {
        const arena = chooseBalancedArena(counts, index === 0 ? arenado.arena : undefined);
        counts[arena] += 1;
        return { ...arenado, arena, dataImportacao: agora };
      });

      setArenados(prev => [...prev, ...fallback]);
      setUltimaImportacao(agora);
      return;
    }

    try {
      const counts = buildCounts(arenados);
      const payload = normalized.map((arenado, index) => {
        const arena = chooseBalancedArena(counts, index === 0 ? arenado.arena : undefined);
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
      const counts = buildCounts(arenados);
      const fallback = normalized.map((arenado, index) => {
        const arena = chooseBalancedArena(counts, index === 0 ? arenado.arena : undefined);
        counts[arena] += 1;
        return { ...arenado, arena, dataImportacao: agora };
      });

      setArenados(prev => [...prev, ...fallback]);
      setUltimaImportacao(agora);
    }
  };

  const updateArenado = async (id: string, updates: UpdateArenadoInput) => {
    setArenados(prev =>
      prev.map(arenado =>
        arenado.id === id ? { ...arenado, ...updates } : arenado
      )
    );

    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      const patch: Record<string, string> = {};

      if (updates.status) {
        patch.status = updates.status;
      }

      if (updates.arena) {
        patch.arena_id = updates.arena;
      }

      if (Object.keys(patch).length > 0) {
        await supabaseUpdate(`/arenados?codigo=eq.${encodeURIComponent(id)}`, patch);
      }

      await refreshArenados();
    } catch (error) {
      console.error("Erro ao atualizar arenado no Supabase:", error);
    }
  };

  return (
    <DataContext.Provider
      value={{
        arenados,
        ultimaImportacao,
        isAuthenticated,
        login,
        logout,
        currentUser,
        isLoadingData,
        usingSupabase,
        refreshArenados,
        addArenados,
        updateArenado,
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
