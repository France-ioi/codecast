def quick_sort(size, arr, left, right):
    _VIEW_quicksort= "showSort(arr, cursors=[left, right, i, j], dim=size, thresholds=[pivot])"
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


_VIEW_quicksort= "showSort(arr, dim=n)"
arr = [4, 2, 1, 2, 3, 2, 1, 0, 1]
n = len(arr)
quick_sort(n, arr, 0, n - 1)
