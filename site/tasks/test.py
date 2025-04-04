import json
import re
s = ('Возможно, стоит добавить немного разнообразия задачи, например, работать с строками или списками из разных элементов. Но для простоты начну с суммирования чисел.' +
  '</think>'
    '```json' +
    '{' +
  '"description": "Составьте программу для вычисления суммы квадратов целых чисел от 1 до заданного ввода. Используйте цикл.",' +
  '"difficulty": "3",'+
  '"input/output": {' +
    '"1": {"input": 3, "output": 14},'
    '"2": {"input": 6, "output": 91},'
    '"3": {"input": 5, "output": 55},'
    '"4": {"input": 7, "output": 140},'
    '"5": {"input": 8, "output": 204},'
    '"6": {"input": 4, "output": 30},'
    '"7": {"input": 9, "output": 285},'
    '"8": {"input": 10, "output": 385},'
    '"9": {"input": 1, "output": 1},'
    '"10": {"input": 2, "output": 5}'
  '}'
'}' +
'```')

regex = re.compile("\json(.*)\ ")
print(regex.findall(s))
res_dict = json.loads((regex.findall(s))[0])
print(res_dict['description'])