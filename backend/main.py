from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_DETAILS, DATABASE_NAME

app = FastAPI()

allowed_origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient(MONGO_DETAILS)
    app.mongodb = app.mongodb_client[DATABASE_NAME]
    print("Connected to MongoDB")

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()
    print("Closed connection to MongoDB")

@app.get("/")
async def root():
    return {"message": "Welcome to MarketingCRM!"}
