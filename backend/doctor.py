from fastapi import APIRouter
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
import httpx

from utils import get_access_token, CALENDAR_ID

doctor_router = APIRouter()

@doctor_router.get("/doctor/appointments")
async def get_doctor_appointments():
    token = get_access_token()
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    now = datetime.utcnow().isoformat() + 'Z'
    time_max = (datetime.utcnow() + timedelta(days=30)).isoformat() + 'Z'

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f'https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events',
            headers=headers,
            params={
                'timeMin': now,
                'timeMax': time_max,
                'singleEvents': True,
                'orderBy': 'startTime'
            }
        )

    if response.status_code == 200:
        events = response.json().get("items", [])
        return JSONResponse(content=events)
    else:
        return JSONResponse(content={"error": response.text}, status_code=response.status_code)
