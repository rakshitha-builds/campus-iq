"""
CampusIQ AI — Model Training Script
=====================================
Trains two classifiers used by the complaint-analysis AI service:
  1. Category classifier  — predicts issue type (Electrical, Plumbing, etc.)
  2. Priority classifier   — predicts urgency (Low/Medium/High/Critical)

Both use the same standard NLP pipeline:
  Text  -->  TF-IDF Vectorizer (with bigrams)  -->  Logistic Regression

Priority labeling criteria (kept consistent across all examples, so the
model learns a real generalizable pattern instead of noisy one-offs):
  Critical — safety hazards: sparks, shocks, fire, flooding, gas smell,
             exposed wiring, theft/security breach, building-wide outage
  High     — a service is fully non-functional for a room/area, or a
             safety-adjacent gap (broken lock, missing fire extinguisher,
             alarm not working, no water/power/network in a whole area)
  Medium   — a service is degraded but still partly functional, or
             affects comfort/hygiene without being unsafe
  Low      — cosmetic or single-item issues with no functional impact

This script can be re-run any time new labeled complaint data is available
— just extend `training_data` below and re-run. It overwrites
category_model.joblib and priority_model.joblib with freshly trained models.

Run with:  python train_model.py
"""

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score

# -----------------------------------------------------------------------
# Training data: (complaint_text, category, priority)
# -----------------------------------------------------------------------
training_data = [
    # ---------------- Electrical ----------------
    ("The lights in the classroom are not working", "Electrical", "Medium"),
    ("Fan is broken and making noise", "Electrical", "Low"),
    ("Projector is not turning on", "Electrical", "Medium"),
    ("Power socket sparked when I plugged in my laptop", "Electrical", "Critical"),
    ("Tube light flickering in the lab", "Electrical", "Low"),
    ("Electrical wiring exposed near the staircase", "Electrical", "Critical"),
    ("Switch board is not working in room 204", "Electrical", "Medium"),
    ("No power in the entire block since morning", "Electrical", "Critical"),
    ("Ceiling fan making a loud grinding noise", "Electrical", "Low"),
    ("Short circuit smell coming from the wall socket", "Electrical", "Critical"),
    ("Lights keep flickering on and off in the corridor", "Electrical", "Low"),
    ("Extension board is sparking near my desk", "Electrical", "Critical"),
    ("Fan in the hostel room stopped working completely", "Electrical", "Medium"),
    ("Bulb needs replacement in the staff room", "Electrical", "Low"),
    ("Inverter backup not working during power cuts", "Electrical", "Medium"),
    ("Wires hanging loose from the ceiling near the exit", "Electrical", "Critical"),
    ("Plug point is loose and doesn't hold the charger", "Electrical", "Low"),
    ("Smart board power supply is not functioning", "Electrical", "Medium"),
    ("Emergency light not working during power cut", "Electrical", "High"),
    ("Electric shock felt while touching the switch", "Electrical", "Critical"),
    ("Entire floor lost power due to tripped circuit", "Electrical", "Critical"),
    ("One tube light out of four not working in hall", "Electrical", "Low"),

    # ---------------- Plumbing ----------------
    ("Water is leaking from the ceiling in the washroom", "Plumbing", "Medium"),
    ("Tap is broken and water is wasting continuously", "Plumbing", "Medium"),
    ("No water supply in the hostel bathroom", "Plumbing", "High"),
    ("Pipe burst near the entrance, flooding the corridor", "Plumbing", "Critical"),
    ("Washroom flush is not working properly", "Plumbing", "Low"),
    ("Sink is clogged and water is not draining", "Plumbing", "Medium"),
    ("Drainage smell coming from the restroom", "Plumbing", "Medium"),
    ("Hot water geyser is not working in hostel", "Plumbing", "Low"),
    ("Water leakage damaging the wall near library", "Plumbing", "Medium"),
    ("Toilet seat is broken in the ground floor washroom", "Plumbing", "Low"),
    ("Water is overflowing from the tank on the terrace", "Plumbing", "High"),
    ("Bathroom door lock broken along with leaking pipe", "Plumbing", "Medium"),
    ("Drinking water cooler is leaking continuously", "Plumbing", "Medium"),
    ("Sewage water backing up into the bathroom", "Plumbing", "Critical"),
    ("Shower head is broken in the hostel bathroom", "Plumbing", "Low"),
    ("Water pressure is too low in the entire wing", "Plumbing", "High"),
    ("Pipe leaking under the sink in the staff washroom", "Plumbing", "Medium"),
    ("Flooded bathroom floor due to blocked drain", "Plumbing", "Critical"),
    ("No water supply anywhere in the building today", "Plumbing", "High"),
    ("Small drip from the tap, barely noticeable", "Plumbing", "Low"),

    # ---------------- HVAC ----------------
    ("AC is not cooling properly in the seminar hall", "HVAC", "Medium"),
    ("Air conditioner making loud noise during class", "HVAC", "Low"),
    ("Room is too hot, AC seems to be off", "HVAC", "Medium"),
    ("AC water leaking onto the floor", "HVAC", "Medium"),
    ("Ventilation not working in the computer lab", "HVAC", "Medium"),
    ("AC remote is missing from the classroom", "HVAC", "Low"),
    ("Cooling system completely down in server room", "HVAC", "Critical"),
    ("Fan speed of AC not adjustable, stuck on high", "HVAC", "Low"),
    ("AC compressor making a rattling sound", "HVAC", "Low"),
    ("Classroom AC blowing hot air instead of cold", "HVAC", "Medium"),
    ("Server room temperature rising, cooling failure", "HVAC", "Critical"),
    ("AC filter needs cleaning, poor air quality", "HVAC", "Low"),
    ("Exhaust fan in the lab not working", "HVAC", "Low"),
    ("AC unit leaking gas smell in the office", "HVAC", "Critical"),
    ("Thermostat not responding, room stuck on cold", "HVAC", "Low"),
    ("All ACs down in the entire building during exams", "HVAC", "High"),

    # ---------------- Internet / Network ----------------
    ("WiFi is not working in the library", "Internet", "High"),
    ("Internet speed is very slow in the hostel", "Internet", "Medium"),
    ("Unable to connect to campus WiFi at all", "Internet", "High"),
    ("Network keeps disconnecting during online class", "Internet", "Medium"),
    ("LAN cable not working in the computer lab", "Internet", "Medium"),
    ("WiFi password not accepted, need it reset", "Internet", "Low"),
    ("Complete internet outage in the entire building", "Internet", "Critical"),
    ("Router lights are off, no network at all", "Internet", "High"),
    ("WiFi signal very weak on the third floor", "Internet", "Medium"),
    ("Unable to access online exam portal due to network issue", "Internet", "Critical"),
    ("Ethernet port not working at my workstation", "Internet", "Low"),
    ("Campus WiFi keeps asking to login repeatedly", "Internet", "Low"),
    ("No internet access in the entire hostel block", "Internet", "High"),
    ("Video call keeps dropping due to poor connection", "Internet", "Medium"),
    ("Server is down, unable to access student portal", "Internet", "Critical"),
    ("WiFi slightly slower than usual today", "Internet", "Low"),

    # ---------------- Cleaning ----------------
    ("Classroom is very dirty and hasn't been cleaned", "Cleaning", "Low"),
    ("Garbage bin overflowing near the canteen", "Cleaning", "Medium"),
    ("Washroom is unhygienic and needs urgent cleaning", "Cleaning", "High"),
    ("Dust accumulated on all the benches", "Cleaning", "Low"),
    ("Spilled liquid on the floor, slippery and unsafe", "Cleaning", "High"),
    ("Corridor floor not mopped in days", "Cleaning", "Low"),
    ("Bad smell in the hostel corridor due to garbage", "Cleaning", "Medium"),
    ("Cobwebs all over the ceiling in the lab", "Cleaning", "Low"),
    ("Washbasin area is filthy and never cleaned", "Cleaning", "Medium"),
    ("Trash not collected from the classroom for days", "Cleaning", "Low"),
    ("Pigeon droppings on the balcony need cleaning", "Cleaning", "Medium"),
    ("Cafeteria tables are sticky and unclean", "Cleaning", "Low"),
    ("Dead insects found near the water cooler", "Cleaning", "Medium"),
    ("Washroom hasn't been cleaned in over a week, unhygienic", "Cleaning", "High"),

    # ---------------- Security ----------------
    ("CCTV camera in the parking area is not working", "Security", "Medium"),
    ("Main gate lock is broken", "Security", "High"),
    ("Suspicious person seen near the hostel gate", "Security", "Critical"),
    ("ID card scanner not working at entrance", "Security", "Medium"),
    ("Door lock of the lab is broken, anyone can enter", "Security", "High"),
    ("Fire extinguisher missing from the corridor", "Security", "High"),
    ("Emergency exit door is jammed", "Security", "Critical"),
    ("Security guard not present at the main gate", "Security", "High"),
    ("Fire alarm not working on the second floor", "Security", "Critical"),
    ("Boundary wall has a gap allowing outsiders in", "Security", "High"),
    ("Laptop stolen from the unlocked classroom", "Security", "Critical"),
    ("CCTV footage not recording since last week", "Security", "Medium"),
    ("Broken window allowing easy entry to the lab", "Security", "High"),
    ("Unknown vehicle parked inside campus overnight", "Security", "Medium"),

    # ---------------- General / Furniture ----------------
    ("Chair is broken in classroom 3B", "General", "Low"),
    ("Whiteboard marker not provided in the room", "General", "Low"),
    ("Table wobbling, one leg is broken", "General", "Low"),
    ("Window glass is cracked in the library", "General", "Medium"),
    ("Notice board is damaged and falling off the wall", "General", "Low"),
    ("Bench is broken and unsafe to sit on", "General", "Medium"),
    ("Cupboard lock is broken in the staff room", "General", "Low"),
    ("Curtains torn and hanging in the seminar hall", "General", "Low"),
    ("Door hinge is loose and door won't close", "General", "Low"),
    ("Ceiling tile fell down in the corridor", "General", "High"),
    ("Multiple chairs missing from the classroom", "General", "Medium"),
]

