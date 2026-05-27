from flask import Flask, render_template, jsonify, make_response, request
import subprocess
import os
import sys
import traceback
import kociemba

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/cube-string")
def cube_string():
    try:
        tiles_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "tiles.txt"))
        with open(tiles_path, "r") as f:
            cube_str = f.read().strip()

        resp = make_response(jsonify({"cubeString": cube_str}))
        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        resp.headers["Pragma"] = "no-cache"
        resp.headers["Expires"] = "0"
        return resp
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)})

@app.route("/scan-cube")
def scan_cube():
    try:
        script_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "ColorDetection", "color.py")
        )
        print("DEBUG: Running with", sys.executable, script_path)

        subprocess.Popen([sys.executable, script_path])
        return jsonify({"status": "Camera opened"})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)})

@app.route("/solve-cube")
def solve_cube():
    try:
        script_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "SolverLogic", "Solver.py")
        )
        print("DEBUG: Running with", sys.executable, script_path)

        # Run synchronously (wait until solver.py finishes)
        result = subprocess.run([sys.executable, script_path], capture_output=True, text=True)

        if result.returncode == 0:
            moves_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "moves.txt"))
            if os.path.exists(moves_path):
                with open(moves_path, "r") as f:
                    solution = f.read().strip()
            else:
                solution = "No moves.txt generated."

            resp = make_response(jsonify({"status": "ok", "solution": solution}))
            resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            resp.headers["Pragma"] = "no-cache"
            resp.headers["Expires"] = "0"
            return resp
        else:
            return jsonify({"status": "error", "message": result.stderr})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)})
@app.route("/solve-state", methods=["POST"])
def solve_state():
    try:
        data = request.get_json()
        cube_str = data.get("cubeString", "").strip()

        print("DEBUG: Received frontend cube string:")
        print(cube_str)
        print("Length:", len(cube_str))

        if len(cube_str) != 54:
            return jsonify({
                "status": "error",
                "message": f"Cube string must be 54 characters, got {len(cube_str)}"
            })

        counts = {face: cube_str.count(face) for face in "URFDLB"}
        print("Counts:", counts)

        for face in "URFDLB":
            if counts[face] != 9:
                return jsonify({
                    "status": "error",
                    "message": f"Invalid cube string: expected 9 {face} stickers, got {counts[face]}",
                    "counts": counts
                })

        solution = kociemba.solve(cube_str)

        return jsonify({
            "status": "ok",
            "solution": solution,
            "cubeString": cube_str
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        })

if __name__ == "__main__":
    app.run(debug=True)
