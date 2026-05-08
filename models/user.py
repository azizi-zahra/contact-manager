from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, Annotated, TYPE_CHECKING
from pydantic import StringConstraints, field_validator
import re

if TYPE_CHECKING:
    from models.contact import Contact

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password: str
    contacts: list["Contact"] = Relationship(back_populates="user")

class UserRegister(SQLModel):
    username: Annotated[str, StringConstraints(min_length=3, max_length=50)]
    password: Annotated[str, StringConstraints(min_length=8, max_length=100)]
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        pattern = r'^[a-zA-Z0-9_]+$'
        if not re.match(pattern, v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

class UserLogin(SQLModel):
    username: Annotated[str, StringConstraints(min_length=3, max_length=50)]
    password: Annotated[str, StringConstraints(min_length=8, max_length=100)]

class UserResponse(SQLModel):
    id: int
    username: str