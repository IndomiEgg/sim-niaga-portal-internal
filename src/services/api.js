import axios from 'axios';

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const apiTokenKey = 'simniaga-api-token';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(apiTokenKey);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getApiError(error) {
  const response = error?.response?.data;
  if (response?.errors) {
    const firstError = Object.values(response.errors).flat()[0];
    if (firstError) return firstError;
  }
  return response?.message || error?.message || 'Server tidak dapat dihubungi. Periksa koneksi API.';
}

export const apiMode = 'api';

export function unwrapApiData(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function logoutApi() {
  try {
    if (localStorage.getItem(apiTokenKey)) await apiClient.post('/auth/logout');
  } finally {
    localStorage.removeItem(apiTokenKey);
    localStorage.removeItem('simniaga-api-user');
    localStorage.removeItem('sim-role');
  }
}

export async function uploadApiDocument(file, category = 'bukti_dosen') {
  const form = new FormData();
  form.append('file', file);
  form.append('kategori', category);
  const { data } = await apiClient.post('/dokumen', form);
  return data?.data || data;
}

export async function getApiDocumentUrl(id) {
  const { data } = await apiClient.get(`/dokumen/${id}/unduh`);
  return data?.data?.url || data?.url;
}
