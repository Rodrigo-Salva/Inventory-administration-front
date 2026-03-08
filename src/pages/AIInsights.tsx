import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/api/client";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import clsx from "clsx";
import toast from "react-hot-toast";

export default function AIInsights() {
  const [analysis, setAnalysis] = useState<string | null>(null);

  const forecastMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/api/v1/ai/forecast");
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      toast.success("Análisis completado con éxito");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Error al conectar con la IA de Gemini");
    },
  });

  const handleGenerate = () => {
    setAnalysis(null);
    forecastMutation.mutate();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary-600/10 rounded-xl">
              <Sparkles className="h-8 w-8 text-primary-600" />
            </div>
            IA Demand Insights
          </h1>
          <p className="mt-2 text-slate-600 max-w-2xl">
            Análisis predictivo basado en tu historial de ventas de los últimos 60 días. 
            Gemini identifica tendencias, riesgos de quiebre de stock y oportunidades de optimización.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={forecastMutation.isPending}
          className={clsx(
            "group relative px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all disabled:opacity-50 flex items-center gap-3 shadow-sm overflow-hidden",
            forecastMutation.isPending && "cursor-not-allowed"
          )}
        >
          {forecastMutation.isPending ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
          )}
          <span>{forecastMutation.isPending ? "Analizando..." : "Generar Predicciones"}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Quick Stats or placeholders */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Alcance del Análisis
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Periodo</span>
              <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-full">60 Días</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Modelo</span>
              <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">Gemini 1.5 Flash</span>
            </div>
          </div>

          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100/50 space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <AlertTriangle className="h-5 w-5" /> Importante
            </div>
            <p className="text-xs text-amber-800/80 leading-relaxed">
              Las predicciones son sugerencias basadas en datos históricos. No cuentan con factores externos 
              como festivos locales o huelgas a menos que se mencionen en los datos.
            </p>
          </div>

          <div className="p-6 bg-primary-900 text-white rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <Lightbulb className="h-10 w-10 text-primary-400" />
              <h3 className="font-bold text-lg leading-tight">Optimiza tu Flujo de Caja</h3>
              <p className="text-sm text-primary-100/70">
                Usa estas recomendaciones para evitar tener capital inmovilizado en productos de baja rotación.
              </p>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-primary-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          </div>
        </div>

        {/* Right Column: AI Analysis Text */}
        <div className="lg:col-span-8">
          <div className={clsx(
            "min-h-[500px] bg-white rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-500",
            !analysis && "flex flex-col items-center justify-center p-12 text-center"
          )}>
            {!analysis && !forecastMutation.isPending && (
              <div className="space-y-6 max-w-sm">
                <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mx-auto scale-110">
                  <Sparkles className="h-12 w-12 text-slate-300" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">Listo para Analizar</h2>
                  <p className="text-sm text-slate-500">
                    Pulsa el botón superior para que la IA escanee tu historial de ventas y te dé recomendaciones estratégicas.
                  </p>
                </div>
              </div>
            )}

            {forecastMutation.isPending && (
              <div className="space-y-8 p-12 w-full animate-pulse">
                <div className="h-8 bg-white rounded-full w-48"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-white rounded-full w-full"></div>
                  <div className="h-4 bg-white rounded-full w-full"></div>
                  <div className="h-4 bg-white rounded-full w-5/6"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-32 bg-white rounded-3xl"></div>
                  <div className="h-32 bg-white rounded-3xl"></div>
                  <div className="h-32 bg-white rounded-3xl"></div>
                </div>
                <div className="h-4 bg-white rounded-full w-2/3"></div>
              </div>
            )}

            {analysis && (
              <div className="p-8 md:p-12 animate-in slide-in-from-bottom-4 duration-500">
                <div className="prose prose-slate max-w-none 
                  prose-headings:text-slate-900 prose-headings:font-bold prose-headings:tracking-tight
                  prose-p:text-slate-600 prose-p:leading-relaxed
                  prose-strong:text-slate-900 prose-strong:font-bold
                  prose-ul:list-disc prose-ul:marker:text-primary-500
                  prose-li:text-slate-600 prose-li:my-2
                  prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:bg-primary-50/50 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-xl
                ">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
                
                <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Generado el {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="text-primary-600 font-bold text-xs hover:underline"
                  >
                    Exportar Análisis (PDF)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
