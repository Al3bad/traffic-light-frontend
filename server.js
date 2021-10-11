const { Server } = require("socket.io");
const http = require("http");
const net = require("net");
const express = require("express");

const webApp = express();
const webServer = http.createServer(webApp);
const qnxServer = net.createServer();

let host = "localhost";
const ports = [3030, 3035];

const io = new Server(webServer, {
  path: "/socket/traffic-light-system",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// QNX node ---[update]--> (3035) SERVER
//                                   |
//                                (3030) <--------------- new client is connected
//                                SOCKET -- new state --> connected client
//                                                   |--> connected client
//                                                   |--> connected client
//                                                   |--> ...

// Initial state
let systemStatus = {};
let systemIsConnected = false;
let qnxSocket = undefined;

// ==================== Web : Routes ========================= //

// serve static files
webApp.use("/traffic-light-system", express.static(__dirname + "/build/public/traffic-light-system"));

// serve the webpage
webApp.get("/traffic-light-system", (req, res) => {
  res.sendFile(__dirname + "/build/public/index.html");
});

// ==================== Socket IO ========================= //
const refresh = () => {
  if (io.sockets.adapter.rooms.get("main_room"))
    io.to("main_room").emit("refresh", {
      systemIsConnected,
      users: io.sockets.adapter.rooms.get("main_room").size,
      systemStatus,
    });
};

io.on("connection", (socket) => {
  // console.log("a new user has connected connected");

  // Add any user to the main_room
  socket.join("main_room");
  socket.emit("system_connection", systemIsConnected);

  // Update the number of online user
  refresh();

  // for testign
  socket.on("send_command", (msg) => {
    if (systemIsConnected && qnxSocket) {
      // send the command to the qnx node (browser ---> web-server ---> qnx-node)
      // console.log(`COMMAND: ${msg.command}, VALUE: ${msg.value}`);
      qnxSocket.write(`${msg.command}=${msg.value}\n`);
    }
  });

  socket.on("disconnect", () => {
    // console.log("user has disconnected");
    // Update the number of online user
    refresh();
  });
});

// ==================== QNX : Server ========================= //

qnxServer.on("connection", (socket) => {
  qnxSocket = socket;
  systemIsConnected = true;
  refresh();

  socket.on("data", (data) => {
    const body = data.toString().split(">")[1];
    
    // Clean up the received body
    const status = body.split("-");
    systemStatus[status[0]] = status[1].slice(0, status[1].indexOf("\x00"));

    // Send it to the front-end
    // console.log(systemStatus);
    refresh();
  });

  socket.on("end", () => {
    console.log("socket end")
  });

  socket.on("close", () => {
    console.log("socket close");
    qnxSocket = undefined;
    systemIsConnected = false;
    systemStatus = {};
    refresh();
  })

  socket.on("error", () => {
    console.log("socket error");
  })
})

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

qnxServer.maxConnections = 1;
qnxServer.listen(ports[1], () => {
  console.log(`QNX server is listening at http://${host}:${ports[1]}`);
});

webServer.listen(ports[0], host, () => {
  console.log(`Web server is listening at http://${host}:${ports[0]}`);
});
