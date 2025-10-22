from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, APIUsage
from datetime import datetime
from .config import FREE_TIER_LIMIT

def verify_api_key(x_api_key: str = Header(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.api_key == x_api_key).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Usage tracking (monthly)
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    usage = db.query(APIUsage).filter(
        APIUsage.user_id == user.id,
        APIUsage.date >= month_start
    ).first()
    
    if not usage:
        usage = APIUsage(user_id=user.id, requests=1)
        db.add(usage)
        db.commit()
    else:
        if usage.requests >= FREE_TIER_LIMIT:
            raise HTTPException(status_code=429, detail="Free tier limit reached")
        usage.requests += 1
        db.commit()
    
    return user
