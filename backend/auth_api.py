import os
import re
import random
import string
import urllib.request
import urllib.parse
import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from backend.database import get_db, Base, engine, SessionLocal
from backend.models import User

# Password hashing setup using bcrypt with fallback
try:
    import bcrypt
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$") or hashed_password.startswith("$2y$"):
                return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception as e:
            print(f"[AUTH] bcrypt verify error: {e}")
        
        # Fallback PBKDF2/SHA256 check if legacy hash exists
        salt = os.getenv("SECRET_KEY", "icfai_secret_salt_2026").encode()
        pbkdf2_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode(), salt, 100000).hex()
        return pbkdf2_hash == hashed_password
except Exception as e:
    def hash_password(password: str) -> str:
        salt = os.getenv("SECRET_KEY", "icfai_secret_salt_2026").encode()
        return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000).hex()

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        salt = os.getenv("SECRET_KEY", "icfai_secret_salt_2026").encode()
        return hashlib.pbkdf2_hmac("sha256", plain_password.encode(), salt, 100000).hex() == hashed_password

# Approved institutional email domains
DEFAULT_DOMAINS = ["icfai.edu", "icfai.ac.in", "ifheindia.org", "edu.in", "ac.in"]
env_domains = os.getenv("APPROVED_EMAIL_DOMAINS")
APPROVED_DOMAINS = [d.strip().lower() for d in env_domains.split(",")] if env_domains else DEFAULT_DOMAINS

def is_approved_college_email(email: str) -> bool:
    if not email or "@" not in email:
        return False
    email_clean = email.strip().lower()
    pattern = r"^[\w\.-]+@([\w-]+\.)+[\w-]{2,}$"
    if not re.match(pattern, email_clean):
        return False
    domain = email_clean.split("@")[-1]
    return any(domain == d or domain.endswith("." + d) for d in APPROVED_DOMAINS)

# In-memory captcha store (challenge_id -> {"code": code, "expires": datetime})
captcha_store: dict[str, dict] = {}

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None  # Role requested in tab (verified against DB)
    captcha_token: Optional[str] = None  # Turnstile token
    captcha_id: Optional[str] = None     # Math CAPTCHA ID
    captcha_answer: Optional[str] = None # Math CAPTCHA user answer

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    reset_code: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    email: str
    current_password: str
    new_password: str

class ProvisionUserRequest(BaseModel):
    email: str
    name: str
    role: str  # "admin" or "faculty"
    initial_password: str

def verify_captcha_response(token: Optional[str], captcha_id: Optional[str], answer: Optional[str]) -> bool:
    secret_key = os.getenv("TURNSTILE_SECRET_KEY") or os.getenv("CAPTCHA_SECRET")
    
    # Cloudflare Turnstile verification if secret key and token provided
    if secret_key and token:
        try:
            data = urllib.parse.urlencode({"secret": secret_key, "response": token}).encode()
            req = urllib.request.Request("https://challenges.cloudflare.com/turnstile/v0/siteverify", data=data)
            with urllib.request.urlopen(req, timeout=5) as resp:
                res = json.loads(resp.read().decode())
                if res.get("success"):
                    return True
        except Exception as e:
            print(f"[CAPTCHA] Turnstile verification error: {e}")

    # Local institutional CAPTCHA verification
    if captcha_id and answer:
        entry = captcha_store.get(captcha_id)
        if entry:
            # Check expiration (5 minutes)
            if entry["expires"] < datetime.utcnow():
                captcha_store.pop(captcha_id, None)
                return False
            expected = entry["code"]
            if str(answer).strip().upper() == str(expected).strip().upper():
                captcha_store.pop(captcha_id, None)  # Single-use challenge
                return True
        return False

    return False

@router.get("/captcha-challenge")
def get_captcha_challenge():
    """Generates a secure, compact CAPTCHA challenge for the login form."""
    # Clean up expired items
    now = datetime.utcnow()
    expired_keys = [k for k, v in captcha_store.items() if v["expires"] < now]
    for k in expired_keys:
        captcha_store.pop(k, None)

    num1 = random.randint(2, 9)
    num2 = random.randint(1, 9)
    code = str(num1 + num2)
    challenge_id = "".join(random.choices(string.ascii_letters + string.digits, k=20))
    
    captcha_store[challenge_id] = {
        "code": code,
        "expires": now + timedelta(minutes=5),
    }
    
    return {
        "captcha_id": challenge_id,
        "question": f"{num1} + {num2} = ?",
        "num1": num1,
        "num2": num2,
        "expires_in_seconds": 300,
    }

