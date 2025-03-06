import React, { useState, useEffect } from 'react';
import axios from '../api';
import { useAuth } from '../context/AuthContext';

interface Order {
  order_id: string;
  serviceType: string;
  status: string;
  created_at: string;
}

const MyRequests = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/my-requests', {
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

    if (user) {
      fetchOrders();
    }
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center p-6" style={{ backgroundImage: "url('/src/assets/background1.png')" }}>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Mis Pedidos</h2>

        {loading ? (
          <p className="text-center text-gray-500">Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-500">No has realizado ningún pedido aún.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">ID del Pedido</th>
                <th className="border p-2">Tipo de Servicio</th>
                <th className="border p-2">Estado</th>
                <th className="border p-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id} className="text-center">
                  <td className="border p-2">{order.order_id}</td>
                  <td className="border p-2">{order.serviceType}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-white ${order.status === "Procesando Pago" ? "bg-yellow-500" : order.status === "Aprobado" ? "bg-green-500" : order.status === "Finalizado" ? "bg-gray-500" : order.status === "Cancelado" ? "bg-red-500" : "bg-cyan-500"}`}>
                      {order.status}
                    </span>
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

export default MyRequests;
