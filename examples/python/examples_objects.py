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
i = 0
i = 1
tel = {'name': "John", 'number': "0123456789", 'inside': {'a': "val", 'c': "test"}}
tel['number'] = "0987654321"
tel['inside']['a'] = "newval"
tel['inside'] = {'a': "vala", 'b': "valb"}
test.b = 10
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
