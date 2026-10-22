import React from 'react';
import { ScanRecord } from '../types';
import { X, Calendar, User, MapPin, Trash2, FileSpreadsheet, Printer, PackageCheck } from 'lucide-react';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ScanRecord[];
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onSelectRecord: (record: ScanRecord) => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onDeleteRecord,
  onClearAll,
  onSelectRecord,
}) => {
  if (!isOpen) return null;

  const totalBoxesInBatch = history.reduce((sum, h) => sum + h.analysis.total_visible, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Registro de Auditorías y Lotes</h3>
              <p className="text-xs text-slate-400">
                Historial de conteos de cajas realizados en esta sesión de trabajo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary metric banner */}
        <div className="bg-slate-950/60 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Total de registros: <strong className="text-slate-200">{history.length}</strong>
            </span>
            <span className="text-slate-400">
              Total cajas acumuladas: <strong className="text-amber-400 font-mono text-sm">{totalBoxesInBatch}</strong>
            </span>
          </div>
          {history.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Limpiar historial
            </button>
          )}
        </div>

        {/* Records list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm text-slate-400">No hay auditorías guardadas en esta sesión.</p>
              <p className="text-xs text-slate-500">
                Al escanear un pallet o grupo de cajas, pulsa "Guardar Auditoría" para registrarlo aquí.
              </p>
            </div>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                onClick={() => {
                  onSelectRecord(record);
                  onClose();
                }}
                className="bg-slate-950 border border-slate-800/80 hover:border-amber-500/50 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={record.imageUrl}
                    alt="Miniatura"
                    className="w-16 h-14 rounded-lg object-cover border border-slate-700 bg-slate-900 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                        {record.locationOrBatch || 'Lote Sin Identificar'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {record.analysis.total_visible} cajas
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        {record.operator || 'Operador'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs text-slate-400 group-hover:text-amber-300 font-semibold transition-colors">
                    Ver resultado →
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecord(record.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
