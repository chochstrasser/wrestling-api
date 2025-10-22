from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import uuid
from ..database import get_db
from ..models import User, APIUsage
# import stripe  # Uncomment when integrating with Stripe

router = APIRouter()

@router.post("/signup")
def signup(email: str, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Generate API key
    api_key = str(uuid.uuid4())
    user = User(email=email, api_key=api_key)
    db.add(user)
    db.commit()
    db.refresh(user)

    # TODO: Integrate Stripe checkout session for paid plans
    # stripe.Customer.create(email=email)

    return {"email": email, "api_key": api_key, "plan": "free"}

@router.delete("/user")
def delete_user(email: str, db: Session = Depends(get_db)):
    """
    Delete a user account by email.
    This will also delete all associated API usage records.
    """
    # Find user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete associated API usage records
    db.query(APIUsage).filter(APIUsage.user_id == user.id).delete()
    
    # Delete user
    db.delete(user)
    db.commit()
    
    return {"message": f"User {email} and all associated data deleted successfully"}

@router.get("/user")
def get_user_info(email: str, db: Session = Depends(get_db)):
    """
    Get user information by email.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get usage stats
    usage = db.query(APIUsage).filter(APIUsage.user_id == user.id).all()
    total_requests = sum(u.requests for u in usage)
    
    return {
        "email": user.email,
        "api_key": user.api_key,
        "plan": user.plan,
        "total_requests": total_requests
    }
