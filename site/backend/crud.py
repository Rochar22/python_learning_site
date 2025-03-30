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


async def get_exist_user(email, password):
    async with AsyncSession(engine) as session:
        result = await session.execute(select(exists().where(User.email == email)))
        user_exists = result.scalar()
        if user_exists:
            result = await session.execute(select(User).where(User.email == email).limit(1))
            users = result.scalar_one_or_none()
            verify = verify_password(password, users.password)
            print(verify)
            if verify:
                return True 
            return False

async def create_user(db: AsyncSession, username: str, password: str, email: str):
    try:
        hash_password = get_password_hash(password)
        db_user = User(username=username, password=hash_password, email=email)
        db.add(db_user)
        await db.commit()
        return {"message": "Вы успешно зарегистрированы", "status": 1} 
    except Exception:
        return {"message": f"Имя {username} уже существует", "status": 0}