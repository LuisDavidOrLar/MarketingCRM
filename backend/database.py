from bson.objectid import ObjectId
from datetime import datetime
from fastapi import Request

def get_database(request: Request):
    return request.app.mongodb

def get_collection(request: Request, collection_name: str):
    db = get_database(request)
    return db[collection_name]

async def create_user(request: Request, user_data: dict):
    try:
        result = await get_collection(request, "users").insert_one(user_data)
        await request.app.mongodb_client.admin.command('ping')
        print("Pinged your deployment!")
        return result.inserted_id
    except Exception as e:
        print(f"Error inserting user: {e}")
        return None

async def get_user_by_email(request: Request, email: str):
    try:
        user = await get_collection(request, "users").find_one({"email": email})
        return user
    except Exception as e:
        print(f"Error retrieving user by email {email}: {e}")
        return None

async def update_user_profile(request: Request, email: str, profile_data: dict):
    try:
        result = await get_collection(request, "users").update_one(
            {"email": email},
            {"$set": profile_data}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error updating user profile for {email}: {e}")
        return False
