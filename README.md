# 3Jscube-solver-roux

A Rubik’s Cube solver web application that combines a 3D Three.js cube visualiser, webcam-based colour detection, manual cube entry, a Flask backend, and Python/Java solving logic.

The application allows users to scan a real Rubik’s Cube using their webcam or manually enter cube colours using a 2D grid. It converts the cube into a 54-character facelet string, solves it using Kociemba, and animates the solution on an interactive 3D cube in the browser.

---

## Features

- Interactive 3D Rubik’s Cube rendered with Three.js
- Orbit controls for rotating and inspecting the cube
- Manual face rotation controls for all six cube faces
- Webcam-based cube colour detection using OpenCV
- Manual cube colour entry using a 2D grid
- Flask backend for connecting the scanner, solver, and frontend
- Cube state stored as a 54-character facelet string
- Python solver integration using the Kociemba solving library
- Java cube representation and search-based solving experiments

---

## Tech Stack

- **Frontend:** HTML, JavaScript, Three.js
- **Backend:** Python, Flask
- **Computer Vision:** OpenCV, NumPy
- **Solver Logic:** Python, Java
- **Cube Rendering:** Three.js, OrbitControls

---

## How to Run

### 1. Clone the Repository

```bash
git clone https://github.com/akshitpalamthody420/3Jscube-solver-roux.git
cd 3Jscube-solver-roux
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

### 3. Activate the Virtual Environment

For macOS/Linux:

```bash
source venv/bin/activate
```

For Windows:

```bash
venv\Scripts\activate
```

### 4. Install Requirements

```bash
pip install -r requirements.txt
```

### 5. Run the Flask App

```bash
cd cube-app
python app.py
```

### 6. Open in Browser

Go to:

```text
http://127.0.0.1:5000
```

---

## Project Structure

```text
3Jscube-solver-roux/
│
├── CUBE-V4/
│   └── MyCube.java
│
├── ColorDetection/
│   └── color.py
│
├── WebCube/
│   ├── realcube.js
│   └── test.html
│
├── cube-app/
│   ├── app.py
│   ├── moves.txt
│   ├── tiles.txt
│   │
│   ├── SolverLogic/
│   │   └── Solver.py
│   │
│   ├── static/
│   │   └── realcube.js
│   │
│   └── templates/
│       └── index.html
│
├── requirements.txt
└── README.md
```

---

## Usage

### Manual Cube Entry

1. Select a colour from the manual entry panel.
2. Click stickers on the 2D cube grid to enter the cube state.
3. Click **Use Manual Cube**.
4. Click **Solve Your Cube**.
5. The 3D cube will animate the solution.

### Webcam Detection

1. Click **Scan Your Cube**.
2. The OpenCV camera window will open.
3. Show each cube face in the required order.
4. Press **Enter** to capture each face.
5. Return to the browser.
6. Click **Solve Your Cube**.

### Manual Face Rotation

The cube can also be rotated manually using the face buttons:

```text
L, L'
R, R'
U, U'
D, D'
F, F'
B, B'
```

After manually rotating the cube, click **Solve Your Cube** to solve the current frontend cube state.

---

## Cube State Format

The cube is represented as a 54-character string in Kociemba face order:

```text
U R F D L B
```

Each face has 9 stickers.

Solved cube string:

```text
UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
```

---

## Notes

- The app resets `tiles.txt` to the solved cube state when Flask starts and exits.
- Camera detection works best with clear lighting and minimal glare.
- If webcam colour detection is inaccurate, use the manual cube entry grid.
- The frontend sends the current cube state to the Flask backend, where Kociemba solves it.
