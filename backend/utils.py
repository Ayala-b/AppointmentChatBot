from google.oauth2 import service_account
from google.auth.transport.requests import Request as GoogleRequest

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
