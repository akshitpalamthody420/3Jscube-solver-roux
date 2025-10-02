import kociemba
import os

def main():
    # adjust this path depending on where tile.txt is
    # Example: "../tile.txt" means tile.txt is one folder above
    tile_path = os.path.join("..", "tile.txt")

    try:
        with open(tile_path, "r") as f:
            facelet_string = f.read().strip()
        
        print("Input Facelet String:")
        print(facelet_string)

        # Solve using Kociemba's algorithm
        solution = kociemba.solve(facelet_string)
        print("\nSolution Moves:")
        print(solution)

    except FileNotFoundError:
        print(f"Error: tile.txt not found at {tile_path}")
    except Exception as e:
        print(f"Error solving cube: {e}")

if __name__ == "__main__":
    main()
