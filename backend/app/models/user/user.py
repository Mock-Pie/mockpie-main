from database.database import Base
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
import enum
from passlib.hash import bcrypt
from ...enums import Gender

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
        raise AttributeError("Password is not a readable attribute")
    
    @password.setter
    def password(self, plain_password):
        self._password = bcrypt.hash(plain_password)
    
    def verify_password(self, plain_password):
        return bcrypt.verify(plain_password, self._password)

