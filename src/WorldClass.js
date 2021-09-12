import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

class World {
  constructor(trafficLights) {
    this.loader = new GLTFLoader();
    this.scene = new THREE.Scene();
    this.renderer;
    this.camera;
    this.controls;
    this.trafficLights = trafficLights;

    this.roadObj;
    this.trafficLightObj;
    this.trafficLightGroup = new THREE.Group();
    this.trafficLightGroup.name = "trafficLightGroup";

    this.d = 40;
    this.aspect = window.innerWidth / window.innerHeight;

    this.RED_ON = 0xff0000;
    this.RED_OFF = 0x4d0000;

    this.YELLOW_ON = 0xffd000;
    this.YELLOW_OFF = 0x4d3e00;

    this.GREEN_ON = 0x00e025;
    this.GREEN_OFF = 0x003309;
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor("#d1d1d1");
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    document.body.appendChild(this.renderer.domElement);
  }

  createCamera() {
    this.camera = new THREE.OrthographicCamera(
      -this.d * this.aspect,
      this.d * this.aspect,
      this.d,
      -this.d,
      -1000,
      1000
    );
    this.camera.position.set(20, 20, 20); // all components equal
    this.camera.lookAt(this.scene.position); // or the origin
  }

  setupLighting() {
    // Add a light
    let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    let light = new THREE.DirectionalLight(0xffffff, 1, 1000);
    light.castShadow = true;
    light.position.set(100, 200, 1);
    this.scene.add(light);

    //Set up shadow properties for the light
    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default

    const dencity = 50;
    light.shadow.camera.left = -dencity;
    light.shadow.camera.right = dencity;
    light.shadow.camera.top = dencity;
    light.shadow.camera.bottom = -dencity;
    light.shadow.radius = 1000;

    const directLightHelper = new THREE.DirectionalLightHelper(light);
    this.scene.add(directLightHelper);
  }

