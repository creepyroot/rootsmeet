/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import JoinScreen from './components/JoinScreen';
import PreJoinScreen from './components/PreJoinScreen';
import RoomScreen from './components/RoomScreen';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [preJoining, setPreJoining] = useState<string | null>(null);
  const [initialMedia, setInitialMedia] = useState({ mic: true, video: true });

  useEffect(() => {
    // Check URL parameters for immediate join support
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setPreJoining(roomParam);
      // Clean up URL so user can enter their name
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }

    const timer = setTimeout(() => setShowIntro(false), 3800);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = (name: string) => {
    setUserName(name);
    // Generate a 10 digit random room string
    const newRoom = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setPreJoining(newRoom);
  };

  const startPreJoin = (id: string, name: string) => {
    setUserName(name);
    setPreJoining(id);
  };

  const joinRoom = (mic: boolean, video: boolean) => {
    if (preJoining) {
      setInitialMedia({ mic, video });
      setRoomId(preJoining);
      const url = new URL(window.location.href);
      url.searchParams.set('room', preJoining);
      window.history.pushState({}, '', url.toString());
    }
  };

  const cancelJoin = () => {
    setPreJoining(null);
    setRoomId(null);
  };

  const leaveRoom = () => {
    setRoomId(null);
    setPreJoining(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="h-full w-full bg-[#0A0A0A] font-sans overflow-hidden">
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#070707]"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 2, opacity: 0.3 }}
                transition={{ duration: 2.5, ease: "easeOut" }}
                className="absolute inset-0 m-auto w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]"
              />
            </div>
            <motion.div className="relative text-center flex flex-col items-center">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, ease: "circOut", delay: 0.2 }}
                className="h-[2px] bg-emerald-500 mb-8"
              />
              <div className="overflow-hidden">
                <motion.h1
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                  className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-600 uppercase"
                >
                  GURNOOR PROJECTS
                </motion.h1>
              </div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, ease: "circOut", delay: 1.2 }}
                className="h-[2px] bg-emerald-500 mt-8"
              />
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.8 }}
                className="mt-6 text-slate-400 font-medium tracking-widest uppercase text-sm"
              >
                Presents
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ opacity: showIntro ? 0 : 1, scale: showIntro ? 0.95 : 1 }}
        transition={{ duration: 0.8, delay: 3.2 }}
        className="h-full w-full"
      >
        {roomId ? (
          <RoomScreen roomId={roomId} onLeave={leaveRoom} userName={userName || 'Guest'} initialMedia={initialMedia} />
        ) : preJoining ? (
          !userName ? (
            <JoinScreen onJoin={startPreJoin} onCreate={handleCreate} forcedRoomId={preJoining} />
          ) : (
            <PreJoinScreen roomId={preJoining} userName={userName} onJoin={joinRoom} onCancel={cancelJoin} />
          )
        ) : (
          <JoinScreen onJoin={startPreJoin} onCreate={handleCreate} />
        )}
      </motion.div>
    </div>
  );
}

