import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 10;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 3;

const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;



const cubeArray = new Array(27);
let indexCubeArray = 0;

function createCube(){
const cubeGroup = new THREE.Group();
scene.add(cubeGroup);


const geo = new THREE.BoxGeometry(1, 1, 1);
const mat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  flatShading: true,
});

const COLORS = {
  R: 0xff0000,   // Right (+X) - Red
  L: 0xffa500,   // Left (–X) - Orange
  U: 0xffffff,   // Up (+Y) - White
  D: 0xffff00,   // Down (–Y) - Yellow
  F: 0x00ff00,   // Front (+Z) - green
  B: 0x0000ff    // Back (–Z) - blue
};
for(let x= -1; x<=1;x++){
    for (let y = -1; y <= 1; y++){
        for (let z = -1; z <= 1; z++){


          

         
            

            const faceMaterials = [
        new THREE.MeshBasicMaterial({ color: x === 1 ? COLORS.R : 0x000000 }), // Right
        new THREE.MeshBasicMaterial({ color: x === -1 ? COLORS.L : 0x000000 }), // Left
        new THREE.MeshBasicMaterial({ color: y === 1 ? COLORS.U : 0x000000 }), // Top
        new THREE.MeshBasicMaterial({ color: y === -1 ? COLORS.D : 0x000000 }), // Bottom
        new THREE.MeshBasicMaterial({ color: z === 1 ? COLORS.F : 0x000000 }), // Front
        new THREE.MeshBasicMaterial({ color: z === -1 ? COLORS.B : 0x000000 })  // Back
      ];
            const cubie = new THREE.Mesh(geo, faceMaterials);
            cubie.position.set(x * 1.05, y * 1.05, z * 1.05);
            cubeGroup.add(cubie);
            cubeArray[indexCubeArray++] = cubie;
            console.log(cubeArray[indexCubeArray-1])
            

        }

    }
}

} 
let isRotating = false;
let targetRotation = 0;
let currentRotation = 0;
let rotationSpeed = THREE.MathUtils.degToRad(2);
let rotationSpeedother = THREE.MathUtils.degToRad(-2); // Smoothness

 let pivot = new THREE.Group();
function getFaceCubies(face) {
  return cubeArray.filter(cubie => {
    switch(face) {
      case "R": return cubie.position.x > 0.5;   // Right face
      case "L": return cubie.position.x < -0.5;  // Left face
      case "U": return cubie.position.y > 0.5;   // Up
      case "D": return cubie.position.y < -0.5;  // Down
      case "F": return cubie.position.z > 0.5;   // Front
      case "B": return cubie.position.z < -0.5;  // Back
    }
  });
}

function rotateFace(face, direction) {
  if (isRotating) return; // Prevent overlapping moves
  isRotating = true;

  const cubies = getFaceCubies(face);
  targetRotation = THREE.MathUtils.degToRad(90);
  currentRotation = 0;

  // Reset pivot
  pivot = new THREE.Group();
  scene.add(pivot);

  // Attach cubies to pivot
  cubies.forEach(c => pivot.attach(c));

  // Set pivot position at cube center
  pivot.position.set(0,0,0);

  // Axis depends on face
  let axis;
  switch(face) {
    case "R": case "L": axis = "x"; break;
    case "U": case "D": axis = "y"; break;
    case "F": case "B": axis = "z"; break;
  }

  function animateRotation() {
    if (currentRotation < targetRotation) {
      let step = Math.min(rotationSpeed, targetRotation - currentRotation);
      if (direction < 0) step *= -1; // Flip for CCW
      pivot.rotation[axis] += step;
      currentRotation += Math.abs(step);

      controls.update();
      renderer.render(scene, camera);

      requestAnimationFrame(animateRotation);
    } else {
      targetRotation = 0;
      currentRotation = 0;
      isRotating = false;

      // Re-parent cubies
      while (pivot.children.length > 0) {
        const child = pivot.children[0];
        child.applyMatrix4(pivot.matrixWorld);
        pivot.remove(child);
        scene.add(child);
      }
      pivot.rotation.set(0,0,0);
    }
  }

  animateRotation();
}

document.getElementById("Lcw").onclick  = () => rotateFace("L", +1);
document.getElementById("Lccw").onclick = () => rotateFace("L", -1);

document.getElementById("Rcw").onclick  = () => rotateFace("R", +1);
document.getElementById("Rccw").onclick = () => rotateFace("R", -1);

document.getElementById("Ucw").onclick  = () => rotateFace("U", +1);
document.getElementById("Uccw").onclick = () => rotateFace("U", -1);

document.getElementById("Dcw").onclick  = () => rotateFace("D", +1);
document.getElementById("Dccw").onclick = () => rotateFace("D", -1);

document.getElementById("Fcw").onclick  = () => rotateFace("F", +1);
document.getElementById("Fccw").onclick = () => rotateFace("F", -1);

document.getElementById("Bcw").onclick  = () => rotateFace("B", +1);
document.getElementById("Bccw").onclick = () => rotateFace("B", -1);














// Lighting
//const hemiLight = new THREE.HemisphereLight(0x0000ff, 0xa020f0);
//scene.add(hemiLight);



function animate(t=0) {
  requestAnimationFrame(animate);



  
  
  controls.update();
  renderer.render(scene, camera);
}
createCube();

animate();
