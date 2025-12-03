from pydantic import BaseModel
from typing import List as TList, Optional
from datetime import datetime

class CardBase(BaseModel):
    title: str
    description: Optional[str] = None
    position: int = 0

class CardCreate(CardBase):
    pass

class Card(CardBase):
    id: int
    list_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class ListBase(BaseModel):
    title: str
    position: int = 0

class ListCreate(ListBase):
    pass

class List(ListBase):
    id: int
    board_id: int
    created_at: datetime
    cards: TList[Card] = []

    class Config:
        orm_mode = True

class BoardBase(BaseModel):
    title: str

class BoardCreate(BoardBase):
    pass

class Board(BoardBase):
    id: int
    created_at: datetime
    lists: TList[List] = []

    class Config:
        orm_mode = True
