from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from bson import ObjectId

from database import (
    sop_automation_config_collection,
    sop_of_the_day_collection,
    documents_collection,
)
from sop_of_the_day.services import generate_unique_sop_highlight

scheduler = BackgroundScheduler()
JOB_ID = "daily_sop_generation"


def get_automation_config() -> dict:
    """Read the singleton automation config, creating it if it doesn't exist."""
    config = sop_automation_config_collection.find_one()
    if not config:
        config = {
            "enabled": False,
            "schedule_time": "08:00",
            "document_id": None,
            "document_name": None,
            "previous_topics": [],
            "generated_count": 0,
            "document_exhausted": False,
            "last_generated_at": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        sop_automation_config_collection.insert_one(config)
        config = sop_automation_config_collection.find_one()
    return config


def run_automated_sop_generation():
    """The daily job: generate a unique SOP from the configured document."""
    print(f"[SOP Scheduler] Running automated SOP generation at {datetime.utcnow()}")

    config = get_automation_config()

    if not config.get("enabled"):
        print("[SOP Scheduler] Automation is disabled, skipping.")
        return

    document_id = config.get("document_id")
    if not document_id:
        print("[SOP Scheduler] No document selected, skipping.")
        return

    if config.get("document_exhausted"):
        print("[SOP Scheduler] Document is exhausted, skipping. HR needs to select a new document.")
        return

    try:
        document = documents_collection.find_one({"_id": ObjectId(document_id)})
    except Exception as e:
        print(f"[SOP Scheduler] Error fetching document: {e}")
        return

    if not document or not document.get("is_active"):
        print("[SOP Scheduler] Document not found or inactive.")
        return

    extracted_text = document.get("extracted_text", "")
    if not extracted_text:
        print("[SOP Scheduler] Document has no extracted text.")
        return

    previous_topics = config.get("previous_topics", [])

    try:
        highlight = generate_unique_sop_highlight(
            document_name=document["filename"],
            document_text=extracted_text,
            previous_topics=previous_topics,
        )
    except Exception as e:
        print(f"[SOP Scheduler] Error generating SOP highlight: {e}")
        return

    # Deactivate any currently active SOP
    sop_of_the_day_collection.update_many(
        {"is_active": True},
        {"$set": {"is_active": False, "deactivated_at": datetime.utcnow()}},
    )

    # Save new SOP
    sop_data = {
        "document_id": document_id,
        "document_name": document["filename"],
        "title": highlight["title"],
        "summary": highlight["summary"],
        "key_points": highlight["key_points"],
        "practical_tip": highlight["practical_tip"],
        "created_by": "system:automation",
        "created_at": datetime.utcnow(),
        "is_active": True,
        "source": "automated",
    }
    sop_of_the_day_collection.insert_one(sop_data)
    print(f"[SOP Scheduler] Generated SOP: {highlight['title']}")

    # Update config
    update_fields = {
        "previous_topics": previous_topics + [highlight["title"]],
        "generated_count": config.get("generated_count", 0) + 1,
        "last_generated_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    content_remaining = highlight.get("content_remaining", True)
    if not content_remaining:
        update_fields["document_exhausted"] = True
        print("[SOP Scheduler] Document exhausted — no more unique content available.")

    sop_automation_config_collection.update_one(
        {"_id": config["_id"]},
        {"$set": update_fields},
    )


def check_and_catchup():
    """Called on startup: if automation is enabled and no SOP was generated today, generate one now."""
    config = get_automation_config()

    if not config.get("enabled"):
        return

    if config.get("document_exhausted"):
        return

    if not config.get("document_id"):
        return

    last_generated = config.get("last_generated_at")
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    if last_generated is None or last_generated < today_start:
        print("[SOP Scheduler] Catch-up: no SOP generated today, generating now...")
        run_automated_sop_generation()
    else:
        print("[SOP Scheduler] SOP already generated today, no catch-up needed.")


def reschedule_job(schedule_time: str):
    """Update the cron schedule without restarting the scheduler."""
    try:
        hour, minute = schedule_time.split(":")
        hour, minute = int(hour), int(minute)
    except (ValueError, AttributeError):
        hour, minute = 8, 0

    existing = scheduler.get_job(JOB_ID)
    if existing:
        scheduler.reschedule_job(
            JOB_ID,
            trigger=CronTrigger(hour=hour, minute=minute),
        )
        print(f"[SOP Scheduler] Rescheduled to {hour:02d}:{minute:02d}")
    else:
        scheduler.add_job(
            run_automated_sop_generation,
            trigger=CronTrigger(hour=hour, minute=minute),
            id=JOB_ID,
            replace_existing=True,
        )
        print(f"[SOP Scheduler] Created job at {hour:02d}:{minute:02d}")


def init_scheduler():
    """Initialize and start the scheduler. Called from main.py startup."""
    config = get_automation_config()
    schedule_time = config.get("schedule_time", "08:00")

    try:
        hour, minute = schedule_time.split(":")
        hour, minute = int(hour), int(minute)
    except (ValueError, AttributeError):
        hour, minute = 8, 0

    scheduler.add_job(
        run_automated_sop_generation,
        trigger=CronTrigger(hour=hour, minute=minute),
        id=JOB_ID,
        replace_existing=True,
    )
    scheduler.start()
    print(f"[SOP Scheduler] Started. Daily job at {hour:02d}:{minute:02d}")

    check_and_catchup()


def shutdown_scheduler():
    """Gracefully shut down the scheduler. Called from main.py shutdown."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[SOP Scheduler] Shut down.")
