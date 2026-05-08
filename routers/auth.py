from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from database import get_session
from models import User, UserRegister, UserLogin
from security import hash_password, verify_password, create_token

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    data: UserRegister,
    session: Session = Depends(get_session),
):
    existing = session.exec(
        select(User).where(User.username == data.username)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This username already exists.",
        )

    new_user = User(
        username=data.username,
        password=hash_password(data.password),
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return {"message": "Successful Sign Up", "user_id": new_user.id}


@router.post("/login")
def login(
    data: UserLogin,
    session: Session = Depends(get_session),
):
    user = session.exec(
        select(User).where(User.username == data.username)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username / password is wrong",
        )

    if not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username / password is wrong",
        )

    token = create_token(user.id)

    return {"token": token, "message": "Welcome"}