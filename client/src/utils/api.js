import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const saved = JSON.parse(localStorage.getItem('hms_auth') || 'null')
  if (saved?.accessToken) config.headers.Authorization = `Bearer ${saved.accessToken}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    console.error('[API ERROR]', {
      url: err.config?.url,
      status: err.response?.status,
      message: err.response?.data?.message,
    });
    return Promise.reject(err);
  }
);

export default api