  addSurface(width = 40, height = 40) {
    // Create the surface
    const gSurface = new THREE.PlaneGeometry(width, height);
    gSurface.rotateX(THREE.MathUtils.degToRad(90));
    const mSurface = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide });
    const plane = new THREE.Mesh(gSurface, mSurface);
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  loadRoad() {
    return new Promise((resolve, reject) => {
      this.loader.load(
        "road.glb",
        (gltf) => {
          gltf.scene.scale.set(3, 3, 3);
          gltf.scene.children[0].material.color.setHex(0x363636);
          gltf.scene.children[0].receiveShadow = true;
          resolve(gltf.scene);
        },
        undefined,
        (error) => {
          console.error(error);
          reject(error);
        }
      );
    });
  }

  loadTrafficLight() {
    return new Promise((resolve, reject) => {
      // traffic light
      this.loader.load(
        "traffic-light.glb",
        (gltf) => {
          gltf.scene.scale.set(2, 2, 2);
          console.log(gltf.scene.children);
          // traffic light holder
          gltf.scene.children[0].material.color.setHex(0x636363);
          // pedestrian red
          gltf.scene.children[1].children[0].material.color.setHex(this.RED_OFF);
          // pedestrian green
          gltf.scene.children[1].children[1].material.color.setHex(this.GREEN_OFF);
          gltf.scene.children[5].children[0].material.color.setHex(this.GREEN_OFF);
          gltf.scene.children[5].children[1].material.color.setHex(this.YELLOW_OFF);
          gltf.scene.children[5].children[2].material.color.setHex(this.RED_OFF);
          gltf.scene.children[1].castShadow = true;
          gltf.scene.children[2].castShadow = true;
          gltf.scene.children[4].castShadow = true;
          gltf.scene.children[6].castShadow = true;
          gltf.scene.children[7].castShadow = true;
          gltf.scene.castShadow = true;
          resolve(gltf.scene);
        },
        undefined,
        (error) => {
          console.error(error);
          reject(error);
        }
      );
    });
  }

  async build() {
    // Create the environement
    this.createRenderer();
    this.createCamera();
    this.setupLighting();

    // Make the scene responsive on window resize
    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.aspect = window.innerWidth / window.innerHeight;
      this.camera.left = -this.d * this.aspect;
      this.camera.right = this.d * this.aspect;
      this.camera.updateProjectionMatrix();
    });

    // Load 3d objects
    this.roadObj = await this.loadRoad();
    this.trafficLightObj = await this.loadTrafficLight();

    // Add 3d objects
    this.addSurface(200, 200);
    this.scene.add(await this.roadObj);

    for (const trafficLight of this.trafficLights) {
      const { name, position, rotation, tl_state, pl_state, flipX, flipY } = trafficLight;

      // Create a clone of the original traffic light object
      const trafficLightInstance = this.trafficLightObj.clone();
      trafficLightInstance.traverse((obj) => {
        if (obj.isMesh) obj.material = obj.material.clone();
      });

      // set name
      trafficLightInstance.name = name;

      // set position
      trafficLightInstance.position.set(position[0], position[1], position[2]);

      // set rotation
      trafficLightInstance.rotateX(THREE.Math.degToRad(rotation[0]));
      trafficLightInstance.rotateY(THREE.Math.degToRad(rotation[1]));
      trafficLightInstance.rotateZ(THREE.Math.degToRad(rotation[2]));

      // set flip (if true)
      const scale = new THREE.Vector3(1, 1, 1);
      if (flipX) scale.x *= -1;
      if (flipY) scale.z *= -1;
      trafficLightInstance.scale.multiply(scale);

      // set pedestrian crossing light state
      if (pl_state === "red") {
        trafficLightInstance.children[1].children[0].material.color.setHex(this.RED_ON);
        trafficLightInstance.children[1].children[1].material.color.setHex(this.GREEN_OFF);
      } else if (pl_state === "green") {
        trafficLightInstance.children[1].children[0].material.color.setHex(this.RED_OFF);
        trafficLightInstance.children[1].children[1].material.color.setHex(this.GREEN_ON);
      } else {
        trafficLightInstance.children[1].children[0].material.color.setHex(this.RED_OFF);
        trafficLightInstance.children[1].children[1].material.color.setHex(this.GREEN_OFF);
      }

      if (tl_state === "red") {
        trafficLightInstance.children[5].children[0].material.color.setHex(this.GREEN_ON);
        trafficLightInstance.children[5].children[1].material.color.setHex(this.YELLOW_OFF);
        trafficLightInstance.children[5].children[2].material.color.setHex(this.RED_OFF);
      } else if (tl_state === "yellow") {
        trafficLightInstance.children[5].children[0].material.color.setHex(this.GREEN_OFF);
        trafficLightInstance.children[5].children[1].material.color.setHex(this.YELLOW_ON);
        trafficLightInstance.children[5].children[2].material.color.setHex(this.RED_OFF);
      } else if (tl_state === "red") {
        trafficLightInstance.children[5].children[0].material.color.setHex(this.GREEN_OFF);
        trafficLightInstance.children[5].children[1].material.color.setHex(this.YELLOW_OFF);
        trafficLightInstance.children[5].children[2].material.color.setHex(this.RED_ON);
      } else {
        trafficLightInstance.children[5].children[0].material.color.setHex(this.GREEN_OFF);
        trafficLightInstance.children[5].children[1].material.color.setHex(this.YELLOW_OFF);
        trafficLightInstance.children[5].children[2].material.color.setHex(this.RED_OFF);
      }
      console.log(trafficLightInstance);
      this.trafficLightGroup.add(trafficLightInstance);
    }
    this.scene.add(this.trafficLightGroup);

    // helpers
    const gridHelper = new THREE.GridHelper(200, 50);
    this.scene.add(gridHelper);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.screenSpacePanning = true;
  }

  updateState(name, { tl_state, pl_state }) {
    const trafficLight = this.trafficLightGroup.getObjectByName(name);

    if (!trafficLight) {
      console.log(trafficLight);
      console.log("Traffic Light with this name: " + name + " is not found!");
      return;
    }

    if (pl_state === "red") {
      trafficLight.children[1].children[0].material.color.setHex(this.RED_ON);
      trafficLight.children[1].children[1].material.color.setHex(this.GREEN_OFF);
    } else if (pl_state === "green") {
      trafficLight.children[1].children[0].material.color.setHex(this.RED_OFF);
      trafficLight.children[1].children[1].material.color.setHex(this.GREEN_ON);
    }

    if (tl_state === "green") {
      trafficLight.children[5].children[0].material.color.setHex(this.GREEN_ON);
      trafficLight.children[5].children[1].material.color.setHex(this.YELLOW_OFF);
      trafficLight.children[5].children[2].material.color.setHex(this.RED_OFF);
    } else if (tl_state === "yellow") {
      trafficLight.children[5].children[0].material.color.setHex(this.GREEN_OFF);
      trafficLight.children[5].children[1].material.color.setHex(this.YELLOW_ON);
      trafficLight.children[5].children[2].material.color.setHex(this.RED_OFF);
    } else if (tl_state === "red") {
      trafficLight.children[5].children[0].material.color.setHex(this.GREEN_OFF);
      trafficLight.children[5].children[1].material.color.setHex(this.YELLOW_OFF);
      trafficLight.children[5].children[2].material.color.setHex(this.RED_ON);
    }
  }

  render = () => {
    requestAnimationFrame(this.render);
    this.renderer.render(this.scene, this.camera);
  };
}

export { World };
