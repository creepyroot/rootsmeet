import React, { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { Mic, MicOff, Video as VidIcon, VideoOff, PhoneOff, MonitorUp, Users, Copy, Check, MessageSquare, X, Send, Hand, Smile, Shield, ShieldOff, UserX, FileUp, Download, MicOff as MicOffAdmin, VideoOff as VideoOffAdmin, Disc2, Subtitles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import InteractivePanel from './InteractivePanel';

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

  const [polls, setPolls] = useState<{ id: string, creatorId: string, question: string, options: { text: string, votes: number, voters: string[] }[] }[]>([]);

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
    } else if (data.type === 'poll_create') {
      setPolls(prev => [...prev, data.payload]);
    } else if (data.type === 'poll_vote') {
      setPolls(prev => prev.map(p => {
        if (p.id !== data.payload.pollId) return p;
        return {
          ...p,
          options: p.options.map((opt, idx) => {
            if (idx !== data.payload.optionIdx) return opt;
            return {
              ...opt,
              votes: opt.votes + 1,
              voters: [...opt.voters, data.payload.voterId]
            };
          })
        };
      }));
    } else if (data.type === 'canvas_draw') {
      window.dispatchEvent(new CustomEvent('peer-draw', { detail: data.payload }));
    } else if (data.type === 'canvas_clear') {
      window.dispatchEvent(new CustomEvent('peer-canvas-clear'));
    } else if (data.type === 'sound_trigger') {
      const { soundType } = data.payload;
      import('../utils/audioSynth').then(({ playSynthSound }) => {
        playSynthSound(soundType);
      });
      // Temporarily display an animated reaction corresponding to the triggered sound!
      const emojis: Record<string, string> = { chime: '🔔', ding: '🛎️', scifi: '⚡', pop: '🧼' };
      const reactionId = Math.random().toString();
      setReactions(prev => [...prev, { id: reactionId, userId: senderId, emoji: emojis[soundType] || '🔊' }]);
      setTimeout(() => setReactions(prev => prev.filter(r => r.id !== reactionId)), 3000);
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
    if (userVideo.current && localStream) {
      userVideo.current.srcObject = localStream;
      userVideo.current.play().catch(err => {
        console.warn("Local video play failed on mount/update:", err);
      });
    }
  }, [localStream, isReady]);

  useEffect(() => {
    let currentPeer: Peer | null = null;
    let cancelled = false;

    const initMediaAndPeer = async () => {
      // Settle hardware/browser resource releases from PreJoinScreen
      await new Promise(resolve => setTimeout(resolve, 500));
      if (cancelled) return;

      let stream: MediaStream | null = null;
      
      const getMediaStream = async (): Promise<MediaStream> => {
        const videoConstraint = initialMedia?.video !== false ? { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: 'user' 
        } : false;

        // Try 1: Try both mic and video (with ideal video spec)
        try {
          const s = await navigator.mediaDevices.getUserMedia({
            video: videoConstraint,
            audio: initialMedia?.mic !== false
          });
          if (cancelled) {
            s.getTracks().forEach(t => t.stop());
          }
          return s;
        } catch (e) {
          console.warn("Try 1 failed (both ideal):", e);
        }

        // Try 2: Try both mic and video (standard/simple video spec)
        try {
          const s = await navigator.mediaDevices.getUserMedia({
            video: initialMedia?.video !== false,
            audio: initialMedia?.mic !== false
          });
          if (cancelled) {
            s.getTracks().forEach(t => t.stop());
          }
          return s;
        } catch (e) {
          console.warn("Try 2 failed (both simple):", e);
        }

        // Try 3: Try video only (ideal spec)
        if (initialMedia?.video !== false) {
          try {
            const vs = await navigator.mediaDevices.getUserMedia({
              video: videoConstraint,
              audio: false
            });
            if (cancelled) {
              vs.getTracks().forEach(t => t.stop());
            }
            setIsMuted(true); // Since mic failed or is disabled
            return vs;
          } catch (e) {
            console.warn("Try 3 failed (video ideal only):", e);
          }

          // Try 4: Try video only (simple spec)
          try {
            const vs = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
            if (cancelled) {
              vs.getTracks().forEach(t => t.stop());
            }
            setIsMuted(true);
            return vs;
          } catch (e) {
            console.warn("Try 4 failed (video simple only):", e);
          }
        }

        // Try 5: Try audio only
        if (initialMedia?.mic !== false) {
          try {
            const as = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true
            });
            if (cancelled) {
              as.getTracks().forEach(t => t.stop());
            }
            setIsVideoOff(true);
            return as;
          } catch (e) {
            console.warn("Try 5 failed (audio only):", e);
          }
        }

        // Fallback: Empty stream
        setIsVideoOff(true);
        setIsMuted(true);
        return new MediaStream();
      };

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("navigator.mediaDevices is not available in this context.");
        setIsVideoOff(true);
        setIsMuted(true);
        stream = new MediaStream();
      } else {
        stream = await getMediaStream();
      }

      if (initialMedia?.mic === false && stream) {
        stream.getAudioTracks().forEach(t => t.enabled = false);
      }

      if (cancelled) {
        if (stream) stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      setLocalStream(stream);
      setIsReady(true);
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
          if (!p.destroyed) p.reconnect();
        });

        p.on('error', (err) => {
          console.warn("PeerJS connection warning caught: ", err);
        });
      };

      const peerOptions = {
        debug: 1,
        host: '0.peerjs.com',
        port: 443,
        secure: true,
        config: {
          'iceServers': [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        }
      };

      // Try forming as Host
      const tryHost = new Peer(roomPeerId, peerOptions);
      peerRef.current = tryHost; // Assign immediately to allow instant cleanup!

      tryHost.on('open', (id) => {
        if (cancelled) {
          tryHost.destroy();
          return;
        }
        setIsHost(true);
        setupPeerHandlers(tryHost);
      });

      tryHost.on('error', (err) => {
        if (cancelled) return;
        if (err.type === 'unavailable-id') {
          // Room exists, join as guest
          try { tryHost.destroy(); } catch (e) {}
          const guestPeer = new Peer(peerOptions);
          setIsHost(false);
          peerRef.current = guestPeer; // Update reference for cleanup
          setupPeerHandlers(guestPeer);
        } else {
          console.error("PeerJS Error:", err);
        }
      });

      currentPeer = tryHost;
    };

    initMediaAndPeer();

    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

  const toggleMute = async () => {
    if (streamRef.current) {
      let audioTrack = streamRef.current.getAudioTracks()[0];
      if (!audioTrack) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const newTrack = tempStream.getAudioTracks()[0];
          if (newTrack) {
            streamRef.current.addTrack(newTrack);
            audioTrack = newTrack;
            mediaConnections.current.forEach(call => {
              const pc = call.peerConnection;
              if (pc) {
                const senders = pc.getSenders();
                const sender = senders.find(s => s.track?.kind === 'audio');
                if (sender) {
                  sender.replaceTrack(newTrack);
                } else {
                  pc.addTrack(newTrack, streamRef.current!);
                }
              }
            });
          }
        } catch (e) {
          console.error("Failed to acquire audio track on toggle:", e);
          return;
        }
      }
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = async () => {
    if (streamRef.current) {
      let videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newTrack = tempStream.getVideoTracks()[0];
          if (newTrack) {
            streamRef.current.addTrack(newTrack);
            videoTrack = newTrack;
            if (userVideo.current) {
              userVideo.current.srcObject = streamRef.current;
            }
            mediaConnections.current.forEach(call => {
              const pc = call.peerConnection;
              if (pc) {
                const senders = pc.getSenders();
                const sender = senders.find(s => s.track?.kind === 'video');
                if (sender) {
                  sender.replaceTrack(newTrack);
                } else {
                  pc.addTrack(newTrack, streamRef.current!);
                }
              }
            });
          }
        } catch (e) {
          console.error("Failed to acquire video track on toggle:", e);
          return;
        }
      }
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
      // 1. Set up audio context mixing for ALL participant audio streams
      let audioCtx: AudioContext | null = null;
      let dest: MediaStreamAudioDestinationNode | null = null;
      const AudioCtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      
      if (AudioCtxClass) {
        try {
          audioCtx = new AudioCtxClass();
          dest = audioCtx.createMediaStreamDestination();
          
          let hasAudio = false;
          // Connect local mic
          if (localStream && localStream.getAudioTracks().length > 0) {
            const localSource = audioCtx.createMediaStreamSource(localStream);
            localSource.connect(dest);
            hasAudio = true;
          }
          
          // Connect remote peer streams
          peers.forEach(peer => {
            if (peer.stream && peer.stream.getAudioTracks().length > 0) {
              try {
                const peerSource = audioCtx.createMediaStreamSource(peer.stream);
                peerSource.connect(dest);
                hasAudio = true;
              } catch (e) {
                console.warn("Could not splice remote audio node to recording:", e);
              }
            }
          });
        } catch (audioMixErr) {
          console.warn("WebAudio context mix failed:", audioMixErr);
        }
      }

      // 2. Set up Canvas Compositor to record the active meeting grid layout
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create canvas 2d context for compositor.");

      let compositorActive = true;
      
      const drawCompositorFrame = () => {
        if (!compositorActive) return;
        
        // Dark premium background
        ctx.fillStyle = '#0F0F12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Select all active participant cards (handles offline standbys as well)
        const cards = Array.from(document.querySelectorAll('main [data-participant-card="true"]')) as HTMLDivElement[];
        const count = cards.length;
        
        if (count > 0) {
          let cols = 1;
          let rows = 1;
          
          if (count > 4) {
             cols = 3;
             rows = Math.ceil(count / 3);
          } else if (count > 2) {
             cols = 2;
             rows = 2;
          } else if (count > 1) {
             cols = 2;
             rows = 1;
          }
          
          const cellWidth = canvas.width / cols;
          const cellHeight = canvas.height / rows;
          
          cards.forEach((card, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = col * cellWidth;
            const y = row * cellHeight;
            
            const pName = card.getAttribute('data-name') || `Participant ${index + 1}`;
            const isVideoOffAttr = card.getAttribute('data-video-off') === 'true';
            const video = card.querySelector('video') as HTMLVideoElement | null;
            
            // Draw a subtle quadrant framing
            ctx.strokeStyle = '#1E1E24';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
            
            if (video && !isVideoOffAttr && video.videoWidth > 0) {
              try {
                const vWidth = video.videoWidth;
                const vHeight = video.videoHeight;
                const vRatio = vWidth / vHeight;
                const cellRatio = cellWidth / cellHeight;
                
                let drawW = cellWidth;
                let drawH = cellHeight;
                let drawX = x;
                let drawY = y;
                
                if (cellRatio > vRatio) {
                  drawW = cellHeight * vRatio;
                  drawX = x + (cellWidth - drawW) / 2;
                } else {
                  drawH = cellWidth / vRatio;
                  drawY = y + (cellHeight - drawH) / 2;
                }
                
                ctx.save();
                ctx.beginPath();
                ctx.rect(x + 4, y + 4, cellWidth - 8, cellHeight - 8);
                ctx.clip();
                
                // If it is our local video, mirror it to look natural inside the webm composition
                const isLocal = card.getAttribute('data-peer-id') === 'local';
                if (isLocal && !isScreenSharing) {
                  ctx.translate(drawX + drawW, drawY);
                  ctx.scale(-1, 1);
                  ctx.drawImage(video, 0, 0, drawW, drawH);
                } else {
                  ctx.drawImage(video, drawX, drawY, drawW, drawH);
                }
                ctx.restore();
              } catch (err) {
                console.warn("Local/remote frame compositing failed:", err);
              }
            } else {
              // Standby Avatar representation
              ctx.save();
              ctx.beginPath();
              ctx.rect(x + 4, y + 4, cellWidth - 8, cellHeight - 8);
              ctx.clip();
              
              ctx.fillStyle = '#09090B';
              ctx.fillRect(x + 4, y + 4, cellWidth - 8, cellHeight - 8);
              
              const rGlow = Math.min(cellWidth, cellHeight) * 0.4;
              const grad = ctx.createRadialGradient(x + cellWidth / 2, y + cellHeight / 2, 5, x + cellWidth / 2, y + cellHeight / 2, rGlow);
              grad.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
              grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
              ctx.fillStyle = grad;
              ctx.fillRect(x + 4, y + 4, cellWidth - 8, cellHeight - 8);
              
              const avatarSize = Math.max(30, Math.min(64, Math.min(cellWidth, cellHeight) * 0.25));
              ctx.beginPath();
              ctx.arc(x + cellWidth / 2, y + cellHeight / 2, avatarSize, 0, Math.PI * 2);
              ctx.fillStyle = '#1D1D22';
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
              ctx.lineWidth = 1.5;
              ctx.fill();
              ctx.stroke();
              
              ctx.fillStyle = '#10B981';
              ctx.font = `bold ${Math.max(10, avatarSize * 0.6)}px Inter, system-ui, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              const initials = pName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              ctx.fillText(initials, x + cellWidth / 2, y + cellHeight / 2);
              ctx.restore();
            }
            
            // Draw a pristine name layout card at the bottom left
            ctx.fillStyle = 'rgba(15, 15, 22, 0.85)';
            ctx.beginPath();
            const bx = x + 16;
            const by = y + cellHeight - 42;
            const bw = Math.min(180, cellWidth - 32);
            const bh = 26;
            const br = 6;
            
            if (ctx.roundRect) {
              ctx.roundRect(bx, by, bw, bh, br);
            } else {
              ctx.rect(bx, by, bw, bh);
            }
            ctx.fill();
            
            ctx.fillStyle = '#E4E4E7';
            ctx.font = 'bold 11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            
            let displayName = pName;
            if (displayName.length > 20) {
              displayName = displayName.substring(0, 18) + '...';
            }
            ctx.fillText(displayName, bx + 12, by + 13);
          });
        } else {
          ctx.fillStyle = '#64748B';
          ctx.font = '16px sans-serif';
          ctx.fillText("Active Meeting Stage Empty", canvas.width / 2 - 100, canvas.height / 2);
        }
        
        requestAnimationFrame(drawCompositorFrame);
      };
      
      requestAnimationFrame(drawCompositorFrame);

      // Capture canvas as video track
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream();
      
      // Inject compositor video tracks
      canvasStream.getVideoTracks().forEach(t => combinedStream.addTrack(t));
      
      // Inject mixed audio tracks
      if (dest && dest.stream.getAudioTracks().length > 0) {
        dest.stream.getAudioTracks().forEach(t => combinedStream.addTrack(t));
      } else if (localStream && localStream.getAudioTracks().length > 0) {
        localStream.getAudioTracks().forEach(t => combinedStream.addTrack(t));
      }

      if (combinedStream.getTracks().length === 0) {
        throw new Error("Could not compound any visual tracks to record.");
      }

      // Standard portable mimetype support for WebM video in modern browsers
      let recorderOptions: MediaRecorderOptions = { mimeType: 'video/webm' };
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        recorderOptions = { mimeType: 'video/webm;codecs=vp8,opus' };
      }

      const recorder = new MediaRecorder(combinedStream, recorderOptions);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      
      const currentAudioCtx = audioCtx;
      recorder.onstop = () => {
        compositorActive = false;
        
        // Stop all track nodes of canvas recording stream to free hardware completely
        canvasStream.getTracks().forEach(t => t.stop());
        combinedStream.getTracks().forEach(t => t.stop());
        
        if (currentAudioCtx && currentAudioCtx.state !== 'closed') {
          currentAudioCtx.close().catch(e => console.warn("Error releasing AudioContext sandbox:", e));
        }

        const url = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `Meeting_Recording_${new Date().getTime()}.webm`;
        a.click();
      };
      
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      alert(`Failed to start recording: ${err.message || err}`);
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
    const reactionId = Math.random().toString();
    setReactions(prev => [...prev, { id: reactionId, userId: 'local', emoji }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== reactionId)), 3000);
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
    : { gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' };

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
            <div 
              className="relative min-h-[160px] group transition-all"
              data-participant-card="true"
              data-peer-id="local"
              data-name={userName}
              data-video-off={isVideoOff}
            >
              <div className={`absolute inset-0 bg-[#1E1E1E] ${squircle} overflow-hidden shadow-sm flex items-center justify-center border border-[#2A2A2A]`}>
                <video 
                  ref={userVideo} 
                  autoPlay 
                  muted 
                  playsInline 
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''} ${isScreenSharing ? '' : '-scale-x-100'}`} 
                />
                {isVideoOff && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0C0C0F] overflow-hidden">
                    {/* Cinematic background light */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)] animate-pulse" />
                    
                    {/* Rotating lines and rings */}
                    <div className="absolute w-24 h-24 rounded-full border border-dashed border-emerald-500/10 animate-[spin_25s_linear_infinite]" />
                    <div className="absolute w-20 h-20 rounded-full border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)] animate-[spin_10s_linear_infinite_reverse]" />
                    
                    {/* Center Avatar initials block */}
                    <div className="relative w-16 h-16 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center shadow-xl z-10 select-none">
                      <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-br from-emerald-400 to-teal-200 drop-shadow-sm">
                        {userName ? (userName.substring(0, 2).toUpperCase()) : 'YOU'}
                      </span>
                    </div>
                    
                    <span className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-[#10B981]/80 flex items-center gap-1 z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                      Standby Active
                    </span>
                  </div>
                )}
                <div className={`absolute bottom-4 left-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 ${minorSquircle} text-white text-xs font-medium flex items-center border border-white/10 shadow-lg z-10`}>
                  You {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-500 ml-2" /> : <AudioVisualizer stream={localStream} />}
                </div>
              </div>

              <AnimatePresence>
                {handRaised && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`absolute top-4 right-4 w-9 h-9 bg-emerald-600 ${minorSquircle} flex items-center justify-center text-white shadow-xl border-2 border-[#1E1E1E] z-10`}
                  >
                    <Hand className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute inset-x-0 bottom-10 top-0 pointer-events-none overflow-visible z-20">
                <AnimatePresence>
                  {reactions.filter(r => r.userId === 'local').map(r => (
                    <motion.div
                      key={r.id}
                      initial={{ y: 50, opacity: 0, scale: 0.5 }}
                      animate={{ y: -150, opacity: 1, scale: 2.8 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2.5, ease: "easeOut" }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 text-4xl drop-shadow-xl"
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
          {showChat && peerRef.current && (
            <InteractivePanel
              onClose={() => setShowChat(false)}
              messages={messages as any}
              chatInput={chatInput}
              setChatInput={setChatInput}
              sendChatMessage={sendChatMessage}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              activeUploads={activeUploads}
              polls={polls}
              setPolls={setPolls as any}
              broadcastData={broadcastData}
              userId={peerRef.current.id}
              userName={userName}
            />
          )}
        </AnimatePresence>
      </div>

      <footer className="h-[88px] flex items-center justify-center px-4 shrink-0 w-full bg-gradient-to-t from-[#111111] to-transparent absolute bottom-0 z-20 pb-4 pointer-events-none">
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.9, x: "-50%" }}
              animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
              exit={{ opacity: 0, y: 15, scale: 0.9, x: "-50%" }}
              className={`absolute bottom-[96px] left-1/2 bg-[#1E1E1E]/95 backdrop-blur-3xl border border-white/10 ${squircle} p-2 flex gap-1.5 shadow-2xl z-50 pointer-events-auto`}
            >
              {['👍', '❤️', '😂', '🎉', '👋', '👀'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl hover:bg-slate-800/80 ${minorSquircle} transition-all hover:scale-110 active:scale-95 text-white`}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`flex items-center gap-1.5 sm:gap-3 bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/10 p-1.5 sm:p-2.5 rounded-[24px] shadow-2xl pointer-events-auto max-w-[96vw] overflow-x-auto scrollbar-none`}>
          <button 
            onClick={toggleMute}
            className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center ${minorSquircle} transition-all ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="Toggle Microphone"
          >
            {isMuted ? <MicOff className="w-4.5 h-4.5 sm:w-5 h-5" /> : <Mic className="w-4.5 h-4.5 sm:w-5 h-5" />}
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center ${minorSquircle} transition-all ${isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="Toggle Camera"
          >
            {isVideoOff ? <VideoOff className="w-4.5 h-4.5 sm:w-5 h-5" /> : <VidIcon className="w-4.5 h-4.5 sm:w-5 h-5" />}
          </button>
          
          <button 
            onClick={toggleScreenShare}
            className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center ${minorSquircle} transition-all ${isScreenSharing ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="Share Screen"
          >
            <MonitorUp className="w-4.5 h-4.5 sm:w-5 h-5" />
          </button>

          <button 
            onClick={() => setShowCaptions(!showCaptions)}
            className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center ${minorSquircle} transition-all ${showCaptions ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="Toggle Captions"
          >
            <Subtitles className="w-4.5 h-4.5 sm:w-5 h-5" />
          </button>

          <button 
            onClick={toggleRecording}
            className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center ${minorSquircle} transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="Record Meeting"
          >
            <Disc2 className="w-4.5 h-4.5 sm:w-5 h-5" />
          </button>

          <div className="relative flex-shrink-0">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${minorSquircle} transition-all ${showEmojiPicker ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
              title="React"
            >
              <Smile className="w-4.5 h-4.5 sm:w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={toggleHandRaise}
            className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center ${minorSquircle} transition-all ${handRaised ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
            title={handRaised ? "Lower Hand" : "Raise Hand"}
          >
            <Hand className="w-4.5 h-4.5 sm:w-5 h-5" />
          </button>

          <div className="w-[1px] h-8 bg-slate-700/50 mx-1 flex-shrink-0 hidden sm:block"></div>

          <button 
            onClick={onLeave}
            className={`w-13 xs:w-14 sm:w-16 h-10 sm:h-12 flex-shrink-0 flex items-center justify-center ${minorSquircle} bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/20`}
            title="Leave Meeting"
          >
            <PhoneOff className="w-4.5 h-4.5 sm:w-5 h-5" />
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
  onKick?: () => void,
  key?: any
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const squircle = "rounded-[24px]";
  const minorSquircle = "rounded-[20px]";
  const [hasVideo, setHasVideo] = useState(stream.getVideoTracks().filter(t => t.enabled).length > 0);

  useEffect(() => {
    if (ref.current && hasVideo) {
      ref.current.srcObject = stream;
      ref.current.play().catch(e => console.error("Play error:", e));
    }
  }, [stream, hasVideo]);

  useEffect(() => {
    const handleTrackChange = () => {
      setHasVideo(stream.getVideoTracks().filter(t => t.enabled).length > 0);
    };

    stream.getVideoTracks().forEach(track => {
      track.addEventListener('mute', handleTrackChange);
      track.addEventListener('unmute', handleTrackChange);
    });

    const iv = setInterval(handleTrackChange, 1200);

    return () => {
      clearInterval(iv);
      stream.getVideoTracks().forEach(track => {
        track.removeEventListener('mute', handleTrackChange);
        track.removeEventListener('unmute', handleTrackChange);
      });
    };
  }, [stream]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative min-h-[160px] group transition-all"
      data-participant-card="true"
      data-peer-id={peerID}
      data-name={peerID.includes('pure-meet-room-') ? `Host ${peerID.substring(peerID.length - 5)}` : `Participant ${peerID.substring(peerID.length - 5)}`}
      data-video-off={!hasVideo}
    >
      <div className={`absolute inset-0 bg-[#1E1E1E] ${squircle} overflow-hidden border border-[#2A2A2A] flex items-center justify-center shadow-sm`}>
        {hasVideo ? (
          <video 
            ref={ref} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0C0C0F] overflow-hidden">
            {/* Cinematic background light */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.06)_0%,transparent_70%)] animate-pulse" />
            
            {/* Rotating lines and rings */}
            <div className="absolute w-24 h-24 rounded-full border border-dashed border-teal-500/10 animate-[spin_20s_linear_infinite]" />
            <div className="absolute w-20 h-20 rounded-full border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.1)] animate-[spin_8s_linear_infinite_reverse]" />
            
            {/* Center Avatar initials block */}
            <div className="relative w-16 h-16 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center shadow-xl z-10 select-none">
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-br from-teal-400 to-blue-200 drop-shadow-sm">
                P{peerID.substring(peerID.length - 2).toUpperCase()}
              </span>
            </div>
            
            <span className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-[#10B981]/80 flex items-center gap-1 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
              Feed Standby
            </span>
          </div>
        )}

        <div className={`absolute bottom-4 left-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 flex items-center ${minorSquircle} text-white text-xs font-medium border border-white/10 shadow-lg z-10`}>
          {peerID.includes('pure-meet-room-') ? <Shield className="w-3.5 h-3.5 text-amber-500 mr-1.5" /> : null}
          Participant {peerID.substring(peerID.length - 5)}
        </div>
      </div>

      <AnimatePresence>
        {isHandRaised && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`absolute top-4 right-20 w-9 h-9 bg-emerald-600 ${minorSquircle} flex items-center justify-center text-white shadow-xl border-2 border-[#1E1E1E] z-10`}
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
            className={`absolute top-4 right-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10`}
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

      <div className="absolute inset-x-0 bottom-10 top-0 pointer-events-none overflow-visible z-20">
        <AnimatePresence>
          {peerReactions.map(r => (
            <motion.div
              key={r.id}
              initial={{ y: 50, opacity: 0, scale: 0.5 }}
              animate={{ y: -150, opacity: 1, scale: 2.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-4xl drop-shadow-xl"
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
