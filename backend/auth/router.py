from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import get_current_user
from auth.jwt import create_access_token
from auth.service import authenticate, create_user, get_user_by_email, get_user_by_username
from database import get_db
from models.user import User
from schemas.auth import Token, UserLogin, UserRegister
from schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    if await get_user_by_email(db, data.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    if await get_user_by_username(db, data.username):
        raise HTTPException(status_code=409, detail="Username already taken")

    user = await create_user(db, data)
    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user, from_attributes=True))


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate(db, data.email, data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user, from_attributes=True))


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
