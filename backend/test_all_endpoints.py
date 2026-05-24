"""
Comprehensive backend endpoint test suite for NexusLearn.
Tests all API endpoints for correct behavior, validation, and error handling.
"""
import requests
import json
import os
import time

BASE = "http://localhost:8000"
PASS = 0
FAIL = 0
ERRORS = []


def test(name, condition, detail=""):
    global PASS, FAIL, ERRORS
    if condition:
        PASS += 1
        print(f"  [PASS] {name}")
    else:
        FAIL += 1
        ERRORS.append(f"{name}: {detail}")
        print(f"  [FAIL] {name} -- {detail}")


def headers(token):
    return {"Authorization": f"Bearer {token}"}


# ============================================================
print("\n" + "=" * 60)
print("1. SYSTEM ENDPOINTS")
print("=" * 60)

r = requests.get(f"{BASE}/")
test("GET / returns 200", r.status_code == 200)
test("GET / has version", "version" in r.json())

r = requests.get(f"{BASE}/health")
test("GET /health returns 200", r.status_code == 200)
test("GET /health has status", r.json().get("status") == "healthy")

# ============================================================
print("\n" + "=" * 60)
print("2. AUTH ENDPOINTS")
print("=" * 60)

r = requests.get(f"{BASE}/departments")
test("GET /departments returns 200", r.status_code == 200)
depts_response = r.json()
# Handle both list and dict formats
if isinstance(depts_response, dict) and "departments" in depts_response:
    depts = depts_response["departments"]
elif isinstance(depts_response, list):
    depts = depts_response
else:
    depts = []
test("Departments is a list", isinstance(depts, list) and len(depts) > 0, f"got {depts_response}")

# Signup HR user
hr_data = {
    "email": "testhr@nexuslearn.com",
    "password": "TestPass123!",
    "full_name": "Test HR",
    "role": "hr",
    "department": depts[0],
}
r = requests.post(f"{BASE}/signup", data=hr_data)
if r.status_code == 400 and "already" in r.text.lower():
    print("  (HR user already exists, skipping signup)")
else:
    test("POST /signup HR returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")

# Signup Employee user
emp_data = {
    "email": "testemp@nexuslearn.com",
    "password": "TestPass123!",
    "full_name": "Test Employee",
    "role": "employee",
    "department": depts[0],
}
r = requests.post(f"{BASE}/signup", data=emp_data)
if r.status_code == 400 and "already" in r.text.lower():
    print("  (Employee user already exists, skipping signup)")
else:
    test("POST /signup Employee returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")

# Login HR
r = requests.post(f"{BASE}/login", json={"email": hr_data["email"], "password": hr_data["password"]})
test("POST /login HR returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")
hr_token = r.json().get("access_token", "") if r.status_code == 200 else ""
test("HR token received", len(hr_token) > 0)

# Login Employee
r = requests.post(f"{BASE}/login", json={"email": emp_data["email"], "password": emp_data["password"]})
test("POST /login Employee returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")
emp_token = r.json().get("access_token", "") if r.status_code == 200 else ""
test("Employee token received", len(emp_token) > 0)

# GET /me
r = requests.get(f"{BASE}/me", headers=headers(hr_token))
test("GET /me HR returns 200", r.status_code == 200)
hr_user = r.json()
test("HR user has email", hr_user.get("email") == hr_data["email"])
test("HR user has role=hr", hr_user.get("role") == "hr")

r = requests.get(f"{BASE}/me", headers=headers(emp_token))
test("GET /me Employee returns 200", r.status_code == 200)
emp_user = r.json()
test("Employee user has role=employee", emp_user.get("role") == "employee")

# Auth without token
r = requests.get(f"{BASE}/me")
test("GET /me without token returns 403", r.status_code == 403)

# ============================================================
print("\n" + "=" * 60)
print("3. DOCUMENT ENDPOINTS")
print("=" * 60)

