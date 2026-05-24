import { useState } from 'react';
import { Video, Keyboard, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface JoinScreenProps {
  onJoin: (roomId: string) => void;
  onCreate: () => void;
}

export default function JoinScreen({ onJoin, onCreate }: JoinScreenProps) {
  const [roomId, setRoomId] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() !== '') {
      onJoin(roomId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[440px] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden"
      >
        <div className="p-8 pb-6 border-b border-slate-50">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Video className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">
            Video Meetings
          </h1>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            Create a secure room or enter a code to join an existing session seamlessly.
          </p>
        </div>

        <div className="p-8 pt-6 space-y-6">
          <button 
            onClick={onCreate}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          >
            Start New Meeting
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-medium text-slate-400 uppercase tracking-widest">Or</span>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="roomCode" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Meeting Code
              </label>
              <div className="relative flex items-center">
                <Keyboard className="w-5 h-5 text-slate-400 absolute left-3.5" />
                <input 
                  id="roomCode"
                  type="text" 
                  placeholder="e.g. abc-def-ghi" 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={roomId.trim() === ''}
              className="w-full py-3.5 bg-white border-2 border-slate-200 text-slate-900 font-medium rounded-xl hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              Join Meeting <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
