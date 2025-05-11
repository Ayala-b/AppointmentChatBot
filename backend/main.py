from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from google.oauth2 import service_account
from google.auth.transport.requests import Request as GoogleRequest
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICE_ACCOUNT_FILE = 'credentials.json'
SCOPES = ['https://www.googleapis.com/auth/calendar']
CALENDAR_ID = 'aba91404@gmail.com'

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)
credentials.refresh(GoogleRequest())
TOKEN = credentials.token

def get_access_token():
    global credentials, TOKEN
    if not credentials.valid or credentials.expired:
        credentials.refresh(GoogleRequest())
        TOKEN = credentials.token
    return TOKEN

class TimeRequest(BaseModel):
    start: str
    end: str
    summary: str = "Doctor Appointment"

def is_in_future(start_str: str) -> bool:
    try:
        start = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        return start >= now
    except Exception as e:
        print("Date check error:", e)
        return False

def is_duration_valid(start_str: str, end_str: str) -> bool:
    try:
        start = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
        end = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
        duration = end - start
        return timedelta(minutes=1) <= duration <= timedelta(minutes=30)
    except Exception as e:
        print("Duration error:", e)
        return False

def is_within_business_hours(start_str: str, end_str: str) -> bool:
    try:
        start = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
        end = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
        weekday = start.weekday()

        start_time = start.time()
        end_time = end.time()

        if weekday == 5 or end.weekday() == 5:
            return False

        if weekday in [6, 0, 1, 2, 3]:  # Sunday–Thursday
            return (start_time >= datetime.strptime("09:00", "%H:%M").time() and
                    end_time <= datetime.strptime("17:00", "%H:%M").time())

        if weekday == 4:  # Friday
            return (start_time >= datetime.strptime("09:00", "%H:%M").time() and
                    end_time <= datetime.strptime("13:00", "%H:%M").time())

        return False
    except Exception as e:
        print("Date error:", e)
        return False


@app.get("/")
async def root():
    return {"message": "Hello from FastAPI!"}

@app.post("/check_availability")
async def check_availability(data: TimeRequest):
    if not is_in_future(data.start):
        return {"available": False, "reason": "Cannot book in the past"}

    if not is_within_business_hours(data.start, data.end):
        return {"available": False, "reason": "Outside working hours"}

    if not is_duration_valid(data.start, data.end):
        return {"available": False, "reason": "Appointment must be between 1 and 30 minutes long"}

    access_token = get_access_token()
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    params = {
        "timeMin": data.start,
        "timeMax": data.end,
        "singleEvents": True,
        "orderBy": "startTime"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f'https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events',
            headers=headers,
            params=params
        )

    if response.status_code == 200:
        events = response.json().get("items", [])
        if len(events) == 0:
            return {"available": True}
        else:
            return {"available": False, "reason": "Time slot already booked"}
    else:
        return {"error": response.text}

@app.post("/book_appointment")
async def book_appointment(data: TimeRequest):
    access_token = get_access_token()
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }

    event = {
        'summary': data.summary,
        'start': {'dateTime': data.start, 'timeZone': 'Asia/Jerusalem'},
        'end': {'dateTime': data.end, 'timeZone': 'Asia/Jerusalem'}
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f'https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events',
            headers=headers,
            json=event
        )

    if response.status_code == 200:
        created = response.json()
        return {"eventId": created["id"], "status": "booked"}
    else:
        return {"error": response.text}
