from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, Annotated, TYPE_CHECKING
from pydantic import StringConstraints

if TYPE_CHECKING:
    from models.contact import Contact

class ContactLabel(SQLModel, table=True):
    contact_id: int = Field(foreign_key="contact.id", primary_key=True)
    label_id: int = Field(foreign_key="label.id", primary_key=True)

class Label(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Annotated[str, StringConstraints(max_length=50)]
    color: str = Field(default="#808080", max_length=7)  
    user_id: int = Field(foreign_key="user.id")
    contacts: list["Contact"] = Relationship(
        back_populates="labels",
        link_model=ContactLabel
    )

class LabelCreate(SQLModel):
    name: Annotated[str, StringConstraints(max_length=50)]
    color: str = "#808080"

class LabelUpdate(SQLModel):
    name: Optional[Annotated[str, StringConstraints(max_length=50)]] = None
    color: Optional[str] = None

class LabelResponse(SQLModel):
    id: int
    name: str
    color: str