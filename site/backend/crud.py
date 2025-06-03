from sqlalchemy import exists
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine
from models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalars().first()

async def get_exist_user(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password): 
        return None
    return user

async def create_user(db: AsyncSession, username: str, password: str, email: str):
    try:
        hash_password = get_password_hash(password)
        db_user = User(username=username, password=hash_password, email=email)
        db.add(db_user)
        await db.commit()
        return {"message": "Вы успешно зарегистрированы", "status": 1} 
    except Exception:
        return {"message": f"Имя {username} уже существует", "status": 0}