# Upload a test document
test_content = """
Corporate Safety Policy Manual

Chapter 1: Workplace Safety
All employees must follow safety protocols at all times. Protective equipment must be worn in designated areas.
Fire exits must remain clear. Emergency drills are conducted quarterly.

Chapter 2: Data Security
Passwords must be at least 12 characters with uppercase, lowercase, numbers, and symbols.
Do not share credentials. Report suspicious emails to IT immediately.
Two-factor authentication is mandatory for all systems.

Chapter 3: Communication Standards
Use professional language in all correspondence. Reply to emails within 24 hours.
Confidential information must not be discussed in public areas.
Meeting notes should be shared within 48 hours.

Chapter 4: Remote Work Policy
Remote employees must maintain a secure workspace. VPN must be used for all company systems.
Work hours should be logged daily. Video calls require professional attire.

Chapter 5: Incident Reporting
All incidents must be reported within 24 hours. Use the online reporting system.
Anonymous reporting is available. Follow-up reviews occur within 5 business days.
"""

# Create a temp txt file
test_file_path = os.path.join(os.path.dirname(__file__), "test_document.txt")
with open(test_file_path, "w") as f:
    f.write(test_content)

r = requests.post(
    f"{BASE}/upload-document",
    headers=headers(hr_token),
    files={"file": ("test_safety_policy.txt", open(test_file_path, "rb"), "text/plain")},
    data={"create_chatbot": "true"},
)
test("POST /upload-document returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")
doc_id = r.json().get("id", "") if r.status_code == 200 else ""
test("Document ID received", len(doc_id) > 0)

# List documents
r = requests.get(f"{BASE}/documents", headers=headers(hr_token))
test("GET /documents HR returns 200", r.status_code == 200)
docs = r.json()
test("Documents list is non-empty", len(docs) > 0)

r = requests.get(f"{BASE}/documents", headers=headers(emp_token))
test("GET /documents Employee returns 200", r.status_code == 200)

# Employee cannot upload
r = requests.post(
    f"{BASE}/upload-document",
    headers=headers(emp_token),
    files={"file": ("test.txt", b"test", "text/plain")},
)
test("POST /upload-document Employee returns 403", r.status_code == 403)

# ============================================================
print("\n" + "=" * 60)
print("4. CHATBOT ENDPOINTS")
print("=" * 60)

# Create chatbot
r = requests.post(
    f"{BASE}/chatbots",
    headers=headers(hr_token),
    json={"name": "Safety Bot", "document_id": doc_id, "access_type": "all", "departments": []},
)
test("POST /chatbots returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")
chatbot_id = r.json().get("id", "") if r.status_code == 200 else ""
test("Chatbot ID received", len(chatbot_id) > 0)

# List chatbots
r = requests.get(f"{BASE}/chatbots", headers=headers(hr_token))
test("GET /chatbots HR returns 200", r.status_code == 200)
test("Chatbots list non-empty", len(r.json()) > 0)

r = requests.get(f"{BASE}/chatbots", headers=headers(emp_token))
test("GET /chatbots Employee returns 200", r.status_code == 200)

# Employee cannot create chatbot
r = requests.post(
    f"{BASE}/chatbots",
    headers=headers(emp_token),
    json={"name": "Bad Bot", "document_id": doc_id, "access_type": "all"},
)
test("POST /chatbots Employee returns 403", r.status_code == 403)

# Invalid document_id format
r = requests.post(
    f"{BASE}/chatbots",
    headers=headers(hr_token),
    json={"name": "Bad", "document_id": "invalid", "access_type": "all"},
)
test("POST /chatbots invalid doc ID returns 400", r.status_code == 400)

# Chat with bot
r = requests.post(
    f"{BASE}/chat",
    headers=headers(emp_token),
    json={"chatbot_id": chatbot_id, "message": "What is the password policy?"},
)
test("POST /chat returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")
if r.status_code == 200:
    test("Chat response has content", len(r.json().get("response", "")) > 0)

