import React, { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { Mic, MicOff, Video as VidIcon, VideoOff, PhoneOff, MonitorUp, Users, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface RoomScreenProps {
  roomId: string;
  onLeave: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function RoomScreen({ roomId, onLeave }: RoomScreenProps) {
  const [peers, setPeers] = useState<{ id: string, stream: MediaStream }[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [id: string]: RTCPeerConnection }>({});
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    socketRef.current = io("/", { path: '/socket.io' });

    navigator.mediaDevices.getUserMedia({ video: { height: 720, width: 1280 }, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }

        socketRef.current!.emit("join-room", roomId);

        socketRef.current!.on("user-connected", async (userId: string) => {
          const peer = createPeerConnection(userId, stream);
          peersRef.current[userId] = peer;
          
          try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socketRef.current!.emit("offer", { target: userId, sdp: offer });
          } catch (e) {
            console.error(e);
          }
        });

        socketRef.current!.on("offer", async (payload: { caller: string, sdp: RTCSessionDescriptionInit }) => {
          const peer = createPeerConnection(payload.caller, stream);
          peersRef.current[payload.caller] = peer;
          
          await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socketRef.current!.emit("answer", { target: payload.caller, sdp: answer });
        });

        socketRef.current!.on("answer", async (payload: { caller: string, sdp: RTCSessionDescriptionInit }) => {
          const peer = peersRef.current[payload.caller];
          if (peer) {
            await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          }
        });

        socketRef.current!.on("ice-candidate", async (payload: { caller: string, candidate: RTCIceCandidateInit }) => {
          const peer = peersRef.current[payload.caller];
          if (peer) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              console.error(e);
            }
          }
        });

        socketRef.current!.on("user-disconnected", (userId: string) => {
          if (peersRef.current[userId]) {
            peersRef.current[userId].close();
            delete peersRef.current[userId];
          }
          setPeers(prev => prev.filter(p => p.id !== userId));
        });

      })
      .catch(err => {
        console.error("Failed to get local stream", err);
        socketRef.current!.emit("join-room", roomId);
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peersRef.current).forEach(peer => peer.close());
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  function createPeerConnection(userId: string, stream: MediaStream | null) {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    
    if (stream) {
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
      });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current!.emit("ice-candidate", {
          target: userId,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      setPeers(prev => {
        const existing = prev.find(p => p.id === userId);
        if (existing) return prev;
        return [...prev, { id: userId, stream: event.streams[0] }];
      });
    };

    return peer;
  }

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true } as any);
        const screenTrack = screenStream.getVideoTracks()[0];
        
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          stopScreenShare();
        };

        if (userVideo.current) {
          userVideo.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen sharing failed", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(peer => {
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack).catch(console.error);
        }
      });
      if (userVideo.current) {
        userVideo.current.srcObject = streamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  const copyUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const participantCount = peers.length + 1;
  const gridCols = participantCount === 1 ? 'grid-cols-1' :
                   participantCount === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                   participantCount <= 4 ? 'grid-cols-2' :
                   participantCount <= 6 ? 'grid-cols-2 md:grid-cols-3' :
                   'grid-cols-3 md:grid-cols-4';

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col font-sans">
      <header className="h-16 flex items-center justify-between px-6 bg-[#1A1A1A] text-white shrink-0 shadow-sm z-20 sticky top-0 border-b border-black/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <VidIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-[15px] hidden sm:block">Meeting <span className="text-slate-400 font-normal ml-2">{roomId}</span></h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={copyUrl}
            className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors text-slate-200"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          <div className="flex items-center gap-2 text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-full text-xs font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>{participantCount}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 flex items-center justify-center overflow-hidden relative w-full h-full">
        <div className={`w-full max-w-[1600px] h-full grid ${gridCols} gap-4 auto-rows-fr`}>
          {/* User Video */}
          <div className="relative bg-[#1E1E1E] rounded-2xl overflow-hidden shadow-sm flex items-center justify-center min-h-[200px] border border-[#2A2A2A]">
            <video 
              ref={userVideo} 
              autoPlay 
              muted 
              playsInline 
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''} ${isScreenSharing ? '' : '-scale-x-100'}`} 
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1E1E1E]">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
                  <span className="text-2xl text-slate-300 font-medium">You</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-2 border border-white/5">
              You {isMuted && <MicOff className="w-3.5 h-3.5 text-red-500" />}
            </div>
          </div>

          {/* Peers Videos */}
          {peers.map((peer) => (
            <PeerVideo key={peer.id} stream={peer.stream} peerID={peer.id} />
          ))}
        </div>
      </main>

      <footer className="h-[88px] flex items-center justify-center px-6 shrink-0 z-10 w-full bg-gradient-to-t from-black/80 to-transparent absolute bottom-0">
        <div className="flex items-center gap-3 bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10 p-2 rounded-[20px] shadow-2xl">
          <button 
            onClick={toggleMute}
            className={`w-12 h-12 flex items-center justify-center rounded-[14px] transition-all ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="Toggle Microphone"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`w-12 h-12 flex items-center justify-center rounded-[14px] transition-all ${isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="Toggle Camera"
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VidIcon className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={toggleScreenShare}
            className={`w-12 h-12 flex items-center justify-center rounded-[14px] transition-all ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="Share Screen"
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          <div className="w-[1px] h-8 bg-slate-700/50 mx-1"></div>

          <button 
            onClick={onLeave}
            className="w-16 h-12 flex items-center justify-center rounded-[14px] bg-red-600 hover:bg-red-700 text-white transition-all shadow-md shadow-red-900/20"
            title="Leave Meeting"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}

const PeerVideo = ({ stream, peerID }: { stream: MediaStream, peerID: string }) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-[#1E1E1E] rounded-2xl overflow-hidden shadow-sm flex items-center justify-center min-h-[200px] border border-[#2A2A2A]"
    >
      <video 
        ref={ref} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover" 
      />
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium border border-white/5">
        Participant {peerID.substring(0, 4)}
      </div>
    </motion.div>
  );
};
