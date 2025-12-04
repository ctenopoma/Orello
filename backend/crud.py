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
    return db.query(models.List).filter(models.List.board_id == board_id).order_by(models.List.position).all()

def create_list(db: Session, list: schemas.ListCreate, board_id: int):
    db_list = models.List(**list.dict(), board_id=board_id)
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    return db_list

# Card CRUD
def get_cards(db: Session, list_id: int):
    return db.query(models.Card).filter(models.Card.list_id == list_id).order_by(models.Card.position).all()

def create_card(db: Session, card: schemas.CardCreate, list_id: int):
    db_card = models.Card(**card.dict(), list_id=list_id)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

def update_card_position(db: Session, card_id: int, new_list_id: int, new_position: int):
    db_card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not db_card:
        return None

    old_list_id = db_card.list_id
    old_position = db_card.position

    if old_list_id == new_list_id:
        if old_position == new_position:
            return db_card
            
        if old_position < new_position:
            # Moving down: Shift items between old and new UP
            db.query(models.Card).filter(
                models.Card.list_id == new_list_id,
                models.Card.position > old_position,
                models.Card.position <= new_position
            ).update({models.Card.position: models.Card.position - 1}, synchronize_session=False)
        else:
            # Moving up: Shift items between new and old DOWN
            db.query(models.Card).filter(
                models.Card.list_id == new_list_id,
                models.Card.position >= new_position,
                models.Card.position < old_position
            ).update({models.Card.position: models.Card.position + 1}, synchronize_session=False)
    else:
        # Moving to different list: Shift items in target list DOWN to make space
        db.query(models.Card).filter(
            models.Card.list_id == new_list_id,
            models.Card.position >= new_position
        ).update({models.Card.position: models.Card.position + 1}, synchronize_session=False)
        
        # Optional: Shift items in source list UP to close gap (omitted for simplicity/performance)

    db_card.list_id = new_list_id
    db_card.position = new_position
    db.commit()
    db.refresh(db_card)
    return db_card

def update_card(db: Session, card_id: int, card: schemas.CardCreate):
    db_card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if db_card:
        db_card.title = card.title
        db_card.description = card.description
        db.commit()
        db.refresh(db_card)
    return db_card

def delete_card(db: Session, card_id: int):
    db_card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if db_card:
        db.delete(db_card)
        db.commit()
    return db_card
