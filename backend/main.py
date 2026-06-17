from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from config import settings

from auth.routes import router as auth_router
from admin.routes import router as admin_router
from documents.routes import router as documents_router
from chatbots.routes import router as chatbots_router
from flashcards.routes import router as flashcards_router
from assessments.routes import router as assessments_router
from learning_paths.routes import router as learning_paths_router
from sop_of_the_day.routes import router as sop_of_the_day_router
from employees.routes import router as employees_router
from notifications.routes import router as notifications_router
from analytics.routes import router as analytics_router
from onboarding.routes import router as onboarding_router
from tracks.routes import router as tracks_router
from mentorship.routes import router as mentorship_router

app = FastAPI(title="Corporate LMS API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(documents_router)
app.include_router(chatbots_router)
app.include_router(flashcards_router)
app.include_router(assessments_router)
app.include_router(learning_paths_router)
app.include_router(sop_of_the_day_router)
app.include_router(employees_router)
app.include_router(notifications_router)
app.include_router(analytics_router)
app.include_router(onboarding_router)
app.include_router(tracks_router)
app.include_router(mentorship_router)


@app.on_event("startup")
async def startup_event():
    # [FAISS-DISABLED] from chatbots.services import preload_faiss_indexes
    # [FAISS-DISABLED] preload_faiss_indexes()

    # Backfill status on existing users + seed super_admin from env (idempotent)
    from auth.bootstrap import run_bootstrap
    run_bootstrap()

    from sop_of_the_day.scheduler import init_scheduler
    init_scheduler()


@app.on_event("shutdown")
async def shutdown_event():
    from sop_of_the_day.scheduler import shutdown_scheduler
    shutdown_scheduler()


@app.get("/")
async def root():
    return {"message": "Corporate LMS API", "version": "2.0.0", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
