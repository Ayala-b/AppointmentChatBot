# backend/auth.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
import httpx

# Dummy in-memory user store for demo purposes
fake_users_db = {
    "doctor@example.com": {
        "email": "doctor@example.com",
        "hashed_password": "$2b$12$KIX2J1e9i4eZ6BfskSgUye/4U1E/Z77oxUdW2/yCnXz1eMZzkWZkK",  # "password"
        "role": "doctor"
    }
}

SECRET_KEY = "yoursecret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

router = APIRouter()

# SMTP email configuration (use env vars in production)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "aba91404@gmail.com"
SMTP_PASSWORD = "jmzw lajc znus qdjf"

class EmailRequest(BaseModel):
    to: str
    subject: str
    body: str

class AppointmentRequest(BaseModel):
    to: str
    summary: str
    start: str
    end: str


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user(email: str):
    user = fake_users_db.get(email)
    if user:
        return user
    return None

def authenticate_user(email: str, password: str):
    user = get_user(email)
    if not user or not verify_password(password, user["hashed_password"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(status_code=401, detail="Invalid credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
        user = get_user(email)
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception

@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/send_email")
async def send_email(data: EmailRequest):
    try:
        msg = MIMEText(data.body)
        msg["Subject"] = data.subject
        msg["From"] = SMTP_USER
        msg["To"] = data.to

        print(">> trying to send email to:", data.to)  

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, [data.to], msg.as_string())

        return {"status": "Email sent successfully"}
    except Exception as e:
        print(">> EMAIL ERROR:", e)  
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/book_and_notify")
async def book_and_notify(data: AppointmentRequest):
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post("http://127.0.0.1:5000/book_appointment", json={
                "start": data.start,
                "end": data.end,
                "summary": data.summary
            })

        if res.status_code == 200:
            # Send email
            body = f"Your appointment '{data.summary}' was scheduled from {data.start} to {data.end}."
            await send_email(EmailRequest(to=data.to, subject="Appointment Confirmation", body=body))
            return {"status": "Appointment booked and email sent."}
        else:
            return {"error": "Appointment booking failed", "detail": res.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))