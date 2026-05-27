import cv2
import numpy as np
import os
from collections import Counter


# Display colours in BGR
COLOR_MAP = {
    "W": (255, 255, 255),
    "R": (0, 0, 255),
    "O": (0, 165, 255),
    "Y": (0, 255, 255),
    "G": (0, 255, 0),
    "B": (255, 0, 0),
    "X": (128, 128, 128),
}


def apply_gray_world_white_balance(frame):
    """
    Simple white balance correction.
    Helps reduce colour shift from warm/cool lighting.
    """
    result = frame.astype(np.float32)

    avg_b = np.mean(result[:, :, 0])
    avg_g = np.mean(result[:, :, 1])
    avg_r = np.mean(result[:, :, 2])

    avg_gray = (avg_b + avg_g + avg_r) / 3

    result[:, :, 0] *= avg_gray / (avg_b + 1e-6)
    result[:, :, 1] *= avg_gray / (avg_g + 1e-6)
    result[:, :, 2] *= avg_gray / (avg_r + 1e-6)

    return np.clip(result, 0, 255).astype(np.uint8)


def enhance_lighting(frame):
    """
    Improves contrast in poor lighting using CLAHE on the L channel in LAB.
    """
    balanced = apply_gray_world_white_balance(frame)

    lab = cv2.cvtColor(balanced, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)

    enhanced_lab = cv2.merge((l, a, b))
    enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    return enhanced


def get_stable_roi_colour(frame, x, y, w, h):
    """
    Uses the centre of each square and median colour instead of full average.
    This avoids borders, shadows, glare, and sticker edges.
    """
    margin = int(min(w, h) * 0.25)

    roi = frame[
        y + margin:y + h - margin,
        x + margin:x + w - margin
    ]

    if roi.size == 0:
        roi = frame[y:y + h, x:x + w]

    # Mild blur reduces camera noise
    roi = cv2.GaussianBlur(roi, (5, 5), 0)

    # Median is more robust than average
    median_bgr = np.median(roi.reshape(-1, 3), axis=0)

    return median_bgr.astype(np.uint8)


def bgr_to_lab_colour(bgr):
    """
    Convert one BGR colour to LAB.
    LAB is better than HSV/RGB for comparing perceived colour differences.
    """
    arr = np.uint8([[bgr]])
    lab = cv2.cvtColor(arr, cv2.COLOR_BGR2LAB)[0][0]
    return lab.astype(np.float32)


def colour_distance_lab(c1, c2):
    """
    Weighted LAB distance.
    L is brightness, A/B are colour channels.
    We reduce the brightness weight so lighting changes matter less.
    """
    dl = (c1[0] - c2[0]) * 0.45
    da = c1[1] - c2[1]
    db = c1[2] - c2[2]

    return np.sqrt(dl * dl + da * da + db * db)


def classify_against_centres(sticker_bgr, centre_refs):
    """
    Classify a sticker by comparing it to the six centre stickers captured
    under the same lighting.
    """
    sticker_lab = bgr_to_lab_colour(sticker_bgr)

    best_label = "X"
    best_dist = float("inf")

    for label, centre_bgr in centre_refs.items():
        centre_lab = bgr_to_lab_colour(centre_bgr)
        dist = colour_distance_lab(sticker_lab, centre_lab)

        if dist < best_dist:
            best_dist = dist
            best_label = label

    return best_label


def draw_cube_layout(cube_faces, face_names, size=30, gap=2):
    layout = {
        "Up": (0, 3),
        "Left": (3, 0),
        "Front": (3, 3),
        "Right": (3, 6),
        "Back": (3, 9),
        "Down": (6, 3),
    }

    rows = 9
    cols = 12

    canvas = np.ones(
        ((rows * (size + gap)), (cols * (size + gap)), 3),
        dtype=np.uint8
    ) * 255

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

    if offset_x < 0:
        offset_x = 0

    if offset_y + h > H:
        offset_y = H - h

    display[offset_y:offset_y + h, offset_x:offset_x + w] = layout_img

    return display


def build_grid(frame, tile_size=50, gap=120):
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

    return tiles


