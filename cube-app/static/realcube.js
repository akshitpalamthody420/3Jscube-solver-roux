import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

// color mapping
const COLORS = {
  U: 0xffffff, // white
  R: 0xff0000, // red
  F: 0x00ff00, // green
  D: 0xffff00, // yellow
  L: 0xff8000, // orange
  B: 0x0000ff, // blue
};

// global
const w = window.innerWidth;
const h = window.innerHeight;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
camera.position.z = 6;

const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const cubeArray = [];
let indexCubeArray = 0;

let playing = false;
let currentCubeString = "";
let stickers = [];

// Kociemba face order: U R F D L B
const FACE_ORDER = ["U", "R", "F", "D", "L", "B"];

const FACE_NORMALS = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};

// Coordinate order used to build/read the 54-character Kociemba string
const FACE_COORDS = {
  U: [
    [-1, 1, -1], [0, 1, -1], [1, 1, -1],
    [-1, 1, 0],  [0, 1, 0],  [1, 1, 0],
    [-1, 1, 1],  [0, 1, 1],  [1, 1, 1],
  ],

  R: [
    [1, 1, 1],  [1, 1, 0],  [1, 1, -1],
    [1, 0, 1],  [1, 0, 0],  [1, 0, -1],
    [1, -1, 1], [1, -1, 0], [1, -1, -1],
  ],

  F: [
    [-1, 1, 1], [0, 1, 1], [1, 1, 1],
    [-1, 0, 1], [0, 0, 1], [1, 0, 1],
    [-1, -1, 1], [0, -1, 1], [1, -1, 1],
  ],

  D: [
    [-1, -1, 1], [0, -1, 1], [1, -1, 1],
    [-1, -1, 0], [0, -1, 0], [1, -1, 0],
    [-1, -1, -1], [0, -1, -1], [1, -1, -1],
  ],

  L: [
    [-1, 1, -1], [-1, 1, 0], [-1, 1, 1],
    [-1, 0, -1], [-1, 0, 0], [-1, 0, 1],
    [-1, -1, -1], [-1, -1, 0], [-1, -1, 1],
  ],

  B: [
    [1, 1, -1], [0, 1, -1], [-1, 1, -1],
    [1, 0, -1], [0, 0, -1], [-1, 0, -1],
    [1, -1, -1], [0, -1, -1], [-1, -1, -1],
  ],
};

function sameVec(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function initStickerModel(cubeString) {
  stickers = [];

  let index = 0;

  for (const face of FACE_ORDER) {
    for (let i = 0; i < 9; i++) {
      stickers.push({
        color: cubeString[index],
        pos: [...FACE_COORDS[face][i]],
        normal: [...FACE_NORMALS[face]],
      });

      index++;
    }
  }

  currentCubeString = cubeString;
}

function stickerModelToCubeString() {
  let result = "";

  for (const face of FACE_ORDER) {
    const normal = FACE_NORMALS[face];

    for (const coord of FACE_COORDS[face]) {
      const sticker = stickers.find(s =>
        sameVec(s.pos, coord) && sameVec(s.normal, normal)
      );

      if (!sticker) {
        throw new Error(`Missing sticker for face ${face} at ${coord.join(",")}`);
      }

      result += sticker.color;
    }
  }

  return result;
}

function rotateVector(vec, axis, dir) {
  const [x, y, z] = vec;

  if (axis === "x") {
    return dir === 1
      ? [x, -z, y]
      : [x, z, -y];
  }

  if (axis === "y") {
    return dir === 1
      ? [z, y, -x]
      : [-z, y, x];
  }

  if (axis === "z") {
    return dir === 1
      ? [-y, x, z]
      : [y, -x, z];
  }

  return vec;
}

function getMoveAxis(face) {
  if (face === "R" || face === "L") return "x";
  if (face === "U" || face === "D") return "y";
  if (face === "F" || face === "B") return "z";
  throw new Error(`Invalid face: ${face}`);
}

function getMoveLayer(face) {
  switch (face) {
    case "R": return 1;
    case "L": return -1;
    case "U": return 1;
    case "D": return -1;
    case "F": return 1;
    case "B": return -1;
    default: throw new Error(`Invalid face: ${face}`);
  }
}

// Direction mapping for Kociemba/Singmaster notation in this coordinate system
function getMoveDirection(move) {
  const face = move[0];
  const isPrime = move.endsWith("'");

  const clockwiseDirection = {
    R: -1,
    L: 1,
    U: -1,
    D: 1,
    F: -1,
    B: 1,
  };

  let dir = clockwiseDirection[face];

  if (isPrime) {
    dir *= -1;
  }

  return dir;
}

function applyLogicalSingleMove(move) {
  const face = move[0];
  const axis = getMoveAxis(face);
  const layer = getMoveLayer(face);
  const dir = getMoveDirection(move);

  const axisIndex = { x: 0, y: 1, z: 2 }[axis];

  stickers.forEach(sticker => {
    if (sticker.pos[axisIndex] === layer) {
      sticker.pos = rotateVector(sticker.pos, axis, dir);
      sticker.normal = rotateVector(sticker.normal, axis, dir);
    }
  });

  currentCubeString = stickerModelToCubeString();
}

function applyLogicalMove(move) {
  if (move.endsWith("2")) {
    applyLogicalSingleMove(move[0]);
    applyLogicalSingleMove(move[0]);
  } else {
    applyLogicalSingleMove(move);
  }

  console.log("Current Kociemba cube string:", currentCubeString);
}

// create cube
function createCube() {
  const geo = new THREE.BoxGeometry(0.95, 0.95, 0.95);

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const faceMaterials = [
          new THREE.MeshBasicMaterial({ color: 0x000000 }), // Right
          new THREE.MeshBasicMaterial({ color: 0x000000 }), // Left
          new THREE.MeshBasicMaterial({ color: 0x000000 }), // Up
          new THREE.MeshBasicMaterial({ color: 0x000000 }), // Down
          new THREE.MeshBasicMaterial({ color: 0x000000 }), // Front
          new THREE.MeshBasicMaterial({ color: 0x000000 })  // Back
        ];

        const cubie = new THREE.Mesh(geo, faceMaterials);
        cubie.position.set(x * 1.05, y * 1.05, z * 1.05);

        scene.add(cubie);
        cubeArray[indexCubeArray++] = cubie;
      }
    }
  }
}