# Chat history
r = requests.get(f"{BASE}/chat-history/{chatbot_id}", headers=headers(emp_token))
test("GET /chat-history returns 200", r.status_code == 200)
test("Chat history has messages", len(r.json()) > 0)

# Clear chat history
r = requests.delete(f"{BASE}/chat-history/{chatbot_id}", headers=headers(emp_token))
test("DELETE /chat-history returns 200", r.status_code == 200)

# ============================================================
print("\n" + "=" * 60)
print("5. FLASHCARD ENDPOINTS")
print("=" * 60)

# Create flashcard set
r = requests.post(
    f"{BASE}/flashcard-sets",
    headers=headers(hr_token),
    json={
        "document_id": doc_id,
        "name": "Safety Training Cards",
        "num_cards": 5,
        "difficulty": "medium",
        "access_type": "all",
    },
)
test("POST /flashcard-sets returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:300]}")
fset_id = r.json().get("id", "") if r.status_code == 200 else ""
cards = r.json().get("cards", []) if r.status_code == 200 else []
test("Flashcard set ID received", len(fset_id) > 0)
test("Cards generated", len(cards) > 0, f"got {len(cards)} cards")

# Validate card structure
if cards:
    card = cards[0]
    test("Card has 'id' field", "id" in card)
    test("Card has 'category' field", "category" in card)
    test("Card has 'scenario' field", "scenario" in card)
    test("Card has 'best_practice' field", "best_practice" in card)
    test("Card has 'key_takeaway' field", "key_takeaway" in card)

    # Check uniqueness
    scenarios = [c["scenario"].strip().lower() for c in cards]
    test("Cards are unique (no duplicate scenarios)", len(scenarios) == len(set(scenarios)),
         f"duplicates found: {len(scenarios)} total, {len(set(scenarios))} unique")

# Validation: num_cards bounds
r = requests.post(
    f"{BASE}/flashcard-sets",
    headers=headers(hr_token),
    json={"document_id": doc_id, "name": "Bad", "num_cards": 0, "difficulty": "easy", "access_type": "all"},
)
test("POST /flashcard-sets num_cards=0 returns 400", r.status_code == 400)

r = requests.post(
    f"{BASE}/flashcard-sets",
    headers=headers(hr_token),
    json={"document_id": doc_id, "name": "Bad", "num_cards": 100, "difficulty": "easy", "access_type": "all"},
)
test("POST /flashcard-sets num_cards=100 returns 400", r.status_code == 400)

# Employee cannot create
r = requests.post(
    f"{BASE}/flashcard-sets",
    headers=headers(emp_token),
    json={"document_id": doc_id, "name": "Bad", "num_cards": 5, "difficulty": "easy", "access_type": "all"},
)
test("POST /flashcard-sets Employee returns 403", r.status_code == 403)

# List flashcard sets
r = requests.get(f"{BASE}/flashcard-sets", headers=headers(emp_token))
test("GET /flashcard-sets Employee returns 200", r.status_code == 200)
test("Employee sees flashcard sets", len(r.json()) > 0)

# Get single set
if fset_id:
    r = requests.get(f"{BASE}/flashcard-sets/{fset_id}", headers=headers(emp_token))
    test("GET /flashcard-sets/:id returns 200", r.status_code == 200)

# Get due cards
if fset_id:
    r = requests.get(f"{BASE}/flashcard-sets/{fset_id}/due", headers=headers(emp_token))
    test("GET /flashcard-sets/:id/due returns 200", r.status_code == 200)
    due_data = r.json()
    test("Due response has cards_due", "cards_due" in due_data)
    test("Due response has total_cards", "total_cards" in due_data)
    test("All new cards are due", due_data.get("cards_new", 0) > 0)

