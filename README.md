# 3Jscube-solver-roux
3js roux solver



A Rubik’s Cube solver web application that combines a 3D Three.js cube visualiser, webcam-based colour detection, a Flask backend, and Python/Java solving logic.

The application allows users to scan a real Rubik’s Cube using their webcam, convert the detected sticker colours into a cube state string, solve the cube, and animate the solution on an interactive 3D cube in the browser.

## Features

- Interactive 3D Rubik’s Cube rendered with Three.js
- Orbit controls for rotating and inspecting the cube
- Manual face rotation controls for all six cube faces
- Webcam-based cube colour detection using OpenCV
- HSV-based colour classification for Rubik’s Cube stickers
- Flask backend for connecting the scanner, solver, and frontend
- Cube state stored as a 54-character facelet string
- Solver output written as move sequences and played back on the 3D cube
- Python solver integration using the Kociemba solving library
- Java cube representation and search-based solving experiments

## Tech Stack

- **Frontend:** HTML, JavaScript, Three.js
- **Backend:** Python, Flask
- **Computer Vision:** OpenCV, NumPy
- **Solver Logic:** Python, Java
- **Cube Rendering:** Three.js, OrbitControls

##How to run



```bash
git clone https://github.com/akshitpalamthody420/3Jscube-solver-roux.git
cd 3Jscube-solver-roux
2. Create a Virtual Environment
python -m venv venv
3. Activate the Virtual Environment
macOS / Linux
source venv/bin/activate
Windows
venv\Scripts\activate
4. Install Requirements
pip install -r requirements.txt
5. Run the Flask App
cd cube-app
python app.py
6. Open in Browser

Go to:

http://127.0.0.1:5000

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
└── README.md
