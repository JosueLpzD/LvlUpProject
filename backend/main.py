from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.timeblock_routes import timeblock_router
from routes.navi_routes import navi_router
from routes.config_routes import config_router

app = FastAPI()
# Configurar CORS (Para que el Frontend puerto 3000 pueda hablar con el Backend puerto 8000)
origins = [
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def read_root():
    return {"message": "Bienvenido al API de LvlUp"}

app.include_router(timeblock_router)
app.include_router(navi_router)
app.include_router(config_router)