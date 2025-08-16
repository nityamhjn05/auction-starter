import React, { useEffect, useState } from 'react';
import { listNotifications } from '../api.js';
import { getSocket } from '../socket.js';
import { useUser } from '../user.jsx';
import NotificationCard from '../components/NotificationCard.jsx';

export default function Notifications(){
  const { userId } = useUser();
  const [rows, setRows] = useState([]);
  const refresh = async()=> setRows(await listNotifications(userId));

  useEffect(() => {
    refresh();
    const s = getSocket();
    s.emit('join-user', userId);
    s.on('notify', refresh);
    return () => s.off('notify', refresh);
  }, [userId]);

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 16px' }}>
      <h2 style={{
        textAlign: 'center',
        marginBottom: 16,
        fontSize: 26,
        letterSpacing: 1,
      }}>
        Notifications
      </h2>

      {rows.length === 0 && (
        <div style={{
          border: '1px dashed #d1d5db',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
          color: '#6b7280'
        }}>
          No notifications yet.
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map(n => <NotificationCard key={n.id} n={n} />)}
      </div>
    </div>
  );
}
