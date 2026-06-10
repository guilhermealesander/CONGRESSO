import { useState } from "react";
import { useData } from "./data-context";
import {
  LayoutDashboard, Users, Upload, Shield, LogOut, Menu, X,
  ChevronRight, Bell, Search, Settings, Layers
} from "lucide-react";

type Page = "dashboard" | "arenas" | "importar" | "arenados" | "detalhe" | "usuarios";

interface LayoutProps {
  page: Page;
  setPage: (p: Page) => void;
  arenadoId?: string;
  setArenadoId?: (id: string) => void;
  children: React.ReactNode;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "arenas", label: "Arenas", icon: Layers },
  { id: "importar", label: "Importar Planilha", icon: Upload },
  { id: "arenados", label: "Arenados", icon: Users },
  { id: "usuarios", label: "Usuários", icon: Users },
];

export function Layout({ page, setPage, children }: LayoutProps) {
  const { arenas, logout, currentUser, currentUserRole } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNavItems = navItems.filter(item => {
    if (currentUserRole !== "admin" && (item.id === "importar" || item.id === "usuarios")) {
      return false;
    }
    return true;
  });

  const pageTitles: Record<Page, string> = {
    dashboard: "Dashboard",
    arenas: "Gerenciar Arenas",
    importar: "Importar Planilha",
    arenados: "Lista de Arenados",
    detalhe: "Detalhes do Arenado",
    usuarios: "Usuários",
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        flex flex-col bg-slate-900 text-white transition-all duration-300
        ${sidebarOpen ? "w-64" : "w-16"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <span className="text-white" style={{ fontSize: "1rem", letterSpacing: "-0.01em" }}>ARENA CJU</span>
              <p className="text-slate-400" style={{ fontSize: "0.6875rem" }}>Sistema de Gestão</p>
            </div>
          )}
        </div>

        {/* Arena color indicators */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-slate-700/50">
            <p className="text-slate-500 mb-2" style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Arenas Ativas</p>
            <div className="flex gap-1.5 flex-wrap">
              {arenas.map(a => (
                <div
                  key={a.id}
                  className="w-4 h-4 rounded-full border-2 border-slate-700"
                  style={{ backgroundColor: a.cor }}
                  title={a.nome}
                />
              ))}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setPage(item.id as Page); setMobileOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 mb-1 transition-all rounded-lg mx-2
                  ${sidebarOpen ? "pr-4" : "justify-center px-2"}
                  ${active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                `}
                style={{ width: sidebarOpen ? "calc(100% - 16px)" : "calc(100% - 16px)" }}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span style={{ fontSize: "0.9375rem" }}>{item.label}</span>
                    {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-slate-700/50 p-4">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white" style={{ fontSize: "0.75rem" }}>
                  {currentUser.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-white truncate" style={{ fontSize: "0.875rem" }}>{currentUser}</p>
                <p className="text-slate-400" style={{ fontSize: "0.6875rem" }}>
                  {currentUserRole === "admin" ? "Administrador" : currentUserRole === "lider" ? "Líder" : "Colaborador"}
                </p>
              </div>
            </div>
          ) : null}
          <button
            onClick={logout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-all ${!sidebarOpen ? "justify-center" : ""}`}
            title="Sair"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span style={{ fontSize: "0.875rem" }}>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => { setSidebarOpen(!sidebarOpen); setMobileOpen(!mobileOpen); }}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1">
            <h1 className="text-slate-800" style={{ fontSize: "1.125rem" }}>{pageTitles[page]}</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
              <Search className="w-4 h-4 text-slate-400" />
              <input placeholder="Buscar..." className="bg-transparent outline-none text-slate-600 w-40" style={{ fontSize: "0.875rem" }} />
            </div>
            <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
