from fastapi import FastAPI, Request
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tasks import get_random_task
from ai import check_task
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

class Task(BaseModel):
    topic: str
    difficulty: int
class CompleteTask(BaseModel):
    task: str
    difficulty: int
    code: str

templates = Jinja2Templates(directory="./templates")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static", html=True), name="static")
@app.post("/task/")
async def create_item(task: Task):
    output = get_random_task(task)
    return {'task': output}

@app.post("/task/check")
async def check_task(answer: CompleteTask):
    output = check_task(answer.code, answer.task)
    return {'status': output}

if __name__ == '__main__':
    uvicorn.run('main:app', reload=True)