import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.ArrayList;
import java.util.*;




/* first be able to make proper representation of cube using 2d arrays and not obects.
the find a way to get corner orientation, edge orientation.

 * 
 * 
 * 
 */

public class MyCube {
    private int[][] cube = new int[6][9]; // 6 faces × 9 stickers
    private String[][] labels = new String[6][9]; 

    public enum Face { U, R, F, L, B, D }

    public MyCube() {
        // solved cube: each face filled with its index
       for (Face f : Face.values()) {
        int idx = f.ordinal(); //.ordinal() returns its position in its enum declaration
        for (int i = 0; i < 9; i++) {
            cube[idx][i] = idx;
            labels[idx][i] = f.name() + i; // U0-U8, R0-R8, etc
        }
    }
    }
    public MyCube(MyCube other) {
        for (int i = 0; i < 6; i++) {
            this.cube[i] = other.cube[i].clone();
            this.labels[i] = other.labels[i].clone();
        }
    }


    public static MyCube fromStateString(String state) {
    if (state.length() != 54) throw new IllegalArgumentException("State string must have length 54");
    MyCube c = new MyCube();
    int pos = 0;
    for (int f = 0; f < 6; f++) {
        for (int i = 0; i < 9; i++) {
            char ch = state.charAt(pos++);
            // convert char to int representing color/face
            // assuming solved cube uses 0..5 for U,R,F,L,B,D
            c.cube[f][i] = ch - '0';
            c.labels[f][i] = "" + "URFLBD".charAt(c.cube[f][i]) + i; 
        }
    }
    return c;
}
public String toStateString() {
    StringBuilder sb = new StringBuilder(54);
    for (int f = 0; f < 6; f++) {
        for (int i = 0; i < 9; i++) {
            
            sb.append(cube[f][i]);
        }
    }
    return sb.toString();
}


    // rotate a face counter-clockwise
    private void rotateFaceCCW(int f) {
        int[] old = cube[f].clone();
        String[] oldLabels = labels[f].clone();
        cube[f][0] = old[2];  labels[f][0] = oldLabels[2];
        cube[f][1] = old[5]; labels[f][1] = oldLabels[5];
        cube[f][2] = old[8];  labels[f][2] = oldLabels[8];
        cube[f][3] = old[1]; labels[f][3] = oldLabels[1];
        cube[f][4] = old[4]; labels[f][4] = oldLabels[4];
        cube[f][5] = old[7]; labels[f][5] = oldLabels[7];
        cube[f][6] = old[0]; labels[f][6] = oldLabels[0];
        cube[f][7] = old[3]; labels[f][7] = oldLabels[3];
        cube[f][8] = old[6]; labels[f][8] = oldLabels[6];
    }

