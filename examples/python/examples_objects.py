# Objects
class Test:
    def __init__(selfref, a, b, m):
        selfref.a = a
        selfref.b = b
        selfref.m = m

    def sum(self):
        self.m = "newmessage"
        return self.a + self.b

    def sum2(objSelf):
        objSelf.m = "newmessage obj"
        return objSelf.a + objSelf.b

    def getM(self):
        return self.m

class Test2:
    def __init__(selfref):
        selfref.a = 41

test = Test(41, 1, "Bonjour")
test.b = 10
test2 = Test2()
test2.a = 42
test2.b = "plop"
i = 0
i = 1
tel = {'name': "John", 'number': "0123456789", 'inside': {'a': "val", 'c': "test"}}
tel['number'] = "0987654321"
tel['inside']['a'] = "newval"
tel['inside'] = {'a': "vala", 'b': "valb"}
print(test.sum())
test.sum2()
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
test.a.b = "plop"
test.a.c = 41
test.a.c = 42
print(test.a.c)

tab = [Test1(1), Test2(2)]
test.a.tab = tab
test.a.tab[1].a = 42
print(test.a.tab[1].a)


