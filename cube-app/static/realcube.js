import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

const SOLVED_CUBE_STRING =
  "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

const COLORS = {
  U: 0xffffff, // white
  R: 0xff0000, // red
  F: 0x00ff00, // green
  D: 0xffff00, // yellow
  L: 0xff8000, // orange
  B: 0x0000ff, // blue
};

const w = window.innerWidth;
const h = window.innerHeight;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);

const cubeContainer = document.getElementById("cube-container");
if (cubeContainer) {
  cubeContainer.appendChild(renderer.domElement);
} else {
  document.body.appendChild(renderer.domElement);
}

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

const FACE_ORDER = ["U", "R", "F", "D", "L", "B"];

const FACE_NORMALS = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};

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
      const sticker = stickers.find(
        (s) => sameVec(s.pos, coord) && sameVec(s.normal, normal)
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
    return dir === 1 ? [x, -z, y] : [x, z, -y];
  }

  if (axis === "y") {
    return dir === 1 ? [z, y, -x] : [-z, y, x];
  }

  if (axis === "z") {
    return dir === 1 ? [-y, x, z] : [y, -x, z];
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

  stickers.forEach((sticker) => {
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

  currentCubeString = stickerModelToCubeString();

  console.log("Move applied:", move);
  console.log("Current Kociemba cube string:", currentCubeString);
  console.log("Is solved?", currentCubeString === SOLVED_CUBE_STRING);
}

function createCube() {
  const geo = new THREE.BoxGeometry(0.95, 0.95, 0.95);

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const faceMaterials = [
          new THREE.MeshBasicMaterial({ color: 0x000000 }),
          new THREE.MeshBasicMaterial({ color: 0x000000 }),
          new THREE.MeshBasicMaterial({ color: 0x000000 }),
          new THREE.MeshBasicMaterial({ color: 0x000000 }),
          new THREE.MeshBasicMaterial({ color: 0x000000 }),
          new THREE.MeshBasicMaterial({ color: 0x000000 }),
        ];

        const cubie = new THREE.Mesh(geo, faceMaterials);
        cubie.position.set(x * 1.05, y * 1.05, z * 1.05);

        scene.add(cubie);
        cubeArray[indexCubeArray++] = cubie;
      }
    }
  }
}

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

function getCubieAt(coord) {
  return cubeArray.find((cubie) => {
    const x = Math.round(cubie.position.x / 1.05);
    const y = Math.round(cubie.position.y / 1.05);
    const z = Math.round(cubie.position.z / 1.05);

    return x === coord[0] && y === coord[1] && z === coord[2];
  });
}

function getMaterialIndexForFace(face) {
  switch (face) {
    case "R": return 0; // right material
    case "L": return 1; // left material
    case "U": return 2; // up material
    case "D": return 3; // down material
    case "F": return 4; // front material
    case "B": return 5; // back material
    default: throw new Error(`Invalid face: ${face}`);
  }
}

function applyStateToCube(state) {
  const getColor = (ch) => COLORS[ch] ?? 0x808080;

  // Reset all visible stickers to black first
  cubeArray.forEach((cubie) => {
    for (let i = 0; i < 6; i++) {
      cubie.material[i].color.setHex(0x000000);
    }
  });

  // Apply stickers using exact Kociemba coordinate mapping
  for (const face of FACE_ORDER) {
    const materialIndex = getMaterialIndexForFace(face);

    for (let i = 0; i < 9; i++) {
      const coord = FACE_COORDS[face][i];
      const sticker = state[face][i];

      const cubie = getCubieAt(coord);

      if (!cubie) {
        console.error(`No cubie found for ${face} sticker ${i} at`, coord);
        continue;
      }

      cubie.material[materialIndex].color.setHex(getColor(sticker));
    }
  }
}

let isRotating = false;
let targetRotation = 0;
let currentRotation = 0;
const rotationSpeed = THREE.MathUtils.degToRad(2);
let pivot = new THREE.Group();

