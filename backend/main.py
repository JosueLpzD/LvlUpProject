from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.timeblock_routes import timeblock_router
from routes.navi_routes import navi_router
from routes.config_routes import config_router
from routes.rewards_routes import rewards_router
from routes.staking_routes import staking_router
from routes.extra_life_routes import extra_life_router

app = FastAPI()
# Configurar CORS - Permite conexiones desde localhost y Cloudflare Tunnel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir cualquier origen (Cloudflare genera URLs aleatorias)
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
app.include_router(rewards_router)
app.include_router(staking_router)
app.include_router(extra_life_router)