import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Zap, ZapOff, Sparkles, AlertCircle, Play, Square, Upload } from 'lucide-react';
import { playScannerSuccessBeep } from '../utils/audio';

interface CameraFeedProps {
  onCapture: (base64Image: string) => void;
  isAnalyzing: boolean;
  onSelectSamplePreset?: () => void;
  onUploadFileClick?: () => void;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  onCapture,
  isAnalyzing,
  onSelectSamplePreset,
  onUploadFileClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [autoScanActive, setAutoScanActive] = useState(false);
  const [autoScanIntervalSec, setAutoScanIntervalSec] = useState(4);
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera
  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(() => {});
      }

      // Check for torch capability
      const track = newStream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
        setHasTorch(Boolean(capabilities.torch));
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let message = 'No se pudo acceder a la cámara.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Permiso de cámara denegado. Puedes habilitarlo en los permisos del navegador o usar una imagen de prueba / subir archivo.';
      } else if (err.name === 'NotFoundError') {
        message = 'No se detectó ninguna cámara conectada en este dispositivo.';
      }
      setErrorMsg(message);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
      }
    };
  }, [facingMode]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const newTorch = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: newTorch }],
        });
        setTorchOn(newTorch);
      } catch (e) {
        console.warn('Torch constraint error:', e);
      }
    }
  };

  // Flip Front/Back Camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture frame
  const captureFrame = useCallback(() => {
    if (!videoRef.current || isAnalyzing) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.92);
    playScannerSuccessBeep();
    onCapture(base64);
  }, [isAnalyzing, onCapture]);

  // Auto scan interval runner
  useEffect(() => {
    if (autoScanActive) {
      autoScanTimerRef.current = setInterval(() => {
        if (!isAnalyzing) {
          captureFrame();
        }
      }, autoScanIntervalSec * 1000);
    } else {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
    }
    return () => {
      if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
    };
  }, [autoScanActive, autoScanIntervalSec, isAnalyzing, captureFrame]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col items-center">
      {/* Video Viewport */}
      <div className="relative w-full aspect-[4/3] md:aspect-[16/10] bg-slate-950 flex items-center justify-center overflow-hidden">
        {errorMsg ? (
          <div className="p-8 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 mb-1">Cámara no disponible</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{errorMsg}</p>
            </div>
            <div className="pt-2 flex flex-wrap gap-2 justify-center">
              {onSelectSamplePreset && (
                <button
                  onClick={onSelectSamplePreset}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Probar Escenas de Almacén
                </button>
              )}
              {onUploadFileClick && (
                <button
                  onClick={onUploadFileClick}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Subir Foto desde Galería
                </button>
              )}
              <button
                onClick={startCamera}
                className="px-3 py-2 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reintentar
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Industrial Viewfinder Crosshairs and Guides */}
            <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
              {/* Top Viewfinder Markers */}
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 border-t-2 border-l-2 border-amber-400 rounded-tl-lg shadow-sm"></div>
                <div className="bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/60 text-[11px] font-mono text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  VISTA EN DIRECTO
                </div>
                <div className="w-8 h-8 border-t-2 border-r-2 border-amber-400 rounded-tr-lg shadow-sm"></div>
              </div>

              {/* Center Guidance Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-48 h-48 border border-dashed border-slate-300 rounded-xl relative flex items-center justify-center">
                  <div className="w-4 h-0.5 bg-amber-400"></div>
                  <div className="h-4 w-0.5 bg-amber-400 absolute"></div>
                </div>
              </div>

              {/* Bottom Viewfinder Markers */}
              <div className="flex justify-between items-end">
                <div className="w-8 h-8 border-b-2 border-l-2 border-amber-400 rounded-bl-lg shadow-sm"></div>
                <div className="text-[10px] text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded backdrop-blur-sm">
                  Apunta hacia el pallet o estantería
                </div>
                <div className="w-8 h-8 border-b-2 border-r-2 border-amber-400 rounded-br-lg shadow-sm"></div>
              </div>
            </div>

            {/* Camera Utility Controls (Top Right) */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
              <button
                onClick={toggleFacingMode}
                className="w-10 h-10 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-200 flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg"
                title="Cambiar entre cámara trasera y delantera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  className={`w-10 h-10 rounded-xl backdrop-blur-md border flex items-center justify-center transition-all shadow-lg ${
                    torchOn
                      ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300'
                      : 'bg-slate-900/80 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Activar / desactivar linterna / flash"
                >
                  {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}
            </div>
          </>
        )}

        {/* Loading / Analyzing Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-6">
            <div className="relative w-16 h-16 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin"></div>
              <Camera className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Analizando con Visión IA...</h4>
            <p className="text-xs text-slate-400 text-center max-w-xs">
              Detectando recuadros, identificando tipo de material, etiquetas y contando cajas individuales...
            </p>
          </div>
        )}
      </div>

      {/* Camera Action Control Bar */}
      <div className="w-full bg-slate-900/90 border-t border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Continuous Auto-Scan Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoScanActive(!autoScanActive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              autoScanActive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
            title="Escanea y actualiza automáticamente cada intervalo"
          >
            {autoScanActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current text-emerald-400" />
                Auto-Conteo Activo
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-slate-300" />
                Auto-Conteo Continuo
              </>
            )}
          </button>

          {autoScanActive && (
            <select
              value={autoScanIntervalSec}
              onChange={(e) => setAutoScanIntervalSec(Number(e.target.value))}
              className="bg-slate-950 text-slate-300 text-xs px-2 py-1 rounded-lg border border-slate-700"
            >
              <option value={3}>Cada 3s</option>
              <option value={5}>Cada 5s</option>
              <option value={8}>Cada 8s</option>
            </select>
          )}
        </div>

        {/* Central Shutter Capture Button */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={captureFrame}
            disabled={isAnalyzing || Boolean(errorMsg)}
            className="group relative flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-amber-500/30 border-4 border-slate-950 ring-4 ring-amber-500/30">
              <Camera className="w-7 h-7 text-slate-950 transition-transform group-hover:scale-110" />
            </div>
            <span className="sr-only">Capturar y contar cajas</span>
          </button>
        </div>

        {/* Quick alternative button */}
        <div className="flex items-center gap-2">
          {onSelectSamplePreset && (
            <button
              onClick={onSelectSamplePreset}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Escenas Ejemplo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
