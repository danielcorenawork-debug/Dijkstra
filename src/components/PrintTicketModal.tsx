import React from 'react';
import { BoxCountAnalysis } from '../types';
import { Printer, X, CheckCircle, Package } from 'lucide-react';

interface PrintTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: BoxCountAnalysis;
  batchName: string;
  operatorName: string;
  imageUrl?: string;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  isOpen,
  onClose,
  analysis,
  batchName,
  operatorName,
  imageUrl,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header toolbar (screen only) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Comprobante de Conteo de Cajas</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Vale / Guardar PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Content Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-white text-slate-900 font-mono text-xs print:p-0 print:m-0">
          <div className="max-w-md mx-auto border-2 border-dashed border-slate-300 p-6 rounded-lg print:border-none print:p-0">
            {/* Ticket Header */}
            <div className="text-center pb-4 border-b-2 border-slate-900">
              <div className="text-xl font-black uppercase tracking-wider font-sans">
                BOXCOUNTER AI
              </div>
              <div className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">
                Certificado de Auditoría y Recepción
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{currentDate}</div>
            </div>

            {/* Batch Info */}
            <div className="py-3 border-b border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Lote / Ubicación:</span>
                <span className="font-bold text-slate-900">{batchName || 'General Muelle A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operador:</span>
                <span className="font-bold text-slate-900">{operatorName || 'Auditor'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado de Estiba:</span>
                <span className="font-bold uppercase text-slate-900">{analysis.stack_integrity}</span>
              </div>
            </div>

            {/* Prominent Count Total */}
            <div className="my-4 p-4 bg-slate-100 rounded border border-slate-300 text-center">
              <span className="text-[10px] uppercase text-slate-600 block">TOTAL CAJAS VERIFICADAS</span>
              <div className="text-4xl font-extrabold text-slate-950 my-1 font-mono">
                {analysis.total_visible}
              </div>
              {analysis.estimated_total_stack && analysis.estimated_total_stack > analysis.total_visible && (
                <div className="text-[10px] text-slate-600">
                  Estimación total pallet: ~{analysis.estimated_total_stack} unidades
                </div>
              )}
            </div>

            {/* Boxes Breakdown Table */}
            <div className="mb-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1 border-b border-slate-300 pb-1">
                Detalle de Cajas Detectadas:
              </div>
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-1">#ID</th>
                    <th className="py-1">Tipo</th>
                    <th className="py-1">Condición</th>
                    <th className="py-1 text-right">Etiqueta/Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysis.boxes.map((b) => (
                    <tr key={b.id}>
                      <td className="py-1 font-bold">#{b.id}</td>
                      <td className="py-1 capitalize">{b.type}</td>
                      <td className="py-1">
                        {b.condition === 'damaged_crushed'
                          ? 'Dañada'
                          : b.condition === 'fragile_marked'
                          ? 'Frágil'
                          : 'Intacta'}
                      </td>
                      <td className="py-1 text-right truncate max-w-[100px] text-slate-600">
                        {b.label_or_barcode || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes & Summary */}
            <div className="pt-2 border-t border-slate-300 text-[10px] text-slate-600 space-y-1">
              <p>
                <strong>Observaciones:</strong> {analysis.summary_es}
              </p>
            </div>

            {/* Signature Area */}
            <div className="mt-8 pt-6 border-t border-dashed border-slate-400 grid grid-cols-2 gap-4 text-center text-[10px]">
              <div>
                <div className="border-b border-slate-400 pb-6 mb-1"></div>
                <span className="text-slate-600">Firma Operador</span>
              </div>
              <div>
                <div className="border-b border-slate-400 pb-6 mb-1"></div>
                <span className="text-slate-600">Firma Supervisor Logístico</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