texts = [t[0] for t in training_data]
categories = [t[1] for t in training_data]
priorities = [t[2] for t in training_data]


def train_and_save(X, y, label_name, output_path):
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(stop_words="english", max_features=500, ngram_range=(1, 2))),
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ])

    # 5-fold cross-validation gives a more stable accuracy estimate than a
    # single train/test split — useful to quote in a demo/viva.
    cv_scores = cross_val_score(pipeline, X, y, cv=5)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    test_acc = accuracy_score(y_test, y_pred)

    print(f"\n{'='*60}")
    print(f"  {label_name} Model — Training Complete")
    print(f"{'='*60}")
    print(f"Total labeled examples: {len(X)}")
    print(f"5-Fold Cross-Validation Accuracy: {cv_scores.mean()*100:.1f}% (+/- {cv_scores.std()*100:.1f}%)")
    print(f"Held-out Test Accuracy: {test_acc*100:.1f}%\n")
    print("Classification Report (held-out test set):")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Final model is refit on ALL data before saving, so the deployed model
    # benefits from every labeled example, not just the training split.
    pipeline.fit(X, y)
    joblib.dump(pipeline, output_path)
    print(f"Saved trained model to: {output_path}")

    return pipeline


if __name__ == "__main__":
    print("CampusIQ AI — Training complaint classification models...")
    print(f"Total labeled examples: {len(training_data)}")

    train_and_save(texts, categories, "Category Classifier", "category_model.joblib")
    train_and_save(texts, priorities, "Priority Classifier", "priority_model.joblib")

    print("\nDone. Restart the AI service (main.py) to use the freshly trained models.")