const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('../frontend'));



app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

const activeRooms = new Map();

io.on('connection', (socket) => {
  console.log('user connected:', socket.id);;

  socket.on('createRoom', () => {
      console.log('createRoom event received');
      const roomCode = generateRoomCode();
      activeRooms.set(roomCode, { left: socket.id, right: null });
      socket.join(roomCode);
      socket.emit('roomCreated', roomCode);
      console.log(roomCode)
  });

  socket.on('joinRoom', (roomCode) => {
      const room = activeRooms.get(roomCode);
      if (room && !room.right) {
          room.right = socket.id;
          activeRooms.set(roomCode, room);
          socket.join(roomCode);
          io.to(roomCode).emit('roomJoined', { left: room.left, right: room.right });
          console.log("joined room" + roomCode)
      } else {
          socket.emit('joinError', 'Invalid or full room.');
      }
  });

  socket.on('disconnect', () => {
      // Clean up rooms when a player disconnects
      activeRooms.forEach((room, code) => {
          if (room.left === socket.id || room.right === socket.id) {
              io.to(code).emit('playerDisconnected');
              activeRooms.delete(code);
          }
      });
  });

  socket.on('paddleMove', (data) => {
    const room = Array.from(socket.rooms).find(room => room !== socket.id); // Find the room
    if (room) {
        socket.to(room).emit('paddleUpdate', data); // Broadcast to the other player
    }
  });

});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});


//helper functions

function generateRoomCode() {
  let code;
  do {
      code = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit code
  } while (activeRooms.has(code)); // Ensure uniqueness
  return code;
}
// will remove nodemon from dep