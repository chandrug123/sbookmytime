import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;
    const isAuthRoute = orig.url?.includes('/auth/');

    if (err.response?.status === 401 && !orig._retry && !isAuthRoute) {
      orig._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post('http://localhost:5000/api/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${refresh}` }
          });
          localStorage.setItem('access_token', data.access_token);
          orig.headers.Authorization = `Bearer ${data.access_token}`;
          return api(orig);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
