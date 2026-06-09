import { io } from 'socket.io-client';

const URL = 'http://localhost:3000';

export const socket = io(URL, {
  auth: {
    token: localStorage.getItem('token')
  },
  autoConnect: false
});

// Update token on auth change
export const connectSocket = (token: string) => {
  socket.auth = { token };
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};
