from flask import Flask, render_template, jsonify, make_response, request
import subprocess
import os
import sys
import traceback
import kociemba
import atexit
import signal

app = Flask(__name__)

SOLVED_CUBE_STRING = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"


def get_tiles_path():
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "tiles.txt"))


def reset_tiles_file():
    tiles_path = get_tiles_path()

    with open(tiles_path, "w") as f:
        f.write(SOLVED_CUBE_STRING)

    print("tiles.txt reset to solved cube.")


def handle_exit_signal(signum, frame):
    reset_tiles_file()
    sys.exit(0)


# Reset tiles.txt when Flask starts
reset_tiles_file()

# Reset tiles.txt when Flask exits normally
atexit.register(reset_tiles_file)

# Reset tiles.txt when Flask is stopped with Ctrl+C or terminated
signal.signal(signal.SIGINT, handle_exit_signal)
signal.signal(signal.SIGTERM, handle_exit_signal)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/cube-string")
def cube_string():
    try:
        tiles_path = get_tiles_path()

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

        print("DEBUG: Running scanner with", sys.executable, script_path)

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

        print("DEBUG: Running solver with", sys.executable, script_path)

        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True
        )

        print("SOLVER STDOUT:")
        print(result.stdout)

        print("SOLVER STDERR:")
        print(result.stderr)

        if result.returncode != 0:
            return jsonify({
                "status": "error",
                "message": result.stderr,
                "stdout": result.stdout,
            })

        moves_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "moves.txt"))

        if os.path.exists(moves_path):
            with open(moves_path, "r") as f:
                solution = f.read().strip()
        else:
            solution = "No moves.txt generated."

        resp = make_response(jsonify({
            "status": "ok",
            "solution": solution
        }))

        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        resp.headers["Pragma"] = "no-cache"
        resp.headers["Expires"] = "0"

        return resp

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)})


def expand_double_turns(solution: str) -> str:
    moves = solution.split()
    expanded = []

    for move in moves:
        if move.endswith("2"):
            expanded.append(move[0])
            expanded.append(move[0])
        else:
            expanded.append(move)

    return " ".join(expanded)


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
        expanded_solution = expand_double_turns(solution)

        return jsonify({
            "status": "ok",
            "solution": expanded_solution,
            "rawSolution": solution,
            "cubeString": cube_str
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        })


@app.route("/save-manual-cube", methods=["POST"])
def save_manual_cube():
    try:
        data = request.get_json()
        cube_str = data.get("cubeString", "").strip()

        if len(cube_str) != 54:
            return jsonify({
                "status": "error",
                "message": f"Cube string must be 54 characters, got {len(cube_str)}"
            })

        counts = {face: cube_str.count(face) for face in "URFDLB"}

        for face in "URFDLB":
            if counts[face] != 9:
                return jsonify({
                    "status": "error",
                    "message": f"Invalid cube: expected 9 {face} stickers, got {counts[face]}",
                    "counts": counts
                })

        tiles_path = get_tiles_path()

        with open(tiles_path, "w") as f:
            f.write(cube_str)

        return jsonify({
            "status": "ok",
            "message": "Manual cube saved.",
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