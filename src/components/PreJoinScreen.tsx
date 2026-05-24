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
    let cancelled = false;
    let activeStream: MediaStream | null = null;
    
    const initPreview = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("MediaDevices API not available.");
        setError('Secure origin (HTTPS) or supported browser required for media.');
        setMicEnabled(false);
        setVideoEnabled(false);
        setStream(new MediaStream());
        return;
      }

      const getMediaStream = async (): Promise<MediaStream> => {
        const videoConstraint = { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: "user"
        };
        
        // Try 1: Try both mic and video (with ideal video spec)
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: videoConstraint,
            audio: true
          });
        } catch (e) {
          console.warn("Try 1 failed (both ideal):", e);
        }

        // Try 2: Try both mic and video (standard/simple video spec)
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
        } catch (e) {
          console.warn("Try 2 failed (both simple):", e);
        }

        // Try 3: Try video only (ideal spec)
        try {
          const vs = await navigator.mediaDevices.getUserMedia({
            video: videoConstraint,
            audio: false
          });
          setMicEnabled(false);
          return vs;
        } catch (e) {
          console.warn("Try 3 failed (video ideal):", e);
        }

        // Try 4: Try video only (simple spec)
        try {
          const vs = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          setMicEnabled(false);
          return vs;
        } catch (e) {
          console.warn("Try 4 failed (video simple):", e);
        }

        // Try 5: Try audio only
        try {
          const as = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          });
          setVideoEnabled(false);
          return as;
        } catch (e) {
          console.warn("Try 5 failed (audio only):", e);
        }

        // Fallback: Empty stream (all blocked)
        setVideoEnabled(false);
        setMicEnabled(false);
        setError('Standby Mode: Access to mic & camera is blocked or unavailable.');
        return new MediaStream();
      };

      try {
        const currentStream = await getMediaStream();

        if (cancelled) {
          currentStream.getTracks().forEach(t => t.stop());
          return;
        }

        activeStream = currentStream;
        setStream(currentStream);
        
        // Disable any tracks matching starting toggle values
        currentStream.getAudioTracks().forEach(t => t.enabled = micEnabled);
        currentStream.getVideoTracks().forEach(t => t.enabled = videoEnabled);

        if (videoRef.current && currentStream.getVideoTracks().length > 0) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Critical prejoin preview error:", err);
        setError('Could not run preview. Running in standby mode.');
        setMicEnabled(false);
        setVideoEnabled(false);
        setStream(new MediaStream());
      }
    };

    initPreview();

    return () => {
      cancelled = true;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleMic = async () => {
    if (!micEnabled) {
      if (stream) {
        const tracks = stream.getAudioTracks();
        if (tracks.length === 0) {
          try {
            const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const newTrack = tempStream.getAudioTracks()[0];
            if (newTrack) {
              stream.addTrack(newTrack);
              newTrack.enabled = true;
            }
          } catch (e) {
            console.warn("Failed to acquire audio track dynamically:", e);
          }
        } else {
          tracks.forEach(t => t.enabled = true);
        }
      }
      setMicEnabled(true);
    } else {
      if (stream) {
        stream.getAudioTracks().forEach(t => t.enabled = false);
      }
      setMicEnabled(false);
    }
  };

  const toggleVideo = async () => {
    if (!videoEnabled) {
      if (stream) {
        const tracks = stream.getVideoTracks();
        if (tracks.length === 0) {
          try {
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const newTrack = tempStream.getVideoTracks()[0];
            if (newTrack) {
              stream.addTrack(newTrack);
              newTrack.enabled = true;
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
              }
              setError(null);
            }
          } catch (e) {
            console.warn("Failed to acquire camera track dynamically:", e);
          }
        } else {
          tracks.forEach(t => t.enabled = true);
        }
      }
      setVideoEnabled(true);
    } else {
      if (stream) {
        stream.getVideoTracks().forEach(t => t.enabled = false);
      }
      setVideoEnabled(false);
    }
  };

  const handleJoin = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    onJoin(micEnabled, videoEnabled);
  };

  const getInitials = (nameString: string) => {
    const parts = nameString.trim().split(/\s+/);
    if (!parts.length || !parts[0]) return 'M';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
        <div className={`relative w-full md:w-3/5 aspect-video bg-[#0C0C0F] ${minorSquircle} overflow-hidden shadow-inner flex items-center justify-center border border-white/5`}>
          {videoEnabled && !error ? (
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover -scale-x-100" 
            />
          ) : (
            <div className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden">
              {/* Cinematic scanning lines and rotating rings */}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 via-transparent to-transparent z-0 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] z-0 pointer-events-none animate-pulse" />
              
              {/* Outer dashed spinning loop */}
              <div className="absolute w-32 h-32 rounded-full border border-dashed border-emerald-500/10 animate-[spin_30s_linear_infinite]" />
              
              {/* Inner continuous spin ring */}
              <div className="absolute w-28 h-28 rounded-full border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-[spin_12s_linear_infinite]" />
              
              {/* The glowing avatar button container */}
              <div className="relative w-20 h-20 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center shadow-2xl z-10 select-none">
                <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-emerald-400 to-teal-200 drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)] tracking-wide">
                  {getInitials(userName)}
                </span>
                
                {/* Active radar blip */}
                {micEnabled && (
                  <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              
              {/* Sub-label */}
              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#10B981] drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] flex items-center gap-1.5 z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                {error ? "Standby Mode" : "Camera Paused"}
              </p>
              {error && (
                <p className="mt-1 text-[10px] text-slate-500 max-w-[80%] text-center uppercase tracking-widest leading-relaxed z-10 truncate px-2">
                  Mic & video restricted or unavailable
                </p>
              )}
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
