# Global

i = 0

def fun():
    global i
    i = 1
    t = "test"

fun()
t = "test2"



# LIST

lst = [0, 1, 2, 3, 4, 5, 6]

def incrementElement(i):
    lst[i] = lst[i] + 1

def incrementAllElements():
    for i in range(0, len(lst)):
        incrementElement(i)

for i in range(0, 10):
    incrementAllElements()
