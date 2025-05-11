import json
import requests
import google.auth
from google.oauth2 import service_account
from google.auth.transport.requests import Request

# קריאה לקובץ המפתח
SERVICE_ACCOUNT_FILE = 'credentials.json'
SCOPES = ['https://www.googleapis.com/auth/calendar']
CALENDAR_ID = 'aba91404@gmail.com'  # שנה ל־ID האמיתי

# יצירת אובייקט ההרשאה
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)

# רענון טוקן
credentials.refresh(Request())
token = credentials.token

# headers
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# טווח בדיקה
params = {
    "timeMin": "2025-05-10T10:00:00+03:00",
    "timeMax": "2025-05-10T10:30:00+03:00",
    "singleEvents": True,
    "orderBy": "startTime"
}

# שליחת בקשה
url = f'https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events'
response = requests.get(url, headers=headers, params=params)

# תוצאה
if response.status_code == 200:
    events = response.json().get("items", [])
    print("Available:" if not events else "Busy!")
    print("Events:", json.dumps(events, indent=2, ensure_ascii=False)) 

else:
    print("Error:", response.status_code, response.text)