// parse cube string
function parseCubeString(str) {
  const faces = ["U", "R", "F", "D", "L", "B"];
  const state = {};
  let idx = 0;

  for (const f of faces) {
    state[f] = str.slice(idx, idx + 9).split("");
    idx += 9;
  }

  return state;
}

// apply state to visible cube
function applyStateToCube(state) {
  const getColor = (ch) => COLORS[ch];

  cubeArray.forEach(cubie => {
    if (cubie.position.x > 0.5) {
      const sticker = state.R.shift();
      cubie.material[0].color.setHex(getColor(sticker));
    }

    if (cubie.position.x < -0.5) {
      const sticker = state.L.shift();
      cubie.material[1].color.setHex(getColor(sticker));
    }

    if (cubie.position.y > 0.5) {
      const sticker = state.U.shift();
      cubie.material[2].color.setHex(getColor(sticker));
    }

    if (cubie.position.y < -0.5) {
      const sticker = state.D.shift();
      cubie.material[3].color.setHex(getColor(sticker));
    }

    if (cubie.position.z > 0.5) {
      const sticker = state.F.shift();
      cubie.material[4].color.setHex(getColor(sticker));
    }

    if (cubie.position.z < -0.5) {
      const sticker = state.B.shift();
      cubie.material[5].color.setHex(getColor(sticker));
    }
  });
}

// === ROTATION SYSTEM ===
let isRotating = false;
let targetRotation = 0;
let currentRotation = 0;
const rotationSpeed = THREE.MathUtils.degToRad(2);
let pivot = new THREE.Group();

function getFaceCubies(face) {
  return cubeArray.filter(cubie => {
    switch (face) {
      case "R": return cubie.position.x > 0.5;
      case "L": return cubie.position.x < -0.5;
      case "U": return cubie.position.y > 0.5;
      case "D": return cubie.position.y < -0.5;
      case "F": return cubie.position.z > 0.5;
      case "B": return cubie.position.z < -0.5;
      default: return false;
    }
  });
}

