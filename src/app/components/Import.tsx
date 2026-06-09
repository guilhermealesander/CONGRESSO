import { useState, useRef, useCallback } from "react";
import { useData, ARENAS, Arenado, ArenaId } from "./data-context";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";

type ImportStatus = "idle" | "preview" | "success" | "error";

export function Import() {
  const { addArenados, arenados } = useData();
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [dragging, setDragging] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<Partial<Arenado>[]>([]);
  const [erros, setErros] = useState<string[]>([]);
  const [arenaDefault, setArenaDefault] = useState<ArenaId>("azul");
  const [importCount, setImportCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const distribuirEmEquilibrio = useCallback((itens: Partial<Arenado>[]) => {
    const counts = ARENAS.reduce((acc, arena) => {
      acc[arena.id] = arenados.filter(item => item.arena === arena.id).length;
      return acc;
    }, {} as Record<ArenaId, number>);

    return itens.map((item, index) => {
      const preferida = (item.arena as ArenaId | undefined) ?? (index === 0 ? arenaDefault : undefined);
      const arena = [...ARENAS]
        .sort((a, b) => {
          const diff = counts[a.id] - counts[b.id];
          if (diff !== 0) return diff;
          if (preferida) {
            if (a.id === preferida) return -1;
            if (b.id === preferida) return 1;
          }
          return 0;
        })[0].id;

      counts[arena] += 1;

      return {
        ...item,
        arena,
      };
    });
  }, [arenados, arenaDefault]);

  const processarArquivo = useCallback((file: File) => {
    setArquivo(file);
    setErros([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let rows: string[][] = [];

        if (file.name.endsWith(".csv")) {
          const text = data as string;
          rows = text.split("\n").map(l => l.split(/[,;]/).map(c => c.trim().replace(/^"|"$/g, "")));
        } else {
          const wb = XLSX.read(data, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
        }

        if (rows.length < 2) {
          setErros(["Arquivo vazio ou sem dados."]);
          setStatus("error");
          return;
        }

        const headers = rows[0].map(h => String(h).toLowerCase().trim());
        const dataRows = rows.slice(1).filter(r => r.some(c => c));

        const mapeados: Partial<Arenado>[] = dataRows.map((row, i) => {
          const get = (keys: string[]) => {
            for (const k of keys) {
              const idx = headers.findIndex(h => h.includes(k));
              if (idx >= 0 && row[idx]) return String(row[idx]).trim();
            }
            return "";
          };

          const arenaVal = get(["arena"]).toLowerCase() as ArenaId;
          const arenaValida = ARENAS.find(a => a.id === arenaVal || a.nome.toLowerCase().includes(arenaVal));

          return {
            id: `IMP-${Date.now()}-${i}`,
            nome: get(["nome", "name", "participant"]) || `Arenado ${i + 1}`,
            cpf: get(["cpf", "documento", "doc"]),
            email: get(["email", "e-mail", "mail"]),
            telefone: get(["telefone", "tel", "fone", "phone"]),
            arena: arenaValida ? arenaValida.id : arenaDefault,
            dataImportacao: new Date().toLocaleDateString("pt-BR"),
            status: "pendente" as const,
            cidade: get(["cidade", "city"]),
            estado: get(["estado", "uf", "state"]),
            profissao: get(["profissao", "profissão", "cargo", "job"]),
          };
        });

        setPreview(distribuirEmEquilibrio(mapeados));
        setStatus("preview");
      } catch {
        setErros(["Erro ao processar arquivo. Verifique o formato."]);
        setStatus("error");
      }
    };
    if (file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  }, [arenaDefault]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processarArquivo(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  };

  const confirmarImportacao = async () => {
    const validos = preview.filter(p => p.nome) as Arenado[];
    await addArenados(validos, {
      fileName: arquivo?.name,
      fileType: arquivo?.name.endsWith(".csv") ? "csv" : arquivo?.name.endsWith(".xls") ? "xls" : "xlsx",
    });
    setImportCount(validos.length);
    setStatus("success");
  };

  const resetar = () => {
    setStatus("idle");
    setArquivo(null);
    setPreview([]);
    setErros([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex gap-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-800" style={{ fontSize: "0.875rem" }}>Formatos aceitos: <strong>.xlsx, .xls, .csv</strong></p>
            <p className="text-blue-600 mt-1" style={{ fontSize: "0.8125rem" }}>
              A planilha deve conter colunas como: <code className="bg-blue-100 px-1 rounded">nome</code>, <code className="bg-blue-100 px-1 rounded">cpf</code>, <code className="bg-blue-100 px-1 rounded">email</code>, <code className="bg-blue-100 px-1 rounded">telefone</code>, <code className="bg-blue-100 px-1 rounded">arena</code>, <code className="bg-blue-100 px-1 rounded">cidade</code>, <code className="bg-blue-100 px-1 rounded">estado</code>
            </p>
          </div>
        </div>
      </div>

      {status === "success" ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-slate-800 mb-2">Importação Concluída!</h3>
          <p className="text-slate-500" style={{ fontSize: "0.9375rem" }}>
            <strong className="text-slate-700">{importCount}</strong> arenados importados com sucesso.
          </p>
          <button
            onClick={resetar}
            className="mt-6 px-6 py-3 rounded-xl text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
          >
            Nova Importação
          </button>
        </div>
      ) : status === "preview" ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-slate-800">Pré-visualização da Importação</h3>
              <button onClick={resetar} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-500" style={{ fontSize: "0.875rem" }}>
              Arquivo: <strong>{arquivo?.name}</strong> · {preview.length} registros encontrados
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Nome", "CPF", "Email", "Telefone", "Arena", "Cidade", "Status"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-slate-500" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((row, i) => {
                    const arena = ARENAS.find(a => a.id === row.arena);
                    return (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-700" style={{ fontSize: "0.875rem" }}>{row.nome}</td>
                        <td className="px-4 py-3 text-slate-500" style={{ fontSize: "0.8125rem" }}>{row.cpf || "—"}</td>
                        <td className="px-4 py-3 text-slate-500" style={{ fontSize: "0.8125rem" }}>{row.email || "—"}</td>
                        <td className="px-4 py-3 text-slate-500" style={{ fontSize: "0.8125rem" }}>{row.telefone || "—"}</td>
                        <td className="px-4 py-3">
                          {arena && (
                            <span className="px-2 py-1 rounded-full text-white" style={{ backgroundColor: arena.cor, fontSize: "0.75rem" }}>
                              {arena.nome}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500" style={{ fontSize: "0.8125rem" }}>{row.cidade || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full" style={{ fontSize: "0.75rem" }}>pendente</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {preview.length > 10 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-center text-slate-400" style={{ fontSize: "0.8125rem" }}>
                + {preview.length - 10} registros adicionais
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={resetar} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all" style={{ fontSize: "0.9375rem" }}>
              Cancelar
            </button>
            <button
              onClick={confirmarImportacao}
              className="px-6 py-2.5 rounded-xl text-white transition-all hover:opacity-90 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
            >
              <CheckCircle className="w-4 h-4" />
              Confirmar Importação ({preview.length})
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Arena default */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <label className="block text-slate-600 mb-2" style={{ fontSize: "0.875rem" }}>
              Arena inicial da distribuição equilibrada
            </label>
            <div className="relative inline-block">
              <select
                value={arenaDefault}
                onChange={e => setArenaDefault(e.target.value as ArenaId)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white focus:outline-none focus:border-blue-400 cursor-pointer"
                style={{ fontSize: "0.875rem" }}
              >
                {ARENAS.map(a => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`
              border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all
              ${dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"}
            `}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${dragging ? "bg-blue-100" : "bg-slate-100"}`}>
              <Upload className={`w-8 h-8 ${dragging ? "text-blue-500" : "text-slate-400"}`} />
            </div>
            <p className="text-slate-700" style={{ fontSize: "1.125rem" }}>
              {dragging ? "Solte o arquivo aqui" : "Arraste e solte sua planilha"}
            </p>
            <p className="text-slate-400 mt-2" style={{ fontSize: "0.875rem" }}>ou clique para selecionar o arquivo</p>
            <p className="text-slate-300 mt-3" style={{ fontSize: "0.75rem" }}>Formatos: .xlsx · .xls · .csv</p>
          </div>

          {status === "error" && erros.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                {erros.map((e, i) => (
                  <p key={i} className="text-red-700" style={{ fontSize: "0.875rem" }}>{e}</p>
                ))}
              </div>
            </div>
          )}

          {/* Template download hint */}
          <div className="bg-slate-50 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-slate-700" style={{ fontSize: "0.875rem" }}>Modelo de planilha</p>
                <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>Baixe o modelo para garantir compatibilidade</p>
              </div>
            </div>
            <button
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-white transition-all"
              style={{ fontSize: "0.875rem" }}
              onClick={() => {
                const csv = "nome,cpf,email,telefone,arena,cidade,estado,profissao\nJoão Silva,123.456.789-00,joao@email.com,(11)91234-5678,azul,São Paulo,SP,Advogado";
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "modelo_arenados.csv";
                a.click();
              }}
            >
              Baixar Modelo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
