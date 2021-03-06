require("dotenv").config();
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const routes = require("./api/routes");
const { getOpponent, chooseSides, resetPlayers } = require("./utilities/utils");
const Timer = require("./utilities/timer");
const socketAddPoints = require("./services/socketAddPoints");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

routes(app);

mongoose.connect(process.env.DATABASEURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  setInterval(() => {
    if (socket.opponent && !socket.gameover) {
      if (io.of("/").connected[socket.opponent]) {
        if (socket.time.getTime() === 0) {
          socket.emit("winner", socket.side === "X" ? "O" : "X");
          socket
            .to(socket.opponent)
            .emit("winner", socket.side === "X" ? "O" : "X");
          resetPlayers(socket, io.of("/").connected[socket.opponent]);
        }
        if (io.of("/").connected[socket.opponent].time.getTime() === 0) {
          socket.emit(
            "winner",
            io.of("/").connected[socket.opponent].side === "X" ? "O" : "X"
          );
          socket
            .to(socket.opponent)
            .emit(
              "winner",
              io.of("/").connected[socket.opponent].side === "X" ? "O" : "X"
            );
          resetPlayers(socket, io.of("/").connected[socket.opponent]);
        }
      }
    }
  }, 1000);

  socket.on("winner", ({ side, opponentId }) => {
    resetPlayers(socket, io.of("/").connected[opponentId]);
    socket.to(opponentId).emit("winner", side);
  });

  socket.on("play", ({ box, opponentId }) => {
    socket.time.pause();
    io.of("/").connected[opponentId].time.start();
    socket.to(opponentId).emit("play", {
      box,
      timeObject: {
        user: socket.time.getTime(),
        opponent: io.of("/").connected[opponentId].time.getTime(),
      },
    });
  });

  socket.on("setPlayers", (username) => {
    socket.name = username;
    socket.time = new Timer(30);
    socket.gameover = false;
    socket.join("waiting");
    io.in("waiting").clients((error, clients) => {
      if (error) throw error;
      const opponentId = getOpponent(socket, clients, io);
      if (opponentId) {
        io.of("/").connected[opponentId].leave("waiting");
        socket.leave("waiting");
        socket.opponent = opponentId;
        io.of("/").connected[opponentId].opponent = socket.id;
        const { side1, side2 } = chooseSides();
        const createPayload = (socket, side, initialPayload) => {
          socket.side = side;
          side === "X" ? socket.time.setTime(34) : socket.time.setTime(30);
          return {
            ...initialPayload,
            callback: side === "X" ? socket.time.start() : null,
          };
        };
        socket.to(opponentId).emit(
          "matched",
          createPayload(socket, side1, {
            username,
            id: socket.id,
            side: side1,
            timeObject: {
              opponent: socket.time.getTime(),
              user: io.of("/").connected[opponentId].time.getTime(),
            },
          })
        );
        socket.emit(
          "matched",
          createPayload(io.of("/").connected[opponentId], side2, {
            username: io.of("/").connected[opponentId].name,
            id: opponentId,
            side: side2,
            timeObject: {
              user: socket.time.getTime(),
              opponent: io.of("/").connected[opponentId].time.getTime(),
            },
          })
        );
      }
    });
  });

  socket.on("cancel", () => {
    socket.leave("waiting");
  });
  socket.on("updateuserpoints", async (token) => {
    const error = await socketAddPoints(token);
    if (error) return socket.emit("an error", error);

    socket.emit("updated");
  });

  socket.on("disconnect", () => {
    if (!socket.gameover && socket.opponent) {
      socket
        .to(socket.opponent)
        .emit("winner", socket.side === "X" ? "O" : "X");
      resetPlayers(socket, io.of("/").connected[socket.opponent]);
      console.log("disconnected");
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});
