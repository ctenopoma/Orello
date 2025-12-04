from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn

from . import models, schemas, crud, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Allow CORS for local development with Electron
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
@app.post("/api/boards/", response_model=schemas.Board)
def create_board(board: schemas.BoardCreate, db: Session = Depends(database.get_db)):
    return crud.create_board(db=db, board=board)

@app.get("/api/boards/", response_model=List[schemas.Board])
def read_boards(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    boards = crud.get_boards(db, skip=skip, limit=limit)
    return boards

@app.get("/api/boards/{board_id}", response_model=schemas.Board)
def read_board(board_id: int, db: Session = Depends(database.get_db)):
    db_board = crud.get_board(db, board_id=board_id)
    if db_board is None:
        raise HTTPException(status_code=404, detail="Board not found")
    return db_board

# Lists
@app.post("/api/boards/{board_id}/lists/", response_model=schemas.List)
def create_list(board_id: int, list: schemas.ListCreate, db: Session = Depends(database.get_db)):
    return crud.create_list(db=db, list=list, board_id=board_id)

@app.get("/api/boards/{board_id}/lists/", response_model=List[schemas.List])
def read_lists(board_id: int, db: Session = Depends(database.get_db)):
    return crud.get_lists(db, board_id=board_id)

# Cards
@app.post("/api/lists/{list_id}/cards/", response_model=schemas.Card)
def create_card(list_id: int, card: schemas.CardCreate, db: Session = Depends(database.get_db)):
    return crud.create_card(db=db, card=card, list_id=list_id)

@app.get("/api/lists/{list_id}/cards/", response_model=List[schemas.Card])
def read_cards(list_id: int, db: Session = Depends(database.get_db)):
    return crud.get_cards(db, list_id=list_id)

@app.put("/api/cards/{card_id}/move")
def move_card(card_id: int, new_list_id: int, new_position: int, db: Session = Depends(database.get_db)):
    return crud.update_card_position(db, card_id, new_list_id, new_position)

@app.put("/api/cards/{card_id}", response_model=schemas.Card)
def update_card(card_id: int, card: schemas.CardCreate, db: Session = Depends(database.get_db)):
    db_card = crud.update_card(db, card_id=card_id, card=card)
    if db_card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return db_card

@app.delete("/api/cards/{card_id}")
def delete_card(card_id: int, db: Session = Depends(database.get_db)):
    db_card = crud.delete_card(db, card_id=card_id)
    if db_card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
