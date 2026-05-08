import time
from contextlib import asynccontextmanager
from fastapi import Request
from fastapi import FastAPI
from fastapi_swagger import patch_fastapi
from fastapi.middleware.cors import CORSMiddleware
from database import create_db
from routers import contact_router, auth_router, label_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=== Creating Database ===")
    create_db()
    print("=== Database was created ===")
    yield
    print("=== Shutting Down ===")
    
app = FastAPI(title="Contact API", 
              version="4.0.0", 
              lifespan=lifespan, 
              docs_url=None, 
              swagger_ui_oauth2_redirect_url=None)

patch_fastapi(app, docs_url="/docs")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = round(time.time() - start_time, 3)
    print(f"{request.method} {request.url.path} - {response.status_code} - {duration}s")
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(contact_router, prefix="/api", tags=["Contacts"])
app.include_router(label_router, prefix="/api", tags=["Label"])