import socket from "socket.io-client";
let s = socket.io({
  path: "/socket/traffic-light-system",
});

const eStatus = document.querySelector(".status");
const eUsers = document.querySelector(".online-users");
const eTime = document.querySelector(".time");

eStatus.innerHTML = "System is not connected";
eStatus.style.color = "red";

eUsers.innerHTML = "Online Users: 0";

function calcTime(city, offset) {
  let d = new Date();
  let utc = d.getTime() + d.getTimezoneOffset() * 60000;
  let nd = new Date(utc + 3600000 * offset);
  return nd.toLocaleString("en-AU");
}


setInterval(() => {
  eTime.innerHTML = calcTime("Melbourne", "+11");
}, 1000);

const colors = { R: "red", S: "red", Y: "yellow", G: "green", W: "red" };
let data = {};
let flashing = false;
let toggleColor = "grey";
let interval;

s.on("connect", (msg) => {
  console.log("A new connection has been established");
});

s.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});

s.on("update", (newState) => {
  console.log(newState);
});

s.on("refresh", ({ systemIsConnected, users, systemStatus }) => {
  console.log(systemIsConnected, users, systemStatus);
  eStatus.innerHTML = `System is ${systemIsConnected ? "" : "not"} connected`;
  eStatus.style.color = systemIsConnected ? "green" : "red";
  eUsers.innerHTML = `Online Users: ${users}`;

  // Process data
  flashing = false;
  for (const node in systemStatus) {
    if (Object.hasOwnProperty.call(systemStatus, node)) {
      const statusRaw = systemStatus[node];
      const status = statusRaw.split(":");

      const currNode = {};

      status.forEach((element) => {
        const arr = element.split("=");
        currNode[arr[0]] = arr[1];
        if (arr[1] == "W") flashing = true;
      });

      data[node] = currNode;
    }
  }
  // data = systemStatus;
  console.log(data);
  if (flashing) {
    interval = setInterval(() => {
      toggleColor = toggleColor == "red"? "grey": "red";
      draw();
    }, 300)
  } else {
    clearInterval(interval);
    draw();

  }
});




const btn = document.querySelector(".send-train-signal-btn");
btn.addEventListener("click", (e) => {
  s.emit("send_command", {
    command: "CMD_INCOMING_TRAIN",
    value: "1",
  });
});

// ==================== Canvas ========================= //

const canvasContainer = document.querySelector(".layout div");
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let sensors = [];

let width = canvasContainer.clientWidth;
let height = canvasContainer.clientHeight;

