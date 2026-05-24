import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" }, maxHttpBufferSize: 1e8 }); // Increase buffer for files if needed

  const PORT = 3000;
  
  const rooms: Record<string, { admin: string, banned: string[] }> = {};
  const socketToRoom: Record<string, string> = {};

  io.on("connection", (socket) => {
    socket.on("join-room", (roomId) => {
      if (!rooms[roomId]) {
        rooms[roomId] = { admin: socket.id, banned: [] };
      }
      
      if (rooms[roomId].banned.includes(socket.id)) {
        socket.emit("banned");
        return;
      }

      socket.join(roomId);
      socketToRoom[socket.id] = roomId;
      socket.to(roomId).emit("user-connected", socket.id);
      
      // Send current admin to the user
      socket.emit("admin-status", rooms[roomId].admin);
      io.to(roomId).emit("admin-status", rooms[roomId].admin); // broadcast in case of updates

      socket.on("disconnect", () => {
        socket.to(roomId).emit("user-disconnected", socket.id);
        delete socketToRoom[socket.id];
        
        if (rooms[roomId] && rooms[roomId].admin === socket.id) {
          // Reassign admin to another user in room if any
          const clients = io.sockets.adapter.rooms.get(roomId);
          if (clients && clients.size > 0) {
            const nextAdmin = Array.from(clients)[0];
            rooms[roomId].admin = nextAdmin;
            io.to(roomId).emit("admin-status", nextAdmin);
          } else {
            delete rooms[roomId]; // Room empty
          }
        }
      });
    });

    socket.on("offer", (payload) => {
      io.to(payload.target).emit("offer", { caller: socket.id, sdp: payload.sdp });
    });

    socket.on("answer", (payload) => {
      io.to(payload.target).emit("answer", { caller: socket.id, sdp: payload.sdp });
    });

    socket.on("ice-candidate", (payload) => {
      io.to(payload.target).emit("ice-candidate", { caller: socket.id, candidate: payload.candidate });
    });

    socket.on("chat-message", (payload) => {
      io.to(payload.room).emit("chat-message", {
        id: Math.random().toString(36),
        message: payload.message,
        sender: socket.id,
        senderName: payload.senderName || "Guest",
        timestamp: Date.now()
      });
    });

    // File sharing metadata
    socket.on("file-start", (payload) => {
      io.to(payload.room).emit("file-start", {
        fileId: payload.fileId,
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        sender: socket.id,
        senderName: payload.senderName
      });
    });

    socket.on("file-chunk", (payload) => {
      socket.broadcast.to(payload.room).emit("file-chunk", payload);
    });

    socket.on("raise-hand", (payload) => {
      io.to(payload.room).emit("raise-hand", { userId: socket.id, isRaised: payload.isRaised });
    });

    socket.on("reaction", (payload) => {
      io.to(payload.room).emit("reaction", { userId: socket.id, emoji: payload.emoji });
    });

    // Admin Actions
    socket.on("transfer-admin", (payload) => {
      const room = socketToRoom[socket.id];
      if (room && rooms[room] && rooms[room].admin === socket.id) {
        rooms[room].admin = payload.targetUserId;
        io.to(room).emit("admin-status", rooms[room].admin);
      }
    });

    socket.on("ban-user", (payload) => {
      const room = socketToRoom[socket.id];
      if (room && rooms[room] && rooms[room].admin === socket.id) {
        rooms[room].banned.push(payload.targetUserId);
        io.to(payload.targetUserId).emit("banned");
        io.to(room).emit("user-disconnected", payload.targetUserId);
        
        // Also forcibly leave room
        const targetSocket = io.sockets.sockets.get(payload.targetUserId);
        if (targetSocket) {
          targetSocket.leave(room);
        }
      }
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
