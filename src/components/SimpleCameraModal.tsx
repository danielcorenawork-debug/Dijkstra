import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Zap, ZapOff, AlertCircle } from 'lucide-react';
import { playScannerSuccessBeep } from '../utils/audio';

interface SimpleCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export const SimpleCameraModal: React.FC<SimpleCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

      const track = newStream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
        setHasTorch(Boolean(capabilities.torch));
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Permiso de cámara no concedido. Habilita los permisos en tu navegador.'
          : 'No se pudo iniciar la cámara en este dispositivo.'
      );
    }
  }, [facingMode]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, facingMode]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

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
        console.warn('Torch error:', e);
      }
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
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

    // Stop camera and send picture
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    onCapture(base64);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="w-full max-w-xl flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Cámara en Vivo
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFacingMode}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Cambiar de cámara"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-xl border transition-all ${
                torchOn
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Linterna"
            >
              {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-all ml-1"
            title="Cerrar cámara"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Viewfinder */}
      <div className="relative w-full max-w-xl aspect-[4/3] rounded-3xl overflow-hidden bg-black border-2 border-slate-800 shadow-2xl flex items-center justify-center my-auto">
        {errorMsg ? (
          <div className="p-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <p className="text-sm text-slate-300">{errorMsg}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold"
            >
              Cerrar y usar otra opción
            </button>
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

            {/* Target Reticle Overlays */}
            <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-2 border-l-2 border-amber-400 rounded-tl-lg"></div>
                <div className="w-8 h-8 border-t-2 border-r-2 border-amber-400 rounded-tr-lg"></div>
              </div>
              <div className="text-center text-[11px] text-amber-300/80 bg-slate-950/60 px-3 py-1 rounded-full mx-auto backdrop-blur-sm">
                Encuadra las cajas dentro de la pantalla
              </div>
              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-2 border-l-2 border-amber-400 rounded-bl-lg"></div>
                <div className="w-8 h-8 border-b-2 border-r-2 border-amber-400 rounded-br-lg"></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Shutter Action Bar */}
      <div className="w-full max-w-xl flex items-center justify-center pt-2 pb-2 z-20">
        <button
          onClick={takePhoto}
          disabled={Boolean(errorMsg)}
          className="group relative flex flex-col items-center gap-2 disabled:opacity-50"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] border-4 border-slate-950 ring-4 ring-amber-500/50">
            <Camera className="w-9 h-9 text-slate-950 transition-transform group-hover:scale-110" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">
            Tomar Foto y Contar
          </span>
        </button>
      </div>
    </div>
  );
};
