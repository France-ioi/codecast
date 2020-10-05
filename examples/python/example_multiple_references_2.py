a = [0, 1]
b = [2, 3]
c = [a, b]

def test(c):
    v = "test1"
    c[0][0] = 42
    v = "test"
def test2(a, c):
    v = "test1"
    a[0] = 45
    v = "test"

test(c)
# 42 42
print(a[0])
print(c[0][0])

test2(a, c)
# 45 45
print(a[0])
print(c[0][0])
