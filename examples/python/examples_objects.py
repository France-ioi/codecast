# Objects
class Test:
    def __init__(self, a, b, m):
        self.a = a
        self.b = b
        self.m = m

    def sum(self):
        self.m = "newmessage"
        return self.a + self.b

    def getM(self):
        return self.m

test = Test(41, 1, "Bonjour")
test.b = 10
i = 0
i = 1
tel = {'name': "John", 'number': "0123456789", 'inside': {'a': "val", 'c': "test"}}
tel['number'] = "0987654321"
tel['inside']['a'] = "newval"
tel['inside'] = {'a': "vala", 'b': "valb"}
print(test.sum())
print(test.getM())



# Extend
class classA:
    def __init__(self, a):
        self.a = a

class classB(classA):
    def __init__(self, a):
        classA.__init__(self, a)
        self.a = self.a + 1

obj = classB(41)
print(obj.a)


# Objects in object
class Test1:
    def __init__(self, a):
        self.a = a

class Test2:
    def __init__(self, b):
        self.b = b

test = Test1(2)
test.a = Test2("test")
test.a.c = 41
test.a.c = 42
print(test.a.c)


