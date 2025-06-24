const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const schema = require("../config/schema");
const root = require("../src/routes/routes");
const authMiddleware = require("../src/middlewares/check-token");
const { Server } = require("socket.io");
const cors = require("cors");
const { createServer } = require("http");
const { setIo } = require("../src/socket.js");


const ACCESS_TOKEN_SECRET = "supersecret_access";

// Храним соответствие userId и socket.id
const userSocketMap = new Map();

const jwt = require("jsonwebtoken");


const app = express();
const httpServer = createServer(app);

// Настройка Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Сохраняем io в модуле socket.js
setIo(io);

// Проверка JWT для Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: Token missing"));
  }
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET); // Используйте ваш SECRET_KEY
    socket.user = decoded; // Добавляем пользователя в объект socket
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Подключение Socket.IO
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.userId}, socket.id: ${socket.id}`);

  // Сохраняем соответствие userId и socket.id
  userSocketMap.set(socket.user.userId, socket.id);

  // Присоединяем пользователя к комнате
  const roomId = createRoomId(socket.user.userId);
  socket.join(roomId);
  console.log(`User ${socket.user.userId} joined room ${roomId}`);

  socket.on("disconnect", () => {
    userSocketMap.delete(socket.user.userId);
    console.log(`User disconnected: ${socket.user.userId}, socket.id: ${socket.id}`);
  });
});

// Функция для создания уникального ID комнаты
function createRoomId(userId) {
  return `chat-${userId}`;
}

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Применяем authMiddleware, пропуская публичные мутации
app.use((req, res, next) => {
  if (req.path === "/graphql" && req.method === "POST") {
    const body = req.body;
    if (
      body &&
      body.query &&
      (body.query.includes("register") || body.query.includes("login"))
    ) {
      console.log(
        "Skipping authMiddleware for public mutations (register/login)"
      );
      return next();
    }
  }
  authMiddleware(req, res, next);
});

app.use(
  "/graphql",
  graphqlHTTP((req) => {
    //console.log("graphqlHTTP: req", { headers: req.headers, user: req.user });
    return {
      schema,
      rootValue: root,
      context: { user: req.user || null, io }, // Добавляем io в контекст
      graphiql: true,
    };
  })
);

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/graphql`);
  console.log(`Socket.IO running on ws://localhost:${PORT}`);
});
