import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video as VidIcon, VideoOff, Settings } from 'lucide-react';
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
          video: { width: 1280, height: 720 }, 
          audio: true 
        });
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        console.warn("Could not get complete media", err);
        try {
           currentStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
           setStream(currentStream);
           setVideoEnabled(false);
        } catch (err2) {
           setError('Could not access microphone or camera. Please check permissions.');
           setMicEnabled(false);
           setVideoEnabled(false);
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
    <div className="h-full w-full bg-[#111111] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-[800px] bg-[#1A1A1A] ${squircle} shadow-2xl border border-white/10 p-6 flex flex-col md:flex-row gap-8 items-center`}
      >
        <div className={`relative w-full md:w-2/3 aspect-video bg-[#0A0A0A] ${minorSquircle} overflow-hidden shadow-inner flex items-center justify-center border border-white/5`}>
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
              className={`w-12 h-12 flex items-center justify-center ${minorSquircle} transition-all backdrop-blur-md ${!micEnabled ? 'bg-red-500/90 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-black/60 hover:bg-black/80 text-white'}`}
            >
              {!micEnabled ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button 
              onClick={toggleVideo}
              className={`w-12 h-12 flex items-center justify-center ${minorSquircle} transition-all backdrop-blur-md ${!videoEnabled ? 'bg-red-500/90 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-black/60 hover:bg-black/80 text-white'}`}
            >
              {!videoEnabled ? <VideoOff className="w-5 h-5" /> : <VidIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/3 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">Ready to join?</h1>
            <p className="text-sm text-slate-400">Meeting: <span className="font-mono text-slate-300">{roomId}</span></p>
          </div>

          <div className={`bg-[#222222] p-4 ${minorSquircle} border border-white/5`}>
            <p className="text-sm text-slate-400 mb-1">Joining as</p>
            <p className="text-lg font-medium text-white">{userName}</p>
          </div>
          
          <div className="flex items-center gap-2 text-emerald-500/80 text-xs font-medium bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            <Settings className="w-4 h-4" /> E2E Encrypted Meeting
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <button 
              onClick={handleJoin}
              className={`w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium ${minorSquircle} transition-all shadow-lg shadow-emerald-600/20`}
            >
              Join Now
            </button>
            <button 
              onClick={onCancel}
              className={`w-full py-3.5 bg-transparent hover:bg-white/5 text-slate-300 font-medium ${minorSquircle} transition-all`}
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
