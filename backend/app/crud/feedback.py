from sqlalchemy.orm import Session
from backend.app.models.presentation.feedback import Feedback

# Create feedback record
def create_feedback(db: Session, presentation_id: int, data: dict) -> Feedback:
    feedback = Feedback(presentation_id=presentation_id, data=data)
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback

# Get feedback by presentation_id
def get_feedback_by_presentation_id(db: Session, presentation_id: int) -> Feedback:
    return db.query(Feedback).filter(Feedback.presentation_id == presentation_id).first() 