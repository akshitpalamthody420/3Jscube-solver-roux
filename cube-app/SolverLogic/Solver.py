import kociemba
import os

def expand_double_turns(solution: str) -> str:
    moves = solution.split()
    expanded = []
    for move in moves:
        if move.endswith("2"):
            expanded.append(move[0])  # add the face once
            expanded.append(move[0])  # add the face again
        else:
            expanded.append(move)
    return " ".join(expanded)

def main():
    base_path = os.path.join("..")
    tiles_path = os.path.join(base_path, "tiles.txt")
    moves_path = os.path.join(base_path, "moves.txt")

    try:
        # Read facelet string
        with open(tiles_path, "r") as f:
            facelet_string = f.read().strip()
        
        print("Input Facelet String:")
        print(facelet_string)

        # Solve with Kociemba
        solution = kociemba.solve(facelet_string)
        print("\nSolution Moves:")
        print(solution)

        # Expand double turns (U2 -> U U)
        expanded_solution = expand_double_turns(solution)
        print("\nExpanded Solution:")
        print(expanded_solution)

        # Write expanded solution to moves.txt
        with open(moves_path, "w") as f:
            f.write(expanded_solution)

        print(f"\nExpanded solution written to {moves_path}")

    except FileNotFoundError:
        print(f"Error: tiles.txt not found at {tiles_path}")
    except Exception as e:
        print(f"Error solving cube: {e}")

if __name__ == "__main__":
    main()
