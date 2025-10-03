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

//
//const cubeString = "BBURUDBFUFFFRRFUUFLULUFUDLRRDBBDBDBLUDDFLLRRBRLLLBRDDF";

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

//parse
function parseCubeString(str) {
  const faces = ["U", "R", "F", "D", "L", "B"];
  let state = {};
  let idx = 0;
  for (let f of faces) {
    state[f] = str.slice(idx, idx + 9).split("");
    idx += 9;
  }
  return state;
}

// apply state
function applyStateToCube(state) {
  const getColor = (ch) => COLORS[ch];

  cubeArray.forEach(cubie => {
    if (cubie.position.x > 0.5) {
      let sticker = state.R.shift();
      cubie.material[0].color.setHex(getColor(sticker));
    }
    if (cubie.position.x < -0.5) {
      let sticker = state.L.shift();
      cubie.material[1].color.setHex(getColor(sticker));
    }
    if (cubie.position.y > 0.5) {
      let sticker = state.U.shift();
      cubie.material[2].color.setHex(getColor(sticker));
    }
    if (cubie.position.y < -0.5) {
      let sticker = state.D.shift();
      cubie.material[3].color.setHex(getColor(sticker));
    }
    if (cubie.position.z > 0.5) {
      let sticker = state.F.shift();
      cubie.material[4].color.setHex(getColor(sticker));
    }
    if (cubie.position.z < -0.5) {
      let sticker = state.B.shift();
      cubie.material[5].color.setHex(getColor(sticker));
    }
  });
}

// === ROTATION SYSTEM ===
let isRotating = false;
let targetRotation = 0;
let currentRotation = 0;
let rotationSpeed = THREE.MathUtils.degToRad(2);
let pivot = new THREE.Group();

function getFaceCubies(face) {
  return cubeArray.filter(cubie => {
    switch(face) {
      case "R": return cubie.position.x > 0.5;
      case "L": return cubie.position.x < -0.5;
      case "U": return cubie.position.y > 0.5;
      case "D": return cubie.position.y < -0.5;
      case "F": return cubie.position.z > 0.5;
      case "B": return cubie.position.z < -0.5;
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
  pivot.position.set(0,0,0);

  let axis;
  switch(face) {
    case "R": case "L": axis = "x"; break;
    case "U": case "D": axis = "y"; break;
    case "F": case "B": axis = "z"; break;
  }

  function animateRotation() {
    if (currentRotation < targetRotation) {
      let step = Math.min(rotationSpeed, targetRotation - currentRotation);
      if (direction < 0) step *= -1;
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
      }
      pivot.rotation.set(0,0,0);

      if (callback) callback();   //  notify when finished
    }
  }

  animateRotation();
}
function performMove(move) {
  return new Promise((resolve) => {
    let face = move[0];
    let dir = +1;
    if (move.endsWith("'")) dir = -1;   // counterclockwise
    rotateFace(face, dir, resolve);
  });
}
let playing = false;

async function playSolution(moves) {
  if (playing) return;
  playing = true;

  for (let move of moves) {
    await performMove(move);
  }

  playing = false;
}

// === BUTTON HANDLERS ===
document.getElementById("Lcw").onclick  = () => performMove("L");
document.getElementById("Lccw").onclick = () => performMove("L'");
document.getElementById("Rcw").onclick  = () => performMove("R");
document.getElementById("Rccw").onclick = () => performMove("R'");
document.getElementById("Ucw").onclick  = () => performMove("U");
document.getElementById("Uccw").onclick = () => performMove("U'");
document.getElementById("Dcw").onclick  = () => performMove("D");
document.getElementById("Dccw").onclick = () => performMove("D'");
document.getElementById("Fcw").onclick  = () => performMove("F");
document.getElementById("Fccw").onclick = () => performMove("F'");
document.getElementById("Bcw").onclick  = () => performMove("B");
document.getElementById("Bccw").onclick = () => performMove("B'");

// main llop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// start
createCube();
fetch("/cube-string")
  .then(res => res.json())
  .then(data => {
    const state = parseCubeString(data.cubeString);
    applyStateToCube(state);
    animate();
  });
document.getElementById("solveBtn").onclick = () => {
  fetch("/solve-cube")
    .then(res => res.json())
    .then(data => {
      if (data.status === "ok") {
        // Split solution string like "R U R' U'" into ["R","U","R'","U'"]
        const moves = data.solution.trim().split(/\s+/);
        console.log("Moves to play:", moves);
        playSolution(moves);
      } else {
        console.error("Solver error:", data.message);
      }
    });
}

