import requests
import json
import time



API_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "deepseek-r1:7b"
def generate_task(topic: str, difficult: int):
    PROMPT = "Сгенерируй задачу для программирования на русском. " \
    "отправь в виде выделенного json файла, где описание задачи это 'description', сложность одна цифра 'difficulty', " \
    "данные 'input/output'" \
    " в 'input/output' будут хранится некоторое количество данных входных и выходных данных, " \
    "каждый из них будут находиться в отдельном ключе, который отображает номер, " \
    "то есть первые тестовые данные - '1', вторые - '2' и так до десятого '10'." \
    "тестовые входные данные для проверки решения 'input'" \
    " и выходные данные, которые должны состоковаться с входными, 'output'." \
    "Также прошу тебя начинай описание задачи с 'Создайте программу' или 'Напишите программу', не в коем случае не начинай с " \
    "'Создайте задачу для прграммирования на руссском' и не отклоняйся от ключей, которых я тебе задал" \
    f"Тема: {topic}. Сложность: {difficult}/5, где 1 - легкая, 5 - очень сложная."

    try:
        payload = {
            "model": MODEL,
            "prompt": PROMPT,
            "stream": False,
            "Content-Type": "application/json"
        }

        response = requests.post(API_URL, json=payload)
        jsondata = json.loads(response.text)
        result = jsondata['response']
        print(jsondata)
        '''
        print(result)
        if result[3:7] == 'json':
            last_index = result.rfind('json')
            json_file = json.loads(result[last_index+4:-3])
        else: 
            json_file = json.loads(result)'''
        return result
    except Exception as e:
        return {'error': e}
    
def check_task(code: str, task: str):
    PROMPT = f"У меня есть задача '{task}' и код для нее '{code}',"\
    "как ты считаешь данное решение подходит под условие задачи? Ответь в виде json файла"
    try:
        payload = {
            "model": MODEL,
            "prompt": PROMPT,
            "stream": False,
            "Content-Type": "application/json"
        }

        response = requests.post(API_URL, json=payload)
        jsondata = json.loads(response.text)
        result = jsondata['response']
        print(jsondata)
        '''
        print(result)
        if result[3:7] == 'json':
            last_index = result.rfind('json')
            json_file = json.loads(result[last_index+4:-3])
        else: 
            json_file = json.loads(result)'''
        return result
    except Exception as e:
        return {'error': e}

if __name__ == "__main__":
    start = time.time()
    code = "a = input() sum = 0 for i in a: b = int(i) sum += b print(sum)"
    task = "Напишите программу, которая находит сумму цифр числа."
    print(check_task(code, task))
    end = time.time() - start
    print(end)
