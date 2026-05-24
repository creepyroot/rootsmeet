import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video as VidIcon, VideoOff, Settings, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface PreJoinScreenProps {
  roomId: string;
  userName: string;
  onJoin: (micEnabled: boolean, videoEnabled: boolean) => void;
  onCancel: () => void;
}

export default function PreJoinScreen({ roomId, userName, onJoin, onCancel }: PreJoinScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [error, setError] = useState('');

  const squircle = "rounded-[24px]";
  const minorSquircle = "rounded-[20px]";

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    
    const initPreview = async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            facingMode: "user"
          }, 
          audio: true 
        });
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        console.warn("Optimal camera constraints failed, trying fallback...", err);
        try {
          // Standard video/audio without resolution constraints
          currentStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          setStream(currentStream);
          if (videoRef.current) {
            videoRef.current.srcObject = currentStream;
          }
        } catch (err2) {
          console.warn("No camera available, falling back to audio only.", err2);
          try {
            currentStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setStream(currentStream);
            setVideoEnabled(false);
          } catch (err3) {
            setError('Could not access microphone or camera. Please check permissions.');
            setMicEnabled(false);
            setVideoEnabled(false);
          }
        }
      }
    };

    initPreview();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(t => t.enabled = !micEnabled);
    }
    setMicEnabled(!micEnabled);
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(t => t.enabled = !videoEnabled);
    }
    setVideoEnabled(!videoEnabled);
  };

  const handleJoin = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    onJoin(micEnabled, videoEnabled);
  };

  return (
    <div className="h-full w-full bg-[#0A0A0A] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[20%] -left-[10%] w-[800px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full mix-blend-screen mix-blend-lighten"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen mix-blend-lighten"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik00MCAwaC0xdjQwaDFWMHptMCA0MEgwdjFoNDBWMHoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIgZmlsbC1ydWxlPSJldmVub2RkIi8+Cjwvc3ZnPg==')] opacity-40"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`w-full max-w-[900px] bg-[#141414]/80 backdrop-blur-3xl ${squircle} shadow-[0_24px_80px_rgba(0,0,0,0.4)] border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center relative z-10`}
      >
        <div className={`relative w-full md:w-3/5 aspect-video bg-[#0A0A0A] ${minorSquircle} overflow-hidden shadow-inner flex items-center justify-center border border-white/5`}>
          {videoEnabled && !error ? (
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover -scale-x-100" 
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <VidIcon className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">{error || "Camera is off"}</p>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-4">
            <button 
              onClick={toggleMic}
              className={`w-14 h-14 flex items-center justify-center ${minorSquircle} transition-all backdrop-blur-md ${!micEnabled ? 'bg-red-500/90 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-black/60 hover:bg-black/80 text-white border border-white/10'}`}
            >
              {!micEnabled ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button 
              onClick={toggleVideo}
              className={`w-14 h-14 flex items-center justify-center ${minorSquircle} transition-all backdrop-blur-md ${!videoEnabled ? 'bg-red-500/90 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-black/60 hover:bg-black/80 text-white border border-white/10'}`}
            >
              {!videoEnabled ? <VideoOff className="w-6 h-6" /> : <VidIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div className="w-full md:w-2/5 flex flex-col gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Ready to join?</h1>
            <p className="text-sm text-slate-400 font-medium">Meeting: <span className="font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md ml-1">{roomId}</span></p>
          </div>

          <div className={`bg-[#1A1A1A] p-5 ${minorSquircle} border border-white/5`}>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Joining as</p>
            <p className="text-xl font-medium text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              {userName}
            </p>
          </div>
          
          <div className="flex items-center gap-3 text-teal-300 text-sm font-medium bg-teal-500/10 p-4 rounded-xl border border-teal-500/20 shadow-inner">
            <Sparkles className="w-5 h-5 text-teal-400 rounded-full bg-teal-500/20 p-1" /> Ultra-Fast P2P Connection
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button 
              onClick={handleJoin}
              className={`w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0A] font-bold text-lg ${minorSquircle} transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] active:scale-[0.98]`}
            >
              Join Room Now
            </button>
            <button 
              onClick={onCancel}
              className={`w-full py-3.5 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white font-medium ${minorSquircle} transition-all border border-transparent hover:border-white/10`}
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
