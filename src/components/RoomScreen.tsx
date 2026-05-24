import React, { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { Mic, MicOff, Video as VidIcon, VideoOff, PhoneOff, MonitorUp, Users, Copy, Check, MessageSquare, X, Send, Hand, Smile, Shield, ShieldOff, UserX, FileUp, Download, MicOff as MicOffAdmin, VideoOff as VideoOffAdmin, Disc2, Subtitles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RoomScreenProps {
  roomId: string;
  userName?: string;
  onLeave: () => void;
  initialMedia?: { mic: boolean, video: boolean };
}

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

interface Transcription {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export default function RoomScreen({ roomId, userName = 'Guest', onLeave, initialMedia }: RoomScreenProps) {
  const [peers, setPeers] = useState<{ id: string, stream: MediaStream, name?: string }[]>([]);
  const peerRef = useRef<Peer | null>(null);
  const dataConnections = useRef<Map<string, DataConnection>>(new Map());
  const mediaConnections = useRef<Map<string, MediaConnection>>(new Map());
  
  const userVideo = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const [isMuted, setIsMuted] = useState(initialMedia ? !initialMedia.mic : false);
  const [isVideoOff, setIsVideoOff] = useState(initialMedia ? !initialMedia.video : false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const recognitionRef = useRef<any>(null);
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
  
  const [activeUploads, setActiveUploads] = useState<Record<string, number>>({});
  const filesRef = useRef<Record<string, { name: string, total: number, received: number, chunks: any[], complete: boolean, url?: string }>>({});

  const showChatRef = useRef(showChat);

  useEffect(() => {
    showChatRef.current = showChat;
  }, [showChat]);

  // Handle incoming data messages
  const handleDataMessage = useCallback((senderId: string, data: any) => {
    if (data.type === 'peer-list' && isHost === false) {
      // Connect to other peers in the room
      const existingPeers = data.peers as string[];
      existingPeers.forEach(peerId => {
        if (peerId !== peerRef.current?.id && !mediaConnections.current.has(peerId)) {
          connectToPeer(peerId, streamRef.current);
        }
      });
    } else if (data.type === 'chat') {
      setMessages(prev => {
        if (prev.find(p => p.id === data.payload.id)) return prev;
        return [...prev, { ...data.payload, isSelf: false }];
      });
      if (!showChatRef.current) {
        setUnreadCount(prev => prev + 1);
      }
    } else if (data.type === 'file-start') {
      filesRef.current[data.payload.fileId] = {
        name: data.payload.fileName, total: data.payload.fileSize, received: 0, chunks: [], complete: false
      };
      setMessages(prev => [...prev, {
        id: data.payload.fileId, sender: data.payload.sender, senderName: data.payload.senderName,
        message: `Sent a file: ${data.payload.fileName}`, timestamp: Date.now(), isSelf: false, isFile: true,
        fileData: { id: data.payload.fileId, name: data.payload.fileName, progress: 0 }
      }]);
    } else if (data.type === 'file-chunk') {
      const file = filesRef.current[data.payload.fileId];
      if (file && !file.complete) {
        file.chunks.push(data.payload.data);
        file.received += data.payload.data.byteLength || data.payload.data.length;
        const progress = Math.min(100, Math.floor((file.received / file.total) * 100));
        setMessages(prev => prev.map(m => {
          if (m.id === data.payload.fileId && m.fileData) return { ...m, fileData: { ...m.fileData, progress }};
          return m;
        }));
        if (file.received >= file.total) {
          file.complete = true;
          const blob = new Blob(file.chunks);
          const url = URL.createObjectURL(blob);
          file.url = url;
          setMessages(prev => prev.map(m => {
            if (m.id === data.payload.fileId && m.fileData) return { ...m, fileData: { ...m.fileData, url, progress: 100 }};
            return m;
          }));
        }
      }
    } else if (data.type === 'raise-hand') {
      setRaisedHands(prev => {
        const newSet = new Set(prev);
        if (data.payload.isRaised) newSet.add(senderId);
        else newSet.delete(senderId);
        return newSet;
      });
    } else if (data.type === 'reaction') {
      const reactionId = Math.random().toString();
      setReactions(prev => [...prev, { id: reactionId, userId: senderId, emoji: data.payload.emoji }]);
      setTimeout(() => setReactions(prev => prev.filter(r => r.id !== reactionId)), 3000);
    } else if (data.type === 'transcription') {
      setTranscriptions(prev => {
        const next = [...prev, data.payload];
        return next.slice(-Math.max(next.length, 5));
      });
      setTimeout(() => setTranscriptions(prev => prev.filter(t => t.id !== data.payload.id)), 8000);
    } else if (data.type === 'force-mute') {
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(t => t.enabled = false);
        setIsMuted(true);
      }
    } else if (data.type === 'force-video-off') {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(t => t.enabled = false);
        setIsVideoOff(true);
      }
    }
  }, [isHost]);

  const broadcastData = (type: string, payload: any) => {
    const message = { type, payload };
    dataConnections.current.forEach(conn => {
      if (conn.open) conn.send(message);
    });
  };

  const setupDataConnection = useCallback((conn: DataConnection) => {
    conn.on('open', () => {
      if (isHost && peerRef.current) {
        // Send list of all existing peers to new joiner
        const peerList = Array.from(mediaConnections.current.keys()).filter(id => id !== conn.peer);
        conn.send({ type: 'peer-list', peers: peerList });
      }
    });
    conn.on('data', (data: any) => {
      handleDataMessage(conn.peer, data);
    });
    conn.on('close', () => {
      dataConnections.current.delete(conn.peer);
    });
  }, [isHost, handleDataMessage]);

  const connectToPeer = useCallback((peerId: string, stream: MediaStream | null) => {
    if (!peerRef.current) return;
    
    // Connect Data
    if (!dataConnections.current.has(peerId)) {
      const dataConn = peerRef.current.connect(peerId);
      dataConnections.current.set(peerId, dataConn);
      setupDataConnection(dataConn);
    }
    
    // Connect Media
    if (stream && !mediaConnections.current.has(peerId)) {
       const call = peerRef.current.call(peerId, stream);
       mediaConnections.current.set(peerId, call);
       
       call.on('stream', (userVideoStream) => {
         setPeers(prev => {
           if (prev.find(p => p.id === peerId)) return prev;
           return [...prev, { id: peerId, stream: userVideoStream }];
         });
       });
       
       call.on('close', () => {
         mediaConnections.current.delete(peerId);
         setPeers(prev => prev.filter(p => p.id !== peerId));
       });
    }
  }, [setupDataConnection]);

  useEffect(() => {
    let currentPeer: Peer | null = null;
    let cancelled = false;

    const initMediaAndPeer = async () => {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: initialMedia?.video !== false ? { height: 720, width: 1280 } : false, 
          audio: true 
        });
        if (initialMedia?.mic === false) {
          stream.getAudioTracks().forEach(t => t.enabled = false);
        }
      } catch (err) {
        console.warn("Media failed", err);
        stream = new MediaStream(); // Dummy stream if all fails
        setIsVideoOff(true);
        setIsMuted(true);
      }

      if (cancelled) return;

      streamRef.current = stream;
      setLocalStream(stream);
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      const roomPeerId = `pure-meet-room-${roomId}`;
      
      const setupPeerHandlers = (p: Peer) => {
        p.on('open', (id) => {
          setIsReady(true);
          
          if (id !== roomPeerId) {
            // We are guest, connect to host
            connectToPeer(roomPeerId, stream);
          }
        });

        p.on('connection', (conn) => {
          dataConnections.current.set(conn.peer, conn);
          setupDataConnection(conn);
        });

        p.on('call', (call) => {
          mediaConnections.current.set(call.peer, call);
          call.answer(streamRef.current || undefined);
          call.on('stream', (userVideoStream) => {
            setPeers(prev => {
              if (prev.find(peer => peer.id === call.peer)) return prev;
              return [...prev, { id: call.peer, stream: userVideoStream }];
            });
          });
          call.on('close', () => {
             mediaConnections.current.delete(call.peer);
             setPeers(prev => prev.filter(peer => peer.id !== call.peer));
          });
        });
        
        p.on('disconnected', () => {
          if (!p.destroyed) p.reconnect()
        });
      };

      // Try forming as Host
      const tryHost = new Peer(roomPeerId, {
        config: {'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }]}
      });

      tryHost.on('open', (id) => {
        if (cancelled) return;
        setIsHost(true);
        peerRef.current = tryHost;
        setupPeerHandlers(tryHost);
      });

      tryHost.on('error', (err) => {
        if (cancelled) return;
        if (err.type === 'unavailable-id') {
          // Room exists, join as guest
          const guestPeer = new Peer({
            config: {'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }]}
          });
          setIsHost(false);
          peerRef.current = guestPeer;
          setupPeerHandlers(guestPeer);
        } else {
          console.error("PeerJS Error:", err);
        }
      });

      currentPeer = tryHost;
    };

    initMediaAndPeer();

    // Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript;
        if (text.trim() && peerRef.current) {
          const payload = { id: Math.random().toString(36), senderName: userName, text: text.trim(), timestamp: Date.now() };
          broadcastData('transcription', payload);
          setTranscriptions(prev => {
            const next = [...prev, payload];
            return next.slice(-Math.max(next.length, 5));
          });
          setTimeout(() => setTranscriptions(prev => prev.filter(t => t.id !== payload.id)), 8000);
        }
      };
      recognitionRef.current = recognition;
    }

    return () => {
      cancelled = true;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      // close all connections
      mediaConnections.current.forEach(c => c.close());
      dataConnections.current.forEach(c => c.close());
    };
  }, [roomId, userName, connectToPeer, setupDataConnection]);

  useEffect(() => {
    if (recognitionRef.current && isReady) {
      if (!isMuted) {
        try { recognitionRef.current.start(); } catch (e) {}
      } else {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    }
  }, [isMuted, isReady]);

  useEffect(() => {
    if (showChat) {
      setUnreadCount(0);
      if (chatScrollRef.current) {
         requestAnimationFrame(() => {
           if (chatScrollRef.current) {
             chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
           }
         });
      }
    }
  }, [messages, showChat]);

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
        
        mediaConnections.current.forEach(call => {
          const sender = call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => stopScreenShare();
        if (userVideo.current) userVideo.current.srcObject = screenStream;
        setIsScreenSharing(true);
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.message?.includes('current context')) {
          alert('Screen sharing is blocked in this preview window.\n\nPlease open the application in a new tab (using the ↗ icon at the top right) to use Screen Sharing.');
        } else {
          alert(`Failed to start screen sharing: ${err.message}`);
        }
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      mediaConnections.current.forEach(call => {
        const sender = call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack).catch(console.error);
        }
      });
      if (userVideo.current) userVideo.current.srcObject = streamRef.current;
    }
    setIsScreenSharing(false);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      let streamToRecord: MediaStream;
      try {
        streamToRecord = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true } as any);
      } catch (e) {
        streamToRecord = await navigator.mediaDevices.getDisplayMedia({ video: true } as any);
      }
      const recorder = new MediaRecorder(streamToRecord);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const url = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `Meeting_Recording_${new Date().getTime()}.webm`;
        a.click();
        streamToRecord.getTracks().forEach(t => t.stop());
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.message?.includes('current context')) {
        alert('Screen recording is blocked in this preview window.\n\nPlease open the application in a new tab (using the ↗ icon at the top right) to use Screen Recording.');
      } else {
        alert(`Failed to start recording: ${err.message}`);
      }
    }
  };

  const toggleHandRaise = () => {
    const newRaised = !handRaised;
    setHandRaised(newRaised);
    broadcastData('raise-hand', { isRaised: newRaised });
  };

  const sendReaction = (emoji: string) => {
    broadcastData('reaction', { emoji });
    setShowEmojiPicker(false);
    if (peerRef.current) {
        const reactionId = Math.random().toString();
        setReactions(prev => [...prev, { id: reactionId, userId: peerRef.current!.id, emoji }]);
        setTimeout(() => setReactions(prev => prev.filter(r => r.id !== reactionId)), 3000);
    }
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !peerRef.current) return;
    
    const payload = {
      id: Math.random().toString(36),
      sender: peerRef.current.id,
      senderName: userName,
      message: chatInput.trim(),
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, { ...payload, isSelf: true }]);
    broadcastData('chat', payload);
    setChatInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !peerRef.current) return;

    const fileId = Math.random().toString(36);
    const chunkSize = 200 * 1024; // 200KB chunks for DataChannel
    
    const startPayload = { fileId, fileName: file.name, fileSize: file.size, sender: peerRef.current.id, senderName: userName };
    broadcastData('file-start', startPayload);
    
    setMessages(prev => [...prev, {
      id: fileId, sender: peerRef.current.id, senderName: userName,
      message: `Sent a file: ${file.name}`, timestamp: Date.now(), isSelf: true, isFile: true,
      fileData: { id: fileId, name: file.name, progress: 0 }
    }]);

    let offset = 0;
    const readNextChunk = () => {
      const slice = file.slice(offset, offset + chunkSize);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (!ev.target?.result) return;
        broadcastData('file-chunk', { fileId, data: ev.target.result });
        offset += chunkSize;
        const progress = Math.min(100, Math.floor((offset / file.size) * 100));
        setActiveUploads(prev => ({ ...prev, [fileId]: progress }));
        
        setMessages(prev => prev.map(m => {
          if (m.id === fileId && m.fileData) return { ...m, fileData: { ...m.fileData, progress }};
          return m;
        }));
        
        if (offset < file.size) {
          setTimeout(readNextChunk, 20);
        } else {
           setActiveUploads(prev => { const n = {...prev}; delete n[fileId]; return n; });
        }
      };
      reader.readAsArrayBuffer(slice);
    };

    readNextChunk();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const muteAll = () => {
    if (window.confirm("Mute everyone else in the meeting?")) {
      broadcastData('force-mute', {});
    }
  };

  const videoOffAll = () => {
    if (window.confirm("Turn off everyone else's camera?")) {
      broadcastData('force-video-off', {});
    }
  };

  const copyUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  const squircle = "rounded-[24px]";
  const minorSquircle = "rounded-[20px]";

  const participantCount = peers.length + 1;
  const gridTemplate = participantCount === 1 
    ? { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }
    : participantCount === 2
    ? { gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }
    : { gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' };

  if (!isReady) {
    return <div className="h-full w-full bg-[#111111] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
        <p className="font-medium tracking-wide">Connecting to P2P Network...</p>
      </div>
    </div>
  }

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
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 text-xs font-semibold animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-500"></div> Recording
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isHost && (
            <>
              <div className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-500/10 text-amber-500 ${minorSquircle} font-medium border border-amber-500/20 mr-2`}>
                <Shield className="w-3.5 h-3.5" />
                Host
              </div>
              <button onClick={muteAll} className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 ${minorSquircle} text-slate-200`} title="Mute All">
                <MicOffAdmin className="w-3.5 h-3.5 text-amber-400" /> <span className="hidden lg:inline">Mute All</span>
              </button>
              <button onClick={videoOffAll} className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 ${minorSquircle} text-slate-200`} title="Video Off All">
                <VideoOffAdmin className="w-3.5 h-3.5 text-amber-400" /> <span className="hidden lg:inline">Stop Video All</span>
              </button>
            </>
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
        <main className={`flex-1 p-3 md:p-6 flex items-center justify-center overflow-hidden transition-all duration-500 ease-in-out`}>
          <div 
            className={`w-full max-w-[1600px] h-full grid gap-3 md:gap-4 auto-rows-fr transition-all duration-500 relative`}
            style={gridTemplate}
          >
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
                  {reactions.filter(r => r.userId === peerRef.current?.id).map(r => (
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
                isHostPOV={isHost}
                onKick={() => {
                  if (window.confirm("Kick this user from the meeting?")) {
                    // Because we are host, we can close their data and media connections to kick them
                    const dc = dataConnections.current.get(peer.id);
                    const mc = mediaConnections.current.get(peer.id);
                    if (dc) dc.close();
                    if (mc) mc.close();
                    dataConnections.current.delete(peer.id);
                    mediaConnections.current.delete(peer.id);
                    setPeers(prev => prev.filter(p => p.id !== peer.id));
                  }
                }}
              />
            ))}
          </div>
        </main>

        <AnimatePresence>
          {showCaptions && transcriptions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`absolute bottom-24 left-6 right-6 md:left-[10%] md:right-[10%] pointer-events-none z-10 flex flex-col items-center gap-2`}
            >
              {transcriptions.map(t => (
                <div key={t.id} className={`bg-black/70 backdrop-blur-md px-4 py-2 ${minorSquircle} text-white max-w-full text-center shadow-lg border border-white/10`}>
                  <span className="font-semibold text-emerald-400 mr-2 text-xs">{t.senderName}:</span>
                  <span className="text-sm font-medium">{t.text}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showChat && (
             <motion.aside 
              initial={{ y: -100, opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ y: -50, opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl h-[75vh] max-h-[800px] bg-[#0A0A0A]/95 backdrop-blur-3xl border border-white/10 flex flex-col z-[100] shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-[32px] overflow-hidden`}
            >
              <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#141414]/80">
                <h3 className="text-white font-bold text-lg flex items-center gap-3 tracking-tight">
                  <MessageSquare className="w-5 h-5 text-emerald-400" /> Room Chat
                </h3>
                <button onClick={() => setShowChat(false)} className={`p-2 rounded-[16px] text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-95`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scroll-smooth overflow-x-hidden">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
                    <div className={`w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center`}>
                      <MessageSquare className="w-8 h-8 opacity-40 text-emerald-400" />
                    </div>
                    <p className="text-base font-medium">No messages yet.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        <span className={`text-[11px] font-bold tracking-wide uppercase ${msg.isSelf ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {msg.isSelf ? 'You' : msg.senderName || 'Peer'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className={`px-5 py-3 rounded-[24px] text-base max-w-[85%] shadow-md ${
                        msg.isSelf 
                          ? 'bg-emerald-500 text-[#0A0A0A] rounded-tr-sm font-medium' 
                          : 'bg-[#1A1A1A] text-slate-200 rounded-tl-sm border border-white/5'
                      } break-words leading-relaxed`}>
                        {msg.isFile && msg.fileData ? (
                          <div className="flex flex-col gap-3 min-w-[240px]">
                            <div className={`flex items-center gap-3 bg-black/20 p-3 rounded-[16px]`}>
                              <FileUp className={`w-10 h-10 text-white/70 p-2 bg-black/20 rounded-[12px]`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{msg.fileData.name}</p>
                                <p className="text-xs opacity-70 font-medium mt-0.5">
                                  {msg.fileData.progress === 100 ? 'Complete' : `${msg.fileData.progress}%`}
                                </p>
                              </div>
                            </div>
                            {msg.fileData.progress < 100 ? (
                              <div className={`w-full bg-black/30 rounded-full h-2 overflow-hidden`}>
                                <div className="bg-white h-full transition-all duration-300 rounded-full" style={{ width: `${msg.fileData.progress}%` }}></div>
                              </div>
                            ) : msg.fileData.url ? (
                              <a 
                                href={msg.fileData.url} 
                                download={msg.fileData.name}
                                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-[16px] text-sm font-bold transition-all ${msg.isSelf ? 'bg-black/20 hover:bg-black/30 text-[#0A0A0A]' : 'bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0A]'}`}
                              >
                                <Download className="w-4 h-4" /> Download
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          msg.message
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={chatScrollRef} />
              </div>
              
              <div className="p-5 bg-[#141414] border-t border-white/5">
                <form onSubmit={sendChatMessage} className="flex items-center gap-3 relative">
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-3 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-[16px] transition-all active:scale-95`}
                  >
                    <FileUp className="w-6 h-6" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setChatInput(prev => prev + '😀')}
                    className={`p-3 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-[16px] transition-all active:scale-95`}
                  >
                    <Smile className="w-6 h-6" />
                  </button>
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Message everyone..." 
                    className={`flex-1 bg-[#1A1A1A] border border-white/10 rounded-[20px] px-5 py-3.5 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-[#222222] transition-all min-w-0 font-medium`}
                  />
                  <button 
                    type="submit" 
                    disabled={!chatInput.trim()}
                    className={`p-3.5 bg-emerald-500 text-[#0A0A0A] shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] rounded-[20px] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95`}
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </button>
                </form>
                {Object.keys(activeUploads).length > 0 && (
                   <div className="mt-3 text-xs text-emerald-400 font-semibold px-2">
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

          <button 
            onClick={() => setShowCaptions(!showCaptions)}
            className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center ${minorSquircle} transition-all ${showCaptions ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="Toggle Captions"
          >
            <Subtitles className="w-5 h-5" />
          </button>

          <button 
            onClick={toggleRecording}
            className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center ${minorSquircle} transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="Record Meeting"
          >
            <Disc2 className="w-5 h-5" />
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
  isHostPOV,
  onKick
}: { 
  stream: MediaStream, 
  peerID: string, 
  isHandRaised: boolean, 
  peerReactions: Reaction[],
  isHostPOV?: boolean,
  onKick?: () => void
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const squircle = "rounded-[24px]";
  const minorSquircle = "rounded-[20px]";

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
      ref.current.play().catch(e => console.error("Play error:", e));
    }
  }, [stream]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative bg-[#1E1E1E] ${squircle} overflow-hidden shadow-sm flex items-center justify-center min-h-[160px] border border-[#2A2A2A] group transition-all`}
    >
      <video 
        ref={ref} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover" 
      />

      <div className={`absolute bottom-4 left-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 flex items-center ${minorSquircle} text-white text-xs font-medium border border-white/10 shadow-lg`}>
        {peerID.includes('pure-meet-room-') ? <Shield className="w-3.5 h-3.5 text-amber-500 mr-1.5" /> : null}
        Participant {peerID.substring(peerID.length - 5)}
      </div>

      <AnimatePresence>
        {isHandRaised && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`absolute top-4 right-20 w-9 h-9 bg-emerald-600 ${minorSquircle} flex items-center justify-center text-white shadow-xl border-2 border-[#1E1E1E]`}
          >
            <Hand className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHostPOV && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`absolute top-4 right-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <button
              onClick={onKick}
              className={`w-9 h-9 bg-red-600/90 hover:bg-red-600 ${minorSquircle} flex items-center justify-center text-white shadow-xl backdrop-blur-md`}
              title="Kick User"
            >
              <UserX className="w-4 h-4" />
            </button>
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!stream || !canvasRef.current || !window.AudioContext) return;
    
    // Check if there are active audio tracks before trying to visualize
    if (stream.getAudioTracks().length === 0 || !stream.getAudioTracks()[0].enabled) {
      return; 
    }

    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let source: MediaStreamAudioSourceNode;
    let animationFrameId: number;

    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;
    } catch (e) {
      // Stream might have stopped or audio context failed
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      
      try {
        analyser.getByteFrequencyData(dataArray);
      } catch (e) {
        return;
      }

      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = 3;
      const barSpacing = 1;
      const numBars = 4;
      const totalWidth = (barWidth + barSpacing) * numBars - barSpacing;
      
      const startX = (canvas.width - totalWidth) / 2;
      
      for (let i = 0; i < numBars; i++) {
        // Average chunk
        const start = Math.floor(i * (bufferLength / numBars));
        const end = Math.floor((i + 1) * (bufferLength / numBars));
        let sum = 0;
        for (let j = start; j < end; j++) {
          sum += dataArray[j];
        }
        const avg = sum / (end - start);
        
        // Map 0-255 to 2-12px height
        const height = 2 + (avg / 255) * 10;
        
        ctx.fillStyle = '#10B981'; // emerald-500
        const x = startX + i * (barWidth + barSpacing);
        const y = (canvas.height - height) / 2;
        
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 1.5);
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (audioContext && audioContext.state !== 'closed') {
        try { audioContext.close(); } catch(e) {}
      }
    };
  }, [stream]);

  return <canvas ref={canvasRef} width={24} height={16} className="ml-2 block" />;
};