# Submit review (SM-2)
if fset_id and cards:
    first_card_id = cards[0]["id"]
    r = requests.post(
        f"{BASE}/flashcard-sets/{fset_id}/review",
        headers=headers(emp_token),
        json={"card_id": first_card_id, "quality": 4},
    )
    test("POST /review quality=4 returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")
    if r.status_code == 200:
        review_data = r.json()
        test("Review has easiness_factor", "easiness_factor" in review_data)
        test("Review has interval", "interval" in review_data)
        test("Review EF <= 3.0", review_data["easiness_factor"] <= 3.0, f"EF={review_data['easiness_factor']}")
        test("First review interval = 1", review_data["interval"] == 1, f"interval={review_data['interval']}")
        test("Repetitions = 1", review_data["repetitions"] == 1)

    # Quality validation
    r = requests.post(
        f"{BASE}/flashcard-sets/{fset_id}/review",
        headers=headers(emp_token),
        json={"card_id": first_card_id, "quality": 6},
    )
    test("POST /review quality=6 returns 400", r.status_code == 400)

    r = requests.post(
        f"{BASE}/flashcard-sets/{fset_id}/review",
        headers=headers(emp_token),
        json={"card_id": first_card_id, "quality": -1},
    )
    test("POST /review quality=-1 returns 400", r.status_code == 400)

# Get stats
if fset_id:
    r = requests.get(f"{BASE}/flashcard-sets/{fset_id}/stats", headers=headers(emp_token))
    test("GET /flashcard-sets/:id/stats returns 200", r.status_code == 200)
    stats = r.json()
    test("Stats has retention_rate", "retention_rate" in stats)
    test("Stats has streak_days", "streak_days" in stats)

# Overview stats
r = requests.get(f"{BASE}/flashcard-stats/overview", headers=headers(emp_token))
test("GET /flashcard-stats/overview returns 200", r.status_code == 200)

# ============================================================
print("\n" + "=" * 60)
print("6. ASSESSMENT ENDPOINTS")
print("=" * 60)

# Create assessment
r = requests.post(
    f"{BASE}/assessments",
    headers=headers(hr_token),
    json={
        "document_id": doc_id,
        "name": "Safety Knowledge Test",
        "assessment_type": "mcq",
        "difficulty": "medium",
        "num_questions": 5,
        "access_type": "all",
        "time_limit_minutes": 30,
    },
)
test("POST /assessments MCQ returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:300]}")
assessment_id = r.json().get("id", "") if r.status_code == 200 else ""
test("Assessment ID received", len(assessment_id) > 0)

# Validation: num_questions bounds
r = requests.post(
    f"{BASE}/assessments",
    headers=headers(hr_token),
    json={"document_id": doc_id, "name": "Bad", "num_questions": 0, "access_type": "all"},
)
test("POST /assessments num_questions=0 returns 400", r.status_code == 400)

r = requests.post(
    f"{BASE}/assessments",
    headers=headers(hr_token),
    json={"document_id": doc_id, "name": "Bad", "num_questions": 100, "access_type": "all"},
)
test("POST /assessments num_questions=100 returns 400", r.status_code == 400)

# Validation: invalid assessment type
r = requests.post(
    f"{BASE}/assessments",
    headers=headers(hr_token),
    json={"document_id": doc_id, "name": "Bad", "assessment_type": "invalid", "num_questions": 5, "access_type": "all"},
)
test("POST /assessments invalid type returns 400", r.status_code == 400)

# Validation: invalid difficulty
r = requests.post(
    f"{BASE}/assessments",
    headers=headers(hr_token),
    json={"document_id": doc_id, "name": "Bad", "difficulty": "extreme", "num_questions": 5, "access_type": "all"},
)
test("POST /assessments invalid difficulty returns 400", r.status_code == 400)

# Employee cannot create
r = requests.post(
    f"{BASE}/assessments",
    headers=headers(emp_token),
    json={"document_id": doc_id, "name": "Bad", "num_questions": 5, "access_type": "all"},
)
test("POST /assessments Employee returns 403", r.status_code == 403)

