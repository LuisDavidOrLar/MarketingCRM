from fastapi import APIRouter, Depends, HTTPException, status, Body, Request, Security, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import FileResponse, Response
from PIL import Image
import random
import os
from fpdf import FPDF
import shutil
from bson import ObjectId
from jose import jwt, JWTError
from datetime import datetime, timedelta
from utils import hash_password, verify_password
from database import get_user_by_email, create_user, update_user_profile, get_collection
from models.user_models import UserCreate, User, UserProfile, UserResponse, UserUpdate
from config import SECRET_KEY, ALGORITHM

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=7))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register")
async def register_user(request: Request, user: UserCreate):
    existing_user = await get_user_by_email(request, user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pwd = hash_password(user.password)
    user_data = user.dict()
    user_data["hashed_password"] = hashed_pwd
    user_data["role"] = user_data.get("role", "user") 
    del user_data["password"]
    user_id = await create_user(request, user_data)
    if user_id:
        access_token = create_access_token(data={"sub": user.email, "role": user_data.get("role", "user")})
        refresh_token = create_refresh_token(data={"sub": user.email, "role": user_data.get("role", "user")})
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=500, detail="Failed to create user")

async def get_current_user_email(request: Request, token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await get_user_by_email(request, email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return email

# RUTA PARA OBTENER EL PERFIL DEL USUARIO
@router.get("/users/me", response_model=UserResponse)
async def read_user_me(
    request: Request,
    current_user_email: str = Security(get_current_user_email)
):
    user = await get_user_by_email(request, current_user_email)
    if user:
        return UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            is_active=user.get("is_active", True),
            role=user["role"],
            name=user.get("name", ""),
            idType=user.get("idType", ""),
            idNumber=user.get("idNumber", ""),
            phone=user.get("phone", ""),
            address=user.get("address", ""),
            isIdNumberLocked=user.get("isIdNumberLocked", False)  # 🚀 Incluye el estado de bloqueo
        )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")


async def authenticate_user(request: Request, email: str, password: str):
    user = await get_user_by_email(request, email)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

@router.put("/users/me", response_model=UserResponse)
async def update_user_me(
    request: Request,
    profile: UserUpdate,
    current_user_email: str = Security(get_current_user_email)
):
        # 🚀 Verificar y Bloquear Número de ID si es la primera vez que se guarda
    user = await get_user_by_email(request, current_user_email)
    if user:
        # Si el Número de ID está presente y aún no está bloqueado, se bloquea
        if profile.idNumber and not user.get("isIdNumberLocked", False):
            profile_data = profile.dict()
            profile_data["isIdNumberLocked"] = True  # Bloquea el Número de ID
            updated = await update_user_profile(request, current_user_email, profile_data)
        else:
            updated = await update_user_profile(request, current_user_email, profile.dict())

        if updated:
            # Obtener el usuario actualizado
            user = await get_user_by_email(request, current_user_email)
            return UserResponse(
                id=str(user["_id"]),
                email=user["email"],
                is_active=user.get("is_active", True),
                role=user["role"],
                name=user.get("name", ""),
                idType=user.get("idType", ""),
                idNumber=user.get("idNumber", ""),
                phone=user.get("phone", ""),
                address=user.get("address", ""),
                isIdNumberLocked=user.get("isIdNumberLocked", False)
            )
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo actualizar el perfil")

@router.post("/token")
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(request, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    refresh_token = create_refresh_token(data={"sub": user["email"], "role": user["role"]})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh-token")
async def refresh_token(request: Request, refresh_token: str = Body(...)):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if email is None or role is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    
    new_access_token = create_access_token(data={"sub": email, "role": role})
    return {"access_token": new_access_token, "token_type": "bearer"}

def admin_required(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    
async def generate_order_id(request: Request) -> str:
    """Genera un order_id único de 4 dígitos verificando que no exista en la base de datos."""
    while True:
        order_id = str(random.randint(1000, 9999))  # Genera un número aleatorio entre 1000 y 9999
        existing_order = await get_collection(request, "orders").find_one({"order_id": order_id})
        if not existing_order:
            return order_id  # Devuelve el ID si no está en uso

@router.post("/request-service")
async def request_service(
    request: Request,
    serviceType: str = Form(...),
    amount: float = Form(...),
    transfer_id: str = Form(...),
    file: UploadFile = File(...),
    current_user_email: str = Security(get_current_user_email)
):
    """Guarda un pedido con el comprobante de pago directamente en MongoDB"""
    try:
        # ✅ Validar que el archivo sea una imagen
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Solo se permiten imágenes")

        # ✅ Leer el archivo en memoria para guardarlo en MongoDB
        file_content = await file.read()

        # ✅ Obtener el usuario
        user = await get_user_by_email(request, current_user_email)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # ✅ Generar un `order_id` único de 4 dígitos
        order_id = await generate_order_id(request)

        # ✅ Guardar los datos del pedido en MongoDB
        order_data = {
            "order_id": order_id,
            "user_id": str(user["_id"]),
            "client_name": user.get("name", "Sin Nombre"),
            "serviceType": serviceType,
            "amount": amount,
            "transfer_id": transfer_id,
            "file": {
                "filename": file.filename,
                "content_type": file.content_type,
                "data": file_content  # ✅ Guardamos la imagen en binario dentro del pedido
            },
            "status": "Procesando Pago",
            "created_at": datetime.utcnow()
        }
        await get_collection(request, "orders").insert_one(order_data)

        return {"message": "Solicitud enviada con éxito", "order_id": order_id}

    except Exception as e:
        print(f"Error al procesar la solicitud de servicio: {e}")
        raise HTTPException(status_code=500, detail="No se pudo procesar la solicitud")
    
@router.get("/my-requests")
async def get_my_requests(request: Request, current_user_email: str = Security(get_current_user_email)):
    try:
        user = await get_user_by_email(request, current_user_email)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        orders = await get_collection(request, "orders").find({"user_id": str(user["_id"])}).to_list(100)

        return [
            {
                "order_id": order["order_id"],
                "serviceType": order["serviceType"],
                "status": order["status"],
                "created_at": order["created_at"]
            }
            for order in orders
        ]
    except Exception as e:
        print(f"Error al obtener los pedidos: {e}")
        raise HTTPException(status_code=500, detail="No se pudieron recuperar los pedidos")
    
@router.get("/orders")
async def get_all_orders(request: Request, current_user_email: str = Security(get_current_user_email)):
    """Obtiene todos los pedidos (solo para administradores)"""
    try:
        # ✅ Verificar que el usuario sea administrador
        user = await get_user_by_email(request, current_user_email)
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Acceso denegado")

        # ✅ Obtener todos los pedidos
        orders = await get_collection(request, "orders").find().to_list(100)

        # ✅ Construir la respuesta sin `file_path`, pero incluyendo el nombre del archivo
        return [
            {
                "order_id": order["order_id"],
                "client_name": order.get("client_name", "Desconocido"),
                "serviceType": order["serviceType"],
                "transfer_id": order["transfer_id"],
                "file_name": order["file"]["filename"] if "file" in order else None,  # ✅ Guardamos el nombre del archivo en la respuesta
                "status": order["status"],
                "created_at": order["created_at"]
            }
            for order in orders
        ]
    except Exception as e:
        print(f"Error al obtener los pedidos: {e}")
        raise HTTPException(status_code=500, detail="No se pudieron recuperar los pedidos")

@router.put("/orders/{order_id}/update-status")
async def update_order_status(request: Request, order_id: str, status: dict, current_user_email: str = Security(get_current_user_email)):
    """Actualiza el estado de un pedido"""
    user = await get_user_by_email(request, current_user_email)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado")

    await get_collection(request, "orders").update_one({"order_id": order_id}, {"$set": {"status": status["status"]}})
    return {"message": "Estado actualizado"}

@router.get("/orders/{order_id}/invoice")
async def generate_invoice(request: Request, order_id: str, current_user_email: str = Security(get_current_user_email)):
    """Genera un PDF con la información completa del pedido y el cliente"""
    try:
        # Verificar que el usuario tiene permisos de administrador
        user = await get_user_by_email(request, current_user_email)
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Acceso denegado")

        # Obtener el pedido de la base de datos
        order = await get_collection(request, "orders").find_one({"order_id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")

        # Convertir `user_id` a ObjectId para buscar en MongoDB
        user_id = order["user_id"]
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="El ID del usuario no es válido")

        client = await get_collection(request, "users").find_one({"_id": ObjectId(user_id)})
        if not client:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        # Crear el PDF
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        pdf.cell(200, 10, "Detalles del Pedido", ln=True, align="C")
        pdf.ln(10)  # Espacio

        # 📌 Información del Cliente
        pdf.set_font("Arial", style='B', size=12)  # ✅ Texto en negrita
        pdf.cell(50, 10, "Información del Cliente:", ln=True)
        pdf.set_font("Arial", size=12)  # ✅ Volver a texto normal
        pdf.cell(50, 10, f"Nombre: {client.get('name', 'Sin Nombre')}", ln=True)
        pdf.cell(50, 10, f"Tipo de ID: {client.get('idType', 'N/A')} {client.get('idNumber', 'N/A')}", ln=True)
        pdf.cell(50, 10, f"Teléfono: {client.get('phone', 'No disponible')}", ln=True)
        pdf.cell(50, 10, f"Dirección: {client.get('address', 'No disponible')}", ln=True)
        pdf.ln(10)  # Espacio

        # 📌 Información del Pedido
        pdf.set_font("Arial", style='B', size=12)  
        pdf.cell(50, 10, "Información del Pedido:", ln=True)
        pdf.set_font("Arial", size=12) 
        pdf.cell(50, 10, f"ID del Pedido: {order['order_id']}", ln=True)
        pdf.cell(50, 10, f"Tipo de Servicio: {order['serviceType']}", ln=True)
        pdf.cell(50, 10, f"ID de Transferencia: {order['transfer_id']}", ln=True)
        pdf.cell(50, 10, f"Fecha del Pedido: {order['created_at'].strftime('%d-%m-%Y')}", ln=True)

        # Guardar el PDF temporalmente
        pdf_output_path = f"uploads/{order_id}.pdf"
        pdf.output(pdf_output_path)

        return FileResponse(pdf_output_path, filename=f"{order_id}.pdf", media_type="application/pdf")

    except Exception as e:
        print(f"Error al generar el PDF: {e}")
        raise HTTPException(status_code=500, detail="Error al generar el PDF")
    
@router.get("/admin/download-payment/{order_id}")
async def download_payment_proof(
    request: Request,
    order_id: str,
    current_user_email: str = Security(get_current_user_email)
):
    """Permite a los administradores descargar comprobantes de pago almacenados en MongoDB"""
    try:
        # ✅ Verificar que el usuario es admin
        user = await get_user_by_email(request, current_user_email)
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Acceso denegado: Solo los administradores pueden descargar comprobantes.")

        # ✅ Obtener el pedido de la base de datos
        order = await get_collection(request, "orders").find_one({"order_id": order_id})
        if not order or "file" not in order:
            raise HTTPException(status_code=404, detail="Pedido o comprobante no encontrado")

        # ✅ Extraer la imagen almacenada en MongoDB
        file_data = order["file"]

        return Response(
            file_data["data"], 
            media_type=file_data["content_type"], 
            headers={"Content-Disposition": f"attachment; filename={file_data['filename']}"}
        )

    except Exception as e:
        print(f"Error al descargar el comprobante: {e}")
        raise HTTPException(status_code=500, detail="No se pudo descargar el archivo")

