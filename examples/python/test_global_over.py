gulobu = 42

def addOne(a):
    print(gulobu)
    return a + 1

b = 2
b = addOne(b)
print(gulobu)
print(b)

# WITH STEP INTO :
# 42
# 42
# 3

# WITH STEP OVER :
# 42
# 3

def test(a):
    if (a == 0):
        return 0
    return 1 + test(a - 1)

for i in range(0, 10):
    print(test(i))
