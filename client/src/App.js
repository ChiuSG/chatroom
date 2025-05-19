import React from 'react';
import ChatRoom from './components/ChatRoom';
import { CssBaseline, Container } from '@mui/material';
import io from 'socket.io-client';

function App() {
  const socket = io('http://localhost:5004', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  return (
    <>
      <CssBaseline />
      <Container>
        <ChatRoom socket={socket} />
      </Container>
    </>
  );
}

export default App;
