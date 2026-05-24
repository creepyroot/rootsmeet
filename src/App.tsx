/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import JoinScreen from './components/JoinScreen';
import RoomScreen from './components/RoomScreen';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Check URL parameters for immediate join support
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
    }
  }, []);

  const handleCreate = (name: string) => {
    setUserName(name);
    // Generate a 10 digit random room string
    const newRoom = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    joinRoom(newRoom, name);
  };

  const joinRoom = (id: string, name: string) => {
    setUserName(name);
    setRoomId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('room', id);
    window.history.pushState({}, '', url.toString());
  };

  const leaveRoom = () => {
    setRoomId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
  };

  if (roomId) {
    return <RoomScreen roomId={roomId} onLeave={leaveRoom} userName={userName || 'Guest'} />;
  }

  return <JoinScreen onJoin={joinRoom} onCreate={handleCreate} />;
}
