# Enumerate, tuples (KO)
my_list = ['apple', 'banana', 'grapes', 'pear']
counter_list = list(enumerate(my_list, 1))
print(counter_list)

# Lamba (OK)
def multiply(x):
    return (x*x)
def add(x):
    return (x+x)

funcs = [multiply, add]
for i in range(5):
    value = list(map(lambda x: x(i), funcs))
    print(value)


# Reversed (OK)
my_str = 'AiBohPhoBiA'
l = range(-1, 2)

# reverse the string
rev_str = reversed(my_str)
rev_l = reversed(l)

# check if the string is equal to its reverse
if list(my_str) == list(rev_str):
   print("The string is a palindrome.")
else:
   print("The string is not a palindrome.")
