#include <stdio.h>

void print_array(int size, int array[]) {
    for (int pos = 0; pos < size; pos += 1) {
        printf("%d%s", array[pos], pos + 1 == size ? "" : " ");
    }
    printf("\n");
}

void quick_sort (int size, int array[], int left, int right) {
    //! quicksort = showSort(array, cursors=[left, right, i, j], dim=size, thresholds=[pivot])
    if (right <= left)
        return;
    int pivot = array[right];
    int i = left;
    int j = right;
    while (1) {
        while (array[i] < pivot)
            i += 1;
        while (pivot < array[j])
            j -= 1;
        if (i >= j) {
            break;
        }
        int temp = array[i];
        array[i] = array[j];
        array[j] = temp;
        i += 1;
        j -= 1;
    }
    quick_sort(size, array, left, i - 1);
    quick_sort(size, array, i, right);
}

int main() {
    //! quicksort = showSort(array, dim=n)
    int array[] = {4, 2, 1, 2, 3, 2, 1, 0, 1};
    int n = sizeof array / sizeof *array;
    quick_sort(n, array, 0, n - 1);
    print_array(n, array);
    return 0;
}
