from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi_swagger import patch_fastapi
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
              version="1.0.0", 
              lifespan=lifespan, 
              docs_url=None, 
              swagger_ui_oauth2_redirect_url=None)

patch_fastapi(app, docs_url="/docs")

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(contact_router, prefix="/api", tags=["Contacts"])
app.include_router(label_router, prefix="/api", tags=["Label"])