// Add click event for the sensors
canvas.addEventListener(
  "click",
  (event) => {
    const x = event.pageX - canvas.offsetLeft;
    const y = event.pageY - canvas.offsetTop;
    sensors.forEach((element) => {
      if (
        y + element.height / 2 > element.top &&
        y + element.height / 2 < element.top + element.height &&
        x + element.width / 2 > element.left &&
        x + element.width / 2 < element.left + element.width
      ) {
        alert("Sensor ID: " + element.id);
      }
    });
  },
  false
);

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
    I1,
    I2,
    X1,
  } = data;
  const padding = 10;
  // Draw the background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  // Sensors settings
  sensors = [];
  let sensorWidth = width / 60;
  let sensorHeight = sensorWidth;

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
  drawRoad(x * 0.88, y, roadWidth * 0.005, roadWidth * 0.1, colors[X1?.state]);
  drawRoad(x * 1.12, y, roadWidth * 0.005, roadWidth * 0.1, colors[X1?.state]);

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
    colors[I1?.SS],
    flashing && I1?.PN == "W" ? toggleColor : colors[I1?.PN]
  );
  drawTrafficLight(
    x * xOffset,
    y - x * (yOffset - 0.093),
    width,
    height,
    LEFT,
    null,
    colors[I1?.SR],
    null,
    false
  );
  drawTrafficLight(
    x * xOffset,
    y + x * yOffset,
    width,
    height,
    RIGHT,
    null,
    colors[I1?.NS],
    flashing && I1?.PS == "W" ? toggleColor : colors[I1?.PS]
  );
  drawTrafficLight(
    x * xOffset,
    y + x * (yOffset - 0.093),
    width,
    height,
    RIGHT,
    null,
    colors[I1?.NR],
    null,
    false
  );

  // let xCarSensorLocation = x * xOffset - 15;
  // let yCarSensorLocation = y - x * yOffset + 30;
  // drawRect(xCarSensorLocation, yCarSensorLocation, sensorWidth, sensorHeight, "#323232");
  // sensors.push({
  //   id: "sensor",
  //   top: yCarSensorLocation,
  //   left: xCarSensorLocation,
  //   width: sensorWidth,
  //   height: sensorWidth,
  // });

  xOffset = 0.55;
  drawTrafficLight(
    x * xOffset,
    y - x * yOffset,
    width,
    height,
    LEFT,
    null,
    colors[I1?.SS],
    flashing && I1?.PN == "W" ? toggleColor : colors[I1?.PN]
  );
  drawTrafficLight(
    x * xOffset,
    y - x * (yOffset - 0.093),
    width,
    height,
    LEFT,
    null,
    colors[I1?.SR],
    null,
    false
  );
  drawTrafficLight(
    x * xOffset,
    y + x * yOffset,
    width,
    height,
    RIGHT,
    null,
    colors[I1?.NS],
    flashing && I1?.PS == "W" ? toggleColor : colors[I1?.PS]
  );
  drawTrafficLight(
    x * xOffset,
    y + x * (yOffset - 0.093),
    width,
    height,
    RIGHT,
    null,
    colors[I1?.NR],
    null,
    false
  );

  // xCarSensorLocation = x * xOffset + 15;
  // yCarSensorLocation = y + x * yOffset - 30;
  // drawRect(xCarSensorLocation, yCarSensorLocation, sensorWidth, sensorHeight, "#323232");
  // sensors.push({
  //   id: "sensor",
  //   top: yCarSensorLocation,
  //   left: xCarSensorLocation,
  //   width: sensorWidth,
  //   height: sensorWidth,
  // });

  xOffset = 1.45;
  drawTrafficLight(
    x * xOffset,
    y - x * yOffset,
    width,
    height,
    LEFT,
    null,
    colors[I2?.SS],
    flashing && I2?.PN == "W" ? toggleColor : colors[I2?.PN]
  );
  drawTrafficLight(
    x * xOffset,
    y - x * (yOffset - 0.093),
    width,
    height,
    LEFT,
    null,
    colors[I2?.SR],
    null,
    false
  );
  drawTrafficLight(
    x * xOffset,
    y + x * yOffset,
    width,
    height,
    RIGHT,
    null,
    colors[I2?.NS],
    flashing && I2?.PS == "W" ? toggleColor : colors[I2?.PS]
  );
  drawTrafficLight(
    x * xOffset,
    y + x * (yOffset - 0.093),
    width,
    height,
    RIGHT,
    null,
    colors[I2?.NR],
    null,
    false
  );

  // xCarSensorLocation = x * xOffset - 15;
  // yCarSensorLocation = y - x * yOffset + 30;
  // drawRect(xCarSensorLocation, yCarSensorLocation, sensorWidth, sensorHeight, "#323232");
  // sensors.push({
  //   id: "sensor",
  //   top: yCarSensorLocation,
  //   left: xCarSensorLocation,
  //   width: sensorWidth,
  //   height: sensorWidth,
  // });

  xOffset = 1.75;
  drawTrafficLight(
    x * xOffset,
    y - x * yOffset,
    width,
    height,
    LEFT,
    null,
    colors[I2?.SS],
    flashing && I2?.PN == "W" ? toggleColor : colors[I2?.PN]
  );
  drawTrafficLight(
    x * xOffset,
    y - x * (yOffset - 0.093),
    width,
    height,
    LEFT,
    null,
    colors[I2?.SR],
    null,
    false
  );
  drawTrafficLight(
    x * xOffset,
    y + x * yOffset,
    width,
    height,
    RIGHT,
    null,
    colors[I2?.NS],
    flashing && I2?.PS == "W" ? toggleColor : colors[I2?.PS]
  );
  drawTrafficLight(
    x * xOffset,
    y + x * (yOffset - 0.093),
    width,
    height,
    RIGHT,
    null,
    colors[I2?.NR],
    null,
    false
  );

  // xCarSensorLocation = x * xOffset + 15;
  // yCarSensorLocation = y + x * yOffset - 30;
  // drawRect(xCarSensorLocation, yCarSensorLocation, sensorWidth, sensorHeight, "#323232");
  // sensors.push({
  //   id: "sensor",
  //   top: yCarSensorLocation,
  //   left: xCarSensorLocation,
  //   width: sensorWidth,
  //   height: sensorWidth,
  // });

  // Draw traffic light on the train intersections (X1)
  xOffset = 1.11;
  yOffset = 0.3;
  drawTrafficLight(x * xOffset, y - x * yOffset, width, height, UP, null, colors[X1?.WS], null, false);
  drawTrafficLight(
    x * (xOffset - 0.22),
    y - x * (yOffset - 0.6),
    width,
    height,
    DOWN,
    null,
    colors[X1?.ES],
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
    colors[I1?.WS],
    flashing && I1?.PE == "W" ? toggleColor : colors[I1?.PE]
  );
  drawTrafficLight(
    x * (xOffset - 0.093),
    y - x * yOffset,
    width,
    height,
    UP,
    null,
    colors[I1?.WR],
    null,
    false
  );
  drawTrafficLight(
    x * (xOffset - 0.22),
    y - x * yOffset,
    width,
    height,
    DOWN,
    null,
    colors[I1?.ES],
    flashing && I1?.PW == "W" ? toggleColor : colors[I1?.PW]
  );
  drawTrafficLight(
    x * (xOffset - 0.22 + 0.093),
    y - x * yOffset,
    width,
    height,
    DOWN,
    null,
    colors[I1?.ER],
    null,
    false
  );

  drawTrafficLight(
    x * xOffset,
    y + x * yOffset,
    width,
    height,
    UP,
    null,
    colors[I1?.WS],
    flashing && I1?.PE == "W" ? toggleColor : colors[I1?.PE]
  );
  drawTrafficLight(
    x * (xOffset - 0.093),
    y + x * yOffset,
    width,
    height,
    UP,
    null,
    colors[I1?.WR],
    null,
    false
  );
  drawTrafficLight(
    x * (xOffset - 0.22),
    y + x * yOffset,
    width,
    height,
    DOWN,
    null,
    colors[I1?.ES],
    flashing && I1?.PW == "W" ? toggleColor : colors[I1?.PW]
  );
  drawTrafficLight(
    x * (xOffset - 0.22 + 0.093),
    y + x * yOffset,
    width,
    height,
    DOWN,
    null,
    colors[I1?.ER],
    null,
    false
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
    colors[I2?.WS],
    flashing && I2?.PE == "W" ? toggleColor : colors[I2?.PE]
  );
  drawTrafficLight(
    x * (xOffset - 0.093),
    y - x * yOffset,
    width,
    height,
    UP,
    null,
    colors[I2?.WR],
    null,
    false
  );
  drawTrafficLight(
    x * (xOffset - 0.22),
    y - x * yOffset,
    width,
    height,
    DOWN,
    null,
    colors[I2?.ES],
    flashing && I2?.PW == "W" ? toggleColor : colors[I2?.PW]
  );
  drawTrafficLight(
    x * (xOffset - 0.22 + 0.093),
    y - x * yOffset,
    width,
    height,
    DOWN,
    null,
    colors[I2?.ER],
    null,
    false
  );

  drawTrafficLight(
    x * xOffset,
    y + x * yOffset,
    width,
    height,
    UP,
    null,
    colors[I2?.WS],
    flashing && I2?.PE == "W" ? toggleColor : colors[I2?.PE]
  );
  drawTrafficLight(
    x * (xOffset - 0.093),
    y + x * yOffset,
    width,
    height,
    UP,
    null,
    colors[I2?.WR],
    null,
    false
  );
  drawTrafficLight(
    x * (xOffset - 0.22),
    y + x * yOffset,
    width,
    height,
    DOWN,
    null,
    colors[I2?.ES],
    flashing && I2?.PW == "W" ? toggleColor : colors[I2?.PW]
  );

  drawTrafficLight(
    x * (xOffset - 0.22 + 0.093),
    y + x * yOffset,
    width,
    height,
    DOWN,
    null,
    colors[I2?.ER],
    null,
    false
  );

  drawDirections(0, 0, width, height);
};

const drawDirections = (x, y, width, height) => {
  ctx.fillStyle = "black";
  const leftBase = 20;
  const topBase = height - 100;
  const rectWidth = 70;
  const rectThickness = 3;
  ctx.font = "20px Arial";
  ctx.fillText("N", leftBase + 10, topBase + 41);
  ctx.fillRect(leftBase + 30, topBase + 33, rectWidth, rectThickness);
  ctx.font = "15px Arial";
  ctx.fillText("S", leftBase + 20 + rectWidth + 15, topBase + 40);

  ctx.fillText("E", leftBase + 33 + (rectWidth / 2 - 8), topBase - 10);
  ctx.fillRect(leftBase + 30 + (rectWidth / 2 - 1.5), topBase, rectThickness, rectWidth);
  ctx.fillText("W", leftBase + 33 + (rectWidth / 2 - 10), topBase + rectWidth + 20);
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

const drawRect = drawRoad;

const drawTrafficLight = (x, y, width, height, angle, flip, tColor, pColor, pCrossing = true) => {
  ctx.save();

  let r = width * 0.007;
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
