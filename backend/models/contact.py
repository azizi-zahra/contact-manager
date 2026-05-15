from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, Annotated, TYPE_CHECKING, List
from pydantic import StringConstraints, field_validator
from models.label import ContactLabel, LabelResponse
import re

if TYPE_CHECKING:
    from models.user import User
    from models.label import Label

class Contact(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Annotated[str, StringConstraints(max_length=50)]
    family_name: Annotated[str, StringConstraints(max_length=50)]
    phone: Annotated[str, StringConstraints(max_length=15, pattern=r'^09\d{9}$')]
    email: Annotated[str, StringConstraints(max_length=100)]
    city: Annotated[str, StringConstraints(max_length=50)]
    user_id: int = Field(foreign_key="user.id")
    user: "User" = Relationship(back_populates="contacts")
    labels: list["Label"] = Relationship(
        back_populates="contacts",
        link_model=ContactLabel
    )
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        pattern = r'^[a-zA-Z0-9._-%+]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError(f'Invalid email format: {v}')
        return v

class ContactCreate(SQLModel):
    name: Annotated[str, StringConstraints(max_length=50)]
    family_name: Annotated[str, StringConstraints(max_length=50)]
    phone: Annotated[str, StringConstraints(max_length=15, pattern=r'^09\d{9}$')]
    email: Annotated[str, StringConstraints(max_length=100)]
    city: Annotated[str, StringConstraints(max_length=50)]
    label_ids: Optional[List[int]] = None  
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError(f'Invalid email format: {v}')
        return v

class ContactUpdate(SQLModel):
    name: Optional[Annotated[str, StringConstraints(max_length=50)]] = None
    family_name: Optional[Annotated[str, StringConstraints(max_length=50)]] = None
    phone: Optional[Annotated[str, StringConstraints(max_length=15, pattern=r'^09\d{9}$')]] = None
    email: Optional[Annotated[str, StringConstraints(max_length=100)]] = None
    city: Optional[Annotated[str, StringConstraints(max_length=50)]] = None
    label_ids: Optional[List[int]] = None  
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(pattern, v):
                raise ValueError(f'Invalid email format: {v}')
        return v

class ContactResponse(SQLModel):
    id: int
    name: Annotated[str, StringConstraints(max_length=50)]
    family_name: Annotated[str, StringConstraints(max_length=50)]
    phone: Annotated[str, StringConstraints(max_length=15, pattern=r'^09\d{9}$')]
    email: Annotated[str, StringConstraints(max_length=100)]
    city: Annotated[str, StringConstraints(max_length=50)]
    labels: List[LabelResponse] = []