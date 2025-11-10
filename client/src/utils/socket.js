import { io } from 'socket.io-client'
// Socket helper

let socket
export function getSocket() {
  if (socket) return socket
  const baseURL = (typeof window !== 'undefined') ? window.location.origin : ''
  socket = io(baseURL, { withCredentials: true })
  return socket
}

export function joinUserRoom(userId) {
  try {
    const s = getSocket()
    s.emit('user:join', String(userId))
  } catch (e) {
    // ignore
  }
}
