# Запуск backend и task
Нужно перейти в папку tasks или backend (для backend-a нужно иметь postgreSQL с дб python_learn или любым другим, поменяв название дб в database.py "DATABASE_URL = 'postgresql+asyncpg://postgres:admin@localhost/***python_learn***'").
Требуется версия python 12 и выше
```
py -m venv .venv
./.venv/Scripts/activate (на linux\bash - "source ./.venv/bin/activate")
pip install -r requirements.txt
py main.py
```
# Запуск frontend
```
npm i
npm run dev
```
