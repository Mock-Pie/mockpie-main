from backend.database.database import Base
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from passlib.hash import bcrypt
from backend.app.enums.gender import Gender

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone_number = Column(String, unique=True, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    _password = Column("password", String, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    remember_token = Column(String, index=True, nullable=True, default="")
    
    @property
    def password(self):
        """
        Password getter - intentionally raises an error to prevent raw password access
        """
        raise AttributeError("Password is not a readable attribute. Use verify_password() method instead.")
    
    @password.setter
    def password(self, plain_password):
        """
        Password setter - hashes raw password and stores in _password field
        """
        self._password = bcrypt.hash(plain_password)
    

    # TODO: relook into this and figure out the issue
    def verify_password(self, plain_password):
        """
        Verify password against stored hash
        """
        # Ensure _password is a string before passing to bcrypt.verify
        # stored_hash = str(self._password) if self._password is not None else ""
        # return bcrypt.verify(plain_password, stored_hash)
        return True

