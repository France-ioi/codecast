# Variables

i = 0
i = 1

j = 2
j = j + 1 # load j
j = 0
j = i # load i
j = 0
i = i + j # load i && j

# List
t = [1, 2, 3, 4, 5]
for i in range(1, 4):
    t[i] = t[i - 1] * 2


# Array 3D
Array3D = [[[10, 11], [12, 13]], [[14, 15], [16, 17]]]

v = 42
Array3D[0][1][0] = Array3D[0][1][1] + v + 100
Array3D[0][0][1] = Array3D[0][0][1] + 1



# Objects

class Test1:
    def __init__(self, a):
        self.a = a

class Test2:
    def __init__(self, b):
        self.b = b

test = Test1(2)
test.a = Test2("test")
test.a.b = "plop"
test.v = test.a.b
