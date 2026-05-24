import React, { useState, useEffect } from 'react';
import { Video, Keyboard, ArrowRight, User, Sparkles, Globe2, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JoinScreenProps {
  onJoin: (roomId: string, name: string) => void;
  onCreate: (name: string) => void;
  forcedRoomId?: string;
}

export default function JoinScreen({ onJoin, onCreate, forcedRoomId }: JoinScreenProps) {
  const [roomId, setRoomId] = useState(forcedRoomId || '');
  const [userName, setUserName] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (forcedRoomId) setRoomId(forcedRoomId);
  }, [forcedRoomId]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && userName.trim()) onJoin(roomId.trim(), userName.trim());
  };

  const handleCreate = () => {
    if (userName.trim()) onCreate(userName.trim());
    else alert("Please enter a name first.");
  };

  const squircle = "rounded-[24px]";

  return (
    <div className="h-full w-full bg-[#0A0A0A] font-sans flex text-slate-200 overflow-y-auto selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-[1400px] mx-auto min-h-full flex flex-col lg:flex-row relative z-10">
        
        {/* Left Side: Brilliant Typography & Branding */}
        <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col justify-center relative">
          
          <div className="absolute top-8 left-8 md:top-12 md:left-16 flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.4)]">
               <Video className="w-5 h-5 text-[#0A0A0A]" />
             </div>
             <span className="text-xl font-bold tracking-tight text-white">ROOTS<span className="text-emerald-400">MEET</span></span>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-20 lg:mt-0"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-white/10 text-sm font-medium text-emerald-400 mb-8 backdrop-blur-md">
              <Sparkles className="w-4 h-4" /> Next-Gen P2P Connectivity
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1] mb-6">
              Lightning Fast.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Zero Servers.</span><br />
              Total Privacy.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-xl font-medium leading-relaxed mb-12">
              Experience ultra-low latency video calls powered entirely by your browser. No downloads, no middle servers, just pure peer-to-peer performance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: "Blazing Fast", desc: "Direct WebRTC peering" },
                { icon: Shield, title: "Secure", desc: "End-to-End Encrypted" },
                { icon: Globe2, title: "Global", desc: "Works anywhere instantly" }
              ].map((ft, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (i * 0.1) }}
                  key={i} className="flex flex-col gap-2 p-1"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-white/5 flex items-center justify-center mb-2 shadow-inner">
                    <ft.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold">{ft.title}</h3>
                  <p className="text-sm text-slate-500 font-medium">{ft.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side: Join/Create Form panel */}
        <div className="w-full lg:w-1/2 p-8 md:p-16 flex items-center justify-center shrink-0">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5, delay: 0.2 }}
             className={`w-full max-w-[480px] bg-[#141414]/80 backdrop-blur-3xl border border-white/10 ${squircle} p-8 sm:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.4)] relative overflow-hidden`}
           >
              {/* Subtle light effects behind the form */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/20 blur-[100px] pointer-events-none rounded-full"></div>
              
              <h2 className="text-2xl font-semibold text-white mb-8 tracking-tight">
                {forcedRoomId ? "Join Meeting" : "Get Started"}
              </h2>

              <form onSubmit={forcedRoomId ? handleJoin : undefined} className="space-y-6 relative z-10">
                <div className="space-y-1.5">
                  <label htmlFor="userName" className="text-xs font-semibold uppercase tracking-widest text-slate-500">Your Name</label>
                  <div className="relative group">
                    <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-400 transition-colors" />
                    <input 
                      id="userName"
                      type="text" 
                      placeholder="Jane Doe" 
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 bg-[#1A1A1A] border border-white/10 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:bg-[#222222] transition-all text-white placeholder:text-slate-600 font-medium text-lg`}
                      autoFocus
                    />
                  </div>
                </div>

                {!forcedRoomId && (
                  <button 
                    type="button"
                    onClick={handleCreate}
                    disabled={!userName.trim()}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0A] font-bold text-lg rounded-2xl transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
                  >
                    Create New Room
                  </button>
                )}

                {!forcedRoomId && (
                  <div className="relative flex items-center justify-center py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <span className="relative bg-[#141414] px-4 text-xs font-bold text-slate-600 uppercase tracking-widest">Or Join</span>
                  </div>
                )}

                <div className="space-y-4">
                  {!forcedRoomId && (
                     <div className="space-y-1.5">
                       <label htmlFor="roomCode" className="text-xs font-semibold uppercase tracking-widest text-slate-500">Meeting Code</label>
                       <div className="relative group">
                         <Keyboard className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-400 transition-colors" />
                         <input 
                           id="roomCode"
                           type="text" 
                           placeholder="Enter 10-digit code" 
                           value={roomId}
                           onChange={(e) => setRoomId(e.target.value)}
                           className={`w-full pl-12 pr-4 py-4 bg-[#1A1A1A] border border-white/10 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:bg-[#222222] transition-all text-white placeholder:text-slate-600 font-medium text-lg tracking-wide`}
                         />
                       </div>
                     </div>
                  )}
                  
                  <button 
                    type={forcedRoomId ? "submit" : "button"}
                    onClick={!forcedRoomId ? handleJoin : undefined}
                    disabled={!roomId.trim() || !userName.trim()}
                    className={`w-full py-4 text-lg font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
                        forcedRoomId 
                          ? 'bg-emerald-500 text-[#0A0A0A] hover:bg-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.3)]' 
                          : 'bg-[#1A1A1A] border border-white/10 text-white hover:bg-[#222] hover:border-white/20'
                    }`}
                  >
                    Join Room <ArrowRight className={`w-5 h-5 ${forcedRoomId ? 'text-[#0A0A0A]' : 'text-slate-400'}`} />
                  </button>
                </div>
              </form>
           </motion.div>
        </div>
      </div>
      
      {/* Background Graphic elements to make it cool */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[20%] -left-[10%] w-[800px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full mix-blend-screen mix-blend-lighten"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen mix-blend-lighten"></div>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50"></div>
        
        {/* Subtle grid over the whole page */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik00MCAwaC0xdjQwaDFWMHptMCA0MEgwdjFoNDBWMHoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIgZmlsbC1ydWxlPSJldmVub2RkIi8+Cjwvc3ZnPg==')] opacity-40"></div>
      </div>
    </div>
  );
}
