import axios from 'axios';

const isPhone = window.location.hostname !== 'localhost';
const baseURL = isPhone 
  ? 'http://192.168.1.5:5000/api'
  : 'http://localhost:5000/api';

const API = axios.create({
  baseURL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;