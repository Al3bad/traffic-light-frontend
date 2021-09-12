import socket from "socket.io-client";
let s = socket.io();

const eStatus = document.querySelector(".status");
const eUsers = document.querySelector(".online-users");
eStatus.innerHTML = "System is not connected";
eUsers.innerHTML = "Online Users: 0";

const colors = ["grey", "red", "yellow", "green"];
let data = {
  TL_I1_NS: {
    state: 0,
    pl_state: 0,
    active: true,
  },
  TL_I1_SN: {
    state: 0,
    pl_state: 0,
    active: true,
  },
  TL_I1_EW: {
    state: 0,
    pl_state: 0,
    active: true,
  },
  TL_I1_WE: {
    state: 0,
    pl_state: 0,
    active: true,
  },
  TL_I2_NS: {
    state: 0,
    pl_state: 0,
    active: true,
  },
  TL_I2_SN: {
    state: 0,
    pl_state: 0,
    active: true,
  },
  TL_I2_EW: {
    state: 0,
    pl_state: 0,
    active: true,
  },
  TL_I2_WE: {
    state: 0,
    pl_state: 0,
    active: true,
  },
  TL_X1_EW: {
    state: 0,
    active: true,
  },
  TL_X1_WE: {
    state: 0,
    active: true,
  },
  BG_X1: {
    state: 0,
    active: true,
  },
};

s.on("connect", (msg) => {
  console.log("A new connection has been established");
});

s.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});

s.on("update", (newState) => {
  console.log(newState);
});

s.on("refresh", ({ systemIsConnected, users, systemState }) => {
  console.log(systemIsConnected, users, systemState);
  eStatus.innerHTML = `System is ${systemIsConnected ? "" : "not"} connected`;
  eUsers.innerHTML = `Online Users: ${users}`;
  data = systemState;
  draw();
});

// const btn = document.querySelector("button");
// btn.addEventListener("click", (e) => {
//   s.emit("client_msg", "This is a message from the client");
// });

// ==================== Canvas ========================= //

const canvasContainer = document.querySelector(".layout div");
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let width = canvasContainer.clientWidth;
let height = canvasContainer.clientHeight;

window.addEventListener("DOMContentLoaded", () => {});

document.onreadystatechange = () => {
  if (document.readyState == "complete") {
    canvas.style.visibility = "visible";
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    canvas.width = width;
    canvas.height = height;
    draw();
  }
};

window.addEventListener("resize", resizeCanvas, false);

function resizeCanvas() {
  width = canvas.parentElement.clientWidth;
  height = canvas.parentElement.clientHeight;
  canvas.width = width;
  canvas.height = height;
  draw();
}

