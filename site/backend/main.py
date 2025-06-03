from fastapi import FastAPI, HTTPException, Response, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from authx import AuthX, AuthXConfig, exceptions
from authx.schema import TokenPayload
from pydantic import BaseModel
from database import *
from fastapi.responses import JSONResponse
import models
import uvicorn
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from schemas import UsersSchema, LoginSchema, UserOut
from crud import get_exist_user, create_user, get_user_by_email
import os
import jwt


app = FastAPI()
config = AuthXConfig(
    JWT_ALGORITHM = "HS256",
    JWT_SECRET_KEY = os.environ.get("SECRET_KEY"),
    JWT_ACCESS_COOKIE_NAME="my_access_token",
    JWT_REFRESH_COOKIE_NAME='refresh_token_cookie',
    JWT_TOKEN_LOCATION=["cookies"],
    JWT_COOKIE_SECURE=False,
    JWT_COOKIE_SAMESITE="lax",
    JWT_COOKIE_CSRF_PROTECT=False,
    JWT_COOKIE_DOMAIN="localhost",)

auth = AuthX(config=config)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(exceptions.MissingTokenError)
async def missing_token_exception_handler(request: Request, exc: exceptions.MissingTokenError):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": "Not authenticated or token missing"},
        headers={"WWW-Authenticate": "Bearer"}, # Важно для 401
    )



@app.exception_handler(exceptions.InvalidToken) # Это может быть базовым для многих ошибок токена
async def invalid_token_exception_handler(request: Request, exc: exceptions.InvalidToken):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": f"Invalid token: {str(exc)}"}, # Можно передать сообщение из исключения
        headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
    )

# authx.exceptions.JWTDecodeError может наследоваться от InvalidTokenError или быть отдельным.
# Если он не ловится InvalidTokenError, добавь отдельный обработчик:
@app.exception_handler(exceptions.JWTDecodeError)
async def jwt_decode_error_handler(request: Request, exc: exceptions.JWTDecodeError):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": f"Token decoding error: {str(exc)}"},
        headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
    )


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)


@app.post("/api/login", response_model=UserOut)
async def login(creds: LoginSchema, response: Response, db: AsyncSession = Depends(get_db)):
    user = await get_exist_user(db, creds.email, creds.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(uid=str(user.email)) 
    refresh_token = auth.create_refresh_token(uid=str(user.email))
    
    auth.set_access_cookies(access_token, response)
    auth.set_refresh_cookies(refresh_token, response)
    return user


auth_dependency = auth.token_required() 
# Если нужны кастомные параметры:
# auth_dependency = auth.token_required(type="access", verify_csrf=True) # и т.д.

async def get_current_user_from_token(
    # FastAPI вызовет auth_dependency (которая является _auth_required),
    # и результат (TokenPayload) будет в payload
    payload: TokenPayload = Depends(auth_dependency), 
    db: AsyncSession = Depends(get_db)
):
        if not isinstance(payload, TokenPayload):
            raise HTTPException(
                status_code=500, 
                detail=f"Unexpected type for payload: {type(payload)}. Expected TokenPayload."
            )

        user_identifier = payload.sub
        
        if user_identifier is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token payload missing user identifier (sub)")

        user = await get_user_by_email(db, email=str(user_identifier)) 
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found for token subject")
        return user


@app.get("/api/protected")
def get_protected(request: Request):
     try:
          auth.verify_token(token=request.cookies.get("my_access_token"))
          return {"status": "success"}
     except Exception as e:
          raise HTTPException(401, detail={"message": str(e)}) from e

@app.post("/api/add_user")
async def create_user_db(user: UsersSchema, db: AsyncSession = Depends(get_db)):
    return await create_user(db, user.username, user.password, user.email)


@app.post("/api/auth/refresh")
async def refresh_token(request: Request, response: Response):
    try:
        raw_refresh_token = request.cookies.get("refresh_token_cookie")
        if not raw_refresh_token:
            raise HTTPException(status_code=401, detail="Refresh token missing")

        payload = auth._decode_token(raw_refresh_token)
        user_identifier = payload.sub
        if user_identifier is None:
            raise HTTPException(status_code=400, detail="Invalid token")
        new_access_token = auth.create_access_token(uid=user_identifier)
        new_refresh_token = auth.create_refresh_token(uid=user_identifier)
        auth.set_access_cookies(new_access_token, response)
        auth.set_refresh_cookies(new_refresh_token, response)
        
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
         raise HTTPException(status_code=401, detail="Refresh token has expired")
    except jwt.InvalidTokenError:
         raise HTTPException(status_code=401, detail="Invalid refresh token")
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        auth.unset_refresh_cookies(response)
        auth.unset_access_cookies(response)
        raise HTTPException(status_code=401, detail="Could not refresh token")
    
@app.post("/api/auth/logout")
async def logout(response: Response):
    # Удаляем cookies
    auth.unset_cookies(response)
    return {"message": "Successfully logged out"}

@app.get("/api/users/me", response_model=UserOut)
async def read_users_me(current_user: models.User = Depends(get_current_user_from_token)):
    return current_user




if __name__ == "__main__":
    uvicorn.run("main:app", port=5000, reload=True)