import React from 'react';
import ChatRoom from './components/ChatRoom';
import { CssBaseline, Container } from '@mui/material';
import io from 'socket.io-client';

function App() {
  const socket = io(process.env.REACT_APP_API_URL || window.location.origin.replace(/:3000$/, ':5002'), {
    transports: ['websocket', 'polling'],
    cors: {
      origin: '*',
    }
  });

  return (
    <>
      <CssBaseline />
      <Container>
        <ChatRoom />
      </Container>
    </>
  );
}

export default App;