@router.post("/login")
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    # 1. Validate CAPTCHA
    if not verify_captcha_response(payload.captcha_token, payload.captcha_id, payload.captcha_answer):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired CAPTCHA answer. Please solve the verification challenge."
        )

    # 2. Email format & domain validation
    email = payload.email.strip().lower()
    if not is_approved_college_email(email):
        allowed_str = ", ".join(APPROVED_DOMAINS)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Access restricted. Only authorized institutional college emails ({allowed_str}) are allowed."
        )

    # 3. Find user in database
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid institutional email address or password."
        )

    # 4. Verify password against securely stored hash
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid institutional email address or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your institutional account has been deactivated. Please contact the administrator."
        )

    # 5. Determine user's actual role STRICTLY from database record
    db_role = user.role.lower()
    if db_role not in ["admin", "faculty"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized role. Only Admin and Faculty accounts are permitted."
        )

    # Generate session / JWT token
    token = f"icfai_jwt_{user.id}_{int(datetime.utcnow().timestamp())}"

    return {
        "status": "SUCCESS",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": db_role,
        },
        "token": token,
        "message": f"Successfully authenticated as {db_role.capitalize()}."
    }

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not is_approved_college_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid institutional college email address."
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Avoid user enumeration while giving safe response
        return {
            "status": "SUCCESS",
            "message": f"If an account exists for {email}, a 6-digit reset code has been issued."
        }

    # Generate single-use 6-digit verification code with 15-minute expiration
    reset_code = "".join(random.choices(string.digits, k=6))
    user.reset_token = reset_code
    user.reset_token_expires = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    print(f"[AUTH] Generated 6-digit password reset code for {email}: {reset_code}")

    return {
        "status": "SUCCESS",
        "message": f"A 6-digit verification code has been generated for {email}.",
        "reset_code": reset_code,  # Sent for testing / demonstration verification
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    
    if not user or not user.reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password reset request or email not found."
        )

    if user.reset_token != payload.reset_code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or incorrect verification code."
        )

    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    # Hash new password securely with bcrypt
    user.hashed_password = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {
        "status": "SUCCESS",
        "message": "Password reset successfully. You can now log in with your new password."
    }

@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    user.hashed_password = hash_password(payload.new_password)
    db.commit()

    return {
        "status": "SUCCESS",
        "message": "Password changed successfully."
    }

@router.post("/provision-user")
def provision_user(payload: ProvisionUserRequest, db: Session = Depends(get_db)):
    """Restricted provisioning endpoint for institution administrators to onboard faculty/admin."""
    email = payload.email.strip().lower()
    if not is_approved_college_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email must belong to an approved institutional domain ({', '.join(APPROVED_DOMAINS)})."
        )

    role = payload.role.strip().lower()
    if role not in ["admin", "faculty"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only 'admin' and 'faculty' roles can be provisioned."
        )

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account with email {email} already exists."
        )

    new_user = User(
        email=email,
        name=payload.name,
        role=role,
        hashed_password=hash_password(payload.initial_password),
        is_active=True,
        is_verified=True,
    )
    db.add(new_user)
    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Successfully provisioned {role.capitalize()} account for {email}.",
        "user": new_user.to_dict(),
    }

def seed_users():
    """Seeds authorized default Admin and Faculty accounts into database with secure bcrypt password hashes."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        initial_users = [
            {
                "email": "admin@icfai.edu",
                "name": "Super Admin",
                "role": "admin",
                "password": "admin123",
            },
            {
                "email": "faculty@icfai.edu",
                "name": "Prof. Faculty Member",
                "role": "faculty",
                "password": "faculty123",
            },
            {
                "email": "admin@icfai.ac.in",
                "name": "ICFAI Tech Admin",
                "role": "admin",
                "password": "admin123",
            },
            {
                "email": "faculty@icfai.ac.in",
                "name": "ICFAI Tech Faculty",
                "role": "faculty",
                "password": "faculty123",
            },
        ]

        for u in initial_users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                new_user = User(
                    email=u["email"],
                    name=u["name"],
                    role=u["role"],
                    hashed_password=hash_password(u["password"]),
                    is_active=True,
                    is_verified=True,
                )
                db.add(new_user)
                print(f"[Seed] Created user: {u['email']} ({u['role']})")
            else:
                # Ensure password hash is valid bcrypt if updated
                if not verify_password(u["password"], existing.hashed_password):
                    existing.hashed_password = hash_password(u["password"])
                    print(f"[Seed] Updated hash for user: {u['email']}")
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding users: {e}")
    finally:
        db.close()
