import axios from 'axios';

// Auto-detect instead of hardcoding an IP: whatever address the browser used
// to load this page (localhost, or a LAN IP like 192.168.x.x) is also the
// address the backend is reachable at, since both run on the same machine.
// This means the app keeps working even when your computer's WiFi IP changes.
const baseURL = `http://${window.location.hostname}:5000/api`;
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