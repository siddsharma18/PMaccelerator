Here’s the properly formatted README.md markdown so it renders exactly as intended in GitHub’s Preview tab:

# Weather AI App

This is a full-stack AI-powered weather application built for the PM Accelerator internship technical assessment. It consists of a FastAPI backend and a responsive frontend to search, display, and understand weather data.

## Features

- Search current weather by city name  
- FastAPI backend with ML model integration  
- Displays humidity, temperature, wind speed, and forecast  
- Info button explaining the PM Accelerator program  
- Shows developer’s name clearly

## Tech Stack

### Frontend

- React  
- TailwindCSS  
- Axios  

### Backend

- FastAPI  
- Python  
- Scikit-learn  
- Pandas  
- Joblib

## File Structure
```bash

weather_ai_app/
├── backend_deploy/
│   ├── main.py
│   ├── model.pkl
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   └── (React frontend source code)
├── Dockerfile
├── README.md
└── …

## How to Run Locally

### 1. Clone the repository
```bash
git clone git@github.com:siddsharma18/PMaccelerator.git
cd PMaccelerator

2. Backend Setup

cd backend_deploy
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

3. Frontend Setup

cd ../frontend
npm install
npm run dev

4. Access Locally
	•	Frontend: http://localhost:3000
	•	Backend: http://localhost:8000

PM Accelerator

The PM Accelerator is a hands-on learning platform helping students and early professionals gain real-world product management experience.
Learn more on their LinkedIn page.

Author

Siddharth Sharma

