import cv2
import numpy as np

# HSV-based color classifier
def classify_color(bgr):
    hsv = cv2.cvtColor(np.uint8([[bgr]]), cv2.COLOR_BGR2HSV)[0][0]
    h, s, v = hsv

    if v > 200 and s < 40:
        return "W"   # White
    elif h < 10 or h > 160:
        return "R"   # Red
    elif 10 < h <= 25:
        return "O"   # Orange
    elif 25 < h <= 35:
        return "Y"   # Yellow
    elif 35 < h <= 85:
        return "G"   # Green
    elif 85 < h <= 130:
        return "B"   # Blue
    else:
        return "X"   # Unknown

def get_average_color(frame, x, y, w, h):
    roi = frame[y:y+h, x:x+w]
    avg_color_per_row = np.average(roi, axis=0)
    avg_color = np.average(avg_color_per_row, axis=0)
    return tuple(map(int, avg_color))

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
    print("Press ENTER to capture a face, D to delete last face, Q to quit.")

    while face_index < 6:
        ret, frame = cap.read()
        if not ret:
            break

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

        display = frame.copy()
        for x, y, w, h in tiles:
            cv2.rectangle(display, (x, y), (x + w, y + h), (0, 255, 0), 2)

        cv2.putText(display, f"Show {face_names[face_index]} Face and Press ENTER",
                    (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

        cv2.imshow("Rubik's Cube Scanner", display)

        key = cv2.waitKey(1) & 0xFF
        if key == 13:  # ENTER key
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

        elif key == ord('d'):  # Delete last face
            if cube_faces and face_index > 0:
                cube_faces.pop()
                face_index -= 1
                print(f"Deleted {face_names[face_index]} face. Please rescan.")

        elif key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    if len(cube_faces) == 6:
        print("\nFinal Cube Representation (2D arrays):")
        for name, face in zip(face_names, cube_faces):
            print(f"{name}: {face}")

        # --- Step 1: determine mapping from center stickers ---
        facelet_map = {}
        for name, face in zip(face_names, cube_faces):
            center_color = face[1][1]  # center of 3x3 face
            facelet_map[center_color] = name[0]  # U,R,F,D,L,B

        print("\nColor -> Face mapping (based on centers):")
        print(facelet_map)

        # --- Step 2: build 54-character facelet string ---
        facelet_string = ""
        for face in cube_faces:
            for row in face:
                for color in row:
                    facelet_string += facelet_map.get(color, "X")

        print("\n54-character facelet string:")
        print(facelet_string)

if __name__ == "__main__":
    main()
