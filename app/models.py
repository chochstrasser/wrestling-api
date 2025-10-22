from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    api_key = Column(String, unique=True, index=True)
    plan = Column(String, default="free")  # free/pro/business


class Wrestler(Base):
    __tablename__ = "wrestlers"
    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    school = Column(String)
    weight_class = Column(String)
    rank = Column(Integer)
    source = Column(String)
    last_updated = Column(DateTime(timezone=True), server_default=func.now())

class APIUsage(Base):
    __tablename__ = "api_usage"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime(timezone=True), server_default=func.now())
    requests = Column(Integer, default=0)
