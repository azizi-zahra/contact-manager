from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from typing import Optional, List
from models import Contact, ContactCreate, ContactUpdate, ContactResponse, User, Label, ContactLabel
from security import get_current_user

router = APIRouter()

@router.get("/contacts", response_model=list[ContactResponse], status_code=status.HTTP_200_OK)
def get_contacts(
    city: Optional[str] = None,
    search: Optional[str] = None,
    label_id: Optional[int] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(Contact).where(Contact.user_id == current_user.id)
    
    if city:
        query = query.where(Contact.city == city)
        
    if label_id:
        query = query.join(ContactLabel).where(ContactLabel.label_id == label_id)
        
    if search:
        query = query.where(
            Contact.name.contains(search) |
            Contact.family_name.contains(search) |
            Contact.phone.contains(search)
        )
        
    contacts = session.exec(query).all()
    
    if not contacts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No contacts found matching your criteria"
        )
        
    return contacts

@router.get("/contacts/{contact_id}", status_code=status.HTTP_200_OK)
def get_contact(
    contact_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    contact = session.exec(
        select(Contact).where(
            Contact.id == contact_id,
            Contact.user_id == current_user.id
        )
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No contact with id {contact_id} was found"
        )    
    return contact

@router.post("/contacts", status_code=status.HTTP_201_CREATED)
def post_contact(
    data: ContactCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    label_data = data.model_dump(exclude={"label_ids"})
    new_contact = Contact(**label_data, user_id=current_user.id)
    
    if data.label_ids:
        labels = session.exec(
            select(Label).where(
                Label.id.in_(data.label_ids),
                Label.user_id == current_user.id
            )
        ).all()
        new_contact.labels = labels
    
    session.add(new_contact)
    session.commit()
    session.refresh(new_contact)
    return new_contact 

@router.put("/contacts/{contact_id}", status_code=status.HTTP_200_OK)
def update_contact(
    contact_id: int, 
    data: ContactUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    contact = session.exec(
        select(Contact).where(
            Contact.id == contact_id,
            Contact.user_id == current_user.id
        )
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No contact with id {contact_id} was found"
        )
        
    update_data = data.model_dump(exclude_unset=True, exclude={"label_ids"})
    for key, value in update_data.items():
        setattr(contact, key, value)
        
    if data.label_ids is not None:
        labels = session.exec(
            select(Label).where(
                Label.id.in_(data.label_ids),
                Label.user_id == current_user.id
            )
        ).all()
        contact.labels = labels
    
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact

@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    contact = session.exec(
        select(Contact).where(
            Contact.id == contact_id,
            Contact.user_id == current_user.id
        )
    ).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No contact with id {contact_id} was found"
        ) 
        
    for label in contact.labels:
        contact.labels.remove(label)    
           
    session.delete(contact)
    session.commit()
    return {"message": f"Contact with id {contact_id} was deleted"}