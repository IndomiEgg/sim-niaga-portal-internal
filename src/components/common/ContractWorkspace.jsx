import { useEffect, useState } from 'react';
import { apiClient, getApiError, unwrapApiData } from '../../services/api';
import { PageTitle } from '../ui/Primitives';

const rowsFrom = (value) => Array.isArray(value) ? value : value ? [value] : [];
const labelOf = (key) => key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

// Small API-backed table for contract endpoints shared by staff workspaces.
export function ContractWorkspace({ screen, endpoint, description, columns, empty = 'Belum ada data.' }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(Boolean(endpoint));
  const [error, setError] = useState('');
  useEffect(() => {
    if (!endpoint) return undefined;
    let active = true;
    apiClient.get(endpoint, { params: { page: 1, per_page: 100 } })
      .then((response) => { if (active) setRows(rowsFrom(unwrapApiData(response))); })
      .catch((reason) => { if (active) setError(getApiError(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint]);
  const keys = columns || [...new Set(rows.flatMap((row) => Object.keys(row || {})))].filter((key) => !['id', 'created_at', 'updated_at'].includes(key)).slice(0, 7);
  return <div className="frame-workspace"><PageTitle eyebrow={screen.group} title={screen.title} description={description}/>
    {error && <p className="frame-feedback" role="alert">{error}</p>}
    {!endpoint ? <p className="frame-warning">Belum tersedia di kontrak API. Layar ini menunggu endpoint backend yang disepakati.</p> : <div className="frame-table-scroll"><table className="frame-table"><thead><tr>{keys.map((key) => <th key={key}>{labelOf(key)}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || index}>{keys.map((key) => <td key={key}>{typeof row[key] === 'object' ? row[key]?.nama || row[key]?.label || '—' : row[key] ?? '—'}</td>)}</tr>)}{!rows.length && <tr><td className="frame-empty" colSpan={Math.max(keys.length, 1)}>{loading ? 'Memuat data…' : empty}</td></tr>}</tbody></table></div>}
  </div>;
}
