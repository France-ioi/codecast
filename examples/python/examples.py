# Simple
a = 0
a = 1
a = 2
a = 3
a = 4

# Simple function
def test(a):
    a = a + 1
    return a
b = test(0)
print(b)


# Functions
def ret(a):
    b = a + a
    return b

def test(a):
    v = ret(a)
    return v + 'c'

c = 'a'
c = 'b'
d = ret(c)
e = test(d)
print(e)


# Recursion
def plop(a):
    if (a == 0):
        return 0
    print(a)
    return a + plop(a - 1)

for i in range(0, 15):
    print(plop(i))

# Recursion 2
def plop(a, b):
    if (a == 0):
        return 0
    if (b == 0):
        return plop(a - 1, a)
    return 1 + plop(a, b - 1)

print(plop(3, 3))




# GLOBAL
glob = 42

def otherF():
    return 1

def plop(a):
    b = 'useless'
    c = b
    if (a == 0):
        return 0
    return a + plop(a - 1)

print(plop(5))



# Array
tab = [4, 10, 21]

tab[1] = 28

print(tab[1])

for num in tab:
    print(num)


# Array 2D
Array2D = [[11, 12, 5, 2], [15, 6,10], [10, 8, 12, 5], [12,15,8,6]]

Array2D[1][2] = 46
print(Array2D[1][1])

# Array 3D
Array3D = [[[0, 1], [2, 3]], [[4, 5], [6, 7]]]

Array3D[0][1][0] = 42
print(Array3D[0][1][0])
