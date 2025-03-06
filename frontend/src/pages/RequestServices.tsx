import React, { useState } from 'react';
import axios from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/20/solid';

const SERVICE_PRICES: { [key: string]: number } = {
  "Branding": 100,
  "Creación de Logo": 60,
  "Creación de Reels": 12,
  "Sesión Fotográfica": 100
};

const RequestService = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState('');
  const [transferId, setTransferId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];

      // Validar que el archivo sea una imagen
      if (!selectedFile.type.startsWith("image/")) {
        alert("Por favor, selecciona un archivo de imagen válido.");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  
    if (!serviceType || !transferId || !file) {
      alert("Por favor, completa todos los campos.");
      return;
    }
  
    const formData = new FormData();
    formData.append('serviceType', serviceType);
    formData.append('email', user?.email || '');
    formData.append('amount', String(SERVICE_PRICES[serviceType]));
    formData.append('transfer_id', transferId);
    formData.append('file', file);
  
    setIsUploading(true);
  
    try {
      const response = await axios.post('/request-service', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });
  
      // ✅ Guardar el `order_id` de la respuesta
      const { order_id } = response.data;
      setOrderId(order_id);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      alert("Hubo un error al procesar la solicitud.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
          <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold mt-4">Pedido Confirmado</h2>
          <p className="text-gray-700 mt-2">Tu número de pedido es:</p>
          <p className="text-xl font-semibold text-blue-600">{orderId}</p>
          <p className="text-gray-700 mt-2">Te contactaremos cuando hayamos procesado tu pago.</p>
          <button
            onClick={() => navigate('/my-requests')}
            className="mt-6 bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition"
          >
            Aceptar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center p-6" style={{ backgroundImage: "url('/src/assets/background1.png')" }}>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Solicitar Servicio</h2>

        {/* Selección de Servicio */}
        <label className="block text-gray-700 mb-2">Tipo de Servicio:</label>
        <select
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4"
        >
          <option value="">Selecciona un servicio...</option>
          {Object.keys(SERVICE_PRICES).map((service) => (
            <option key={service} value={service}>{service}</option>
          ))}
        </select>

        {/* Monto a Pagar */}
        {serviceType && (
          <p className="text-gray-700 mb-4">
            Monto a Pagar: <strong>${SERVICE_PRICES[serviceType]} o al cambio del día</strong>
          </p>
        )}

        {/* Campo para ID de Transferencia */}
        <label className="block text-gray-700 mb-2">ID de Transferencia:</label>
        <input
          type="text"
          value={transferId}
          onChange={(e) => setTransferId(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4"
          placeholder="Ingrese su ID de transferencia"
        />

        {/* Carga de Comprobante */}
        <label className="block text-gray-700 mb-2">Sube tu comprobante de pago:</label>
        <div
          className="border-2 border-dashed border-gray-400 p-6 text-center cursor-pointer rounded-lg bg-gray-50 hover:bg-gray-100"
          onClick={() => document.getElementById("fileUpload")?.click()}
        >
          {file ? (
            <p className="text-gray-600">{file.name}</p>
          ) : (
            <p className="text-gray-500">Arrastra o haz clic para subir tu comprobante</p>
          )}
          <input
            type="file"
            id="fileUpload"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Botón de Confirmación */}
        <button
          onClick={handleSubmit}
          disabled={isUploading}
          className="w-full bg-green-500 text-white py-2 px-4 mt-4 rounded-lg hover:bg-green-600 transition"
        >
          {isUploading ? "Enviando..." : "Confirmar Servicio"}
        </button>
      </div>
    </div>
  );
};

export default RequestService;