    // cycles values through positions (face, index)
    private void cycle(int[][] positions) {
      int tempVal = cube[positions[0][0]][positions[0][1]];
    String tempLabel = labels[positions[0][0]][positions[0][1]];
    for (int i = 0; i < positions.length - 1; i++) {
        cube[positions[i][0]][positions[i][1]] = cube[positions[i+1][0]][positions[i+1][1]];
        labels[positions[i][0]][positions[i][1]] = labels[positions[i+1][0]][positions[i+1][1]];
    }
    cube[positions[positions.length - 1][0]][positions[positions.length - 1][1]] = tempVal;
    labels[positions[positions.length - 1][0]][positions[positions.length - 1][1]] = tempLabel;
}

   
    public void moveUprime() {
    rotateFaceCCW(Face.U.ordinal());
    // Neighboring top rows of F, L, B, R (CCW around U)
    cycle(new int[][]{{2,0},{3,0},{4,0},{1,0}});
    cycle(new int[][]{{2,1},{3,1},{4,1},{1,1}});
    cycle(new int[][]{{2,2},{3,2},{4,2},{1,2}});
}

public void moveDprime() {
    rotateFaceCCW(Face.D.ordinal());
    // Neighboring bottom rows of F, R, B, L (CCW around D)
    cycle(new int[][]{{2,6},{1,6},{4,6},{3,6}});
    cycle(new int[][]{{2,7},{1,7},{4,7},{3,7}});
    cycle(new int[][]{{2,8},{1,8},{4,8},{3,8}});
}

public void moveFprime() {
    rotateFaceCCW(Face.F.ordinal());
    cycle(new int[][]{{0,6},{1,0},{5,2},{3,8}});
    cycle(new int[][]{{0,7},{1,3},{5,1},{3,5}});
    cycle(new int[][]{{0,8},{1,6},{5,0},{3,2}});
}

public void moveBprime() {
    rotateFaceCCW(Face.B.ordinal());
    cycle(new int[][]{{0,0},{3,6},{5,8},{1,2}});
    cycle(new int[][]{{0,1},{3,3}, {5,7}, {1,5}});
    cycle(new int[][]{{0,2},{3,0}, {5,6}, {1,8}});
}

public void moveRprime() {
    rotateFaceCCW(Face.R.ordinal());
    cycle(new int[][]{{0,2},{4,6},{5,2},{2,2}});
    cycle(new int[][]{{0,5},{4,3},{5,5},{2,5}});
    cycle(new int[][]{{0,8},{4,0},{5,8},{2,8}});
}

public void moveLprime() {
    rotateFaceCCW(Face.L.ordinal());
    cycle(new int[][]{{0,0},{2,0},{5,0},{4,8}});
    cycle(new int[][]{{0,3},{2,3},{5,3},{4,5}});
    cycle(new int[][]{{0,6},{2,6},{5,6},{4,2}});
}

public void moveF() { moveFprime(); moveFprime(); moveFprime(); }
public void moveB() { moveBprime(); moveBprime(); moveBprime(); }
public void moveR() { moveRprime(); moveRprime(); moveRprime(); }
public void moveL() { moveLprime(); moveLprime(); moveLprime(); }
public void moveD() { moveDprime(); moveDprime(); moveDprime(); }
public void moveU() { moveUprime(); moveUprime(); moveUprime(); }

public void moveU2() {moveU();moveU();};
public void moveF2() {moveF();moveF();};
public void moveR2() {moveR();moveR();};
public void moveL2() {moveL();moveL();};
public void moveB2() {moveB();moveB();};
public void moveD2() {moveD();moveD();};




   
    public void printCube() {
    java.util.function.BiConsumer<Face, Integer> printRow = (face, row) -> {
        int idx = face.ordinal();
        for (int col = 0; col < 3; col++) {
            int pos = row * 3 + col;
            System.out.print(labels[idx][pos] + " ");
        }
    };

    // U
    System.out.println("          U");
    for (int row = 0; row < 3; row++) {
        System.out.print("        ");
        printRow.accept(Face.U, row);
        System.out.println();
    }

    // L F R B
    System.out.println("L               F               R               B");
    for (int row = 0; row < 3; row++) {
        printRow.accept(Face.L, row);
        System.out.print("   ");
        printRow.accept(Face.F, row);
        System.out.print("   ");
        printRow.accept(Face.R, row);
        System.out.print("   ");
        printRow.accept(Face.B, row);
        System.out.println();
    }

    // D
    System.out.println("          D");
    for (int row = 0; row < 3; row++) {
        System.out.print("        ");
        printRow.accept(Face.D, row);
        System.out.println();
    }
    System.out.println();
}

 public void applyMove(String move) {
        switch (move) {
            case "U": moveU(); break;
            case "U'": moveUprime(); break;
            case "U2": moveU2(); break;
            case "D": moveD(); break;
            case "D'": moveDprime(); break;
            case "D2": moveD2(); break;
            case "F": moveF(); break;
            case "F'": moveFprime(); break;
            case "F2": moveF2(); break;
            case "B": moveB(); break;
            case "B'": moveBprime(); break;
            case "B2": moveB2(); break;
            case "L": moveL(); break;
            case "L'": moveLprime(); break;
            case "L2": moveL2(); break;
            case "R": moveR(); break;
            case "R'": moveRprime(); break;
            case "R2": moveR2(); break;
        }
    }
public static final String[] MOVES = {
        "U", "U'", "D", "D'", "F", "F'", "B", "B'", "L", "L'", "R", "R'", "U2","F2","R2","L2","B2","D2"
    };


