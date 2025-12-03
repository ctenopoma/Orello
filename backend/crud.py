from sqlalchemy.orm import Session
from . import models, schemas

# Board CRUD
def get_boards(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Board).offset(skip).limit(limit).all()

def create_board(db: Session, board: schemas.BoardCreate):
    db_board = models.Board(title=board.title)
    db.add(db_board)
    db.commit()
    db.refresh(db_board)
    return db_board

def get_board(db: Session, board_id: int):
    return db.query(models.Board).filter(models.Board.id == board_id).first()

# List CRUD
def get_lists(db: Session, board_id: int):
    return db.query(models.List).filter(models.List.board_id == board_id).all()

def create_list(db: Session, list: schemas.ListCreate, board_id: int):
    db_list = models.List(**list.dict(), board_id=board_id)
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    return db_list

# Card CRUD
def get_cards(db: Session, list_id: int):
    return db.query(models.Card).filter(models.Card.list_id == list_id).all()

def create_card(db: Session, card: schemas.CardCreate, list_id: int):
    db_card = models.Card(**card.dict(), list_id=list_id)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

def update_card_position(db: Session, card_id: int, new_list_id: int, new_position: int):
    db_card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if db_card:
        db_card.list_id = new_list_id
        db_card.position = new_position
        db.commit()
        db.refresh(db_card)
    return db_card
