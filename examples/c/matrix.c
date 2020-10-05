#include <stdio.h>
int main() {
    //! A = showArray2D(A, rowCursors=[i], colCursors=[k], width=.33)
    //! B = showArray2D(B, rowCursors=[k], colCursors=[j], width=.33)
    //! C = showArray2D(C, rowCursors=[i], colCursors=[j], width=.33)
    double A[2][2] = {{0.866, -0.500}, {0.500, 0.866}};
    double B[2][2] = {{0.500, -0.866}, {0.866, 0.500}};
    double C[2][2];
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            C[i][j] = 0;
            for (int k = 0; k < 2; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            printf("%.3f ", C[i][j]);
        }
        printf("\n");
    }
    return 0;
}
