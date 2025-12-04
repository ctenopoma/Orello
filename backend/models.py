from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Board(Base):
    __tablename__ = "boards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lists = relationship("List", back_populates="board", cascade="all, delete-orphan", order_by="List.position")

class List(Base):
    __tablename__ = "lists"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    position = Column(Integer, default=0)
    board_id = Column(Integer, ForeignKey("boards.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    board = relationship("Board", back_populates="lists")
    cards = relationship("Card", back_populates="list", cascade="all, delete-orphan", order_by="Card.position")

class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    position = Column(Integer, default=0)
    list_id = Column(Integer, ForeignKey("lists.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    list = relationship("List", back_populates="cards")
