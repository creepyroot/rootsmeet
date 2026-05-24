/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import JoinScreen from './components/JoinScreen';
import PreJoinScreen from './components/PreJoinScreen';
import RoomScreen from './components/RoomScreen';

export default function App() {
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

  if (roomId) {
    return <RoomScreen roomId={roomId} onLeave={leaveRoom} userName={userName || 'Guest'} initialMedia={initialMedia} />;
  }

  if (preJoining) {
    if (!userName) {
      return <JoinScreen onJoin={startPreJoin} onCreate={handleCreate} forcedRoomId={preJoining} />;
    }
    return <PreJoinScreen roomId={preJoining} userName={userName} onJoin={joinRoom} onCancel={cancelJoin} />;
  }

  return <JoinScreen onJoin={startPreJoin} onCreate={handleCreate} />;
}

