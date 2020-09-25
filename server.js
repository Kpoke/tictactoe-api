require("dotenv").config();
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const routes = require("./api/routes");
const { getOpponent, chooseSides } = require("./utilities/utils");
const socketAddPoints = require("./services/socketAddPoints");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3001;

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

  socket.on("winner", ({ side, opponentId }) => {
    socket.to(opponentId).emit("winner", side);
  });

  socket.on("play", ({ box, opponentId }) =>
    socket.to(opponentId).emit("play", box)
  );

  socket.on("setPlayers", (username) => {
    socket.name = username;
    socket.join("waiting");
    io.in("waiting").clients((error, clients) => {
      if (error) throw error;
      const opponentId = getOpponent(socket, clients, io);
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
  socket.on("updateuserpoints", async (token) => {
    const error = await socketAddPoints(token);
    if (error) return socket.emit("an error", error);

    socket.emit("updated");
  });

  socket.on("disconnect", () => console.log("disconnected"));
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});
