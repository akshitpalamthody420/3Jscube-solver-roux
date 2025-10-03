from flask import Flask, render_template, jsonify, make_response
import subprocess
import os
import sys
import traceback

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
            os.path.join(os.path.dirname(__file__), "SolverLogic", "solver.py")
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

if __name__ == "__main__":
    app.run(debug=True)
