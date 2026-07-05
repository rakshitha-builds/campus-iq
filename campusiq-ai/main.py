from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os

app = FastAPI(title="CampusIQ AI Service")

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
try:
    category_model = joblib.load(os.path.join(MODEL_DIR, "category_model.joblib"))
    priority_model = joblib.load(os.path.join(MODEL_DIR, "priority_model.joblib"))
    ML_MODELS_LOADED = True
    print("Loaded trained ML models (category_model.joblib, priority_model.joblib)")
except Exception as e:
    category_model = None
    priority_model = None
    ML_MODELS_LOADED = False
    print(f"ML models not found, falling back to keyword rules: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ComplaintText(BaseModel):
    text: str

CATEGORY_KEYWORDS = {
    "HVAC": ["ac", "air conditioner", "cooling", "hvac", "temperature", "hot", "cold"],
    "Electrical": ["light", "electric", "fan", "projector", "switch", "power", "wire"],
    "Plumbing": ["water", "leak", "pipe", "washroom", "tap", "toilet", "drain"],
    "Internet": ["wifi", "internet", "network", "connection", "lan"],
    "Cleaning": ["clean", "dirty", "garbage", "dust", "trash"],
    "Security": ["door", "lock", "security", "cctv", "camera", "theft"],
    "Furniture": ["chair", "table", "desk", "bench", "furniture", "broken"],
}

URGENT_WORDS = ["urgent", "emergency", "immediately", "critical", "dangerous", "asap"]
HIGH_WORDS = ["not working", "broken", "stopped", "damaged", "failed"]
LOW_WORDS = ["minor", "slow", "sometime", "occasionally"]

POSITIVE_WORDS = ["please", "kindly", "thank", "appreciate"]
NEGATIVE_WORDS = ["frustrated", "terrible", "worst", "angry", "annoyed", "fed up"]
URGENT_SENTIMENT = ["urgent", "immediately", "asap", "emergency"]

@app.get("/")
def root():
    return {"message": "CampusIQ AI Service is running", "status": "active"}

def analyze_with_keywords(text: str):
    category = "General"
    max_matches = 0
    for cat, keywords in CATEGORY_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in text)
        if matches > max_matches:
            max_matches = matches
            category = cat
    confidence = min(95, 70 + (max_matches * 8))
    priority = "Medium"
    if any(word in text for word in URGENT_WORDS):
        priority = "Critical"
    elif any(word in text for word in HIGH_WORDS):
        priority = "High"
    elif any(word in text for word in LOW_WORDS):
        priority = "Low"
    return category, priority, confidence

@app.post("/analyze")
def analyze_complaint(data: ComplaintText):
    text = data.text.lower()
    if ML_MODELS_LOADED:
        category = category_model.predict([text])[0]
        priority = priority_model.predict([text])[0]
        cat_proba = category_model.predict_proba([text]).max()
        confidence = round(float(cat_proba) * 100, 1)
        engine = "CampusIQ ML Engine v2.0 (TF-IDF + Logistic Regression)"
    else:
        category, priority, confidence = analyze_with_keywords(text)
        engine = "CampusIQ Rule-Based Engine v1.0 (fallback)"

    sentiment = "Neutral"
    if any(word in text for word in NEGATIVE_WORDS):
        sentiment = "Frustrated"
    elif any(word in text for word in URGENT_SENTIMENT):
        sentiment = "Urgent"
    elif any(word in text for word in POSITIVE_WORDS):
        sentiment = "Polite"

    return {
        "category": category,
        "priority": priority,
        "sentiment": sentiment,
        "confidence": confidence,
        "engine": engine
    }

@app.post("/predict-failure")
def predict_failure(data: dict):
    failure_count = data.get("failure_count", 0)
    age_years = data.get("age_years", 1)
    risk_score = min(98, (failure_count * 15) + (age_years * 5))
    if risk_score >= 80:
        risk_level = "Critical"
        recommendation = "Immediate replacement recommended"
    elif risk_score >= 50:
        risk_level = "Medium"
        recommendation = "Schedule preventive maintenance"
    else:
        risk_level = "Low"
        recommendation = "Continue regular monitoring"
    return {"risk_score": risk_score, "risk_level": risk_level, "recommendation": recommendation}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)