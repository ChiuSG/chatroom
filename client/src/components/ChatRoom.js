import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Paper, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';
import io from 'socket.io-client';

const socket = io('http://localhost:5002');

function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const observerRef = useRef(null);
  const readMessagesRef = useRef(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // 創建 Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId && !readMessagesRef.current.has(messageId)) {
              readMessagesRef.current.add(messageId);
              socket.emit('messageRead', messageId);
              observerRef.current.unobserve(entry.target);
            }
          }
        });
      },
      {
        root: null,
        threshold: 0.5
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    socket.on('message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('messageReadBy', ({ messageId, username: readByUsername }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              readBy: Array.from(new Set([...(msg.readBy || []), readByUsername]))
            }
          : msg
      ));
    });

    socket.on('userTyping', (typingUsers) => {
      setTypingUsers(typingUsers);
    });

    socket.on('userJoined', ({ username, users }) => {
      setMessages(prev => [...prev, { text: `${username} 加入了聊天室`, system: true }]);
      setUsers(users);
    });

    socket.on('userLeft', ({ username, users }) => {
      setMessages(prev => [...prev, { text: `${username} 離開了聊天室`, system: true }]);
      setUsers(users);
      setTypingUsers(prev => prev.filter(user => user !== username));
    });

    socket.on('joinError', ({ message }) => {
      setError(message);
    });

    socket.on('joinSuccess', () => {
      setIsJoined(true);
      setError('');
    });

    return () => {
      socket.off('message');
      socket.off('messageReadBy');
      socket.off('userTyping');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('joinError');
      socket.off('joinSuccess');
    };
  }, []);

  // 當訊息更新時，為新的訊息添加觀察者
  useEffect(() => {
    const messageElements = document.querySelectorAll('[data-message-id]');
    messageElements.forEach(element => {
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    });
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('請輸入用戶名');
      return;
    }
    socket.emit('join', username.trim());
  };

  const handleTyping = () => {
    socket.emit('typing', true);
    
    // 清除之前的計時器
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 設置新的計時器
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', false);
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      socket.emit('message', messageInput);
      setMessageInput('');
      socket.emit('typing', false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  if (!isJoined) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, p: 2 }}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <form onSubmit={handleJoin}>
            <TextField
              fullWidth
              label="請輸入您的名字"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              margin="normal"
              error={!!error}
              helperText={error}
            />
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth
              disabled={!username.trim()}
            >
              加入聊天室
            </Button>
          </form>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">聊天室</Typography>
          <Typography variant="body2">
            在線用戶: {users.join(', ')}
          </Typography>
        </Box>
        
        <List sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
          {messages.map((message, index) => (
            <ListItem 
              key={index}
              data-message-id={message.id}
              sx={{
                flexDirection: message.system ? 'row' : (message.username === username ? 'row-reverse' : 'row'),
                justifyContent: 'flex-start'
              }}
            >
              <ListItemText
                sx={{
                  textAlign: message.system ? 'center' : (message.username === username ? 'right' : 'left'),
                  maxWidth: '80%'
                }}
                primary={message.system ? (
                  <Typography variant="body2" color="text.secondary">
                    {message.text}
                  </Typography>
                ) : (
                  <Box>
                    <Typography 
                      component="span" 
                      variant="body2" 
                      color={message.isAi ? "secondary" : "primary"}
                      sx={{ display: 'block' }}
                    >
                      {message.username === username ? '你' : message.username}
                      {message.isAi && ' 🤖'}
                    </Typography>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 1, 
                        bgcolor: message.username === username ? 'primary.light' : 
                                message.isAi ? 'secondary.light' : 'grey.100',
                        color: message.username === username || message.isAi ? 'white' : 'text.primary',
                        borderRadius: 2,
                        display: 'inline-block',
                        maxWidth: '100%'
                      }}
                    >
                      {message.text}
                    </Paper>
                    {message.readBy && message.readBy.length > 0 && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        已讀: {message.readBy.filter(user => user !== message.username).join(', ')}
                      </Typography>
                    )}
                  </Box>
                )}
                secondary={message.timestamp && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </Typography>
                )}
              />
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>

        {typingUsers.length > 0 && typingUsers.some(user => user !== username) && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {typingUsers.filter(user => user !== username).join(', ')} 正在輸入...
            </Typography>
          </Box>
        )}

        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8 }}>
          <TextField
            fullWidth
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              handleTyping();
            }}
            placeholder="輸入訊息..."
          />
          <Button type="submit" variant="contained">
            發送
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default ChatRoom; 