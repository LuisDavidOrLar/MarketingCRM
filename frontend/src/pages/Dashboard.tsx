import React, { useState, useEffect } from 'react';
import axios from '../api';
import { useAuth } from '../context/AuthContext';

interface ProfileData {
  name: string;
  idType: string;
  idNumber: string;
  phone: string;
  email: string;
  address: string;
  isIdNumberLocked: boolean; // 🚀 Agregamos el campo que faltaba
}

const Dashboard = () => {
  const { user } = useAuth();
  const [isFirstSave, setIsFirstSave] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    idType: '',
    idNumber: '',
    phone: '',
    email: user?.email || '',
    address: '',
    isIdNumberLocked: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data) {
          setProfile(response.data);
          setIsFirstTime(false); // Si hay datos, no es la primera vez
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    // Validación de Campos Obligatorios
    const requiredFields = ['name', 'idType', 'idNumber', 'phone', 'address'];
    for (const field of requiredFields) {
      if (!profile[field as keyof ProfileData]) {
        alert('Por favor, completa todos los campos antes de guardar.');
        return;
      }
    }
  
    try {
      const token = sessionStorage.getItem('token');
      await axios.put('/users/me', profile, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',  // Asegúrate de enviar JSON
        },
      });
      setIsEditing(false);
      setIsFirstSave(true);
      alert('Información actualizada correctamente.');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Hubo un error al actualizar la información.');
    }
  };

return (
    <div className="min-h-screen flex justify-center items-center bg-cover bg-center" style={{ backgroundImage: "url('/src/assets/background1.png')" }}>
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-6">Mi Perfil</h1>
        
        <div className="mb-4">
          <label className="block text-gray-700">Nombre del Cliente/Empresa:</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            disabled={!isFirstTime && !isEditing}
            className={`w-full px-4 py-2 border rounded-lg ${
              (!isFirstTime && !isEditing) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            }`}
          />
        </div>

        <div className="mb-4 flex space-x-4">
  <div className="flex-1">
    <label className="block text-gray-700">Tipo de ID:</label>
    <select
      name="idType"
      value={profile.idType}
      onChange={handleChange}
      disabled={!!profile.idType} // Deshabilitado si ya se ha establecido
      className={`w-full px-4 py-2 border rounded-lg ${
        profile.idType ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
      }`}
    >
      <option value="">Selecciona...</option>
      <option value="J">J</option>
      <option value="G">G</option>
    </select>
  </div>
  <div className="flex-2">
  <label className="block text-gray-700">Número de ID:</label>
  <input
    type="text"
    name="idNumber"
    value={profile.idNumber}
    onChange={handleChange}
    disabled={profile.isIdNumberLocked}  // 🚀 Bloqueado si está en true
    className={`w-full px-4 py-2 border rounded-lg ${
      profile.isIdNumberLocked ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
    }`}
  />
</div>

</div>

        <div className="mb-4">
          <label className="block text-gray-700">Número de Teléfono:</label>
          <input
            type="text"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            disabled={!isFirstTime && !isEditing}
            className={`w-full px-4 py-2 border rounded-lg ${
              (!isFirstTime && !isEditing) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            }`}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Dirección de la Empresa:</label>
          <input
            type="text"
            name="address"
            value={profile.address}
            onChange={handleChange}
            disabled={!isFirstTime && !isEditing}
            className={`w-full px-4 py-2 border rounded-lg ${
              (!isFirstTime && !isEditing) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            }`}
          />
        </div>

        <div className="flex justify-end space-x-4">
          {isFirstTime || isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Guardar
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
            >
              Editar Información
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
