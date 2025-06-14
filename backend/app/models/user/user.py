from backend.database.database import Base
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from passlib.hash import bcrypt
from backend.app.enums.gender import Gender
from backend.app.utils.encryption_handler import *

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone_number = Column(String, unique=True, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    _password = Column("password", String, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    remember_token = Column(String, index=True, nullable=True, default="")
    otp = Column(String, nullable=True)
    otp_expired_at = Column(DateTime, nullable=True)
    email_verified_at = Column(DateTime, nullable=True)
    
    @property
    def password(self):
        """
        Password getter - intentionally raises an error to prevent raw password access
        """
        raise AttributeError("Password is not a readable attribute.")
    
    @password.setter
    def password(self, plain_password):
        """
        Password setter - hashes raw password and stores in _password field
        """
        self._password = EncryptionHandler.get_password_hash(plain_password)
    def verify_password(self, plain_password):
        """
        Verify password against stored hash
        """      
        return EncryptionHandler.verify_plain_password(plain_password, self._password)
    
    # Relationships
    presentations = relationship("Presentation", back_populates="user")