function getFaceCubies(face) {
  return cubeArray.filter((cubie) => {
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

  cubies.forEach((c) => pivot.attach(c));
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

        child.rotation.x =
          Math.round(child.rotation.x / (Math.PI / 2)) * (Math.PI / 2);
        child.rotation.y =
          Math.round(child.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
        child.rotation.z =
          Math.round(child.rotation.z / (Math.PI / 2)) * (Math.PI / 2);
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

function expandMove(move) {
  move = move.trim();

  if (!move) return [];

  if (move.endsWith("2")) {
    const face = move[0];
    return [face, face];
  }

  return [move];
}

async function playMoves(moves, updateLogicalState = true) {
  if (playing) return;

  playing = true;

  for (const rawMove of moves) {
    const expandedMoves = expandMove(rawMove);

    for (const move of expandedMoves) {
      await performMove(move);

      if (updateLogicalState) {
        applyLogicalMove(move);
      }
    }
  }

  playing = false;
}

async function playSolution(moves) {
  await playMoves(moves, true);
}

function bindMoveButtons() {
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
}

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

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

async function loadCubeFromBackend() {
  const res = await fetch("/cube-string", { cache: "no-store" });
  const data = await res.json();

  currentCubeString = data.cubeString;

  initStickerModel(currentCubeString);

  const state = parseCubeString(currentCubeString);
  applyStateToCube(state);

  console.log("Loaded cube string:", currentCubeString);
}

async function solveCurrentCube() {
  if (playing) return;

  try {
    currentCubeString = stickerModelToCubeString();

    console.log("Sending cube string to Kociemba:");
    console.log(currentCubeString);
    console.log("Is solved before solve?", currentCubeString === SOLVED_CUBE_STRING);

    if (currentCubeString === SOLVED_CUBE_STRING) {
      console.log("Cube is already solved. Not calling Kociemba.");
      return;
    }

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
      console.log("Kociemba says cube is already solved.");
      return;
    }

    const moves = solutionText.split(/\s+/);

    await playSolution(moves);

    currentCubeString = stickerModelToCubeString();

    console.log("Cube after solution:", currentCubeString);
    console.log("Solved after solution?", currentCubeString === SOLVED_CUBE_STRING);
  } catch (err) {
    console.error(err);
    alert("Error solving cube: " + err.message);
  }
}

async function scanCube() {
  try {
    const scanResponse = await fetch("/scan-cube", {
      cache: "no-store",
    });

    const scanData = await scanResponse.json();
    console.log("Scan response:", scanData);

    alert(
      "Camera scanner opened. Complete the scan in the camera window, then click OK here to load the scanned cube."
    );

    await loadCubeFromBackend();
  } catch (err) {
    console.error(err);
    alert("Error scanning cube: " + err.message);
  }
}

// ===============================
// MANUAL CUBE ENTRY SYSTEM
// ===============================

const MANUAL_COLOUR_TO_FACE = {
  W: "U",
  R: "R",
  G: "F",
  Y: "D",
  O: "L",
  B: "B",
};

const MANUAL_DISPLAY_COLOURS = {
  W: "white",
  R: "red",
  G: "green",
  Y: "yellow",
  O: "orange",
  B: "blue",
};

const MANUAL_COLOUR_NAMES = {
  W: "White",
  R: "Red",
  G: "Green",
  Y: "Yellow",
  O: "Orange",
  B: "Blue",
};

let selectedManualColour = "W";

const manualFaces = {
  U: Array(9).fill("W"),
  R: Array(9).fill("R"),
  F: Array(9).fill("G"),
  D: Array(9).fill("Y"),
  L: Array(9).fill("O"),
  B: Array(9).fill("B"),
};

function createManualFace(faceKey, title) {
  const face = document.createElement("div");
  face.className = "manualFace";
  face.dataset.face = faceKey;

  const titleEl = document.createElement("div");
  titleEl.className = "manualFaceTitle";
  titleEl.textContent = title;
  face.appendChild(titleEl);

  for (let i = 0; i < 9; i++) {
    const sticker = document.createElement("div");
    sticker.className = "manualSticker";
    sticker.dataset.face = faceKey;
    sticker.dataset.index = i;

    sticker.style.background = MANUAL_DISPLAY_COLOURS[manualFaces[faceKey][i]];

    if (i === 4) {
      sticker.style.outline = "2px solid black";
      sticker.title = "Centre sticker is fixed";
    } else {
      sticker.onclick = () => {
        manualFaces[faceKey][i] = selectedManualColour;
        sticker.style.background = MANUAL_DISPLAY_COLOURS[selectedManualColour];
      };
    }

    face.appendChild(sticker);
  }

  return face;
}

function createSpacer() {
  const spacer = document.createElement("div");
  spacer.className = "manualSpacer";
  return spacer;
}

function createManualCubeGrid() {
  const grid = document.getElementById("manualCubeGrid");

  if (!grid) return;

  grid.innerHTML = "";

  grid.appendChild(createSpacer());
  grid.appendChild(createManualFace("U", "Up"));
  grid.appendChild(createSpacer());
  grid.appendChild(createSpacer());

  grid.appendChild(createManualFace("L", "Left"));
  grid.appendChild(createManualFace("F", "Front"));
  grid.appendChild(createManualFace("R", "Right"));
  grid.appendChild(createManualFace("B", "Back"));

  grid.appendChild(createSpacer());
  grid.appendChild(createManualFace("D", "Down"));
  grid.appendChild(createSpacer());
  grid.appendChild(createSpacer());
}

function manualColoursToKociembaString() {
  const order = ["U", "R", "F", "D", "L", "B"];
  let cubeString = "";

  for (const face of order) {
    for (const colour of manualFaces[face]) {
      cubeString += MANUAL_COLOUR_TO_FACE[colour];
    }
  }

  return cubeString;
}

function validateManualCube() {
  const allColours = [];

  for (const face of ["U", "R", "F", "D", "L", "B"]) {
    allColours.push(...manualFaces[face]);
  }

  const counts = {
    W: 0,
    R: 0,
    G: 0,
    Y: 0,
    O: 0,
    B: 0,
  };

  for (const colour of allColours) {
    counts[colour]++;
  }

  for (const colour of Object.keys(counts)) {
    if (counts[colour] !== 9) {
      return {
        ok: false,
        message: `Invalid cube: ${MANUAL_COLOUR_NAMES[colour]} appears ${counts[colour]} times instead of 9.`,
      };
    }
  }

  return {
    ok: true,
    message: "Manual cube is valid.",
  };
}

function resetManualCube() {
  manualFaces.U = Array(9).fill("W");
  manualFaces.R = Array(9).fill("R");
  manualFaces.F = Array(9).fill("G");
  manualFaces.D = Array(9).fill("Y");
  manualFaces.L = Array(9).fill("O");
  manualFaces.B = Array(9).fill("B");

  createManualCubeGrid();

  const msg = document.getElementById("manualCubeMessage");
  if (msg) msg.textContent = "Manual cube reset.";
}

async function saveManualCube() {
  const msg = document.getElementById("manualCubeMessage");
  const validation = validateManualCube();

  if (!validation.ok) {
    if (msg) msg.textContent = validation.message;
    alert(validation.message);
    return;
  }

  const cubeString = manualColoursToKociembaString();

  console.log("Manual Kociemba cube string:", cubeString);

  const response = await fetch("/save-manual-cube", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      cubeString,
    }),
  });

  const data = await response.json();

  if (data.status !== "ok") {
    if (msg) msg.textContent = data.message;
    alert(data.message);
    return;
  }

  currentCubeString = cubeString;
  initStickerModel(currentCubeString);

  const state = parseCubeString(currentCubeString);
  applyStateToCube(state);

  if (msg) {
    msg.textContent = "Manual cube saved. You can now press Solve Cube.";
  }
}

function bindManualEntry() {
  document.querySelectorAll(".colourBtn").forEach((button) => {
    button.onclick = () => {
      selectedManualColour = button.dataset.colour;

      const selectedText = document.getElementById("selectedColourText");
      if (selectedText) {
        selectedText.textContent = MANUAL_COLOUR_NAMES[selectedManualColour];
      }
    };
  });

  const saveManualCubeBtn = document.getElementById("saveManualCubeBtn");
  if (saveManualCubeBtn) {
    saveManualCubeBtn.onclick = saveManualCube;
  }

  const resetManualCubeBtn = document.getElementById("resetManualCubeBtn");
  if (resetManualCubeBtn) {
    resetManualCubeBtn.onclick = resetManualCube;
  }

  createManualCubeGrid();
}

async function init() {
  createCube();
  bindMoveButtons();
  bindManualEntry();

  const solveBtn = document.getElementById("solveBtn");
  if (solveBtn) {
    solveBtn.onclick = solveCurrentCube;
  }

  const scanBtn = document.getElementById("scanBtn");
  if (scanBtn) {
    scanBtn.onclick = scanCube;
  }

  await loadCubeFromBackend();

  animate();
}

init();