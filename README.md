Appointment ChatBot

A web-based chatbot interface that allows users to schedule doctor appointments by interacting with a conversational UI. The backend uses FastAPI and integrates directly with Google Calendar to check availability and book events.

🌐 Technologies Used

Frontend: React.js

Backend: FastAPI (Python 3.10+)

Calendar Integration: Google Calendar API

Docker: Containerization of frontend and backend

HTTP Client: httpx for async API requests

📦 Prerequisites

Node.js v18+

Python 3.10+

Docker & Docker Compose

Google Cloud Project with Calendar API enabled

🛠️ Setup Instructions

1. Clone the Repository

git clone https://github.com/Ayala-b/AppointmentChatBot.git
cd appointment-chatbot

2. Add Google Credentials- a file name is: credentials.json which I sent you Place it inside the backend/ directory

🚀 Running with Docker

docker-compose up --build

The app will be available at:

Frontend: http://localhost:3000

Backend (API): http://localhost:5000

⚙️ Running Locally (Without Docker)

Backend:

cd backend
pip install -r requirements.txt
uvicorn main:app --reload

Frontend:

cd fronted/client
npm install
npm start

📌 API Endpoints

GET /

Health check – returns a welcome message

POST /check_availability

Checks if the given time range is available in Google Calendar

Validates business hours and overlapping events

POST /book_appointment

Books an appointment and adds it to the calendar

Request Body:

{
  "start": "2025-05-20T10:00:00+03:00",
  "end": "2025-05-20T10:30:00+03:00",
  "summary": "Doctor Appointment"
}

🕒 Business Rules

Working Days: Sunday to Friday (closed on Saturday)

Working Hours:

Sun–Thu: 09:00–17:00

Friday: 09:00–13:00

Double bookings are prevented by querying Google Calendar before booking

📋 Features

🤖 Conversational chatbot UI (React)

✅ Validates time and business hours

📅 Fully synced with Google Calendar

🔒 Error handling and user feedback

📄 License

MIT License © 2025 Your Name

🙌 Author

Developed by Ayala Barebi – feel free to reach out for collaboration or questions!

Enjoy scheduling smart ✨

