# Multiple references

a = 42
arr = {'a': a, 'b': 1}
arr2 = {'a': 2, 'b': a}

a = 41
# 41 42 42
print(a)
print(arr['a'])
print(arr2['b'])

a = "test"
arr = {'a': a, 'b': 1}
arr2 = {'a': 2, 'b': a}

a = a + "2"
# test2 test test
print(a)
print(arr['a'])
print(arr2['b'])

# Multiple references
a = {'a': 0, 'b': 1}
b = {'a': 2, 'b': 3}
c = {'a': a, 'b': b}

a['a'] = 5
# 5 5
print(a['a'])
print(c['a']['a'])

c['a']['a'] = 6
# 6 6
print(a['a'])
print(c['a']['a'])


# Multiple references parameter
a = {'a': 0, 'b': 1}
b = {'a': 2, 'b': 3}
c = {'a': a, 'b': b}

def test(c):
    v = "test1"
    c['a']['a'] = 42
    v = "test"
def test2(a, c):
    v = "test1"
    a['a'] = 45
    v = "test"

test(c)
# 42 42
print(a['a'])
print(c['a']['a'])

test2(a, c)
# 45 45
print(a['a'])
print(c['a']['a'])


# Multiple references parameter
a0 = {'a': 0, 'b': 1}
b0 = {'a': 2, 'b': 3}

def test():
    v = "test1"
    c0 = {'a': a0, 'b': b0}
    c0['a']['a'] = 42
    v = "test"
def test2(a0):
    v = "test1"
    a0['a'] = 45
    v = "test"

test()
# 42
print(a0['a'])

test2(a0)
# 45
print(a0['a'])



# With cycle
a0 = {'a': 0, 'b': 1}
b0 = {'a': a0, 'b': 3}
a0['b'] = a0

b0['a']['b']['a'] = 42

# {'a': 42, 'b': {...}}
# 42
# 42
# 42
print(a0)
print(a0['a'])
print(b0['a']['b']['a'])
print(b0['a']['b']['b']['a'])

# With cycle two levels
print("cycle 2")
a0 = {'a': 0, 'b': 1}
b0 = {'a': a0, 'b': 3}
c0 = {'a': b0, 'b': 4}
a0['b'] = c0

a0['a'] = 42
# 42
print(a0['a'])
# 42
print(a0['b']['a']['a']['a'])

# {'a': 42, 'b': {'a': {'a': {...}, 'b': 3}, 'b': 4}}
print(a0)
# {'a': {'a': 42, 'b': {'a': {...}, 'b': 4}}, 'b': 3}
print(b0)
# {'a': {'a': {'a': 42, 'b': {...}}, 'b': 3}, 'b': 4}
print(c0)
