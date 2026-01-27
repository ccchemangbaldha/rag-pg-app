from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.users import router as usersRouter
from routes.products import router as productsRouter
from routes.history import router as historyRouter
from routes.health import router as healthRouter
from routes.ai import router as aiRouter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usersRouter)
app.include_router(productsRouter)
app.include_router(historyRouter)
app.include_router(healthRouter)
app.include_router(aiRouter)
