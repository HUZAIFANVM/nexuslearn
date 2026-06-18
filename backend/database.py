from pymongo import MongoClient
import gridfs
from config import settings

client = MongoClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]
fs = gridfs.GridFS(db)

# Existing collections
users_collection = db.users
documents_collection = db.documents
chatbots_collection = db.chatbots
chat_history_collection = db.chat_history

# New collections (Phase 3-5)
flashcard_sets_collection = db.flashcard_sets
flashcard_reviews_collection = db.flashcard_reviews
assessments_collection = db.assessments
assessment_results_collection = db.assessment_results
# Tracks in-progress assessment attempts so the server can enforce time limits
# independently of the client (prevents refresh-to-get-more-time exploits).
assessment_attempts_collection = db.assessment_attempts
assessment_attempts_collection.create_index(
    [("user_id", 1), ("assessment_id", 1)],
    unique=True,
    name="attempts_user_assessment_unique",
)
learning_paths_collection = db.learning_paths

# SOP of the Day collections (Phase 9)
sop_of_the_day_collection = db.sop_of_the_day
sop_dismissals_collection = db.sop_dismissals
sop_automation_config_collection = db.sop_automation_config

# Email verification tokens collection
email_verification_tokens_collection = db.email_verification_tokens
# Create TTL index for automatic expiration (24 hours)
email_verification_tokens_collection.create_index("created_at", expireAfterSeconds=86400)

# Password reset tokens collection
password_reset_tokens_collection = db.password_reset_tokens
# Create TTL index for automatic expiration (1 hour)
password_reset_tokens_collection.create_index("created_at", expireAfterSeconds=3600)

# L&D feature collections (onboarding, learning tracks, mentorship)
onboarding_templates_collection = db.onboarding_templates
onboarding_progress_collection = db.onboarding_progress
onboarding_progress_collection.create_index("user_id", name="onboarding_progress_user")
learning_tracks_collection = db.learning_tracks
mentorships_collection = db.mentorships
mentorships_collection.create_index([("mentor_id", 1)], name="mentorship_mentor")
mentorships_collection.create_index([("mentee_id", 1)], name="mentorship_mentee")
mentorship_sessions_collection = db.mentorship_sessions
mentorship_sessions_collection.create_index([("mentorship_id", 1), ("created_at", -1)], name="mentorship_sessions_lookup")
mentorship_messages_collection = db.mentorship_messages
mentorship_messages_collection.create_index([("mentorship_id", 1), ("created_at", 1)], name="mentorship_messages_lookup")

# LLM (Groq) usage counters — per-day rows for global + per-user caps.
# TTL auto-removes old rows so the collection stays tiny.
llm_usage_collection = db.llm_usage
llm_usage_collection.create_index("created_at", expireAfterSeconds=7 * 86400)

# Notifications
notifications_collection = db.notifications

# Performance indexes
notifications_collection.create_index(
    [("user_id", 1), ("created_at", -1)],
    name="notifications_user_lookup",
)
notifications_collection.create_index(
    [("user_id", 1), ("is_read", 1)],
    name="notifications_unread_count",
)
chat_history_collection.create_index(
    [("chatbot_id", 1), ("user_id", 1), ("timestamp", -1)],
    name="chat_history_lookup",
)
