/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Copy,
  Plus,
  SlidersHorizontal,
  Download,
  Info,
} from 'lucide-react';
import { SimpleCameraModal } from './components/SimpleCameraModal';
import { ProcessingView } from './components/ProcessingView';
import { BoxOverlayCanvas } from './components/BoxOverlayCanvas';
import { getSampleScenes, SampleScene } from './utils/sampleImages';
import { BoxCountAnalysis, DetectedBox } from './types';
import { playScannerSuccessBeep, speakCountSummary } from './utils/audio';

export default function App() {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<BoxCountAnalysis | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState<DetectedBox | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [samples, setSamples] = useState<SampleScene[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  // Simple display toggles
  const [showNumbers, setShowNumbers] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSamples(getSampleScenes());
  }, []);

  // Process image with backend AI
  const processImage = async (base64Data: string) => {
    setActiveImage(base64Data);
    setIsAnalyzing(true);
    setApiError(null);
    setFallbackNotice(null);
    setSelectedBox(null);

    try {
      const res = await fetch('/api/count-boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || `Error del servidor (${res.status})`);
      }

      const result = await res.json();
      if (!result.data) {
        throw new Error('Respuesta inválida del servidor');
      }

      setAnalysis(result.data);
      if (result.isTemporaryFallback) {
        setFallbackNotice(result.warning || 'Pico temporal en Google AI. Conteo de contingencia activo.');
      }
      playScannerSuccessBeep();
    } catch (err: any) {
      console.error('Error counting boxes:', err);
      const is503 =
        err.message &&
        (err.message.includes('503') || err.message.includes('high demand') || err.message.includes('UNAVAILABLE'));
      setApiError(
        is503
          ? 'Los servidores de Google AI están con alta demanda temporal (503). Pulsa "Reintentar" para enviar la imagen nuevamente.'
          : err.message || 'No se pudo completar el análisis de la imagen.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        processImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Reset to initial screen
  const handleReset = () => {
    setActiveImage(null);
    setAnalysis(null);
    setSelectedBox(null);
    setApiError(null);
    setFallbackNotice(null);
  };

  // Speak count summary
  const handleVoiceSpeak = () => {
    if (!analysis) return;
    speakCountSummary(analysis.total_visible, analysis.summary_es);
  };

  // Manual box adjustments
  const handleAddBox = (newBox: DetectedBox) => {
    if (!analysis) return;
    const updated = [...analysis.boxes, newBox];
    setAnalysis({
      ...analysis,
      total_visible: updated.length,
      boxes: updated,
    });
  };

  const handleDeleteBox = (id: number) => {
    if (!analysis) return;
    const updated = analysis.boxes.filter((b) => b.id !== id);
    setAnalysis({
      ...analysis,
      total_visible: updated.length,
      boxes: updated,
    });
    if (selectedBox?.id === id) setSelectedBox(null);
  };

  // Copy result text
  const handleCopy = () => {
    if (!analysis) return;
    const text = `BOXCOUNTER AI: ${analysis.total_visible} cajas detectadas.\n${analysis.summary_es}`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-lg shadow-amber-500/20">
              📦
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                Contador de Cajas
              </h1>
              <p className="text-[11px] text-slate-400">
                Conteo automático por foto con Inteligencia Artificial
              </p>
            </div>
          </div>

          {activeImage && (
            <button
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs flex items-center gap-1.5 transition-all border border-slate-700 shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Contar otra foto
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {/* Hidden input for file upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* ============================================================== */}
        {/* PASO 1: SELECCIONAR FOTO (CÁMARA O SUBIR)                       */}
        {/* ============================================================== */}
        {!activeImage && !isAnalyzing && (
          <div className="w-full max-w-2xl mx-auto space-y-8 py-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                ¿Qué deseas contar hoy?
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Toma una foto con tu cámara o sube una imagen de un pallet, estantería o grupo de cajas.
              </p>
            </div>

            {/* Two Primary Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Take Photo */}
              <button
                onClick={() => setIsCameraOpen(true)}
                className="group relative bg-slate-900 border-2 border-slate-800 hover:border-amber-400 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-200 hover:shadow-2xl hover:shadow-amber-500/10 active:scale-98"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                  Tomar Foto con la Cámara
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Abre la cámara de tu móvil o portátil para apuntar y capturar al instante.
                </p>
                <span className="mt-5 px-4 py-2 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md">
                  <Camera className="w-4 h-4" />
                  Abrir Cámara
                </span>
              </button>

              {/* Option 2: Upload Photo */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group relative bg-slate-900 border-2 border-slate-800 hover:border-amber-400 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-200 hover:shadow-2xl hover:shadow-amber-500/10 active:scale-98"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg">
                  <Upload className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                  Subir una Foto
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Elige una foto guardada en tu galería o arrastra un archivo desde tu equipo.
                </p>
                <span className="mt-5 px-4 py-2 rounded-xl bg-slate-800 group-hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 shadow-md">
                  <Upload className="w-4 h-4" />
                  Seleccionar Archivo
                </span>
              </button>
            </div>

            {/* Quick Demo Samples */}
            <div className="pt-4 border-t border-slate-800/80 text-center space-y-3">
              <span className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                ¿No tienes cajas a mano? Prueba con estas imágenes de ejemplo:
              </span>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {samples.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => processImage(scene.dataUrl)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/50 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>📦</span>
                    <span>{scene.name}</span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">
                      (~{scene.approxCount})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PASO 2: PROCESANDO Y CONTANDO... (ANIMACIÓN CLARA)              */}
        {/* ============================================================== */}
        {activeImage && isAnalyzing && (
          <div className="py-8">
            <ProcessingView imageSrc={activeImage} />
          </div>
        )}

        {/* ============================================================== */}
        {/* PASO 3: RESULTADO FINALIZADO                                    */}
        {/* ============================================================== */}
        {activeImage && !isAnalyzing && analysis && (
          <div className="w-full space-y-6 py-4 animate-in fade-in duration-300">
            {/* Triumphant Final Result Banner */}
            <div className="bg-slate-900 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ CONTEO FINALIZADO
                    </span>
                    <button
                      onClick={handleVoiceSpeak}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      title="Escuchar resultado por voz"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-1 flex items-baseline gap-3 justify-center sm:justify-start">
                    <span className="text-5xl sm:text-6xl font-black font-mono text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                      {analysis.total_visible}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-slate-200">
                      {analysis.total_visible === 1 ? 'Caja Contada' : 'Cajas Contadas'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1 max-w-md">
                    {analysis.summary_es}
                  </p>
                </div>
              </div>

              {/* Big Primary Action: Count Another Photo */}
              <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-500/25 active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  Contar Otra Foto
                </button>

                <button
                  onClick={handleCopy}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copySuccess ? '¡Copiado!' : 'Copiar Resultado'}
                </button>
              </div>
            </div>

            {/* Fallback Notice if active */}
            {fallbackNotice && (
              <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-200 text-xs">
                <span>⚠️ {fallbackNotice}</span>
                <button
                  onClick={() => processImage(activeImage)}
                  className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Reintentar con Google AI
                </button>
              </div>
            )}

            {/* The Image with Counted Boxes Overlay */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <span>📸</span>
                  Foto con recuadros numerados individuales:
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showNumbers}
                    onChange={(e) => setShowNumbers(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Ver números (#1, #2...)</span>
                </label>
              </div>

              <BoxOverlayCanvas
                imageSrc={activeImage}
                boxes={analysis.boxes}
                onBoxSelect={(box) => setSelectedBox(box)}
                selectedBoxId={selectedBox?.id}
                onDeleteBox={handleDeleteBox}
                onAddBox={handleAddBox}
                showNumbers={showNumbers}
                showLabels={true}
                filterType="all"
              />

              <div className="text-center text-[11px] text-slate-400">
                💡 Cada caja visible tiene su número de identificación. Puedes hacer clic en cualquiera o pulsar "+ Agregar caja" si faltó alguna en una sombra.
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ERROR STATE CON BOTÓN REINTENTAR                                */}
        {/* ============================================================== */}
        {apiError && (
          <div className="max-w-xl mx-auto w-full bg-rose-500/10 border-2 border-rose-500/30 rounded-3xl p-6 text-center space-y-4 my-6">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                No se pudo completar el conteo
              </h3>
              <p className="text-xs text-rose-300 max-w-sm mx-auto leading-relaxed">
                {apiError}
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              {activeImage && (
                <button
                  onClick={() => processImage(activeImage)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reintentar ahora
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Simple Camera Modal */}
      <SimpleCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(img) => {
          setIsCameraOpen(false);
          processImage(img);
        }}
      />
    </div>
  );
}
