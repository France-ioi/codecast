# Multiple references

a = 42
arr = [a, 1]
arr2 = [2, a]

a = 41
# 41 42 42
print(a)
print(arr[0])
print(arr2[1])

a = "test"
arr = [a, 1]
arr2 = [2, a]

a = a + "2"
# test2 test test
print(a)
print(arr[0])
print(arr2[1])

a = {'a': 2, 'b': 3}
arr = [a, 1]
arr2 = [2, a]

a['a'] = 1
# 1 1 1
print(a['a'])
print(arr[0]['a'])
print(arr2[1]['a'])


# Multiple references
a = [0, 1]
b = [2, 3]
c = [a, b]

a[0] = 5
# 5 5
print(a[0])
print(c[0][0])

c[0][0] = 6
# 6 6
print(a[0])
print(c[0][0])


# Multiple references parameter
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


# Multiple references parameter
a0 = [0, 1]
b0 = [2, 3]

def test():
    v = "test1"
    c0 = [a0, b0]
    c0[0][0] = 42
    v = "test"
def test2(a0):
    v = "test1"
    a0[0] = 45
    v = "test"

test()
# 42
print(a0[0])

test2(a0)
# 45
print(a0[0])

