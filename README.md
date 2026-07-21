# CampusIQ — Smart Campus Operations Platform

CampusIQ is an AI-assisted platform for managing day-to-day campus operations — complaints, assets, room bookings, employee management, and campus announcements — built as an MCA final-year capstone project.

**Live Modules:** Complaint Management • Asset & Inventory Tracking • Room Booking • Employee Management • Campus Notices • Network Fault Detection • Feedback & Ratings • QR-based Guest Reporting • Attendance

##  Key Features

### AI-Powered Complaint Management
- Real trained ML models (TF-IDF + Logistic Regression) automatically classify complaint **category** (Electrical, Plumbing, HVAC, Internet, IT, Cleaning, Security, General) and **priority** (Low/Medium/High/Critical) from free-text descriptions
- RoBERTa-based sentiment analysis on complaint text
- AI-recommended worker assignment — ranks employees by skill match, current workload, and rating
- Auto-escalation: 3+ similar complaints in the same location within 7 days are automatically flagged as a recurring issue and escalated to Critical
- Auto-progression: complaints move from "Assigned" to "In Progress" automatically after a priority-based time window
- SLA tracking with live-computed due dates per priority level

### Role-Based Access Control
- **Super Admin** — full system access, manages Masters (Departments, Categories, Blocks/Floors, Roles, Rooms), sees org-wide analytics
- **Admin** — can be a general Admin or *scoped* to a specific trade (Electrical/Plumbing/HVAC/etc.), seeing only complaints and employees relevant to that trade
- **User** — students/staff who raise complaints, book rooms, and track their requests
- All restrictions are enforced at both the frontend (route guards) and backend (middleware) — not just hidden UI

### QR-Based Guest Complaint System
- Auto-generated QR codes for every floor, encoding a stable location reference
- Scanning a QR (no login required) opens a guest complaint form with location pre-filled, AI-assisted classification, and a private tracking link for status updates and post-resolution feedback
- Admin-side QR Scanner tool (camera or image upload) for quickly identifying a floor's location and its facilities directory (classrooms, labs, washrooms, etc.)

### Asset & Inventory Management
- Item catalog with purchase history, invoice/receipt uploads, and stock tracking
- Distribution tracking by department with receipt uploads
- PDF export for reports

### Room & Resource Booking
- Dynamic room list (driven by Masters, not hardcoded)
- Real time-conflict detection to prevent double-booking
- Department-wise filtering for Super Admin oversight

### Additional Modules
- Employee management with designation/department assignment
- Campus-wide and role-targeted notices/announcements
- In-app notifications for complaint updates, bookings, and feedback
- AI chatbot grounded in live campus data
- Network Fault Pattern Detector — surfaces clusters of repeated infrastructure issues

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite), Tailwind/inline styles |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| AI/ML Service | Python, FastAPI, scikit-learn (TF-IDF + Logistic Regression), RoBERTa |
| Auth | JWT, bcrypt |
| AI Chatbot | Groq API (Llama 3.1) |
| File Handling | Multer, `docx`, `jsPDF` |
| QR | `qrcode.react` (generation), `html5-qrcode` (scanning) |

---

## Project Structure

```
campus_iq/
├── campusiq-frontend/     # React + TypeScript (Vite)
│   └── src/
│       ├── pages/         # Feature pages (Complaints, Assets, Bookings, Masters, etc.)
│       ├── components/    # Shared layout & common components
│       └── context/       # Auth & Theme context providers
├── campusiq-backend/      # Node.js + Express API
│   └── src/
│       ├── controllers/   # Business logic
│       ├── routes/        # API route definitions
│       └── middleware/    # Auth & role-guard middleware
└── campusiq-ai/            # Python FastAPI AI microservice
    ├── main.py             # AI service endpoints
    └── train_model.py      # Model training script
```

---

##  Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- PostgreSQL

### 1. Database Setup
Create a PostgreSQL database and run the schema/seed SQL scripts provided in the repository to set up tables (users, complaints, workers, assets, bookings, notices, masters, etc.).

### 2. Backend
```bash
cd campusiq-backend
npm install
node server.js
```
Runs on `http://localhost:5000`

### 3. Frontend
```bash
cd campusiq-frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`

### 4. AI Service
```bash
cd campusiq-ai
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python train_model.py        # trains and saves category/priority models
python main.py
```
Runs on `http://localhost:8000`

---

## Default Access

| Role | How to get one |
|---|---|
| Super Admin | Seeded during initial DB setup |
| Admin (scoped) | Created via SQL with a `designation` matching a trade in your Categories master |
| User | Self-register via the app's Register page |

> Passwords are bcrypt-hashed — never stored or transmitted in plain text.

---

##  AI Model Details

- **Category Classifier**: TF-IDF (1-2 grams, `max_features=2000`) + Logistic Regression, ~60–65% cross-validated accuracy across 8 categories
- **Priority Classifier**: Same pipeline, ~26–30% accuracy — a known limitation given the inherent subjectivity of priority labeling and limited training data; documented honestly rather than overstated
- **Sentiment Analysis**: Pretrained RoBERTa model
- Training data lives in `campusiq-ai/train_model.py` — extend the `training_data` list and re-run to improve accuracy

---

##  Known Limitations

- Attendance face-recognition is a UI simulation, not a real computer-vision pipeline
- Priority classification accuracy is modest — flagged as an area for future improvement with more labeled data
- Workers (maintenance staff) do not have individual logins by design — Admins update status on their behalf, keeping a single accountable system of record

---

## Project Info

Developed as an MCA final-year capstone project.
**Guide:** Mr. Mohammed Maaz Pasha

---

## License

This project is developed for academic purposes as part of an MCA curriculum.
