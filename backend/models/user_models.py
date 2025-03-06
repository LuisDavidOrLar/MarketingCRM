from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "user"

class UserProfile(BaseModel):
    name: Optional[str] = None
    idType: Optional[str] = None
    idNumber: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    isIdNumberLocked: Optional[bool] = False  # 🚀 Nuevo campo para el bloqueo


class User(UserBase, UserProfile):
    id: str
    is_active: bool
    role: Optional[str] = "user" 

    class Config:
        from_attributes = True
        json_encoders = {
            ObjectId: str
        }

class UserResponse(UserBase, UserProfile):
    id: str
    is_active: bool
    role: Optional[str] = "user"
    isIdNumberLocked: Optional[bool] = False  # 🚀 Incluir este campo


    class Config:
        from_attributes = True
        json_encoders = {
            ObjectId: str
        }

class UserUpdate(BaseModel):
    name: str
    idType: str
    idNumber: str
    phone: str
    address: str