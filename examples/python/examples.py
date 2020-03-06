# Objects
class Test:
    def __init__(self, a, b, m):
        self.a = a
        self.b = b
        self.m = m

    def sum(self):
        return self.a + self.b

    def getM(self):
        return self.m

def coucou():
    return 'coucou'

test = Test(41, 1, "Bonjour")
print test.sum()
print test.getM()


# Extend
class classA:
    def __init__(self, a):
        self.a = a

class classB(classA):
    def __init__(self, a):
        classA.__init__(self, a)
        self.a = self.a + 1

obj = classB(41)
print obj.a


# Recursion
def plop(a):
    if (a == 0):
        return 0
    return a + plop(a - 1)

print plop(5)


# Recursion 2
def plop(a, b):
    if (a == 0):
        return 0
    if (b == 0):
        return plop(a - 1, a)
    return 1 + plop(a, b - 1)

print plop(3, 3)




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

print plop(5)



# Array
tab = [4, 10, 21]

tab[1] = 28

print tab[1]

for num in tab:
    print num


# Array 2D
Array2D = [[11, 12, 5, 2], [15, 6,10], [10, 8, 12, 5], [12,15,8,6]]

Array2D[1][2] = 46
print Array2D[1][1]
