from dotenv import load_dotenv
import os

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_DETAILS")
if not MONGO_DETAILS:
    raise ValueError("No MONGO_DETAILS set")

DATABASE_NAME = os.getenv("DATABASE_NAME", "MarketingCRM_db")
BLOG_COLLECTION = os.getenv("BLOG_COLLECTION", "posts")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("No SECRET_KEY set")

ALGORITHM = os.getenv("ALGORITHM")