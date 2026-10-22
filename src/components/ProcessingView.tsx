import React, { useState, useEffect } from 'react';
import { Package, Sparkles } from 'lucide-react';

interface ProcessingViewProps {
  imageSrc: string;
}

const STEPS = [
  { label: 'Subiendo imagen...', duration: 900 },
  { label: 'Procesando imagen con IA...', duration: 1400 },
  { label: 'Detectando contornos de cajas...', duration: 1600 },
  { label: 'Contando cajas y verificando...', duration: 2000 },
];

export const ProcessingView: React.FC<ProcessingViewProps> = ({ imageSrc }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [fakeCount, setFakeCount] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const nextStep = (index: number) => {
      if (index < STEPS.length - 1) {
        timeoutId = setTimeout(() => {
          setCurrentStepIndex(index + 1);
          nextStep(index + 1);
        }, STEPS[index].duration);
      }
    };

    nextStep(0);
    return () => clearTimeout(timeoutId);
  }, []);

  // Animate fake counter while processing for delightful feedback
  useEffect(() => {
    const interval = setInterval(() => {
      setFakeCount((prev) => (prev < 15 ? prev + 1 : 1));
    }, 280);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl space-y-6">
      {/* Photo with glowing laser scanning line */}
      <div className="relative w-64 h-48 sm:w-72 sm:h-52 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-xl bg-slate-950">
        <img
          src={imageSrc}
          alt="Foto en proceso"
          className="w-full h-full object-cover filter brightness-90"
        />

        {/* Animated laser scanning line */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-[bounce_2s_infinite]"></div>

        {/* Semi-transparent grid overlay */}
        <div className="absolute inset-0 bg-amber-500/10 pointer-events-none backdrop-blur-[1px]"></div>

        {/* Centered counter pill */}
        <div className="absolute bottom-3 inset-x-0 flex justify-center">
          <span className="bg-slate-950/90 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Detectando: ~{fakeCount} cajas...
          </span>
        </div>
      </div>

      {/* Main Status Heading */}
      <div className="space-y-2 max-w-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          Visión por Inteligencia Artificial
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {STEPS[currentStepIndex].label}
        </h3>
        <p className="text-xs text-slate-400">
          Analizando la imagen para identificar y contar cada caja de forma individual...
        </p>
      </div>

      {/* Step Indicators */}
      <div className="w-full max-w-sm space-y-2">
        <div className="grid grid-cols-4 gap-1.5">
          {STEPS.map((step, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx <= currentStepIndex
                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>Paso {currentStepIndex + 1} de 4</span>
          <span className="text-amber-400 font-semibold">Procesando...</span>
        </div>
      </div>
    </div>
  );
};
