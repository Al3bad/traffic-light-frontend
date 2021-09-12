const { networkInterfaces, arch } = require("os");
const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const webApp = express();
const qnxApp = express();
const webServer = http.createServer(webApp);
const qnxServer = http.createServer(qnxApp);

const io = new Server(webServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let host = "localhost";
const ports = [3000, 3005];

const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    if (net.family === "IPv4" && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}

if (arch() == "x32" || arch() == "x64") host = results["Ethernet"][0];

// QNX node -- /update --> (3005) SERVER (3000) <------------------ new client is connected
//                                   |
//                                (3000)
//                                SOCKET -- new state -----> connected client
//                                                      |--> connected client
//                                                      |--> connected client
//                                                      |--> ...

// Initial state
let systemState = {};

let systemIsConnected = false;

// ==================== Web : Routes ========================= //

webApp.use(express.static("build/public"));

// ==================== QNX : Routes ========================= //

qnxApp.use(express.json());

// This route is used by QNX nodes to sends the states of the system
// Then update all the clients in the main_room
qnxApp.get("/qnx/:deviceId/:newState", (req, res) => {
  io.to("main_room").emit("update", { device_id: req.params.deviceId, new_state: req.params.newState });
  res.send("ok");
});

qnxApp.post("/qnx/update", (req, res) => {
  const receivedState = req.body;

  console.log(receivedState);

  if (!(receivedState instanceof Object)) {
    res.send("ERROR: Invalid data");
    return;
  }

  systemState = receivedState;

  refresh();
  res.send("ok");
});

// ==================== Socket IO ========================= //
const refresh = () => {
  if (io.sockets.adapter.rooms.get("main_room"))
    io.to("main_room").emit("refresh", {
      systemIsConnected,
      users: io.sockets.adapter.rooms.get("main_room").size,
      systemState,
    });
};

io.on("connection", (socket) => {
  console.log("a new user has connected connected");

  // Add any user to the main_room
  socket.join("main_room");
  socket.emit("system_connection", systemIsConnected);

  // Update the number of online user
  refresh();

  // for testign
  socket.on("client_msg", (msg) => {
    console.log(msg);
  });

  socket.on("disconnect", () => {
    console.log("user has disconnected");
    // Update the number of online user
    refresh();
  });
});

// ========================================================= //

// Check the number TCP connections
const getConnections = () => {
  return new Promise((resolve, reject) => {
    qnxServer.getConnections((err, num) => {
      if (err) resolve(-1);
      else resolve(num);
    });
  });
};

qnxServer.on("connection", (socket) => {
  console.log(socket.remoteAddress, socket.remotePort);
  systemIsConnected = true;
  refresh();
  socket.on("close", () => {
    systemIsConnected = false;
    systemState = {};
    refresh();
  });
});

qnxServer.keepAliveTimeout = 0;
qnxServer.maxConnections = 1;
qnxServer.listen(ports[1], host, () => {
  console.log(`QNX server is listening at http://${host}:${ports[1]}`);
});

webServer.listen(ports[0], host, () => {
  console.log(`Web server is listening at http://${host}:${ports[0]}`);
});
