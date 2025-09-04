FROM python:3

ENV PYTHONUNBUFFERED=1

WORKDIR /fastapi-site


COPY requirements.txt .
RUN pip install --index-url https://pypi.org/simple -r requirements.txt 
CMD [ "python", "main.py" ]
COPY . .
