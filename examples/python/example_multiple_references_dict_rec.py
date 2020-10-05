# Multiple references local 2
a0 = [0, 1]
b0 = [2, 3]

# 4 4 3 3 2 2 1 1 0 0 0 0 0 0 0
def test(n, a0):
    v = "test1"
    c0 = [a0, b0]
    c0[0][0] = n
    print(a0[0])
    print(c0[0][0])
    v = "test"
    if (n > 0):
        test(n - 1, a0)
        print(a0[0])

test(4, a0)

print(a0[0])
