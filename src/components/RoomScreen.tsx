import React, { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { Mic, MicOff, Video as VidIcon, VideoOff, PhoneOff, MonitorUp, Users, Copy, Check, MessageSquare, X, Send, Hand, Smile, Shield, ShieldOff, UserX, FileUp, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RoomScreenProps {
  roomId: string;
  userName?: string;
  onLeave: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

interface ChatMessage {
  id: string;
  sender: string;
  senderName: string;
  message: string;
  timestamp: number;
  isSelf: boolean;
  isFile?: boolean;
  fileData?: {
    id: string;
    name: string;
    progress: number;
    url?: string;
  }
}

interface Reaction {
  id: string;
  userId: string;
  emoji: string;
}

export default function RoomScreen({ roomId, userName = 'Guest', onLeave }: RoomScreenProps) {
  const [peers, setPeers] = useState<{ id: string, stream: MediaStream }[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [id: string]: RTCPeerConnection }>({});
  const streamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const candidateQueue = useRef<{ [id: string]: RTCIceCandidateInit[] }>({});
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [adminId, setAdminId] = useState<string | null>(null);
  const [activeUploads, setActiveUploads] = useState<Record<string, number>>({});
  const filesRef = useRef<Record<string, { name: string, total: number, received: number, chunks: any[], complete: boolean, url?: string }>>({});

  const showChatRef = useRef(showChat);

  useEffect(() => {
    showChatRef.current = showChat;
  }, [showChat]);

  useEffect(() => {
    socketRef.current = io("/", { path: '/socket.io' });

    const initMedia = async () => {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { height: 720, width: 1280 }, audio: true });
      } catch (err) {
        console.warn("Video+Audio failed, trying audio only", err);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          setIsVideoOff(true);
        } catch (err2) {
          console.warn("Audio also failed, starting without media", err2);
          setIsVideoOff(true);
          setIsMuted(true);
        }
      }

      streamRef.current = stream;
      setLocalStream(stream);
      if (stream && userVideo.current) {
        userVideo.current.srcObject = stream;
      }
      
      socketRef.current!.emit("join-room", roomId);

      const setupSocketListeners = () => {
        socketRef.current!.on("banned", () => {
          alert("You have been removed from this meeting.");
          onLeave();
        });

        socketRef.current!.on("admin-status", (id: string) => {
          setAdminId(id);
        });

        socketRef.current!.on("user-connected", async (userId: string) => {
          const peer = createPeerConnection(userId, streamRef.current);
          peersRef.current[userId] = peer;
          
          try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socketRef.current!.emit("offer", { target: userId, sdp: peer.localDescription });
          } catch (e) {
            console.error(e);
          }
        });

        socketRef.current!.on("offer", async (payload: { caller: string, sdp: RTCSessionDescriptionInit }) => {
          let peer = peersRef.current[payload.caller];
          if (!peer) {
            peer = createPeerConnection(payload.caller, streamRef.current);
            peersRef.current[payload.caller] = peer;
          }
          
          await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socketRef.current!.emit("answer", { target: payload.caller, sdp: peer.localDescription });
          
          processQueuedCandidates(payload.caller, peer);
        });

        socketRef.current!.on("answer", async (payload: { caller: string, sdp: RTCSessionDescriptionInit }) => {
          const peer = peersRef.current[payload.caller];
          if (peer) {
            await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            processQueuedCandidates(payload.caller, peer);
          }
        });

        socketRef.current!.on("ice-candidate", async (payload: { caller: string, candidate: RTCIceCandidateInit }) => {
          const peer = peersRef.current[payload.caller];
          if (peer && peer.remoteDescription && peer.remoteDescription.type) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              console.error(e);
            }
          } else {
            if (!candidateQueue.current[payload.caller]) {
              candidateQueue.current[payload.caller] = [];
            }
            candidateQueue.current[payload.caller].push(payload.candidate);
          }
        });

        socketRef.current!.on("user-disconnected", (userId: string) => {
          if (peersRef.current[userId]) {
            peersRef.current[userId].close();
            delete peersRef.current[userId];
          }
          setPeers(prev => prev.filter(p => p.id !== userId));
        });

        socketRef.current!.on("chat-message", (payload: any) => {
          if (payload.id) {
             setMessages(prev => {
                if (prev.find(p => p.id === payload.id)) return prev;
                return [...prev, {
                  id: payload.id,
                  sender: payload.sender,
                  senderName: payload.senderName || 'Guest',
                  message: payload.message,
                  timestamp: payload.timestamp,
                  isSelf: payload.sender === socketRef.current?.id
                }];
             });
          }
          if (!showChatRef.current && payload.sender !== socketRef.current?.id) {
            setUnreadCount(prev => prev + 1);
          }
        });

        socketRef.current!.on("file-start", (payload: any) => {
          filesRef.current[payload.fileId] = {
            name: payload.fileName,
            total: payload.fileSize,
            received: 0,
            chunks: [],
            complete: false
          };
          setMessages(prev => [...prev, {
            id: payload.fileId,
            sender: payload.sender,
            senderName: payload.senderName || 'Guest',
            message: `Sent a file: ${payload.fileName}`,
            timestamp: Date.now(),
            isSelf: payload.sender === socketRef.current?.id,
            isFile: true,
            fileData: { id: payload.fileId, name: payload.fileName, progress: 0 }
          }]);
        });

        socketRef.current!.on("file-chunk", (payload: any) => {
          const file = filesRef.current[payload.fileId];
          if (file && !file.complete) {
            file.chunks.push(payload.data);
            file.received += payload.data.byteLength || payload.data.length;
            const progress = Math.min(100, Math.floor((file.received / file.total) * 100));
            
            setMessages(prev => prev.map(m => {
              if (m.id === payload.fileId && m.fileData) {
                return { ...m, fileData: { ...m.fileData, progress }};
              }
              return m;
            }));

            if (file.received >= file.total) {
              file.complete = true;
              const blob = new Blob(file.chunks);
              const url = URL.createObjectURL(blob);
              file.url = url;
              setMessages(prev => prev.map(m => {
                if (m.id === payload.fileId && m.fileData) {
                  return { ...m, fileData: { ...m.fileData, url, progress: 100 }};
                }
                return m;
              }));
            }
          }
        });

        socketRef.current!.on("raise-hand", (payload: { userId: string, isRaised: boolean }) => {
          setRaisedHands(prev => {
            const newSet = new Set(prev);
            if (payload.isRaised) newSet.add(payload.userId);
            else newSet.delete(payload.userId);
            return newSet;
          });
        });

        socketRef.current!.on("reaction", (payload: { userId: string, emoji: string }) => {
          const reactionId = Math.random().toString();
          setReactions(prev => [...prev, { id: reactionId, userId: payload.userId, emoji: payload.emoji }]);
          setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== reactionId));
          }, 3000);
        });
      };

      setupSocketListeners();
    };

    initMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peersRef.current).forEach(peer => peer.close());
      socketRef.current?.disconnect();
    };
  }, [roomId, onLeave]);

  useEffect(() => {
    if (showChat) {
      setUnreadCount(0);
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }
  }, [messages, showChat]);

  const processQueuedCandidates = async (caller: string, peer: RTCPeerConnection) => {
    if (candidateQueue.current[caller]) {
      for (const candidate of candidateQueue.current[caller]) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error(e);
        }
      }
      delete candidateQueue.current[caller];
    }
  };

  const handleNegotiationNeededEvent = async (peer: RTCPeerConnection, userId: string) => {
    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketRef.current!.emit("offer", { target: userId, sdp: peer.localDescription });
    } catch (e) {
      console.error(e);
    }
  };

  function createPeerConnection(userId: string, stream: MediaStream | null) {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    
    if (stream) {
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
      });
    }

    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer, userId);

    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          target: userId,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      setPeers(prev => {
        const existing = prev.find(p => p.id === userId);
        if (existing) {
          return prev.map(p => p.id === userId ? { ...p, stream: event.streams[0] } : p);
        }
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
        
        Object.keys(peersRef.current).forEach(userId => {
          const peer = peersRef.current[userId];
          const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          } else {
            peer.addTrack(screenTrack, streamRef.current || new MediaStream());
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
        alert("Could not share screen. Please ensure permissions are granted and try opening the app in a new tab if you are using an iframe.");
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      Object.keys(peersRef.current).forEach(userId => {
        const peer = peersRef.current[userId];
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack).catch(console.error);
        }
      });
      if (userVideo.current) {
        userVideo.current.srcObject = streamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  const toggleHandRaise = () => {
    if (!socketRef.current) return;
    const newRaised = !handRaised;
    setHandRaised(newRaised);
    socketRef.current.emit('raise-hand', { room: roomId, isRaised: newRaised });
  };

  const sendReaction = (emoji: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('reaction', { room: roomId, emoji });
    setShowEmojiPicker(false);
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    
    socketRef.current.emit('chat-message', {
      room: roomId,
      message: chatInput.trim(),
      senderName: userName
    });
    setChatInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socketRef.current) return;

    const fileId = Math.random().toString(36);
    const chunkSize = 1000 * 1024; // 1MB chunks
    
    socketRef.current.emit('file-start', {
      room: roomId,
      fileId,
      fileName: file.name,
      fileSize: file.size,
      senderName: userName
    });

    let offset = 0;
    
    const readNextChunk = () => {
      const reader = new FileReader();
      const slice = file.slice(offset, offset + chunkSize);
      
      reader.onload = (e) => {
        if (!e.target?.result || !socketRef.current) return;
        socketRef.current.emit('file-chunk', {
          room: roomId,
          fileId,
          data: e.target.result
        });
        
        offset += chunkSize;
        const progress = Math.min(100, Math.floor((offset / file.size) * 100));
        setActiveUploads(prev => ({ ...prev, [fileId]: progress }));
        
        if (offset < file.size) {
          setTimeout(readNextChunk, 20);
        } else {
           setActiveUploads(prev => {
             const newObj = { ...prev };
             delete newObj[fileId];
             return newObj;
           });
        }
      };
      
      reader.readAsArrayBuffer(slice);
    };

    readNextChunk();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const banUser = (userId: string) => {
    if (window.confirm("Are you sure you want to remove this user?")) {
      socketRef.current?.emit("ban-user", { targetUserId: userId });
    }
  };

  const makeAdmin = (userId: string) => {
    if (window.confirm("Transfer admin rights to this user? You will lose admin privileges.")) {
      socketRef.current?.emit("transfer-admin", { targetUserId: userId });
    }
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

  let formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  const isAdmin = adminId === socketRef.current?.id;
  const squircle = "rounded-[24px]";
  const minorSquircle = "rounded-[20px]";

  return (
    <div className="h-full w-full bg-[#111111] flex flex-col font-sans relative overflow-hidden">
      <header className="h-16 flex items-center justify-between px-6 bg-[#1A1A1A] text-white shrink-0 shadow-sm z-20 sticky top-0 border-b border-black/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${minorSquircle} bg-slate-800 flex items-center justify-center shadow-inner`}>
              <VidIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-[15px] hidden sm:block tracking-wide">Meeting <span className="text-slate-400 font-normal ml-2">{roomId}</span></h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-500/10 text-amber-500 ${minorSquircle} font-medium border border-amber-500/20`}>
              <Shield className="w-3.5 h-3.5" />
              Admin
            </div>
          )}
          <button 
            onClick={copyUrl}
            className={`hidden md:flex items-center gap-2 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 ${minorSquircle} transition-colors text-slate-200`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          <div className={`flex items-center gap-2 text-slate-300 bg-slate-800/80 px-3 py-1.5 ${minorSquircle} text-xs font-medium`}>
            <Users className="w-3.5 h-3.5" />
            <span>{participantCount}</span>
          </div>
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`relative flex items-center gap-2 text-xs px-3 py-1.5 ${minorSquircle} transition-colors ${showChat ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
            {unreadCount > 0 && !showChat && (
              <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center ${minorSquircle} bg-red-500 text-[10px] font-bold text-white`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <main className={`flex-1 p-3 md:p-6 flex items-center justify-center overflow-hidden transition-all duration-300 ${showChat ? 'md:pr-[340px]' : ''}`}>
          <div className={`w-full max-w-[1600px] h-full grid ${gridCols} gap-3 md:gap-4 auto-rows-fr`}>
            <div className={`relative bg-[#1E1E1E] ${squircle} overflow-hidden shadow-sm flex items-center justify-center min-h-[160px] border border-[#2A2A2A] transition-all`}>
              <video 
                ref={userVideo} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''} ${isScreenSharing ? '' : '-scale-x-100'}`} 
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1E1E1E]">
                  <div className={`w-20 h-20 ${squircle} bg-slate-800 flex items-center justify-center shadow-inner`}>
                    <span className="text-2xl text-slate-300 font-medium">You</span>
                  </div>
                </div>
              )}
              <div className={`absolute bottom-4 left-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 ${minorSquircle} text-white text-xs font-medium flex items-center border border-white/10 shadow-lg`}>
                You {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-500 ml-2" /> : <AudioVisualizer stream={localStream} />}
              </div>

              <AnimatePresence>
                {handRaised && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`absolute top-4 right-4 w-9 h-9 bg-emerald-600 ${minorSquircle} flex items-center justify-center text-white shadow-xl border-2 border-[#1E1E1E]`}
                  >
                    <Hand className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <AnimatePresence>
                  {reactions.filter(r => r.userId === socketRef.current?.id).map(r => (
                    <motion.div
                      key={r.id}
                      initial={{ y: 50, opacity: 0, scale: 0.5 }}
                      animate={{ y: -120, opacity: 1, scale: 2.5 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2.5, ease: "easeOut" }}
                      className="absolute bottom-10 left-1/2 -translate-x-1/2 text-4xl drop-shadow-lg"
                    >
                      {r.emoji}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {peers.map((peer) => (
              <PeerVideo 
                key={peer.id} 
                stream={peer.stream} 
                peerID={peer.id} 
                isHandRaised={raisedHands.has(peer.id)}
                peerReactions={reactions.filter(r => r.userId === peer.id)}
                isAdmin={adminId === peer.id}
                iAmAdmin={isAdmin}
                onBan={() => banUser(peer.id)}
                onMakeAdmin={() => makeAdmin(peer.id)}
              />
            ))}
          </div>
        </main>

        <AnimatePresence>
          {showChat && (
             <motion.aside 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute right-0 top-0 bottom-[88px] w-full md:w-[340px] bg-[#171717] border-l border-white/5 flex flex-col z-30 shadow-2xl rounded-tl-[32px]`}
            >
              <div className="h-14 border-b border-white/5 flex items-center justify-between px-5 shrink-0 bg-[#1A1A1A] rounded-tl-[32px]">
                <h3 className="text-white font-medium text-sm flex items-center gap-2 tracking-wide">
                  <MessageSquare className="w-4 h-4 text-emerald-400" /> Room Chat
                </h3>
                <button onClick={() => setShowChat(false)} className={`p-1.5 ${minorSquircle} text-slate-400 hover:bg-slate-800 hover:text-white transition-colors`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 scroll-smooth">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3">
                    <div className={`w-12 h-12 ${minorSquircle} bg-slate-800/50 flex items-center justify-center`}>
                      <MessageSquare className="w-6 h-6 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">No messages yet.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        <span className={`text-[10px] font-semibold ${msg.isSelf ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {msg.isSelf ? 'You' : msg.senderName}
                        </span>
                        <span className="text-[9px] text-slate-600 font-medium">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className={`px-4 py-2.5 ${minorSquircle} text-sm max-w-[85%] shadow-sm ${
                        msg.isSelf 
                          ? 'bg-emerald-600 text-white rounded-tr-sm' 
                          : 'bg-[#222222] text-slate-200 rounded-tl-sm border border-white/5'
                      }`}>
                        {msg.isFile && msg.fileData ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <div className={`flex items-center gap-2 bg-black/20 p-2 ${minorSquircle}`}>
                              <FileUp className={`w-8 h-8 text-white/70 p-1.5 bg-black/20 ${minorSquircle}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{msg.fileData.name}</p>
                                <p className="text-[10px] opacity-70">
                                  {msg.fileData.progress === 100 ? 'Complete' : `${msg.fileData.progress}%`}
                                </p>
                              </div>
                            </div>
                            {msg.fileData.progress < 100 ? (
                              <div className={`w-full bg-black/30 ${minorSquircle} h-1.5 overflow-hidden`}>
                                <div className="bg-white h-full transition-all duration-300" style={{ width: `${msg.fileData.progress}%` }}></div>
                              </div>
                            ) : msg.fileData.url ? (
                              <a 
                                href={msg.fileData.url} 
                                download={msg.fileData.name}
                                className={`flex items-center justify-center gap-2 w-full py-1.5 ${minorSquircle} text-xs font-medium transition-colors ${msg.isSelf ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                              >
                                <Download className="w-3.5 h-3.5" /> Download
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          msg.message
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 bg-[#1A1A1A] border-t border-white/5">
                <form onSubmit={sendChatMessage} className="flex items-center gap-2 relative">
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 ${minorSquircle} transition-colors`}
                  >
                    <FileUp className="w-5 h-5" />
                  </button>
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Message everyone..." 
                    className={`flex-1 bg-[#222222] border border-white/10 ${minorSquircle} px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-[#2A2A2A] transition-all`}
                  />
                  <button 
                    type="submit" 
                    disabled={!chatInput.trim()}
                    className={`p-2.5 bg-emerald-600 text-white hover:bg-emerald-500 ${minorSquircle} disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors`}
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
                {Object.keys(activeUploads).length > 0 && (
                   <div className="mt-2 text-[10px] text-slate-400 font-medium">
                     Uploading {Object.keys(activeUploads).length} file(s)...
                   </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <footer className="h-[88px] flex items-center justify-center px-6 shrink-0 w-full bg-gradient-to-t from-[#111111] to-transparent absolute bottom-0 z-20 pb-4 pointer-events-none">
        <div className={`flex items-center gap-2 sm:gap-3 bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/10 p-2 sm:p-2.5 ${squircle} shadow-2xl pointer-events-auto`}>
          <button 
            onClick={toggleMute}
            className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center ${minorSquircle} transition-all ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="Toggle Microphone"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center ${minorSquircle} transition-all ${isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="Toggle Camera"
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VidIcon className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={toggleScreenShare}
            className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center ${minorSquircle} transition-all ${isScreenSharing ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="Share Screen"
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center ${minorSquircle} transition-all ${showEmojiPicker ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
              title="React"
            >
              <Smile className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className={`absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#222222] border border-white/10 ${squircle} p-2 flex gap-1.5 shadow-2xl`}
                >
                  {['👍', '❤️', '😂', '🎉', '👋', '👀'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl hover:bg-slate-700 ${minorSquircle} transition-all hover:scale-110 active:scale-95`}
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={toggleHandRaise}
            className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center ${minorSquircle} transition-all ${handRaised ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
            title={handRaised ? "Lower Hand" : "Raise Hand"}
          >
            <Hand className="w-5 h-5" />
          </button>

          <div className="w-[1px] h-8 bg-slate-700/50 mx-1 hidden sm:block"></div>

          <button 
            onClick={onLeave}
            className={`w-14 sm:w-16 h-11 sm:h-12 flex items-center justify-center ${minorSquircle} bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/20`}
            title="Leave Meeting"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}

const PeerVideo = ({ 
  stream, 
  peerID, 
  isHandRaised, 
  peerReactions,
  isAdmin,
  iAmAdmin,
  onBan,
  onMakeAdmin
}: { 
  stream: MediaStream, 
  peerID: string, 
  isHandRaised: boolean, 
  peerReactions: Reaction[],
  isAdmin: boolean,
  iAmAdmin: boolean,
  onBan: () => void,
  onMakeAdmin: () => void
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const squircle = "rounded-[24px]";
  const minorSquircle = "rounded-[20px]";

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative bg-[#1E1E1E] ${squircle} overflow-hidden shadow-sm flex items-center justify-center min-h-[160px] border border-[#2A2A2A] group`}
    >
      <video 
        ref={ref} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover" 
      />
      
      <div className="absolute top-4 left-4 flex gap-2">
        {isAdmin && (
           <div className={`bg-amber-500/80 backdrop-blur px-2 py-1 ${minorSquircle} text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-lg border border-amber-400/50`}>
             <Shield className="w-3 h-3" /> Admin
           </div>
        )}
      </div>

      <div className={`absolute bottom-4 left-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 flex items-center ${minorSquircle} text-white text-xs font-medium border border-white/10 shadow-lg`}>
        Participant {peerID.substring(0, 4)}
        <AudioVisualizer stream={stream} />
      </div>
      
      {iAmAdmin && !isAdmin && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className={`w-8 h-8 ${minorSquircle} bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-slate-800 transition-colors`}
          >
            <ShieldOff className="w-4 h-4" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`absolute top-10 right-0 w-36 bg-[#222222] border border-white/10 ${minorSquircle} shadow-2xl overflow-hidden py-1 z-10`}
              >
                <button onClick={() => { onMakeAdmin(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs text-white hover:bg-slate-700 transition-colors flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Make Admin
                </button>
                <button onClick={() => { onBan(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 border-t border-white/5">
                  <UserX className="w-3.5 h-3.5" /> Remove
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {isHandRaised && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`absolute ${iAmAdmin && !isAdmin ? 'top-14' : 'top-4'} right-4 w-9 h-9 bg-amber-500 ${minorSquircle} flex items-center justify-center text-white shadow-xl border-2 border-[#1E1E1E]`}
          >
            <Hand className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {peerReactions.map(r => (
            <motion.div
              key={r.id}
              initial={{ y: 50, opacity: 0, scale: 0.5 }}
              animate={{ y: -120, opacity: 1, scale: 2.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 text-4xl drop-shadow-lg"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const AudioVisualizer = ({ stream }: { stream: MediaStream | null }) => {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setVolume(0);
      return;
    }
    
    let audioContext: AudioContext;
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch(e) {
      return;
    }
    
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    
    let source;
    try {
      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch (e) {
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationId: number;

    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      const maxBins = Math.floor(dataArray.length / 3); 
      for (let i = 0; i < maxBins; i++) {
        sum += dataArray[i];
      }
      setVolume(sum / maxBins);
      animationId = requestAnimationFrame(checkVolume);
    };

    checkVolume();

    return () => {
      cancelAnimationFrame(animationId);
      source?.disconnect();
      if (audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
    };
  }, [stream]);

  if (!stream) return null;

  return (
    <div className="flex items-center justify-center gap-[2.5px] h-3.5 ml-2.5 w-6">
      {[...Array(4)].map((_, i) => {
        const height = Math.max(3, (volume / 255) * 16 * 1.8 * (Math.random() * 0.4 + 0.6));
        return (
          <motion.div
            key={i}
            className="w-[3.5px] rounded-full bg-emerald-400"
            animate={{ height: Math.min(height, 14) }}
            transition={{ type: 'spring', bounce: 0.6, duration: 0.15 }}
          />
        );
      })}
    </div>
  );
};
