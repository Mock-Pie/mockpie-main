from sqlalchemy.orm import Session
from backend.app.models.feedback.feedback import Feedback
from fastapi import HTTPException, status
from backend.app.static.lang.error_messages.exception_responses import ErrorMessage

# Create feedback record
def create_feedback(db: Session, presentation_id: int, data: dict) -> Feedback:
    feedback = Feedback(presentation_id=presentation_id, data=data)
    
    try:
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating feedback: {str(e)}"
        )


# Get feedback by presentation_id
def get_feedback_by_presentation_id(db: Session, presentation_id: int) -> Feedback:
    return db.query(Feedback).filter(Feedback.presentation_id == presentation_id).first()


def delete_feedback_by_presentation_id(db: Session, presentation_id: int):
    feedback = db.query(Feedback).filter(Feedback.presentation_id == presentation_id).first()
    print("delete_feedback_by_presentation_id", feedback)
    if not feedback:
        return
    
    try: 
        db.delete(feedback)
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting body analysis: {str(e)}"
        )
