/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import JoinScreen from './components/JoinScreen';
import RoomScreen from './components/RoomScreen';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    // Check URL parameters for immediate join support
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
    }
  }, []);

  const handleCreate = () => {
    // Generate a random room string like xxx-xxx-xxx
    const generateSegment = () => Math.random().toString(36).substring(2, 5);
    const newRoom = `${generateSegment()}-${generateSegment()}-${generateSegment()}`;
    joinRoom(newRoom);
  };

  const joinRoom = (id: string) => {
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
    return <RoomScreen roomId={roomId} onLeave={leaveRoom} />;
  }

  return <JoinScreen onJoin={joinRoom} onCreate={handleCreate} />;
}
