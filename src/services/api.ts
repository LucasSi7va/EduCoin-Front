import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080', 
});

api.interceptors.request.use(config => {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (usuario?.token) {
    config.headers.Authorization = `Bearer ${usuario.token}`;
  }
  return config;
});
export default api;