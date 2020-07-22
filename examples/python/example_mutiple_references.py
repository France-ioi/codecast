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


# Multiple references local
a = [0, 1]
b = [2, 3]
c = [a, b]

def test(c):
    c[0][0] = 42

a[0] = 5
# 5 5
print(a[0])
print(c[0][0])

c[0][0] = 6
# 6 6
print(a[0])
print(c[0][0])

test(c)
# 42 42
print(a[0])
print(c[0][0])
