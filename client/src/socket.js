import { io } from 'socket.io-client';

let socket;
export function getSocket(){
  if(!socket){
    socket = io(import.meta.env.VITE_API_BASE || 'http://localhost:8080', { transports:['websocket'] });
  }
  return socket;
}