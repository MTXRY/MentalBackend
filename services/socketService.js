const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Store call state per room (appointment ID)
  const callStates = new Map(); // roomId -> { isActive: boolean, startedBy: userId }

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a room (appointment session)
    socket.on('join-room', (roomId, userId, userName, userRole) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;
      socket.data.userName = userName;
      socket.data.userRole = userRole || 'user';
      
      console.log(`User ${userName} (${userId}, role: ${userRole}) joined room ${roomId}`);
      
      // Get current call state for this room
      const callState = callStates.get(roomId) || { isActive: false, startedBy: null };
      
      console.log(`Call state for room ${roomId}:`, callState);
      
      // Send current call state to the joining user
      socket.emit('call-state', {
        isActive: callState.isActive,
        startedBy: callState.startedBy
      });
      
      console.log(`Sent call-state to ${userName} (${userId}):`, { isActive: callState.isActive, startedBy: callState.startedBy });
      
      // If call is active, notify others in the room
      if (callState.isActive) {
        socket.to(roomId).emit('user-joined', {
          userId,
          userName,
          socketId: socket.id
        });

        // Get all users in the room
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room) {
          const usersInRoom = Array.from(room).map(socketId => {
            const userSocket = io.sockets.sockets.get(socketId);
            return userSocket ? {
              socketId: userSocket.id,
              userId: userSocket.data.userId,
              userName: userSocket.data.userName
            } : null;
          }).filter(Boolean);

          // Send list of existing users to the new user
          socket.emit('room-users', usersInRoom.filter(u => u.socketId !== socket.id));
        }
      }
    });

    // Start call (only doctors can do this)
    socket.on('start-call', (roomId) => {
      const userRole = socket.data.userRole;
      
      if (userRole !== 'doctor' && userRole !== 'admin') {
        socket.emit('error', { message: 'Only doctors can start the call' });
        return;
      }

      // Mark call as active
      callStates.set(roomId, {
        isActive: true,
        startedBy: socket.data.userId
      });

      console.log(`Call started in room ${roomId} by ${socket.data.userName}`);

      // Notify all users in the room that call has started
      const room = io.sockets.adapter.rooms.get(roomId);
      const usersInRoom = room ? Array.from(room).length : 0;
      console.log(`Broadcasting call-started to ${usersInRoom} users in room ${roomId}`);
      
      io.to(roomId).emit('call-started', {
        startedBy: socket.data.userId,
        startedByName: socket.data.userName
      });
      
      console.log(`Call-started event sent to all users in room ${roomId}`);

      // Get all users in the room and send them to each other
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room) {
        const usersInRoom = Array.from(room).map(socketId => {
          const userSocket = io.sockets.sockets.get(socketId);
          return userSocket ? {
            socketId: userSocket.id,
            userId: userSocket.data.userId,
            userName: userSocket.data.userName
          } : null;
        }).filter(Boolean);

        // Send list of all users to everyone in the room
        io.to(roomId).emit('room-users', usersInRoom);
      }
    });

    // End call
    socket.on('end-call', (roomId) => {
      const userRole = socket.data.userRole;
      
      if (userRole !== 'doctor' && userRole !== 'admin') {
        socket.emit('error', { message: 'Only doctors can end the call' });
        return;
      }

      // Mark call as inactive
      callStates.set(roomId, {
        isActive: false,
        startedBy: null
      });

      console.log(`Call ended in room ${roomId} by ${socket.data.userName}`);

      // Notify all users in the room that call has ended
      io.to(roomId).emit('call-ended', {
        endedBy: socket.data.userId,
        endedByName: socket.data.userName
      });
    });

    // Handle WebRTC offer
    socket.on('offer', (data) => {
      socket.to(data.target).emit('offer', {
        offer: data.offer,
        sender: socket.id,
        senderId: socket.data.userId,
        senderName: socket.data.userName
      });
    });

    // Handle WebRTC answer
    socket.on('answer', (data) => {
      socket.to(data.target).emit('answer', {
        answer: data.answer,
        sender: socket.id,
        senderId: socket.data.userId,
        senderName: socket.data.userName
      });
    });

    // Handle ICE candidates
    socket.on('ice-candidate', (data) => {
      socket.to(data.target).emit('ice-candidate', {
        candidate: data.candidate,
        sender: socket.id
      });
    });

    // Handle user leaving
    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      if (roomId) {
        socket.to(roomId).emit('user-left', {
          userId: socket.data.userId,
          userName: socket.data.userName,
          socketId: socket.id
        });
        console.log(`User ${socket.data.userName} left room ${roomId}`);
      }
      console.log(`User disconnected: ${socket.id}`);
    });

    // Handle mute/unmute status
    socket.on('user-audio-status', (data) => {
      socket.to(socket.data.roomId).emit('user-audio-status', {
        userId: socket.data.userId,
        userName: socket.data.userName,
        isMuted: data.isMuted
      });
    });

    // Handle video on/off status
    socket.on('user-video-status', (data) => {
      socket.to(socket.data.roomId).emit('user-video-status', {
        userId: socket.data.userId,
        userName: socket.data.userName,
        isVideoOff: data.isVideoOff
      });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};



