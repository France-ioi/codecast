int fact(int n)
{
    if (n <= 1) {
        return 1;
    }

    return n * fact(n - 1);
}

int main()
{
    int tab[10];

    for (int i = 0; i < 10; i++) {
        tab[i] = fact(i);
    }

    return 0;
}
