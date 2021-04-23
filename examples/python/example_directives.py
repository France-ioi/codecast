# Matrix

_VIEW_matrix = "showArray2D(matrix, rowCursors=[line], colCursors=[col], rows=5, cols=3, zone=center-bottom)"
matrix = [[2, 1, 1], [1, -1, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]
for line in range(2, 5):
    for col in range(0, 3):
        matrix[line][col] = matrix[line - 1][col] + matrix[line - 2][col]


# Array

_VIEW_arr = "showArray(arr, cursors=[index], cursorRows=20, zone=center-bottom)"
arr = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
for index in range(1, 20):
    arr[index] = arr[index - 1] + index




# Matrix scope

def initMatrix():
    for line in range(0, 2):
        for col in range(0, 3):
            matrix[line][col] = line * 10 + col

_VIEW_matrix = "showArray2D(matrix, rowCursors=[line], colCursors=[col], rows=2, cols=, zone=center-bottom)"
matrix = [[0, 0, 0], [0, 0, 0]]
initMatrix()
