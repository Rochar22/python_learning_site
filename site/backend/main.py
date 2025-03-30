from fastapi import FastAPI, HTTPException, Response, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from authx import AuthX, AuthXConfig, RequestToken
from pydantic import BaseModel
from database import *
import models
import uvicorn
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from schemas import UsersSchema
from crud import get_exist_user, create_user
import os


app = FastAPI()
config = AuthXConfig(
    JWT_ALGORITHM = "HS256",
    JWT_SECRET_KEY = os.environ.get("SECRET_KEY"),
    JWT_ACCESS_COOKIE_NAME="my_access_token",
    JWT_TOKEN_LOCATION=["cookies"],
    JWT_COOKIE_SECURE=False,
    JWT_COOKIE_SAMESITE="lax",
    JWT_COOKIE_CSRF_PROTECT=True,
    JWT_COOKIE_DOMAIN=None,)

auth = AuthX(config=config)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)


@app.post("/login")
async def login(creds: UsersSchema, response: Response):
    exists = await get_exist_user(creds.email, creds.password)
    if not exists:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(subject=creds.username)
    refresh_token = auth.create_refresh_token(subject=creds.username)
    
    auth.set_access_cookies(response, access_token)
    auth.set_refresh_cookies(response, refresh_token)
    return {"message": "Successfully logged in"}

async def get_current_user(request: Request):
    try:
        payload = await auth.get_payload(request)
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return models.User(username=username)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


@app.get("/protected", dependencies=[Depends(auth.get_token_from_request)])
def get_protected(token: RequestToken = Depends()):
     try:
          auth.verify_token(token=token)
          return {"status": "success"}
     except Exception as e:
          raise HTTPException(401, detail={"message": str(e)}) from e

@app.post("/add_user")
async def create_user_db(user: UsersSchema, db: AsyncSession = Depends(get_db)):
    return await create_user(db, user.username, user.password, user.email)


@app.post("/refresh")
async def refresh_token(request: Request, response: Response):
    try:
        refresh_token = request.cookies.get("refresh_token_cookie")
        if not refresh_token:
            raise HTTPException(status_code=401, detail="Refresh token missing")

        payload = auth.decode_token(refresh_token)
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=400, detail="Invalid token")
        
        new_access_token = auth.create_access_token(subject=username)
        auth.set_access_cookies(response, new_access_token)
        
        return {"message": "Token refreshed"}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
@app.post("/logout")
async def logout(response: Response):
    # Удаляем cookies
    auth.unset_jwt_cookies(response)
    return {"message": "Successfully logged out"}




if __name__ == "__main__":
    uvicorn.run("main:app", port=5000, reload=True)