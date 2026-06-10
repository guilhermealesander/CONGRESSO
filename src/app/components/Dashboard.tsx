import { useData } from "./data-context";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Users, Calendar, TrendingUp, CheckCircle, Clock, XCircle } from "lucide-react";

export function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { arenas, arenados, ultimaImportacao } = useData();

  const totalAtivos = arenados.filter(a => a.status === "ativo").length;
  const totalInativos = arenados.filter(a => a.status === "inativo").length;
  const totalPendentes = arenados.filter(a => a.status === "pendente").length;
  const taxaAtivos = arenados.length > 0 ? (totalAtivos / arenados.length) * 100 : 0;

  const porArena = arenas.map(arena => ({
    name: arena.nome.replace("Arena ", ""),
    total: arenados.filter(a => a.arena === arena.id).length,
    cor: arena.cor,
    arena,
  }));

  const statusData = [
    { name: "Ativos", value: totalAtivos, cor: "#22c55e" },
    { name: "Inativos", value: totalInativos, cor: "#ef4444" },
    { name: "Pendentes", value: totalPendentes, cor: "#eab308" },
  ];

  const statCards = [
    {
      label: "Total de Arenados",
      value: arenados.length,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      change: "+12% este mês",
    },
    {
      label: "Arenados Ativos",
      value: totalAtivos,
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      change: `${taxaAtivos.toFixed(0)}% do total`,
    },
    {
      label: "Pendentes",
      value: totalPendentes,
      icon: Clock,
      color: "from-yellow-500 to-yellow-600",
      change: "Aguardando validação",
    },
    {
      label: "Inativos",
      value: totalInativos,
      icon: XCircle,
      color: "from-red-500 to-red-600",
      change: "Necessitam atenção",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-slate-500" style={{ fontSize: "0.875rem" }}>{card.label}</p>
              <p className="text-slate-800 mt-1" style={{ fontSize: "2rem", lineHeight: 1.2 }}>{card.value}</p>
              <p className="text-slate-400 mt-1" style={{ fontSize: "0.75rem" }}>{card.change}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-slate-800">Arenados por Arena</h3>
              <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.875rem" }}>Distribuição total</p>
            </div>
            <button
              onClick={() => onNavigate("arenados")}
              className="text-blue-600 hover:text-blue-700 transition-colors"
              style={{ fontSize: "0.875rem" }}
            >
              Ver todos →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porArena} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {porArena.map((entry, idx) => (
                  <Cell key={idx} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="mb-6">
            <h3 className="text-slate-800">Status dos Arenados</h3>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.875rem" }}>Por situação atual</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {statusData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.cor} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{value}</span>}
              />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Arena cards + Last import */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-800">Arenas</h3>
            <button onClick={() => onNavigate("arenas")} className="text-blue-600 hover:text-blue-700" style={{ fontSize: "0.875rem" }}>
              Gerenciar →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {porArena.map(({ arena, total, name }) => (
              <div
                key={arena.id}
                className={`rounded-xl p-4 border-2 ${arena.corBg} ${arena.corBorder} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => onNavigate("arenados")}
              >
                <div
                  className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center"
                  style={{ backgroundColor: arena.cor }}
                >
                  <span className="text-white" style={{ fontSize: "0.75rem" }}>{name.charAt(0)}</span>
                </div>
                <p className={`${arena.corText}`} style={{ fontSize: "0.875rem" }}>{arena.nome}</p>
                <p className="text-slate-800 mt-1" style={{ fontSize: "1.5rem", lineHeight: 1.2 }}>{total}</p>
                <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>arenados</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info side */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-slate-500" style={{ fontSize: "0.75rem" }}>Última Importação</p>
                <p className="text-slate-800" style={{ fontSize: "0.875rem" }}>{ultimaImportacao ?? "—"}</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("importar")}
              className="w-full py-2.5 rounded-xl text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "0.875rem" }}
            >
              Nova Importação
            </button>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-400 mb-1" style={{ fontSize: "0.75rem" }}>Taxa de ocupação</p>
            <p className="text-white" style={{ fontSize: "2rem", lineHeight: 1.2 }}>
              {taxaAtivos.toFixed(0)}%
            </p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                style={{ width: `${taxaAtivos}%` }}
              />
            </div>
            <p className="text-slate-500 mt-2" style={{ fontSize: "0.75rem" }}>{totalAtivos} de {arenados.length} ativos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
