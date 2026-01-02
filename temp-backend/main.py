from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from login import router as login_router
from article import router as articles_router
from users import router as users_router
from db import init_db
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

init_db()

app.include_router(login_router)

app.include_router(articles_router)

app.include_router(users_router)

@app.get("/")
def root():
    return {"status": "Temporal backend online"}
