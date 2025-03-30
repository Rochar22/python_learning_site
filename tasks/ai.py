import requests
import json

API_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "deepseek-r1:7b"
PROMPT = "Сгенерируй задачу для программирования. Тема: Циклы. Сложность: 5/5, где 1 - легкая, 5 - очень сложная. Напиши на русском только саму задачу без решения"

payload = {
    "model": MODEL,
    "prompt": PROMPT,
    "stream": False,
    "Content-Type": "application/json"
}

response = requests.post(API_URL, json=payload)
jsondata = json.loads(response.text)
print(jsondata['response'])