    //masked CUBE scaffolding ig
public String maskCube(java.util.List<Integer> mask) {
    StringBuilder sb = new StringBuilder();
    for (int f = 0; f < 6; f++) {
        for (int i = 0; i < 9; i++) {
            int flatIdx = f * 9 + i; // flatten (face, index) -> single index [0..53]
            if (mask.contains(flatIdx)) {
                // take the face letter from the label, e.g. "U0" -> "U"
                sb.append(labels[f][i].charAt(0));
            } else {
                sb.append("X");
            }
        }
    }
    return sb.toString();
}



    public boolean isSolved() {
        for (int f = 0; f < 6; f++) {
            int color = cube[f][0];
            for (int i = 1; i < 9; i++) {
                if (cube[f][i] != color) return false;
            }
        }
        return true;
    }

public static String solveDFS(MyCube cube, String solution, int depthRemaining) {
        if (cube.isSolved()) {
            return solution.trim();
        }
        if (depthRemaining == 0) {
            return null;
        }

        for (String move : MOVES) {
            MyCube nextCube = new MyCube(cube); // copy
            nextCube.applyMove(move);

            String result = solveDFS(nextCube, solution + " " + move, depthRemaining - 1);
            if (result != null) return result;
        }
        return null;
    }

    public static String solveIDDFS(MyCube cube, int depthLimit) {
    for (int depth = 0; depth <= depthLimit; depth++) {
        String solution = solveDFS(cube, "", depth);
        if (solution != null) {
            return solution;
        }
    }
    return null;
}

public static Map<String, Integer> genPruningTable(
            List<String> solvedStates,
            int depthLimit
    ) {
        Map<String, Integer> pruningTable = new HashMap<>();
        Queue<String> previousFrontier = new ArrayDeque<>(solvedStates);

        // solved states are depth 0
        for (String s : solvedStates) {
            pruningTable.put(s, 0);
        }

        for (int depth = 1; depth <= depthLimit; depth++) {
            Queue<String> frontier = new ArrayDeque<>();
            for (String state : previousFrontier) {
                for (String move : MOVES) {
                    MyCube cube = MyCube.fromStateString(state);
                    cube.applyMove(move);
                    String newState = cube.toStateString();

                    if (!pruningTable.containsKey(newState)) {
                        pruningTable.put(newState, depth);
                        frontier.add(newState);
                    }
                }
            }
            previousFrontier = frontier;
        }

        return pruningTable;
    }

public static String solveDFSWithPruning(
        Map<String, Integer> pruningTable,
        int pruningDepth,
        MyCube cube,
        java.util.List<String> solution,
        int depthRemaining
) {
    String cubeStr = cube.toStateString();

    // test oif solved
    if (cube.isSolved()) {
        return String.join(" ", solution);
    }

    // pruning
    int lowerBound = pruningTable.getOrDefault(cubeStr, pruningDepth + 1);
    if (lowerBound > depthRemaining) {
        return null;
    }

    //  moves
    for (String move : MOVES) {
        // Skip consecutive moves on the same face (e.g. "R" after "R'") or redundant moves like U D U' D'
        if (!solution.isEmpty()) {
    String last = solution.get(solution.size() - 1);
    // same face (e.g. "R" then "R2")
    if (move.charAt(0) == last.charAt(0)) continue;
    // exact inverse (e.g. "U" then "U'")
    if ((last + "'").equals(move) || (move + "'").equals(last)) continue;
}

        solution.add(move);
        MyCube nextCube = new MyCube(cube);
        nextCube.applyMove(move);

        String result = solveDFSWithPruning(pruningTable, pruningDepth, nextCube, solution, depthRemaining - 1);
        if (result != null) {
            return result;
        }

        solution.remove(solution.size() - 1);
    }

    return null;
}

public static String solveIDDFSWithPruning(
        Map<String, Integer> pruningTable,
        int pruningDepth,
        MyCube cube,
        int depthLimit
) {
    for (int depth = 0; depth <= depthLimit; depth++) {
        String result = solveDFSWithPruning(pruningTable, pruningDepth, cube, new java.util.ArrayList<>(), depth);
        if (result != null) return result;
    }
    return null;
}

public static List<String> simplifyMoves(List<String> moves) {
    List<String> result = new ArrayList<>();
    for (String move : moves) {
        if (result.isEmpty()) {
            result.add(move);
            continue;
        }

        String last = result.get(result.size() - 1);
        if (last.charAt(0) == move.charAt(0)) {
            // same face -> combine
            if (last.equals(move)) {
                // X then X -> X2
                result.set(result.size() - 1, last + "2");
            } else if ((last + "'").equals(move) || (move + "'").equals(last)) {
                // X then X' ->cancel
                result.remove(result.size() - 1);
            } else if (last.endsWith("2") && last.charAt(0) == move.charAt(0)) {
                // X2 then X or X' ->reduce
                result.remove(result.size() - 1);
                result.add(move.equals(last.substring(0,1)) ? move + "'" : move);
            }
        } else {
            result.add(move);
        }
    }
    return result;
}

public boolean edgesOriented() {
    // UF edge = U7 + F1
    if (labels[Face.U.ordinal()][7].charAt(0) != 'U' &&
        labels[Face.F.ordinal()][1].charAt(0) != 'F') return false;

    // UR edge = U5 + R1
    if (labels[Face.U.ordinal()][5].charAt(0) != 'U' &&
        labels[Face.R.ordinal()][1].charAt(0) != 'R') return false;

    // UL edge = U3 + L1
    if (labels[Face.U.ordinal()][3].charAt(0) != 'U' &&
        labels[Face.L.ordinal()][1].charAt(0) != 'L') return false;

    // UB edge = U1 + B1
    if (labels[Face.U.ordinal()][1].charAt(0) != 'U' &&
        labels[Face.B.ordinal()][1].charAt(0) != 'B') return false;

    // DF edge = D1 + F7
    if (labels[Face.D.ordinal()][1].charAt(0) != 'D' &&
        labels[Face.F.ordinal()][7].charAt(0) != 'F') return false;

    // DR edge = D5 + R7
    if (labels[Face.D.ordinal()][5].charAt(0) != 'D' &&
        labels[Face.R.ordinal()][7].charAt(0) != 'R') return false;

    // DL edge = D3 + L7
    if (labels[Face.D.ordinal()][3].charAt(0) != 'D' &&
        labels[Face.L.ordinal()][7].charAt(0) != 'L') return false;

    // DB edge = D7 + B7
    if (labels[Face.D.ordinal()][7].charAt(0) != 'D' &&
        labels[Face.B.ordinal()][7].charAt(0) != 'B') return false;

    // FR edge = F5 + R3
    if (labels[Face.F.ordinal()][5].charAt(0) != 'F' &&
        labels[Face.R.ordinal()][3].charAt(0) != 'R') return false;

    // FL edge = F3 + L5
    if (labels[Face.F.ordinal()][3].charAt(0) != 'F' &&
        labels[Face.L.ordinal()][5].charAt(0) != 'L') return false;

    // BR edge = B3 + R5
    if (labels[Face.B.ordinal()][3].charAt(0) != 'B' &&
        labels[Face.R.ordinal()][5].charAt(0) != 'R') return false;

    // BL edge = B5 + L3
    if (labels[Face.B.ordinal()][5].charAt(0) != 'B' &&
        labels[Face.L.ordinal()][3].charAt(0) != 'L') return false;

    return true;
}











    //  MAIN 
    public static void main(String[] args) {
        //MyCube c = new MyCube();
        System.out.println("Initial:");
  

    MyCube solved = new MyCube();

    // Generate pruning table (depth 5 as example)
    List<String> solvedStates = List.of(solved.toStateString());
    Map<String, Integer> table = MyCube.genPruningTable(solvedStates, 6);

    // Scramble
    MyCube c = new MyCube();   // UUFRLB. or uufrld check for simplistic
    c.applyMove("U");
    c.applyMove("U");
    c.applyMove("F");
    c.applyMove("R");
    c.applyMove("L");
    c.applyMove("D");
    


    // Solve with pruning
   String rawSolution = solveIDDFSWithPruning(table, 5, c, 9);
List<String> clean = simplifyMoves(Arrays.asList(rawSolution.split(" ")));
System.out.println("Simplified: " + String.join(" ", clean));




    }
}