# List assessments
r = requests.get(f"{BASE}/assessments", headers=headers(emp_token))
test("GET /assessments Employee returns 200", r.status_code == 200)
test("Employee sees assessments", len(r.json()) > 0)

# Get assessment (employee view — answers stripped)
if assessment_id:
    r = requests.get(f"{BASE}/assessments/{assessment_id}", headers=headers(emp_token))
    test("GET /assessments/:id Employee returns 200", r.status_code == 200)
    if r.status_code == 200:
        assessment_data = r.json()
        questions = assessment_data.get("questions", [])
        test("Questions returned", len(questions) > 0)

        # Verify answers are stripped for employee
        if questions:
            q = questions[0]
            test("Employee: no correct_answer_id", "correct_answer_id" not in q,
                 f"LEAK: correct_answer_id={q.get('correct_answer_id')}")
            test("Employee: no explanation", "explanation" not in q,
                 f"LEAK: explanation present")

            # Check uniqueness
            q_texts = [q["question"].strip().lower() for q in questions]
            test("Questions are unique", len(q_texts) == len(set(q_texts)),
                 f"duplicates: {len(q_texts)} total, {len(set(q_texts))} unique")

    # HR view — answers included
    r = requests.get(f"{BASE}/assessments/{assessment_id}", headers=headers(hr_token))
    test("GET /assessments/:id HR returns 200", r.status_code == 200)
    if r.status_code == 200:
        hr_questions = r.json().get("questions", [])
        if hr_questions:
            test("HR: correct_answer_id present", "correct_answer_id" in hr_questions[0])
            test("HR: explanation present", "explanation" in hr_questions[0])

# Submit assessment
if assessment_id and questions:
    # Build answers for all questions
    answers = []
    for q in questions:
        # Just pick the first option for testing
        answers.append({
            "question_id": q["id"],
            "selected_answer_id": q["options"][0]["id"],
        })

    r = requests.post(
        f"{BASE}/assessments/{assessment_id}/submit",
        headers=headers(emp_token),
        json={"answers": answers, "time_taken_seconds": 120},
    )
    test("POST /assessments/:id/submit returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")
    if r.status_code == 200:
        result = r.json()
        test("Result has score", "score" in result)
        test("Result has percentage", "percentage" in result)
        test("Result has detailed answers", len(result.get("answers", [])) > 0)
        if result.get("answers"):
            test("Answer has explanation", "explanation" in result["answers"][0])
            test("Answer has correct_answer_id", "correct_answer_id" in result["answers"][0])

    # Duplicate submission prevention
    r = requests.post(
        f"{BASE}/assessments/{assessment_id}/submit",
        headers=headers(emp_token),
        json={"answers": answers, "time_taken_seconds": 120},
    )
    test("POST /submit duplicate returns 400", r.status_code == 400, f"got {r.status_code}: {r.text[:200]}")
    if r.status_code == 400:
        test("Duplicate message correct", "already submitted" in r.json().get("detail", "").lower())

    # Missing answers validation
    r = requests.post(
        f"{BASE}/assessments/{assessment_id}/submit",
        headers=headers(hr_token),  # Use HR to avoid duplicate check
        json={"answers": [answers[0]], "time_taken_seconds": 60},
    )
    test("POST /submit incomplete answers returns 400", r.status_code == 400, f"got {r.status_code}: {r.text[:200]}")

# Get results
if assessment_id:
    r = requests.get(f"{BASE}/assessments/{assessment_id}/results", headers=headers(emp_token))
    test("GET /assessments/:id/results returns 200", r.status_code == 200)

    r = requests.get(f"{BASE}/assessment-results", headers=headers(hr_token))
    test("GET /assessment-results HR returns 200", r.status_code == 200)

# Invalid ObjectId
r = requests.get(f"{BASE}/assessments/invalid_id", headers=headers(emp_token))
test("GET /assessments/invalid_id returns 400", r.status_code == 400)

