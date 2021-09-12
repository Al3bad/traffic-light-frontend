import { World } from "./WorldClass.js";

const trafficLights = [
  {
    name: "TL-R3-SN-1",
    position: [58, 0, 7],
    rotation: [0, 90, 0],
    flipX: true,
    tl_state: "red",
    pl_state: "red",
    active: true,
  },
  {
    name: "TL-R3-NW-1",
    position: [57, 0, -7],
    rotation: [0, -90, 0],
    flipX: true,
    tl_state: "yellow",
    pl_state: "red",
    active: true,
  },
  {
    name: "TL-R3-SN-2",
    position: [58 - 21, 0, 7],
    rotation: [0, 90, 0],
    flipX: true,
    tl_state: "red",
    pl_state: "red",
    active: true,
  },
  {
    name: "TL-R3-NW-2",
    position: [57 - 21, 0, -7],
    rotation: [0, -90, 0],
    flipX: true,
    tl_state: "yellow",
    pl_state: "red",
    active: true,
  },
  {
    name: "TL-R3-SN-3",
    position: [-57 + 21, 0, 7],
    rotation: [0, 90, 0],
    flipX: true,
    tl_state: "red",
    pl_state: "red",
    active: true,
  },
  {
    name: "TL-R3-NW-3",
    position: [-58 + 21, 0, -7],
    rotation: [0, -90, 0],
    flipX: true,
    tl_state: "yellow",
    pl_state: "red",
    active: true,
  },
  {
    name: "TL-R3-SN-4",
    position: [-57, 0, 7],
    rotation: [0, 90, 0],
    flipX: true,
    tl_state: "red",
    pl_state: "red",
    active: true,
  },
  {
    name: "TL-R3-NW-4",
    position: [-58, 0, -7],
    rotation: [0, -90, 0],
    flipX: true,
    tl_state: "yellow",
    pl_state: "red",
    active: true,
  },
];

const world = new World(trafficLights);

(async () => {
  await world.build();
  world.render();
  world.updateState("TL-R3-NW-2", { tl_state: "red" });
})();
