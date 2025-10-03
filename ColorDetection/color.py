
import cv2
import numpy as np
import os

# HSV-based color classifier


# Reference HSV values for Rubik's cube colors (tuned for better robustness)
REF_COLORS = {
    "W": np.array([0,   0, 255]),   # White
    "Y": np.array([30, 200, 255]),  # Yellow
    "R": np.array([0, 255, 200]),   # Red
    "O": np.array([15, 255, 200]),  # Orange
    "G": np.array([60, 255, 200]),  # Green
    "B": np.array([110, 255, 200])  # Blue
}

def classify_color(bgr):
    # Convert to HSV
    hsv = cv2.cvtColor(np.uint8([[bgr]]), cv2.COLOR_BGR2HSV)[0][0]
    h, s, v = hsv

    # Normalize brightness
    if v < 50:
        v = 50
    hsv = np.array([h, s, v])

    # Compare to reference colors by Euclidean distance
    min_dist = float("inf")
    best_color = "X"
    for label, ref in REF_COLORS.items():
        # scale hue difference circularly
        dh = min(abs(h - ref[0]), 180 - abs(h - ref[0]))
        ds = abs(s - ref[1]) / 255.0
        dv = abs(v - ref[2]) / 255.0
        dist = (dh/180.0)**2 + ds**2 + dv**2
        if dist < min_dist:
            min_dist = dist
            best_color = label

    return best_color



def get_average_color(frame, x, y, w, h):
    roi = frame[y:y+h, x:x+w]
    avg_color_per_row = np.average(roi, axis=0)
    avg_color = np.average(avg_color_per_row, axis=0)
    return tuple(map(int, avg_color))

# BGR colors for display
COLOR_MAP = {
    "W": (255, 255, 255),
    "R": (0, 0, 255),
    "O": (0, 165, 255),
    "Y": (0, 255, 255),
    "G": (0, 255, 0),
    "B": (255, 0, 0),
    "X": (128, 128, 128),
}

def draw_cube_layout(cube_faces, face_names, size=30, gap=2):
    layout = {
        "Up":    (0, 3),
        "Left":  (3, 0),
        "Front": (3, 3),
        "Right": (3, 6),
        "Back":  (3, 9),
        "Down":  (6, 3),
    }

    rows = 9
    cols = 12
    canvas = np.ones(((rows * (size+gap)), (cols * (size+gap)), 3), dtype=np.uint8) * 255

    for face_idx, face in enumerate(cube_faces):
        name = face_names[face_idx]
        if name not in layout:
            continue
        base_row, base_col = layout[name]

        for r in range(3):
            for c in range(3):
                color = COLOR_MAP.get(face[r][c], (128, 128, 128))
                x1 = (base_col + c) * (size + gap)
                y1 = (base_row + r) * (size + gap)
                x2 = x1 + size
                y2 = y1 + size
                cv2.rectangle(canvas, (x1, y1), (x2, y2), color, -1)
                cv2.rectangle(canvas, (x1, y1), (x2, y2), (0, 0, 0), 1)

    return canvas

def overlay_layout(display, cube_faces, face_names):
    layout_img = draw_cube_layout(cube_faces, face_names, size=30)
    h, w = layout_img.shape[:2]
    H, W = display.shape[:2]

    offset_x = W - w - 20
    offset_y = 50

    if offset_x < 0: offset_x = 0
    if offset_y + h > H: offset_y = H - h

    display[offset_y:offset_y+h, offset_x:offset_x+w] = layout_img
    return display

def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Cannot access webcam.")
        return

    tile_size = 50
    gap = 120
    cube_faces = []
    face_names = ["Up", "Right", "Front", "Down", "Left", "Back"]

    face_index = 0
    ready_to_exit = False
    print("Press ENTER to capture a face, D to delete last face, Q to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        display = frame.copy()

        if face_index < 6:
            cv2.putText(display, f"Show {face_names[face_index]} Face and Press ENTER",
                        (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
        else:
            cv2.putText(display, "All faces captured. Press ENTER again to finish.",
                        (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)

        # Draw scanning squares if not done
        if face_index < 6:
            height, width = frame.shape[:2]
            center_x = width // 2
            center_y = height // 2
            grid_width = 3 * tile_size + 2 * gap
            grid_height = 3 * tile_size + 2 * gap
            start_x = center_x - grid_width // 2
            start_y = center_y - grid_height // 2

            tiles = []
            for row in range(3):
                for col in range(3):
                    x = start_x + col * (tile_size + gap)
                    y = start_y + row * (tile_size + gap)
                    tiles.append((x, y, tile_size, tile_size))
            for x, y, w, h in tiles:
                cv2.rectangle(display, (x, y), (x + w, y + h), (0, 255, 0), 2)

        if cube_faces:
            display = overlay_layout(display, cube_faces, face_names)

        cv2.imshow("Rubik's Cube Scanner", display)
        key = cv2.waitKey(1) & 0xFF

        if key == 13:  # ENTER
            if face_index < 6:  # Capture next face
                face_colors = []
                for row in range(3):
                    row_colors = []
                    for col in range(3):
                        x, y, w, h = tiles[row*3 + col]
                        avg_bgr = get_average_color(frame, x, y, w, h)
                        color_name = classify_color(avg_bgr)
                        row_colors.append(color_name)
                    face_colors.append(row_colors)

                cube_faces.append(face_colors)
                print(f"{face_names[face_index]} face captured: {face_colors}")
                face_index += 1

            else:  # Already scanned all 6, second ENTER exits
                ready_to_exit = True
                break

        elif key == ord('d') and face_index > 0:  # Delete last face
            cube_faces.pop()
            face_index -= 1
            print(f"Deleted {face_names[face_index]} face. Please rescan.")

        elif key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    if ready_to_exit and len(cube_faces) == 6:
        print("\nFinal Cube Representation (2D arrays):")
        for name, face in zip(face_names, cube_faces):
            print(f"{name}: {face}")

        # --- Map center colors to standard Kociemba faces ---
        color_to_face = {}
        for face_name, face in zip(face_names, cube_faces):
            center_color = face[1][1]
            if face_name == "Up":
                color_to_face[center_color] = "U"
            elif face_name == "Right":
                color_to_face[center_color] = "R"
            elif face_name == "Front":
                color_to_face[center_color] = "F"
            elif face_name == "Down":
                color_to_face[center_color] = "D"
            elif face_name == "Left":
                color_to_face[center_color] = "L"
            elif face_name == "Back":
                color_to_face[center_color] = "B"

        print("\nColor -> Face mapping (based on centers):")
        print(color_to_face)

        # --- Build 54-character Kociemba string ---
        facelet_string = ""
        for face in cube_faces:
            for row in face:
                for color in row:
                    facelet_string += color_to_face.get(color, "X")

        print("\n54-character facelet string:")
        print(facelet_string)

        # --- Write to tiles.txt in cube-app ---
        tiles_path = os.path.join("..", "cube-app", "tiles.txt")
        with open(tiles_path, "w") as f:
            f.write(facelet_string)
        print(f"\nFacelet string written to {tiles_path}")

if __name__ == "__main__":
    main()

