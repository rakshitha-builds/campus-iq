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

// If the backend rejects a token as expired/invalid (401), the token
// existing in localStorage no longer means the person is actually logged
// in — clear it and send them to Login, instead of leaving them stuck on
// a broken Dashboard where every request silently fails.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;