# ============================================================
print("\n" + "=" * 60)
print("7. LEARNING PATH ENDPOINTS")
print("=" * 60)

r = requests.post(f"{BASE}/learning-paths/generate", headers=headers(emp_token))
test("POST /learning-paths/generate returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")

r = requests.get(f"{BASE}/learning-paths/me", headers=headers(emp_token))
test("GET /learning-paths/me returns 200", r.status_code == 200, f"got {r.status_code}")

r = requests.get(f"{BASE}/learning-paths/employees", headers=headers(hr_token))
test("GET /learning-paths/employees HR returns 200", r.status_code == 200)

# ============================================================
print("\n" + "=" * 60)
print("8. SOP OF THE DAY ENDPOINTS")
print("=" * 60)

r = requests.post(
    f"{BASE}/sop-of-the-day",
    headers=headers(hr_token),
    json={"document_id": doc_id},
)
test("POST /sop-of-the-day returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:300]}")
sop_id = r.json().get("id", "") if r.status_code == 200 else ""

r = requests.get(f"{BASE}/sop-of-the-day/active", headers=headers(emp_token))
test("GET /sop-of-the-day/active returns 200", r.status_code == 200)
if r.status_code == 200 and r.json():
    test("Active SOP has title", "title" in r.json())

if sop_id:
    r = requests.post(f"{BASE}/sop-of-the-day/{sop_id}/dismiss", headers=headers(emp_token))
    test("POST /sop-of-the-day/:id/dismiss returns 200", r.status_code == 200)

r = requests.get(f"{BASE}/sop-of-the-day/history", headers=headers(hr_token))
test("GET /sop-of-the-day/history returns 200", r.status_code == 200)

# SOP Automation endpoints
r = requests.get(f"{BASE}/sop-of-the-day/automation/config", headers=headers(hr_token))
test("GET /automation/config returns 200", r.status_code == 200)

r = requests.get(f"{BASE}/sop-of-the-day/automation/status", headers=headers(hr_token))
test("GET /automation/status returns 200", r.status_code == 200)

# ============================================================
print("\n" + "=" * 60)
print("9. EMPLOYEE MANAGEMENT ENDPOINTS")
print("=" * 60)

r = requests.get(f"{BASE}/employees", headers=headers(hr_token))
test("GET /employees HR returns 200", r.status_code == 200)

r = requests.get(f"{BASE}/employees/stats", headers=headers(hr_token))
test("GET /employees/stats returns 200", r.status_code == 200)
if r.status_code == 200:
    stats = r.json()
    test("Stats has total_employees", "total_employees" in stats or "total" in stats)

# Employee cannot access
r = requests.get(f"{BASE}/employees", headers=headers(emp_token))
test("GET /employees Employee returns 403", r.status_code == 403)

# ============================================================
print("\n" + "=" * 60)
print("10. NOTIFICATION ENDPOINTS")
print("=" * 60)

notifications = []
notif_data = {}

r = requests.get(f"{BASE}/notifications", headers=headers(emp_token))
test("GET /notifications returns 200", r.status_code == 200)
if r.status_code == 200:
    notif_data = r.json()
    test("Response has notifications array", "notifications" in notif_data)
    test("Response has unread_count", "unread_count" in notif_data)
    notifications = notif_data.get("notifications", [])
    test("Employee has notifications (from earlier creates)", len(notifications) > 0,
         f"got {len(notifications)} notifications")

    if notifications:
        n = notifications[0]
        test("Notification has id", "id" in n)
        test("Notification has type", "type" in n)
        test("Notification has title", "title" in n)
        test("Notification has message", "message" in n)
        test("Notification has is_read", "is_read" in n)
        test("Notification has created_at", "created_at" in n)

        # Check notification types from earlier creates
        types_found = {n["type"] for n in notifications}
        print(f"  (notification types found: {types_found})")

