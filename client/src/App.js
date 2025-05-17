import React from 'react';
import ChatRoom from './components/ChatRoom';
import { CssBaseline, Container } from '@mui/material';

function App() {
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
