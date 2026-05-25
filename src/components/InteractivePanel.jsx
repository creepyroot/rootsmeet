import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, BarChart3, Music, Edit3, X, FileUp, Send, 
  Smile, Plus, Trash2, User, Download, Volume2, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSynthSound } from '../utils/audioSynth';



export default function InteractivePanel({
  onClose,
  messages,
  chatInput,
  setChatInput,
  sendChatMessage,
  fileInputRef,
  handleFileUpload,
  activeUploads,
  polls,
  setPolls,
  broadcastData,
  userId,
  userName,
}) {
  const [activeTab, setActiveTab] = useState('chat');
  const chatScrollRef = useRef(null);

  // Poll controller states
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Collaborative Drawing pad states
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#10B981'); // default: emerald-500
  const lastPos = useRef({ x: 0, y: 0 });

  const isDrawingRef = useRef(false);
  const drawColorRef = useRef(drawColor);

  useEffect(() => {
    drawColorRef.current = drawColor;
  }, [drawColor]);

  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      requestAnimationFrame(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages, activeTab]);

  // Handle Collaborative canvas operations & Direct touch binders (passive: false)
  useEffect(() => {
    if (activeTab !== 'draw' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // Set internal resolution match bounding size while backing up existing paths
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const currentWidth = canvas.width;
      const currentHeight = canvas.height;
      const targetWidth = Math.floor(rect.width);
      const targetHeight = Math.floor(rect.height);
      
      if (targetWidth === 0 || targetHeight === 0) {
        return; // Wait for active rendering dimensions
      }
      
      if (currentWidth === targetWidth && currentHeight === targetHeight) {
        return; // Avoid unnecessary clears
      }
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = currentWidth;
      tempCanvas.height = currentHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx && currentWidth > 0 && currentHeight > 0) {
        tempCtx.drawImage(canvas, 0, 0);
      }
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        if (currentWidth > 0 && currentHeight > 0) {
          ctx.drawImage(tempCanvas, 0, 0, currentWidth, currentHeight, 0, 0, targetWidth, targetHeight);
        }
      }
    };
    
    resizeCanvas();
    
    // Use ResizeObserver for precise dynamic scaling across tabs, animations, and layouts
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    observer.observe(canvas);

    // Direct DOM event touch handles to override browser-level standard gestures and scrolling (passive: false)
    const handleTouchStart = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      if (!e.touches || e.touches.length === 0) return;
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      const x = rect.width > 0 ? ((clientX - rect.left) / rect.width) * canvas.width : (clientX - rect.left);
      const y = rect.height > 0 ? ((clientY - rect.top) / rect.height) * canvas.height : (clientY - rect.top);
      
      lastPos.current = { x, y };
      isDrawingRef.current = true;
      setIsDrawing(true);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (!isDrawingRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      if (!e.touches || e.touches.length === 0) return;
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      const x = rect.width > 0 ? ((clientX - rect.left) / rect.width) * canvas.width : (clientX - rect.left);
      const y = rect.height > 0 ? ((clientY - rect.top) / rect.height) * canvas.height : (clientY - rect.top);
      
      const currentColor = drawColorRef.current;
      ctx.strokeStyle = currentColor;
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      const width = canvas.width;
      const height = canvas.height;
      
      broadcastData('canvas_draw', {
        x,
        y,
        lastX: lastPos.current.x,
        lastY: lastPos.current.y,
        rx: width > 0 ? x / width : 0,
        ry: height > 0 ? y / height : 0,
        rlastX: width > 0 ? lastPos.current.x / width : 0,
        rlastY: width > 0 ? lastPos.current.y / height : 0,
        color: currentColor
      });
      
      lastPos.current = { x, y };
    };

    const handleTouchEnd = () => {
      isDrawingRef.current = false;
      setIsDrawing(false);
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      observer.disconnect();
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [activeTab]);

  // Mouse standard drawing handlers
  const startDrawing = (e) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = rect.width > 0 ? ((e.clientX - rect.left) / rect.width) * canvas.width : (e.clientX - rect.left);
    const y = rect.height > 0 ? ((e.clientY - rect.top) / rect.height) * canvas.height : (e.clientY - rect.top);
    
    lastPos.current = { x, y };
    isDrawingRef.current = true;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = rect.width > 0 ? ((e.clientX - rect.left) / rect.width) * canvas.width : (e.clientX - rect.left);
    const y = rect.height > 0 ? ((e.clientY - rect.top) / rect.height) * canvas.height : (e.clientY - rect.top);
    
    ctx.strokeStyle = drawColor;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Broadcast draw event to peers with both absolute and normalized coordinates
    broadcastData('canvas_draw', {
      x,
      y,
      lastX: lastPos.current.x,
      lastY: lastPos.current.y,
      rx: width > 0 ? x / width : 0,
      ry: height > 0 ? y / height : 0,
      rlastX: width > 0 ? lastPos.current.x / width : 0,
      rlastY: width > 0 ? lastPos.current.y / height : 0,
      color: drawColor
    });
    
    lastPos.current = { x, y };
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    setIsDrawing(false);
  };

  // Draw other peer's lines onto canvas
  const drawExternalSegment = (data) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Fall back to absolute pixels if multi-size relatives are missing
    const lastX = data.rlastX !== undefined ? data.rlastX * width : data.lastX;
    const lastY = data.rlastY !== undefined ? data.rlastY * height : data.lastY;
    const x = data.rx !== undefined ? data.rx * width : data.x;
    const y = data.ry !== undefined ? data.ry * height : data.y;
    
    ctx.strokeStyle = data.color;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Listen to incoming whiteboard sync events
  useEffect(() => {
    const handleDrawMessage = (e) => {
      if (activeTab === 'draw') {
        drawExternalSegment(e.detail);
      }
    };
    
    window.addEventListener('peer-draw', handleDrawMessage);
    return () => window.removeEventListener('peer-draw', handleDrawMessage);
  }, [activeTab]);

  const clearCanvasLocal = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const triggerClearCanvas = () => {
    clearCanvasLocal();
    broadcastData('canvas_clear', {});
  };

  useEffect(() => {
    const handleClearMessage = () => {
      clearCanvasLocal();
    };
    window.addEventListener('peer-canvas-clear', handleClearMessage);
    return () => window.removeEventListener('peer-canvas-clear', handleClearMessage);
  }, []);

  // Format timestamp helper
  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  };

  // Interactive Poll creators
  const addOptionField = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removeOptionField = (idx) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const createPoll = () => {
    if (!pollQuestion.trim() || pollOptions.some(opt => !opt.trim())) return;
    
    const newPoll = {
      id: Math.random().toString(36).substring(2, 11),
      creatorId: userId,
      question: pollQuestion.trim(),
      options: pollOptions.map(opt => ({ text: opt.trim(), votes: 0, voters: [] }))
    };
    
    setPolls(prev => [...prev, newPoll]);
    broadcastData('poll_create', newPoll);
    
    // Reset parameters
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollCreator(false);
  };

  const votePoll = (pollId, optionIdx) => {
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p;
      
      // Ensure user hasn't already voted in this poll
      const hasVoted = p.options.some(opt => opt.voters.includes(userId));
      if (hasVoted) return p;
      
      const updatedOptions = p.options.map((opt, idx) => {
        if (idx !== optionIdx) return opt;
        return {
          ...opt,
          votes: opt.votes + 1,
          voters: [...opt.voters, userId]
        };
      });
      
      const updatedPoll = { ...p, options: updatedOptions };
      broadcastData('poll_vote', { pollId, voterId: userId, optionIdx });
      return updatedPoll;
    }));
  };

  // Trigger synthesized soundboard effects
  const playSfxLocalAndRemote = (soundType) => {
    playSynthSound(soundType);
    broadcastData('sound_trigger', { soundType, senderName: userName });
  };

  return (
    <motion.aside 
      initial={{ y: -100, opacity: 0, scale: 0.82, filter: "blur(10px)" }}
      animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ y: -50, opacity: 0, scale: 0.85, filter: "blur(10px)" }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`absolute top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-3xl h-[78vh] max-h-[750px] bg-[#0A0A0A]/95 backdrop-blur-3xl border border-white/10 flex flex-col z-[100] shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-[32px] overflow-hidden`}
    >
      {/* Dynamic Tab Bar Header */}
      <div className="border-b border-white/10 flex items-center justify-between px-5 py-3 shrink-0 bg-[#141414]/90">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-[80vw]">
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'text-emerald-400' },
            { id: 'polls', label: 'Polls', icon: BarChart3, color: 'text-sky-400' },
            { id: 'draw', label: 'Sketchpad', icon: Edit3, color: 'text-yellow-400' },
            { id: 'sound', label: 'Soundboard', icon: Music, color: 'text-purple-400' }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-[18px] text-sm font-bold transition-all ${
                  isSelected 
                    ? 'bg-white/10 text-white shadow-inner scale-100' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button 
          onClick={onClose} 
          className={`p-2.5 rounded-[18px] text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-90`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Tab Panels content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Real-time Multi-user Room Chat */}
          {activeTab === 'chat' && (
            <motion.div 
              key="chat-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="absolute inset-0 flex flex-col justify-between"
            >
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4.5 scroll-smooth">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
                    <div className={`w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center`}>
                      <MessageSquare className="w-8 h-8 opacity-45 text-emerald-400" />
                    </div>
                    <p className="text-base font-semibold">Ready to communicate peer-to-peer!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, scale: 0.96, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className={`text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase ${msg.isSelf ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {msg.isSelf ? 'You' : msg.senderName || 'Peer'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className={`px-4.5 py-3 rounded-[24px] text-sm sm:text-base max-w-[85%] shadow-md ${
                        msg.isSelf 
                          ? 'bg-emerald-500 text-[#011401] rounded-tr-sm font-semibold' 
                          : 'bg-[#141414] text-slate-200 rounded-tl-sm border border-white/5'
                      } break-words leading-relaxed`}>
                        {msg.isFile && msg.fileData ? (
                          <div className="flex flex-col gap-3 min-w-[200px]">
                            <div className={`flex items-center gap-3 bg-black/25 p-3 rounded-[16px]`}>
                              <FileUp className={`w-10 h-10 text-white/70 p-2 bg-black/20 rounded-[12px]`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{msg.fileData.name}</p>
                                <p className="text-xs opacity-75 font-medium mt-0.5">
                                  {msg.fileData.progress === 100 ? 'Downloaded' : `${msg.fileData.progress}%`}
                                </p>
                              </div>
                            </div>
                            {msg.fileData.progress < 100 ? (
                              <div className={`w-full bg-black/30 rounded-full h-1.5 overflow-hidden`}>
                                <div className="bg-white h-full transition-all duration-300 rounded-full" style={{ width: `${msg.fileData.progress}%` }}></div>
                              </div>
                            ) : msg.fileData.url ? (
                              <a 
                                href={msg.fileData.url}
                                download={msg.fileData.name}
                                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-[16px] text-sm font-bold transition-all ${msg.isSelf ? 'bg-black/35 hover:bg-black/50 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-black'}`}
                              >
                                <Download className="w-4 h-4" /> Save File
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
              
              {/* Message Composer Footer Input */}
              <div className="p-4.5 bg-[#141414]/90 border-t border-white/10">
                <form onSubmit={sendChatMessage} className="flex items-center gap-2 sm:gap-3 relative">
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-3 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-[18px] transition-all active:scale-95`}
                    title="Send File"
                  >
                    <FileUp className="w-5.5 h-5.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setChatInput(chatInput + '👋')}
                    className={`p-3 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-[18px] transition-all active:scale-95`}
                  >
                    <Smile className="w-5.5 h-5.5" />
                  </button>
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Message everyone..." 
                    className={`flex-1 bg-[#0A0A0A] border border-white/10 rounded-[20px] px-4 py-3 text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-[#111] transition-all min-w-0 font-medium`}
                  />
                  <button 
                    type="submit" 
                    disabled={!chatInput.trim()}
                    className={`p-3 bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] rounded-[20px] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
                {Object.keys(activeUploads).length > 0 && (
                   <div className="mt-3 text-xs text-emerald-400 font-semibold px-2">
                     Broadcasting {Object.keys(activeUploads).length} file(s)...
                   </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: P2P Synchronised Interactive Polls */}
          {activeTab === 'polls' && (
            <motion.div 
              key="polls-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="absolute inset-0 flex flex-col p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-white text-lg font-bold">Interactive Polls</h3>
                {!showPollCreator && (
                  <button
                    onClick={() => setShowPollCreator(true)}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm rounded-[18px] transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> Create Poll
                  </button>
                )}
              </div>

              {showPollCreator ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#141414] border border-white/15 p-6 rounded-[24px] space-y-4"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Question</label>
                    <input
                      type="text"
                      placeholder="e.g. Which design is better?"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-[16px] px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Options</label>
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const clone = [...pollOptions];
                            clone[idx] = e.target.value;
                            setPollOptions(clone);
                          }}
                          className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-[14px] px-4 py-2.5 text-sm text-white focus:outline-none"
                        />
                        {pollOptions.length > 2 && (
                          <button 
                            type="button" 
                            onClick={() => removeOptionField(idx)}
                            className="text-red-400 p-2 hover:bg-red-500/10 rounded-[10px]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {pollOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={addOptionField}
                      className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  )}

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={createPoll}
                      className="px-5 py-3 bg-emerald-500 text-black rounded-[16px] font-extrabold text-sm transition-all"
                    >
                      Publish Poll
                    </button>
                    <button
                      onClick={() => setShowPollCreator(false)}
                      className="px-5 py-3 bg-white/5 text-slate-400 hover:text-white rounded-[16px] text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : polls.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <BarChart3 className="w-12 h-12 opacity-30 text-emerald-400" />
                  <p className="text-sm">No active polls inside the room.</p>
                </div>
              ) : (
                <div className="space-y-5 flex-1">
                  {polls.map(poll => {
                    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
                    const userVotedOption = poll.options.findIndex(o => o.voters.includes(userId));
                    const hasVoted = userVotedOption !== -1;

                    return (
                      <div key={poll.id} className="bg-[#141414] border border-white/5 p-5.5 rounded-[24px] space-y-4 shadow-md">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-white text-md tracking-tight leading-snug">{poll.question}</h4>
                          <span className="text-xs text-slate-500 font-medium px-2 py-0.5 bg-white/5 rounded-full">{totalVotes} votes</span>
                        </div>

                        <div className="space-y-3">
                          {poll.options.map((opt, oIdx) => {
                            const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                            const isVoted = hasVoted && userVotedOption === oIdx;

                            return (
                              <button
                                key={oIdx}
                                disabled={hasVoted}
                                onClick={() => votePoll(poll.id, oIdx)}
                                className={`w-full text-left relative overflow-hidden rounded-[16px] border p-3.5 transition-all flex items-center justify-between ${
                                  isVoted 
                                    ? 'bg-emerald-500/10 border-emerald-500/50' 
                                    : hasVoted 
                                      ? 'bg-white/5 border-white/5' 
                                      : 'bg-[#0A0A0A] hover:bg-white/5 border-white/10'
                                }`}
                              >
                                {/* Percentage visual fill */}
                                <div 
                                  className="absolute top-0 left-0 bottom-0 bg-emerald-500/10 transition-all duration-1000 ease-out pointer-events-none"
                                  style={{ width: `${percent}%` }}
                                ></div>

                                <span className={`relative text-sm font-bold z-10 ${isVoted ? 'text-emerald-400' : 'text-slate-200'}`}>
                                  {opt.text}
                                </span>
                                
                                {hasVoted && (
                                  <span className="relative z-10 text-xs font-bold text-slate-400 font-mono">{percent}% ({opt.votes})</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: Collaborative canvas drawing Sketchpad */}
          {activeTab === 'draw' && (
            <motion.div 
              key="draw-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="absolute inset-0 flex flex-col p-5"
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  {['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#FFFFFF'].map(c => (
                    <button
                      key={c}
                      onClick={() => setDrawColor(c)}
                      className={`w-7.5 h-7.5 rounded-full transition-all border-2 ${
                        drawColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <button 
                  onClick={triggerClearCanvas}
                  className="px-4 py-2 bg-red-500 hover:bg-red-400 text-[#0A0A0A] text-xs font-bold rounded-[14px] transition-all active:scale-95"
                >
                  Clear Sketch
                </button>
              </div>

              {/* Whiteboard Interactive Canvas Frame */}
              <div className="flex-1 bg-[#141414] rounded-[24px] overflow-hidden border border-white/5 relative">
                <canvas 
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="h-full w-full cursor-crosshair touch-none block"
                />
                
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-bold text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Collaborative Whiteboard
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: Real-time sound board (Audio Synthesizer) */}
          {activeTab === 'sound' && (
            <motion.div 
              key="sound-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="absolute inset-0 flex flex-col p-6 items-center justify-center text-center"
            >
              <div className="max-w-md space-y-2 mb-8 shrink-0">
                <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-3xl mx-auto flex items-center justify-center mb-4">
                  <Volume2 className="w-8 h-8" />
                </div>
                <h4 className="text-white font-extrabold text-lg">P2P Audio Soundboard</h4>
                <p className="text-sm text-slate-400">Tap to instantly synthesis sound triggers directly into everyone's browsers synchronously!</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                {[
                  { id: 'chime', label: 'Cascading Chime', icon: '🔔', desc: 'Ascending major chord' },
                  { id: 'ding', label: ' Ding-dong Notification', icon: '🛎️', desc: 'Bright success alert' },
                  { id: 'scifi', label: 'Sci-fi Laser', icon: '⚡', desc: 'Synthesizer glide sweep' },
                  { id: 'pop', label: 'Water Bubble Pop', icon: '🧼', desc: 'Analog bubble pop chime' }
                ].map(sound => (
                  <button
                    key={sound.id}
                    onClick={() => playSfxLocalAndRemote(sound.id)}
                    className="flex flex-col items-center p-5 bg-[#141414] hover:bg-[#1A1A1A] border border-white/5 rounded-[24px] hover:border-purple-500/30 transition-all hover:scale-[1.03] active:scale-[0.97] group text-center"
                  >
                    <span className="text-4xl mb-3 block transform group-hover:scale-110 transition-transform">{sound.icon}</span>
                    <h5 className="font-bold text-white text-base mb-1 tracking-tight">{sound.label}</h5>
                    <p className="text-xs text-slate-500 font-medium">{sound.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
