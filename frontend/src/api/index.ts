import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/refresh-token`, { refresh_token: refreshToken });
          sessionStorage.setItem('token', response.data.access_token);
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access_token}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          sessionStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/';
        }
      } else {
        sessionStorage.removeItem('token');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