function rotateFace(face, direction, callback) {
  if (isRotating) return;

  isRotating = true;

  const cubies = getFaceCubies(face);

  targetRotation = THREE.MathUtils.degToRad(90);
  currentRotation = 0;

  pivot = new THREE.Group();
  scene.add(pivot);

  cubies.forEach(c => pivot.attach(c));
  pivot.position.set(0, 0, 0);

  const axis = getMoveAxis(face);

  function animateRotation() {
    if (currentRotation < targetRotation) {
      let step = Math.min(rotationSpeed, targetRotation - currentRotation);

      if (direction < 0) {
        step *= -1;
      }

      pivot.rotation[axis] += step;
      currentRotation += Math.abs(step);

      controls.update();
      renderer.render(scene, camera);

      requestAnimationFrame(animateRotation);
    } else {
      isRotating = false;

      while (pivot.children.length > 0) {
        const child = pivot.children[0];

        child.applyMatrix4(pivot.matrixWorld);
        pivot.remove(child);
        scene.add(child);

        child.position.x = Math.round(child.position.x / 1.05) * 1.05;
        child.position.y = Math.round(child.position.y / 1.05) * 1.05;
        child.position.z = Math.round(child.position.z / 1.05) * 1.05;

        child.rotation.x = Math.round(child.rotation.x / (Math.PI / 2)) * (Math.PI / 2);
        child.rotation.y = Math.round(child.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
        child.rotation.z = Math.round(child.rotation.z / (Math.PI / 2)) * (Math.PI / 2);
      }

      scene.remove(pivot);
      pivot.rotation.set(0, 0, 0);

      if (callback) callback();
    }
  }

  animateRotation();
}

function performMove(move) {
  return new Promise((resolve) => {
    const face = move[0];
    const dir = getMoveDirection(move);

    rotateFace(face, dir, resolve);
  });
}

async function playMoves(moves, updateLogicalState = true) {
  if (playing) return;

  playing = true;

  for (const rawMove of moves) {
    const move = rawMove.trim();

    if (!move) continue;

    await performMove(move);

    if (updateLogicalState) {
      applyLogicalMove(move);
    }
  }

  playing = false;
}

async function playSolution(moves) {
  await playMoves(moves, true);
}

// === BUTTON HANDLERS ===
document.getElementById("Lcw").onclick = () => playMoves(["L"], true);
document.getElementById("Lccw").onclick = () => playMoves(["L'"], true);

document.getElementById("Rcw").onclick = () => playMoves(["R"], true);
document.getElementById("Rccw").onclick = () => playMoves(["R'"], true);

document.getElementById("Ucw").onclick = () => playMoves(["U"], true);
document.getElementById("Uccw").onclick = () => playMoves(["U'"], true);

document.getElementById("Dcw").onclick = () => playMoves(["D"], true);
document.getElementById("Dccw").onclick = () => playMoves(["D'"], true);

document.getElementById("Fcw").onclick = () => playMoves(["F"], true);
document.getElementById("Fccw").onclick = () => playMoves(["F'"], true);

document.getElementById("Bcw").onclick = () => playMoves(["B"], true);
document.getElementById("Bccw").onclick = () => playMoves(["B'"], true);

// Optional: for a move input box with id="moveInput"
window.applyMoveSequence = async function applyMoveSequence() {
  const input = document.getElementById("moveInput");

  if (!input) {
    console.error("No input with id='moveInput' found.");
    return;
  }

  const raw = input.value.trim();

  if (!raw) return;

  const moves = raw.split(/\s+/);

  await playMoves(moves, true);
};

// main loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// start
createCube();

fetch("/cube-string", { cache: "no-store" })
  .then(res => res.json())
  .then(data => {
    currentCubeString = data.cubeString;

    initStickerModel(currentCubeString);

    const state = parseCubeString(currentCubeString);
    applyStateToCube(state);

    console.log("Initial cube string:", currentCubeString);

    animate();
  });

// SOLVE BUTTON: sends current frontend cube state to Kociemba
document.getElementById("solveBtn").onclick = async () => {
  if (playing) return;

  try {
    currentCubeString = stickerModelToCubeString();

    console.log("Sending cube string to Kociemba:");
    console.log(currentCubeString);

    const response = await fetch("/solve-state", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        cubeString: currentCubeString,
      }),
    });

    const data = await response.json();

    if (data.status !== "ok") {
      console.error("Kociemba error:", data);
      alert("Kociemba error: " + data.message);
      return;
    }

    const solutionText = data.solution.trim();

    console.log("Kociemba solution:", solutionText);

    if (!solutionText) {
      console.log("Cube is already solved.");
      return;
    }

    const moves = solutionText.split(/\s+/);

    await playSolution(moves);

    currentCubeString = stickerModelToCubeString();

    console.log("Cube after solution:");
    console.log(currentCubeString);

  } catch (err) {
    console.error(err);
    alert("Error solving cube: " + err.message);
  }
};