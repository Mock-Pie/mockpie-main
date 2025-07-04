from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.models.upcoming_presentation.upcoming_presentation import UpcomingPresentation
from backend.app.crud.user import *
from backend.app.crud.presentation import *

def get_upcoming_presentations_by_deleted_user_id(user_id, db: Session, skip: int = 0, limit: int = 100):
    return db.query(UpcomingPresentation).filter(
        UpcomingPresentation.user_id == user_id,
    ).offset(skip).limit(limit).all()
    
    
    
def get_upcoming_presentation_by_id(db: Session, presentation_id: int, user_id) -> UpcomingPresentation:
    return db.query(UpcomingPresentation).filter(
            UpcomingPresentation.id == presentation_id,
            UpcomingPresentation.user_id == user_id,
            UpcomingPresentation.deleted_at.is_(None) 
        ).first()
    

def create_upcoming_presentation(
    db: Session, 
    user_id: int, 
    topic: str, 
    presentation_date: datetime
) -> UpcomingPresentation:
    
    upcoming_presentation = UpcomingPresentation(
        user_id=user_id,
        topic=topic,
        presentation_date=presentation_date
    )

    print("upcoming_presentation", upcoming_presentation)
    
    try:
        db.add(upcoming_presentation)
        db.commit()
        db.refresh(upcoming_presentation)
        print('saved in db' )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating upcoming presentation: {str(e)}"
        )
    
    return upcoming_presentation


def delete_upcoming_presentation(
    db: Session, 
    upcoming_presentation: UpcomingPresentation, 
) -> UpcomingPresentation:
    
    try:
        # Hard delete - permanently remove from database
        db.delete(upcoming_presentation)
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting upcoming presentation: {str(e)}"
        )
    
    return upcoming_presentation


def get_upcoming_presentations_by_user_id_ordered_asc(
    current_user_id, 
    db: Session, 
) -> list[UpcomingPresentation]:
    
    upcoming_presentation = db.query(UpcomingPresentation).filter(
        UpcomingPresentation.user_id == current_user_id,
        UpcomingPresentation.deleted_at.is_(None)
    ).order_by(UpcomingPresentation.presentation_date.asc()).all()

    print("upcoming_presentation", upcoming_presentation)

    return upcoming_presentation
    
    
def update_upcoming_presentation(
    db: Session, 
    upcoming_presentation: UpcomingPresentation, 
) -> UpcomingPresentation:  
          
    try:
        db.commit()
        db.refresh(upcoming_presentation)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating upcoming presentation: {str(e)}"
        )
    
    return upcoming_presentation