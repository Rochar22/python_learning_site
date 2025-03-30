from pydantic import BaseModel

class UsersSchema(BaseModel):
    email: str
    username: str
    password: str
class LoginSchema(BaseModel):
    email: str
    password: str
