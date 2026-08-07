from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import ConflictException, ForbiddenException, UnauthorizedException
from core.security.deps import get_current_user
from core.security.jwt import create_access_token
from models.user import User
from modules.auth.schemas import Token, UserLogin, UserRegister
from modules.auth.service.auth_service import (
    authenticate,
    create_user,
    get_user_by_email,
    get_user_by_username,
)
from modules.users.schemas import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    if await get_user_by_email(db, data.email):
        raise ConflictException("Email already registered")
    if await get_user_by_username(db, data.username):
        raise ConflictException("Username already taken")

    user = await create_user(db, data)
    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user, from_attributes=True))


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate(db, data.email, data.password)
    if user is None:
        raise UnauthorizedException("Incorrect email or password")
    if not user.is_active:
        raise ForbiddenException("Account suspended")
    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user, from_attributes=True))


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
