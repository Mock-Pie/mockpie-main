from sqlalchemy.orm import Session

from backend.app.models.user.user import User
from backend.app.schemas.upcoming_presentation.upcoming_presentation_schema import *
from backend.app.crud.upcoming_presentation import *

class ListUpcomingPresentations:
    @staticmethod
    async def list_upcoming_presentations(current_user: User, db: Session):
        """
        List all upcoming presentations for the current user.
        
        Args:
            current_user (User): Authenticated user
            db (Session): Database session
            
        Returns:
            UpcomingPresentationList: List of upcoming presentations
        """
        upcoming_presentations = get_upcoming_presentations_by_user_id_ordered_asc(current_user, db)
        
        return UpcomingPresentationList(
            upcoming_presentations=[
                UpcomingPresentationResponse(
                    id=presentation.id,
                    topic=presentation.topic,
                    presentation_date=presentation.presentation_date,
                    created_at=presentation.created_at
                ) for presentation in upcoming_presentations
            ],
            total=len(upcoming_presentations)
        )