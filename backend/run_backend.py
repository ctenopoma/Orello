import os
import sys

# Ensure the correct working directory for database
if getattr(sys, 'frozen', False):
    # Running as compiled - use executable directory
    os.chdir(os.path.dirname(sys.executable))

import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, create_engine
from sqlalchemy.orm import sessionmaker, relationship, Session, declarative_base
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./database.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class Board(Base):
    __tablename__ = "boards"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    lists = relationship("ListModel", back_populates="board", cascade="all, delete-orphan", order_by="ListModel.position")

class ListModel(Base):
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
    list = relationship("ListModel", back_populates="cards")

Base.metadata.create_all(bind=engine)

# Schemas
class CardBase(BaseModel):
    title: str
    description: Optional[str] = None

class CardCreate(CardBase):
    pass

class CardSchema(CardBase):
    id: int
    position: int
    list_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class ListBase(BaseModel):
    title: str

class ListCreate(ListBase):
    pass

class ListSchema(ListBase):
    id: int
    position: int
    board_id: int
    created_at: datetime
    cards: List[CardSchema] = []
    class Config:
        from_attributes = True

class BoardBase(BaseModel):
    title: str

class BoardCreate(BoardBase):
    pass

class BoardSchema(BoardBase):
    id: int
    created_at: datetime
    lists: List[ListSchema] = []
    class Config:
        from_attributes = True

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# App
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World", "From": "Python Backend"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# Boards
@app.post("/api/boards/", response_model=BoardSchema)
def create_board(board: BoardCreate, db: Session = Depends(get_db)):
    db_board = Board(**board.dict())
    db.add(db_board)
    db.commit()
    db.refresh(db_board)
    return db_board

@app.get("/api/boards/", response_model=List[BoardSchema])
def read_boards(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    boards = db.query(Board).offset(skip).limit(limit).all()
    return boards

@app.get("/api/boards/{board_id}", response_model=BoardSchema)
def read_board(board_id: int, db: Session = Depends(get_db)):
    db_board = db.query(Board).filter(Board.id == board_id).first()
    if db_board is None:
        raise HTTPException(status_code=404, detail="Board not found")
    return db_board

# Lists
@app.post("/api/boards/{board_id}/lists/", response_model=ListSchema)
def create_list(board_id: int, list_data: ListCreate, db: Session = Depends(get_db)):
    db_list = ListModel(**list_data.dict(), board_id=board_id)
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    return db_list

@app.get("/api/boards/{board_id}/lists/", response_model=List[ListSchema])
def read_lists(board_id: int, db: Session = Depends(get_db)):
    return db.query(ListModel).filter(ListModel.board_id == board_id).order_by(ListModel.position).all()

# Cards
@app.post("/api/lists/{list_id}/cards/", response_model=CardSchema)
def create_card(list_id: int, card: CardCreate, db: Session = Depends(get_db)):
    db_card = Card(**card.dict(), list_id=list_id)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

@app.get("/api/lists/{list_id}/cards/", response_model=List[CardSchema])
def read_cards(list_id: int, db: Session = Depends(get_db)):
    return db.query(Card).filter(Card.list_id == list_id).order_by(Card.position).all()

@app.put("/api/cards/{card_id}/move")
def move_card(card_id: int, new_list_id: int, new_position: int, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    old_list_id = card.list_id
    old_position = card.position
    
    if old_list_id == new_list_id:
        if old_position < new_position:
            db.query(Card).filter(
                Card.list_id == old_list_id,
                Card.position > old_position,
                Card.position <= new_position
            ).update({Card.position: Card.position - 1})
        elif old_position > new_position:
            db.query(Card).filter(
                Card.list_id == old_list_id,
                Card.position >= new_position,
                Card.position < old_position
            ).update({Card.position: Card.position + 1})
    else:
        db.query(Card).filter(
            Card.list_id == old_list_id,
            Card.position > old_position
        ).update({Card.position: Card.position - 1})
        
        db.query(Card).filter(
            Card.list_id == new_list_id,
            Card.position >= new_position
        ).update({Card.position: Card.position + 1})
        
        card.list_id = new_list_id
    
    card.position = new_position
    db.commit()
    db.refresh(card)
    return card

@app.put("/api/cards/{card_id}", response_model=CardSchema)
def update_card(card_id: int, card: CardCreate, db: Session = Depends(get_db)):
    db_card = db.query(Card).filter(Card.id == card_id).first()
    if db_card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    db_card.title = card.title
    db_card.description = card.description
    db.commit()
    db.refresh(db_card)
    return db_card

@app.delete("/api/cards/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db)):
    db_card = db.query(Card).filter(Card.id == card_id).first()
    if db_card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(db_card)
    db.commit()
    return {"status": "ok"}

if __name__ == "__main__":
    print("Starting Orello Backend on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)
