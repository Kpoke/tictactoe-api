const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { getOpponent, chooseSides } = require("./utils");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3001;

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on("play", (payload) => console.log(payload));

  socket.on("setPlayers", (username) => {
    socket.name = username;
    socket.join("waiting");
    io.in("waiting").clients((error, clients) => {
      if (error) throw error;
      console.log(clients);
      const opponentId = getOpponent(socket.id, clients);
      if (opponentId) {
        io.of("/").connected[opponentId].leave("waiting");
        socket.leave("waiting");
        const { side1, side2 } = chooseSides();
        socket.to(opponentId).emit("matched", {
          username,
          id: socket.id,
          side: side1,
        });
        socket.emit("matched", {
          username: io.of("/").connected[opponentId].name,
          id: opponentId,
          side: side2,
        });
      }
    });
  });

  socket.on("disconnect", () => console.log("disconnected"));
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});
