from pydantic import BaseModel

class UsersSchema(BaseModel):
    email: str
    username: str
    password: str
class LoginSchema(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int 
    username: str
    email: str

    class Config:
        orm_mode = True