r = requests.get(f"{BASE}/notifications/unread-count", headers=headers(emp_token))
test("GET /notifications/unread-count returns 200", r.status_code == 200)
if r.status_code == 200:
    test("Unread count is number", isinstance(r.json().get("unread_count"), int))

# Mark one as read
if notifications and len(notifications) > 0:
    notif_id = notifications[0]["id"]
    r = requests.post(f"{BASE}/notifications/{notif_id}/read", headers=headers(emp_token))
    test("POST /notifications/:id/read returns 200", r.status_code == 200)

    # Verify unread count decreased
    r = requests.get(f"{BASE}/notifications/unread-count", headers=headers(emp_token))
    if r.status_code == 200:
        new_count = r.json().get("unread_count", 0)
        old_count = notif_data.get("unread_count", 0)
        test("Unread count decreased after read", new_count < old_count,
             f"was {old_count}, now {new_count}")

# Mark all as read
r = requests.post(f"{BASE}/notifications/read-all", headers=headers(emp_token))
test("POST /notifications/read-all returns 200", r.status_code == 200)

r = requests.get(f"{BASE}/notifications/unread-count", headers=headers(emp_token))
if r.status_code == 200:
    test("Unread count is 0 after read-all", r.json().get("unread_count") == 0)

# Invalid notification ID
r = requests.post(f"{BASE}/notifications/invalid_id/read", headers=headers(emp_token))
test("POST /notifications/invalid/read returns error", r.status_code in [400, 404])

# No auth
r = requests.get(f"{BASE}/notifications")
test("GET /notifications without auth returns 403", r.status_code == 403)

# ============================================================
print("\n" + "=" * 60)
print("11. PROFILE / AVATAR ENDPOINTS")
print("=" * 60)

emp_user_id = emp_user.get("id", "")
if emp_user_id:
    r = requests.get(f"{BASE}/avatar/{emp_user_id}")
    # Avatar returns 200 (image) or 404 (no avatar) — both are fine
    test("GET /avatar/:id returns 200 or 404", r.status_code in [200, 404, 307])

# ============================================================
print("\n" + "=" * 60)
print("12. CLEANUP — DELETE ENDPOINTS")
print("=" * 60)

# Delete chatbot
if chatbot_id:
    r = requests.delete(f"{BASE}/chatbots/{chatbot_id}", headers=headers(hr_token))
    test("DELETE /chatbots/:id returns 200", r.status_code == 200)

# Delete flashcard set
if fset_id:
    r = requests.delete(f"{BASE}/flashcard-sets/{fset_id}", headers=headers(hr_token))
    test("DELETE /flashcard-sets/:id returns 200", r.status_code == 200)

# Delete assessment
if assessment_id:
    r = requests.delete(f"{BASE}/assessments/{assessment_id}", headers=headers(hr_token))
    test("DELETE /assessments/:id returns 200", r.status_code == 200)

# Deactivate SOP
if sop_id:
    r = requests.delete(f"{BASE}/sop-of-the-day/{sop_id}", headers=headers(hr_token))
    test("DELETE /sop-of-the-day/:id returns 200", r.status_code == 200)

# Delete document
if doc_id:
    r = requests.delete(f"{BASE}/documents/{doc_id}", headers=headers(hr_token))
    test("DELETE /documents/:id returns 200", r.status_code == 200)

# Employee cannot delete
r = requests.delete(f"{BASE}/chatbots/000000000000000000000000", headers=headers(emp_token))
test("DELETE /chatbots Employee returns 403", r.status_code == 403)

# Clean up test file
if os.path.exists(test_file_path):
    os.remove(test_file_path)

# ============================================================
print("\n" + "=" * 60)
print(f"RESULTS: {PASS} passed, {FAIL} failed out of {PASS + FAIL} tests")
print("=" * 60)

if ERRORS:
    print("\nFailed tests:")
    for err in ERRORS:
        print(f"  [FAIL] {err}")
else:
    print("\nAll tests passed!")

print()
