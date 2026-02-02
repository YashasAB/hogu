import { useState, useEffect } from 'react';

interface TableInfo {
  tables: string[];
  counts: Record<string, number>;
}

interface TableData {
  table: string;
  columns: string[];
  records: Record<string, any>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const API_BASE = '/api/db-admin';

export default function DbAdmin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tables, setTables] = useState<TableInfo | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const authHeaders = {
    'Authorization': `Bearer ${password}`,
    'Content-Type': 'application/json',
  };

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tables`, { headers: authHeaders });
      if (!res.ok) {
        if (res.status === 403) {
          setIsAuthenticated(false);
          setError('Invalid password');
          return;
        }
        throw new Error('Failed to fetch tables');
      }
      const data = await res.json();
      setTables(data);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (table: string, pageNum: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tables/${table}?page=${pageNum}&limit=50`, { headers: authHeaders });
      if (!res.ok) throw new Error('Failed to fetch table data');
      const data = await res.json();
      setTableData(data);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchTables();
  };

  const handleSelectTable = (table: string) => {
    setSelectedTable(table);
    setEditingRecord(null);
    fetchTableData(table, 1);
  };

  const handleEdit = (record: Record<string, any>) => {
    setEditingRecord(record);
    setEditValues({ ...record });
  };

  const handleSave = async () => {
    if (!editingRecord || !selectedTable) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tables/${selectedTable}/${editingRecord.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(editValues),
      });
      if (!res.ok) throw new Error('Failed to update record');
      setEditingRecord(null);
      fetchTableData(selectedTable, page);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!selectedTable) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tables/${selectedTable}/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders, 'X-Confirm-Delete': 'true' },
      });
      if (!res.ok) throw new Error('Failed to delete record');
      setDeleteConfirm(null);
      fetchTableData(selectedTable, page);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const truncateValue = (value: any, maxLength: number = 50): string => {
    const str = formatValue(value);
    return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-6">Database Admin</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-pink-500 focus:outline-none"
                placeholder="Enter admin password"
              />
            </div>
            {error && <p className="text-red-400 mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        <aside className="w-64 bg-gray-800 min-h-screen p-4">
          <h1 className="text-xl font-bold mb-6">DB Admin</h1>
          <nav className="space-y-1">
            {tables?.tables.map((table) => (
              <button
                key={table}
                onClick={() => handleSelectTable(table)}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  selectedTable === table
                    ? 'bg-pink-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{table}</span>
                <span className="float-right text-gray-400">
                  {tables.counts[table] || 0}
                </span>
              </button>
            ))}
          </nav>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setPassword('');
              setTables(null);
              setSelectedTable(null);
              setTableData(null);
            }}
            className="mt-8 w-full py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded"
          >
            Logout
          </button>
        </aside>

        <main className="flex-1 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300">
              {error}
              <button onClick={() => setError(null)} className="float-right">×</button>
            </div>
          )}

          {!selectedTable ? (
            <div className="text-gray-400 text-center mt-20">
              Select a table from the sidebar to view and edit records
            </div>
          ) : loading && !tableData ? (
            <div className="text-gray-400 text-center mt-20">Loading...</div>
          ) : tableData ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{selectedTable}</h2>
                <span className="text-gray-400">
                  {tableData.pagination.total} records
                </span>
              </div>

              {editingRecord && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                  <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4">Edit Record</h3>
                    <div className="space-y-4">
                      {Object.keys(editingRecord).map((key) => (
                        <div key={key}>
                          <label className="block text-gray-400 text-sm mb-1">
                            {key}
                            {(key === 'id' || key === 'createdAt') && (
                              <span className="text-gray-500 ml-2">(read-only)</span>
                            )}
                          </label>
                          {key === 'id' || key === 'createdAt' ? (
                            <div className="px-3 py-2 bg-gray-700 rounded text-gray-400">
                              {formatValue(editingRecord[key])}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={formatValue(editValues[key])}
                              onChange={(e) =>
                                setEditValues({ ...editValues, [key]: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-pink-500 focus:outline-none"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setEditingRecord(null)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {deleteConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                  <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-xl font-bold mb-4 text-red-400">Confirm Delete</h3>
                    <p className="text-gray-300 mb-6">
                      Are you sure you want to delete this record? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDelete(deleteConfirm)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {loading ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-800">
                      {tableData.columns.slice(0, 6).map((col) => (
                        <th key={col} className="px-4 py-2 text-left text-sm text-gray-400 border-b border-gray-700">
                          {col}
                        </th>
                      ))}
                      <th className="px-4 py-2 text-left text-sm text-gray-400 border-b border-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.records.map((record, idx) => (
                      <tr key={record.id || idx} className="hover:bg-gray-800/50">
                        {tableData.columns.slice(0, 6).map((col) => (
                          <td key={col} className="px-4 py-2 text-sm border-b border-gray-700">
                            {truncateValue(record[col])}
                          </td>
                        ))}
                        <td className="px-4 py-2 text-sm border-b border-gray-700">
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-blue-400 hover:text-blue-300 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(record.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {tableData.pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => fetchTableData(selectedTable!, page - 1)}
                    disabled={page <= 1 || loading}
                    className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {page} of {tableData.pagination.pages}
                  </span>
                  <button
                    onClick={() => fetchTableData(selectedTable!, page + 1)}
                    disabled={page >= tableData.pagination.pages || loading}
                    className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
