import React, { useState, useRef, useEffect } from 'react';
import { DetectedBox } from '../types';
import { playBoxSelectClick } from '../utils/audio';
import { Check, AlertTriangle, Tag, Trash2, Plus, Eye, EyeOff } from 'lucide-react';

interface BoxOverlayCanvasProps {
  imageSrc: string;
  boxes: DetectedBox[];
  onBoxSelect?: (box: DetectedBox) => void;
  selectedBoxId?: number | null;
  onDeleteBox?: (id: number) => void;
  onAddBox?: (box: DetectedBox) => void;
  showNumbers?: boolean;
  showLabels?: boolean;
  filterType?: string;
}

export const BoxOverlayCanvas: React.FC<BoxOverlayCanvasProps> = ({
  imageSrc,
  boxes,
  onBoxSelect,
  selectedBoxId,
  onDeleteBox,
  onAddBox,
  showNumbers = true,
  showLabels = true,
  filterType = 'all',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [manualAddMode, setManualAddMode] = useState(false);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const filteredBoxes = boxes.filter((b) => {
    if (filterType === 'all') return true;
    if (filterType === 'damaged') return b.condition === 'damaged_crushed';
    if (filterType === 'fragile') return b.condition === 'fragile_marked' || (b.label_or_barcode && b.label_or_barcode.toLowerCase().includes('frágil'));
    return b.type === filterType;
  });

  // Handle manual box drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!manualAddMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentRect({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const curY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const left = Math.min(drawStart.x, curX);
    const top = Math.min(drawStart.y, curY);
    const width = Math.abs(curX - drawStart.x);
    const height = Math.abs(curY - drawStart.y);

    setCurrentRect({ x: left, y: top, w: width, h: height });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect || !containerRef.current) {
      setIsDrawing(false);
      return;
    }

    const { width: contW, height: contH } = containerRef.current.getBoundingClientRect();
    if (currentRect.w > 20 && currentRect.h > 20 && onAddBox) {
      const ymin = Math.round((currentRect.y / contH) * 1000);
      const xmin = Math.round((currentRect.x / contW) * 1000);
      const ymax = Math.round(((currentRect.y + currentRect.h) / contH) * 1000);
      const xmax = Math.round(((currentRect.x + currentRect.w) / contW) * 1000);

      const nextId = boxes.length > 0 ? Math.max(...boxes.map((b) => b.id)) + 1 : 1;
      const newBox: DetectedBox = {
        id: nextId,
        box_2d: [ymin, xmin, ymax, xmax],
        type: 'carton',
        condition: 'intact',
        confidence: 100,
        label_or_barcode: 'Añadida manualmente',
        verified: true,
      };
      onAddBox(newBox);
      playBoxSelectClick();
    }

    setIsDrawing(false);
    setCurrentRect(null);
    setDrawStart(null);
    setManualAddMode(false);
  };

  const getConditionColor = (cond: string, isSelected: boolean) => {
    if (isSelected) return 'border-amber-400 bg-amber-400/20 text-amber-200 ring-2 ring-amber-400';
    switch (cond) {
      case 'damaged_crushed':
        return 'border-rose-500 bg-rose-500/15 text-rose-300 ring-1 ring-rose-500';
      case 'fragile_marked':
        return 'border-purple-400 bg-purple-500/15 text-purple-200';
      case 'open_taped':
        return 'border-yellow-400 bg-yellow-400/15 text-yellow-200';
      default:
        return 'border-emerald-500 bg-emerald-500/10 text-emerald-300';
    }
  };

  const getBadgeBg = (cond: string, isSelected: boolean) => {
    if (isSelected) return 'bg-amber-500 text-slate-950 font-black';
    switch (cond) {
      case 'damaged_crushed':
        return 'bg-rose-600 text-white font-bold';
      case 'fragile_marked':
        return 'bg-purple-600 text-white font-bold';
      default:
        return 'bg-emerald-600 text-white font-bold';
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none">
      {/* Top action toolbar overlay */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs text-slate-200 shadow-lg">
          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {filteredBoxes.length} {filteredBoxes.length === 1 ? 'Caja detectada' : 'Cajas detectadas'}
          </span>
          {boxes.length !== filteredBoxes.length && (
            <span className="text-slate-400">({boxes.length} total)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setManualAddMode(!manualAddMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg backdrop-blur-md ${
              manualAddMode
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                : 'bg-slate-900/90 text-slate-200 border border-slate-700/60 hover:bg-slate-800'
            }`}
            title="Dibuja un recuadro sobre la imagen para añadir una caja que faltó"
          >
            <Plus className="w-3.5 h-3.5" />
            {manualAddMode ? 'Arrastra para dibujar...' : '+ Agregar caja'}
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`relative w-full flex items-center justify-center overflow-hidden min-h-[360px] max-h-[640px] bg-slate-950 ${
          manualAddMode ? 'cursor-crosshair' : 'cursor-default'
        }`}
      >
        <img
          src={imageSrc}
          alt="Cajas inspeccionadas"
          onLoad={onImageLoad}
          className="w-full h-auto max-h-[640px] object-contain block mx-auto pointer-events-none"
        />

        {/* Bounding Boxes Layer */}
        <div className="absolute inset-0 pointer-events-auto">
          {filteredBoxes.map((box) => {
            const [ymin, xmin, ymax, xmax] = box.box_2d;
            const top = `${ymin / 10}%`;
            const left = `${xmin / 10}%`;
            const width = `${(xmax - xmin) / 10}%`;
            const height = `${(ymax - ymin) / 10}%`;
            const isSelected = selectedBoxId === box.id;

            return (
              <div
                key={box.id}
                onClick={(e) => {
                  e.stopPropagation();
                  playBoxSelectClick();
                  if (onBoxSelect) onBoxSelect(box);
                }}
                style={{
                  top,
                  left,
                  width,
                  height,
                }}
                className={`absolute border-2 rounded transition-all duration-150 cursor-pointer group ${getConditionColor(
                  box.condition,
                  isSelected
                )} hover:ring-2 hover:ring-white/80`}
              >
                {/* Number Badge */}
                {showNumbers && (
                  <div
                    className={`absolute -top-3 -left-3 min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center text-[11px] shadow-md transition-transform group-hover:scale-110 ${getBadgeBg(
                      box.condition,
                      isSelected
                    )}`}
                  >
                    #{box.id}
                  </div>
                )}

                {/* Box details tag inside */}
                {showLabels && (
                  <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-slate-950/90 text-white text-[10px] px-1.5 py-0.5 rounded truncate backdrop-blur-sm border border-slate-700/50">
                      {box.label_or_barcode || box.type}
                    </div>
                  </div>
                )}

                {/* Condition Indicator Icon */}
                {box.condition === 'damaged_crushed' && (
                  <div
                    title="Caja dañada o aplastada"
                    className="absolute -top-2.5 -right-2.5 bg-rose-600 text-white p-0.5 rounded-full shadow"
                  >
                    <AlertTriangle className="w-3 h-3" />
                  </div>
                )}

                {/* Delete button in hover/selected */}
                {isSelected && onDeleteBox && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBox(box.id);
                    }}
                    className="absolute -top-3 -right-3 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-lg transition-transform hover:scale-110"
                    title="Eliminar esta caja detectada"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Active drawing rectangle */}
          {isDrawing && currentRect && (
            <div
              style={{
                top: `${currentRect.y}px`,
                left: `${currentRect.x}px`,
                width: `${currentRect.w}px`,
                height: `${currentRect.h}px`,
              }}
              className="absolute border-2 border-dashed border-amber-400 bg-amber-500/20 pointer-events-none rounded"
            >
              <span className="absolute -top-5 left-1 text-[11px] bg-amber-500 text-slate-950 font-bold px-1.5 rounded">
                Nueva caja
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Manual mode helper strip */}
      {manualAddMode && (
        <div className="bg-amber-500/10 border-t border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
          <span>🎯 Haz clic y arrastra sobre la caja en la imagen para marcarla manualmente.</span>
          <button
            onClick={() => setManualAddMode(false)}
            className="text-amber-200 hover:underline font-semibold"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};
