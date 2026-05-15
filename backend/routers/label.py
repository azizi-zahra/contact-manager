from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models import Label, LabelCreate, LabelResponse, LabelUpdate, User, Contact ,ContactLabel
from security import get_current_user

router = APIRouter()

@router.get("/labels", response_model=list[LabelResponse])
def get_labels(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    labels = session.exec(
        select(Label).where(Label.user_id == current_user.id)
    ).all()
    return labels

@router.get("/labels/{label_id}", response_model=LabelResponse)
def get_label(
    label_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    label = session.exec(
        select(Label).where(
            Label.id == label_id,
            Label.user_id == current_user.id
        )
    ).first()
    
    if not label:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No label with id {label_id} was found"
        )    
    return label

@router.post("/labels", status_code=status.HTTP_201_CREATED)
def create_label(
    data: LabelCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    label = Label(**data.model_dump(), user_id=current_user.id)
    session.add(label)
    session.commit()
    session.refresh(label)
    return label

@router.put("/labels/{label_id}")
def update_label(
    label_id: int,
    data: LabelUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    label = session.exec(
        select(Label).where(
            Label.id == label_id,
            Label.user_id == current_user.id
        )
    ).first()
    
    if not label:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No label with id {label_id} was found"
        ) 
        
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(label, key, value)
    
    session.add(label)
    session.commit()
    session.refresh(label)
    return label

@router.delete("/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_label(
    label_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    label = session.exec(
        select(Label).where(
            Label.id == label_id,
            Label.user_id == current_user.id
        )
    ).first()
    
    if not label:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No label with id {label_id} was found"
        ) 
        
    for contact in label.contacts:
        contact.labels.remove(label)
        
    session.delete(label)
    session.commit()
    return {"message": "Label deleted"}