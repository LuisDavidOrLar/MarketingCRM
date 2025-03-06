import React, { useState, useEffect } from 'react';
import axios from '../api';
import { useAuth } from '../context/AuthContext';

interface Order {
  order_id: string;
  client_name: string;
  serviceType: string;
  transfer_id: string;
  file_name?: string;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ["Procesando Pago", "Aprobado", "Finalizado", "Cancelado"];

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/orders', {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        setOrders(response.data);
      } catch (error) {
        console.error("Error al obtener los pedidos:", error);
      } finally {
        setLoading(false);
      }
    };
  
    if (user?.role === "admin") {
      fetchOrders();
    }
  }, [user]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await axios.put(`/orders/${orderId}/update-status`, { status: newStatus }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      setOrders(orders.map(order => order.order_id === orderId ? { ...order, status: newStatus } : order));
    } catch (error) {
      console.error("Error al actualizar el estado del pedido:", error);
    }
  };

  const downloadInvoicePDF = async (orderId: string) => {
    try {
      const response = await axios.get(`/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error al descargar la factura:", error);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.order_id.includes(search) ||
    order.client_name.toLowerCase().includes(search.toLowerCase()) ||
    order.status.toLowerCase().includes(search.toLowerCase()) ||
    order.created_at.includes(search)
  );

  const downloadPaymentProof = async (orderId: string | undefined) => {
    if (!orderId) {
      alert("El ID del pedido es inválido.");
      return;
    }
  
    try {
      const response = await axios.get(`/admin/download-payment/${orderId}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
        responseType: 'blob'
      });
  
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comprobante_${orderId}.jpg`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error al descargar el comprobante:", error);
      alert("No se encontró el comprobante de pago.");
    }
  };
  
  

  return (
    <div className="min-h-screen flex flex-col items-center bg-cover bg-center p-6" style={{ backgroundImage: "url('/src/assets/background1.png')" }}>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-5xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Gestión de Pedidos</h2>

        {/* Barra de Búsqueda */}
        <input
          type="text"
          placeholder="Buscar por ID, Cliente, Estado o Fecha"
          className="w-full p-2 mb-4 border rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p className="text-center text-gray-500">Cargando pedidos...</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-center text-gray-500">No hay pedidos registrados.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">ID del Pedido</th>
                <th className="border p-2">Cliente</th>
                <th className="border p-2">Tipo de Servicio</th>
                <th className="border p-2">Comprobante</th>
                <th className="border p-2">Estado</th>
                <th className="border p-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.order_id} className="text-center">
                  <td className="border p-2">
                    <button className="text-blue-500 underline" onClick={() => downloadInvoicePDF(order.order_id)}>
                      {order.order_id}
                    </button>
                  </td>
                  <td className="border p-2">{order.client_name}</td>
                  <td className="border p-2">{order.serviceType}</td>
                  <td className="border p-2">
        {order.file_name ? (
          <button className="text-blue-500 underline" onClick={() => downloadPaymentProof(order.order_id)}>
            Descargar
          </button>
        ) : (
          "No disponible"
        )}
      </td>
                  <td className="border p-2">
                    <select
                      className="p-2 border rounded"
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-2">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Orders;
