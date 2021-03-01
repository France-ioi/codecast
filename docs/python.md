# Python / Codecast

## View directives

You define a view in the form of a string variable.
The name has to start with **\_VIEW_** followed by the name of the directive.

Example :

    _VIEW_arr = "showArray(arr, cursors=[index], cursorRows=20)"

Here the name of the view is **arr**. A view can be overridden by declaring a new view with
the same name (see quicksort example bellow).

### Lists (Array)

Displays a list as a 1D-table.

Example :

```
_VIEW_arr = "showArray(arr, cursors=[index], cursorRows=20)"
arr = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
for index in range(1, 20):
    arr[index] = arr[index - 1] + index
```

The arguments are :
- The first argument is the name of the variable that contains the list.
- cursors : A list of variable names that contains the indexes we want to put an emphasis on
(an arrow will point on the corresponding cells).
- cw (optional) : The width of a cell in px (default 28).
- dim (optional) : The number of elements in the list by value (integer) or by variable name.
By default, the number is the size of the list.


### Lists of lists (2D Array, Matrix)

Displays a list as a 2D-table.

Example :

```
_VIEW_matrix = "showArray2D(matrix, rowCursors=[line], colCursors=[col])"
matrix = [[2, 1, 1], [1, -1, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]
for line in range(2, 5):
    for col in range(0, 3):
        matrix[line][col] = matrix[line - 1][col] + matrix[line - 2][col]
```

The arguments are :
- The first argument is the name of the view
- rowCursors : A list of variable names that contains the line-indexes we want to put an emphasis on
(an arrow will point on the corresponding line).
- colCursors : A list of variable names that contains the column-indexes we want to put an emphasis on
(an arrow will point on the corresponding column).
- rows : (optional) = The number of rows
- cols : (optional) = The number of columns
- height (optional) = The height of the view in px (default : special value "auto")


### Quicksort

Displays the progress of the quicksort algorithm.

Example :

```
def quick_sort(size, arr, left, right):
    _VIEW_quicksort= "showSort(quicksort, cursors=[left, right, i, j], dim=size, thresholds=[pivot])"
    if (right <= left):
        return
    pivot = arr[right]
    i = left
    j = right
    while (True):
        while (arr[i] < pivot):
            i += 1
        while (pivot < arr[j]):
            j -= 1
        if (i >= j):
            break

        temp = arr[i]
        arr[i] = arr[j]
        arr[j] = temp
        i += 1
        j -= 1

    quick_sort(size, arr, left, i - 1)
    quick_sort(size, arr, i, right)


_VIEW_quicksort= "showSort(quicksort, dim=n)"
arr = [4, 2, 1, 2, 3, 2, 1, 0, 1]
n = len(arr)
quick_sort(n, arr, 0, n - 1)
```

The arguments are :
- The first argument is the name of the view
- dim : The number of elements in the list by value (integer) or by variable name.
- cursors : A list of variable names that contains the indexes we want to put an emphasis on
(an arrow will point on the corresponding cells).
- thresholds : A list of variable names that contains the current threshold.
