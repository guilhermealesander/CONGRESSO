import { useState } from "react";
import { DataProvider, useData } from "./components/data-context";
import { Login } from "./components/Login";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Arenas } from "./components/Arenas";
import { Import } from "./components/Import";
import { ArenadosTable } from "./components/ArenadosTable";
import { ArenadoDetail } from "./components/ArenadoDetail";
import { UsersPage } from "./components/Users";

type Page = "dashboard" | "arenas" | "importar" | "arenados" | "detalhe" | "usuarios";

function AppContent() {
  const { isAuthenticated, currentUserRole } = useData();
  const [page, setPage] = useState<Page>("dashboard");
  const [arenadoId, setArenadoId] = useState<string | undefined>();
  const [filtroArena, setFiltroArena] = useState<string | undefined>();

  if (!isAuthenticated) return <Login />;

  const canAccessUsers = currentUserRole === "admin";

  const handleVerDetalhe = (id: string) => {
    setArenadoId(id);
    setPage("detalhe");
  };

  const handleVerArenados = (arena: string) => {
    setFiltroArena(arena);
    setPage("arenados");
  };

  const handleSetPage = (p: string) => {
    if (p !== "arenados") setFiltroArena(undefined);
    setPage(p as Page);
  };

  return (
    <Layout page={page} setPage={handleSetPage as any}>
      {page === "dashboard" && (
        <Dashboard onNavigate={handleSetPage} />
      )}
      {page === "arenas" && (
        <Arenas onVerArenados={handleVerArenados} />
      )}
      {page === "importar" && (
        <Import />
      )}
      {page === "arenados" && (
        <ArenadosTable
          filtroArenaInicial={filtroArena}
          onVerDetalhe={handleVerDetalhe}
        />
      )}
      {page === "detalhe" && arenadoId && (
        <ArenadoDetail id={arenadoId} onVoltar={() => setPage("arenados")} />
      )}
      {page === "usuarios" && canAccessUsers && (
        <UsersPage />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <DataProvider>
      {/* MARKER-MAKE-KIT-INVOKED */}
      <AppContent />
    </DataProvider>
  );
}
