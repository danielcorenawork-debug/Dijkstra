import React from 'react';
import { BoxCountAnalysis, DetectedBox } from '../types';
import {
  Package,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  FileSpreadsheet,
  Printer,
  BookmarkPlus,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { speakCountSummary } from '../utils/audio';

interface AuditSummaryCardProps {
  analysis: BoxCountAnalysis;
  onSaveToAudit: () => void;
  onExportCsv: () => void;
  onPrintTicket: () => void;
  selectedBox?: DetectedBox | null;
  onClearSelectedBox?: () => void;
  onUpdateBoxCondition?: (id: number, condition: string) => void;
}

export const AuditSummaryCard: React.FC<AuditSummaryCardProps> = ({
  analysis,
  onSaveToAudit,
  onExportCsv,
  onPrintTicket,
  selectedBox,
  onClearSelectedBox,
  onUpdateBoxCondition,
}) => {
  const { total_visible, estimated_total_stack, stack_integrity, summary_es, boxes, recommendations } =
    analysis;

  // Breakdown statistics
  const typeCounts = boxes.reduce<Record<string, number>>((acc, box) => {
    const t = box.type || 'carton';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const damagedCount = boxes.filter((b) => b.condition === 'damaged_crushed').length;
  const fragileCount = boxes.filter(
    (b) => b.condition === 'fragile_marked' || (b.label_or_barcode && b.label_or_barcode.toLowerCase().includes('frágil'))
  ).length;

  const handleSpeak = () => {
    speakCountSummary(total_visible, summary_es);
  };

  const getIntegrityBadge = () => {
    if (stack_integrity === 'riesgo_inclinada') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          Estiba Inestable / Riesgo
        </span>
      );
    }
    if (stack_integrity === 'moderada') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          <Info className="w-3.5 h-3.5" />
          Estabilidad Moderada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        <ShieldCheck className="w-3.5 h-3.5" />
        Estiba Estable y Alineada
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-xl">
      {/* Top Banner: Big Digital Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 block mb-1">
            Recuento Total Automatizado
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl md:text-5xl font-extrabold text-amber-400 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(251,191,36,0.25)]">
              {total_visible}
            </span>
            <span className="text-lg font-semibold text-slate-300">
              {total_visible === 1 ? 'Caja visible' : 'Cajas visibles'}
            </span>
            <button
              onClick={handleSpeak}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all ml-1"
              title="Escuchar locución del recuento"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-1.5">
          {getIntegrityBadge()}
          {estimated_total_stack && estimated_total_stack > total_visible && (
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Estiba profunda estimada: <strong className="text-slate-200">~{estimated_total_stack} cajas</strong>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Pill Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
          <div className="text-[10px] font-medium text-slate-400 uppercase">Cartón Corrugado</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {typeCounts['carton'] || 0}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
          <div className="text-[10px] font-medium text-slate-400 uppercase">Cestas / Otros</div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-1">
            {(typeCounts['plastic_crate'] || 0) + (typeCounts['wooden_crate'] || 0) + (typeCounts['parcel_small'] || 0)}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
          <div className="text-[10px] font-medium text-slate-400 uppercase">Dañadas / Aplastadas</div>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              damagedCount > 0 ? 'text-rose-400' : 'text-slate-500'
            }`}
          >
            {damagedCount}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
          <div className="text-[10px] font-medium text-slate-400 uppercase">Etiqueta Frágil</div>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              fragileCount > 0 ? 'text-purple-400' : 'text-slate-500'
            }`}
          >
            {fragileCount}
          </div>
        </div>
      </div>

      {/* AI Warehouse Summary & Analysis */}
      <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Package className="w-3.5 h-3.5 text-amber-400" />
          Dictamen de Visión Logística:
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">{summary_es}</p>

        {recommendations && recommendations.length > 0 && (
          <div className="pt-2 border-t border-slate-800/60 space-y-1">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
              Observaciones de Almacén:
            </span>
            <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc marker:text-amber-500">
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Selected Box Inspector Panel (when user taps a box on canvas) */}
      {selectedBox && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                #{selectedBox.id}
              </span>
              <span className="text-xs font-bold text-amber-200">Detalles de la Caja #{selectedBox.id}</span>
            </div>
            {onClearSelectedBox && (
              <button
                onClick={onClearSelectedBox}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cerrar
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Tipo de embalaje:</span>
              <strong className="text-slate-200 capitalize">{selectedBox.type}</strong>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Condición:</span>
              <strong
                className={
                  selectedBox.condition === 'damaged_crushed'
                    ? 'text-rose-400'
                    : selectedBox.condition === 'fragile_marked'
                    ? 'text-purple-400'
                    : 'text-emerald-400'
                }
              >
                {selectedBox.condition === 'damaged_crushed'
                  ? 'Aplastada/Dañada'
                  : selectedBox.condition === 'fragile_marked'
                  ? 'Con Marca Frágil'
                  : 'Intacta'}
              </strong>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-slate-400 text-[10px] block">Etiqueta/Código:</span>
              <span className="text-slate-200 truncate block font-mono text-[11px]">
                {selectedBox.label_or_barcode || 'Sin texto legible'}
              </span>
            </div>
          </div>

          {onUpdateBoxCondition && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400">Marcar como:</span>
              <button
                onClick={() => onUpdateBoxCondition(selectedBox.id, 'intact')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-900/40 text-emerald-300 text-[11px] border border-slate-700"
              >
                Intacta
              </button>
              <button
                onClick={() => onUpdateBoxCondition(selectedBox.id, 'damaged_crushed')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-900/40 text-rose-300 text-[11px] border border-slate-700"
              >
                Dañada
              </button>
              <button
                onClick={() => onUpdateBoxCondition(selectedBox.id, 'fragile_marked')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-purple-900/40 text-purple-300 text-[11px] border border-slate-700"
              >
                Frágil
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons: Save, CSV, Print */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
        <button
          onClick={onSaveToAudit}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <BookmarkPlus className="w-4 h-4" />
          Guardar Auditoría
        </button>

        <button
          onClick={onExportCsv}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          Descargar CSV
        </button>

        <button
          onClick={onPrintTicket}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700"
        >
          <Printer className="w-4 h-4 text-blue-400" />
          Vale de Conteo (Imprimir)
        </button>
      </div>
    </div>
  );
};