const draw = () => {
  let {
    TL_I1_NS,
    TL_I1_SN,
    TL_I1_EW,
    TL_I1_WE,
    TL_I2_NS,
    TL_I2_SN,
    TL_I2_EW,
    TL_I2_WE,
    TL_X1_EW,
    TL_X1_WE,
    BG_X1,
  } = data;
  const padding = 10;
  // Draw the background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  let x = width * 0.5;
  let y = height * 0.5;
  let roadWidth = width - padding * 2;
  let roadHeight = roadWidth / 9;

  const roadColor = "black";
  const lineColor = "#404040";
  // Drow the main road
  drawRoad(x, y, roadWidth, roadHeight, roadColor);
  drawRoad(x, y, roadWidth, 2, lineColor);

  // Draw train intersection
  drawRoad(x, y, roadHeight, roadWidth * 0.5, roadColor);
  drawRoad(x, y, 2, roadWidth * 0.5, lineColor);

  // Draw traffic intersection 1
  drawRoad(x * 0.4, y, roadHeight, roadWidth * 0.5, roadColor);
  drawRoad(x * 0.4, y, 2, roadWidth * 0.5, lineColor);
  drawRoad(x * 0.4, y, roadHeight, roadWidth * 0.11, roadColor);

  // Draw traffic intersection 2
  drawRoad(x * 1.6, y, roadHeight, roadWidth * 0.5, roadColor);
  drawRoad(x * 1.6, y, 2, roadWidth * 0.5, lineColor);
  drawRoad(x * 1.6, y, roadHeight, roadWidth * 0.11, roadColor);

  // Draw boom gates
  drawRoad(x * 0.88, y, roadWidth * 0.005, roadWidth * 0.1, colors[BG_X1?.state]);
  drawRoad(x * 1.12, y, roadWidth * 0.005, roadWidth * 0.1, colors[BG_X1?.state]);

  // Draw traffic light
  const UP = 180;
  const DOWN = 1;
  const LEFT = 90;
  const RIGHT = -LEFT;

  // Draw traffic lights on the main road
  let xOffset = 0.25;
  let yOffset = 0.11;
  drawTrafficLight(
    x * xOffset,
    y - x * yOffset,
    width,
    height,
    LEFT,
    null,
    colors[TL_I1_NS?.state],
    colors[TL_I1_NS?.pl_state]
  );
  drawTrafficLight(
    x * xOffset,
    y + x * yOffset,
    width,
    height,
    RIGHT,
    null,
    colors[TL_I1_SN?.state],
    colors[TL_I1_SN?.pl_state]
  );

  xOffset = 0.55;
  drawTrafficLight(
    x * xOffset,
    y - x * yOffset,
    width,
    height,
    LEFT,
    null,
    colors[TL_I1_NS?.state],
    colors[TL_I1_NS?.pl_state]
  );
  drawTrafficLight(
    x * xOffset,
    y + x * yOffset,
    width,
    height,
    RIGHT,
    null,
    colors[TL_I1_SN?.state],
    colors[TL_I1_SN?.pl_state]
  );

  xOffset = 1.45;
  drawTrafficLight(
    x * xOffset,
    y - x * yOffset,
    width,
    height,
    LEFT,
    null,
    colors[TL_I2_NS?.state],
    colors[TL_I2_NS?.pl_state]
  );
  drawTrafficLight(
    x * xOffset,
    y + x * yOffset,
    width,
    height,
    RIGHT,
    null,
    colors[TL_I2_SN?.state],
    colors[TL_I2_SN?.pl_state]
  );

  xOffset = 1.75;
  drawTrafficLight(
    x * xOffset,
    y - x * yOffset,
    width,
    height,
    LEFT,
    null,
    colors[TL_I2_NS?.state],
    colors[TL_I2_NS?.pl_state]
  );
  drawTrafficLight(
    x * xOffset,
    y + x * yOffset,
    width,
    height,
    RIGHT,
    null,
    colors[TL_I2_SN?.state],
    colors[TL_I2_SN?.pl_state]
  );

  // Draw traffic light on the train intersections (X1)
  xOffset = 1.11;
  yOffset = 0.3;
  drawTrafficLight(x * xOffset, y - x * yOffset, width, height, UP, null, colors[TL_X1_EW?.state], null, false);
  drawTrafficLight(
    x * (xOffset - 0.22),
    y - x * (yOffset - 0.6),
    width,
    height,
    DOWN,
    null,
    colors[TL_X1_WE?.state],
    null,
    false
  );

  // Draw traffic light on the intersection 1
  xOffset = 0.51;
  yOffset = 0.16;
  drawTrafficLight(
    x * xOffset,
    y - x * yOffset,
    width,
    height,
    UP,
    null,
    colors[TL_I1_EW?.state],
    colors[TL_I1_EW?.pl_state]
  );
  drawTrafficLight(
    x * (xOffset - 0.22),
    y - x * yOffset,
    width,
    height,
    DOWN,
    null,
    colors[TL_I1_WE?.state],
    colors[TL_I1_WE?.pl_state]
  );

  drawTrafficLight(
    x * xOffset,
    y + x * yOffset,
    width,
    height,
    UP,
    null,
    colors[TL_I1_EW?.state],
    colors[TL_I1_EW?.pl_state]
  );
  drawTrafficLight(
    x * (xOffset - 0.22),
    y + x * yOffset,
    width,
    height,
    DOWN,
    null,
    colors[TL_I1_WE?.state],
    colors[TL_I1_WE?.pl_state]
  );

  // Draw traffic light on the intersection 2
  xOffset = 1.71;
  drawTrafficLight(
    x * xOffset,
    y - x * yOffset,
    width,
    height,
    UP,
    null,
    colors[TL_I2_EW?.state],
    colors[TL_I2_EW?.pl_state]
  );
  drawTrafficLight(
    x * (xOffset - 0.22),
    y - x * yOffset,
    width,
    height,
    DOWN,
    null,
    colors[TL_I2_WE?.state],
    colors[TL_I2_WE?.pl_state]
  );

  drawTrafficLight(
    x * xOffset,
    y + x * yOffset,
    width,
    height,
    UP,
    null,
    colors[TL_I2_EW?.state],
    colors[TL_I2_EW?.pl_state]
  );
  drawTrafficLight(
    x * (xOffset - 0.22),
    y + x * yOffset,
    width,
    height,
    DOWN,
    null,
    colors[TL_I2_WE?.state],
    colors[TL_I2_WE?.pl_state]
  );
};

const drawRoad = (x, y, width, height, color) => {
  ctx.save();
  let roadX = x;
  let roadY = y;
  let roadWidth = width;
  let roadHeight = height;
  ctx.fillStyle = color;
  ctx.translate(roadX, roadY);
  ctx.fillRect(-roadWidth * 0.5, -roadHeight * 0.5, roadWidth, roadHeight);
  ctx.restore();
};

const drawTrafficLight = (x, y, width, height, angle, flip, tColor, pColor, pCrossing = true) => {
  ctx.save();

  let r = width * 0.01;
  let invert = 1;
  if (flip) invert = -1;

  ctx.fillStyle = "grey";
  ctx.translate(x, y);
  ctx.rotate(angle * (Math.PI / 180));

  // Draw cube
  ctx.fillRect(r, -r, -r * 2, r + 1);

  ctx.fillStyle = tColor;
  // Draw traffic light
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();

  if (pCrossing) {
    ctx.fillStyle = pColor;
    // Draw pedestrian crossing light
    ctx.translate(-1, 0);
    ctx.beginPath();
    ctx.moveTo((r + r * 0.6) * invert, -r * 0.5);
    ctx.lineTo(r * invert + 1, 0);
    ctx.lineTo(r * invert + 1, -r);
    ctx.fill();
  }

  ctx.restore();
};

resizeCanvas();
