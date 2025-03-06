from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class OrderBase(BaseModel):
    order_id: str
    user_id: str
    serviceType: str
    amount: float
    transfer_id: str
    file_path: str
    status: str = "Procesando Pago"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(OrderBase):
    pass

class OrderResponse(OrderBase):
    id: str
