#include <stdio.h>

#define SIZE 100

int main() {
    //! A = showArray(A, cursors=[i])
    int A[SIZE];
    A[0] = 1;
    A[1] = 1;
    for (int i = 2; i < SIZE; i++) {
        A[i] = A[i - 1] + A[i - 2];
    }

    return 0;
}
