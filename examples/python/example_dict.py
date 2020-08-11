a = {'a': 2, 'b': 3}
arr = [a, 1]
arr2 = [2, a]

a['a'] = 1
# 1 1 1
print(a['a'])
print(arr[0]['a'])
print(arr2[1]['a'])
