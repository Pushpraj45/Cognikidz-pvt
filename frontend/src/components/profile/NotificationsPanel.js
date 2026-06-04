import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const NotificationsPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/notifications');
      setItems(res.data?.data || []);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const markRead = async id => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setItems(prev => prev.map(n => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
        <button onClick={load} className="text-sm text-primary">
          Refresh
        </button>
      </div>
      {loading ? (
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 text-sm">No notifications</div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.map(n => (
            <li key={n._id} className="py-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{n.message}</div>
                <div className="text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              {!n.isRead && (
                <button onClick={() => markRead(n._id)} className="text-xs text-primary">
                  Mark as read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPanel;
