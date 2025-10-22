from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import verify_api_key
from ..models import Wrestler

router = APIRouter()

@router.get("/rankings")
def get_rankings(weight_class: str = None, db: Session = Depends(get_db), user=Depends(verify_api_key)):
    query = db.query(Wrestler)
    if weight_class:
        query = query.filter(Wrestler.weight_class == weight_class)
    return query.order_by(Wrestler.rank).all()
