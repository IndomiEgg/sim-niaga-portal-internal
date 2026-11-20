import { apiClient, apiMode } from './api';
import { requests, records, summaryByRole } from '../data/mockData';

// Resource paths are injected only after the Laravel API contract is agreed.
export function createDataService(endpoints = {}) {
  const get = async (key, mock) => {
    if (apiMode === 'mock') return mock;
    if (!endpoints[key]) throw new Error(`Endpoint ${key} belum disepakati.`);
    const { data } = await apiClient.get(endpoints[key]);
    return data;
  };
  return {
    dashboard: (role) => get('dashboard', summaryByRole[role] || []),
    listRequests: () => get('requests', requests),
    listRecords: () => get('records', records),
  };
}

export const dataService = createDataService();
