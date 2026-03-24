# Configuration for Gomony backend
import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    # Add more config as needed
