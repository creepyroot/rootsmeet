import { useState, useEffect } from 'react';
import { Video, Keyboard, ArrowRight, User } from 'lucide-react';
import { motion } from 'motion/react';

interface JoinScreenProps {
  onJoin: (roomId: string, name: string) => void;
  onCreate: (name: string) => void;
  forcedRoomId?: string;
}

export default function JoinScreen({ onJoin, onCreate, forcedRoomId }: JoinScreenProps) {
  const [roomId, setRoomId] = useState(forcedRoomId || '');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (forcedRoomId) {
      setRoomId(forcedRoomId);
    }
  }, [forcedRoomId]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() !== '' && userName.trim() !== '') {
      onJoin(roomId.trim(), userName.trim());
    }
  };

  const handleCreate = () => {
    if (userName.trim() !== '') {
      onCreate(userName.trim());
    } else {
      alert("Please enter a name first.");
    }
  };

  return (
    <div className="h-full w-full bg-[#F7F7F8] flex flex-col items-center justify-center p-4 sm:p-6 font-sans overflow-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[440px] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden my-auto"
      >
        <div className="p-8 pb-6 border-b border-slate-50">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Video className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">
            ROOTS MEET
          </h1>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            {forcedRoomId ? "Enter your name to join the meeting." : "Create a secure room or enter a code to join an existing session seamlessly."}
          </p>
        </div>

        <div className="p-8 pt-6 space-y-6">
          <form onSubmit={forcedRoomId ? handleJoin : undefined} className="space-y-6">
            <div>
              <label htmlFor="userName" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Your Name
              </label>
              <div className="relative flex items-center">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5" />
                <input 
                  id="userName"
                  type="text" 
                  placeholder="e.g. John Doe" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                  autoFocus
                />
              </div>
            </div>

            {!forcedRoomId && (
              <button 
                type="button"
                onClick={handleCreate}
                disabled={userName.trim() === ''}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start New Meeting
              </button>
            )}

            {!forcedRoomId && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs font-medium text-slate-400 uppercase tracking-widest">Or</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {!forcedRoomId && (
                <div>
                  <label htmlFor="roomCode" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Meeting Code
                  </label>
                  <div className="relative flex items-center">
                    <Keyboard className="w-5 h-5 text-slate-400 absolute left-3.5" />
                    <input 
                      id="roomCode"
                      type="text" 
                      placeholder="e.g. 1234567890" 
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>
              )}
              <button 
                type={forcedRoomId ? "submit" : "button"}
                onClick={!forcedRoomId ? handleJoin : undefined}
                disabled={roomId.trim() === '' || userName.trim() === ''}
                className={`w-full py-3.5 font-medium rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${forcedRoomId ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white border-2 border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                Join Meeting <ArrowRight className={`w-4 h-4 ${forcedRoomId ? 'text-white' : 'text-slate-400'}`} />
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