def draw_grid(display, tiles):
    for i, (x, y, w, h) in enumerate(tiles):
        cv2.rectangle(display, (x, y), (x + w, y + h), (0, 255, 0), 2)

        # Draw smaller inner sampling box
        margin = int(min(w, h) * 0.25)
        cv2.rectangle(
            display,
            (x + margin, y + margin),
            (x + w - margin, y + h - margin),
            (255, 255, 255),
            1
        )

        cv2.putText(
            display,
            str(i + 1),
            (x + 5, y + 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2
        )


def capture_raw_face(frame, tiles):
    """
    Capture raw BGR values for each sticker.
    Classification happens later after all centre stickers are known.
    """
    enhanced = enhance_lighting(frame)

    face_raw = []

    for row in range(3):
        row_colours = []

        for col in range(3):
            x, y, w, h = tiles[row * 3 + col]
            bgr = get_stable_roi_colour(enhanced, x, y, w, h)
            row_colours.append(bgr)

        face_raw.append(row_colours)

    return face_raw


def classify_all_faces(raw_faces, face_names):
    """
    Use the six centre stickers as calibration references.
    """
    centre_refs = {}

    for face_name, face in zip(face_names, raw_faces):
        centre_bgr = face[1][1]

        if face_name == "Up":
            centre_refs["W"] = centre_bgr
        elif face_name == "Right":
            centre_refs["R"] = centre_bgr
        elif face_name == "Front":
            centre_refs["G"] = centre_bgr
        elif face_name == "Down":
            centre_refs["Y"] = centre_bgr
        elif face_name == "Left":
            centre_refs["O"] = centre_bgr
        elif face_name == "Back":
            centre_refs["B"] = centre_bgr

    classified_faces = []

    for face in raw_faces:
        classified_face = []

        for row in face:
            classified_row = []

            for sticker_bgr in row:
                label = classify_against_centres(sticker_bgr, centre_refs)
                classified_row.append(label)

            classified_face.append(classified_row)

        classified_faces.append(classified_face)

    return classified_faces, centre_refs


def validate_colour_counts(cube_faces):
    flat = []

    for face in cube_faces:
        for row in face:
            flat.extend(row)

    counts = Counter(flat)

    expected = ["W", "R", "G", "Y", "O", "B"]

    print("\nDetected colour counts:")
    for colour in expected:
        print(f"{colour}: {counts[colour]}")

    return all(counts[colour] == 9 for colour in expected), counts


def build_kociemba_string(cube_faces, face_names):
    """
    Build Kociemba string using centre colours to map scanned colour labels
    to U/R/F/D/L/B.
    """
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

    print("\nColour -> Kociemba face mapping:")
    print(color_to_face)

    facelet_string = ""

    for face in cube_faces:
        for row in face:
            for colour in row:
                facelet_string += color_to_face.get(colour, "X")

    return facelet_string


def write_tiles(facelet_string):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    tiles_path = os.path.abspath(
        os.path.join(script_dir, "..", "cube-app", "tiles.txt")
    )

    with open(tiles_path, "w") as f:
        f.write(facelet_string)

    print(f"\nFacelet string written to {tiles_path}")


def main():
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Cannot access webcam.")
        return

    # Try to reduce auto-exposure inconsistency.
    # These may not work on every webcam, but they help when supported.
    cap.set(cv2.CAP_PROP_AUTO_WB, 0)
    cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.25)

    tile_size = 50
    gap = 120

    raw_faces = []
    classified_faces = []

    face_names = ["Up", "Right", "Front", "Down", "Left", "Back"]
    face_index = 0
    ready_to_exit = False

    print("Press ENTER to capture a face.")
    print("Press D to delete the last face.")
    print("Press Q to quit.")
    print("\nImportant: keep the cube orientation consistent:")
    print("Up, Right, Front, Down, Left, Back")

    while True:
        ret, frame = cap.read()

        if not ret:
            break

        enhanced = enhance_lighting(frame)
        display = enhanced.copy()

        tiles = build_grid(frame, tile_size=tile_size, gap=gap)

        if face_index < 6:
            cv2.putText(
                display,
                f"Show {face_names[face_index]} Face and Press ENTER",
                (50, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )

            draw_grid(display, tiles)

        else:
            cv2.putText(
                display,
                "All faces captured. Press ENTER to finish.",
                (50, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                2
            )

        if classified_faces:
            display = overlay_layout(display, classified_faces, face_names)

        cv2.imshow("Rubik's Cube Scanner", display)

        key = cv2.waitKey(1) & 0xFF

        if key == 13:
            if face_index < 6:
                face_raw = capture_raw_face(frame, tiles)
                raw_faces.append(face_raw)

                # Temporary display only: classify captured faces so far against their own centres if possible.
                if len(raw_faces) >= 1:
                    try:
                        classified_faces, _ = classify_all_faces(raw_faces, face_names[:len(raw_faces)])
                    except Exception:
                        pass

                print(f"{face_names[face_index]} face captured.")
                face_index += 1

            else:
                ready_to_exit = True
                break

        elif key == ord("d") and face_index > 0:
            raw_faces.pop()
            face_index -= 1

            if raw_faces:
                try:
                    classified_faces, _ = classify_all_faces(raw_faces, face_names[:len(raw_faces)])
                except Exception:
                    classified_faces = []
            else:
                classified_faces = []

            print(f"Deleted {face_names[face_index]} face. Please rescan.")

        elif key == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

    if ready_to_exit and len(raw_faces) == 6:
        classified_faces, centre_refs = classify_all_faces(raw_faces, face_names)

        print("\nFinal classified cube:")
        for name, face in zip(face_names, classified_faces):
            print(f"{name}: {face}")

        valid_counts, counts = validate_colour_counts(classified_faces)

        if not valid_counts:
            print("\nWARNING: Colour counts are not valid.")
            print("Each colour should appear exactly 9 times.")
            print("Try rescanning in steadier lighting, avoiding glare.")
            print("The file will still be written, but Kociemba may reject it.")

        facelet_string = build_kociemba_string(classified_faces, face_names)

        print("\n54-character facelet string:")
        print(facelet_string)
        print("Length:", len(facelet_string))

        write_tiles(facelet_string)


if __name__ == "__main__":
    main()