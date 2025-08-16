import React, { useEffect, useState } from 'react';
import { listNotifications } from '../api.js';
import { getSocket } from '../socket.js';
import { Link } from 'react-router-dom';
import { useUser } from '../user.jsx';

export default function Notifications(){
  const { userId } = useUser();               // ✅ who am I?
  const [rows, setRows] = useState([]);

  const refresh = async () => {
    if (!userId) return;
    const data = await listNotifications(userId); // ✅ fetch only my notifications
    setRows(data);
  };

  useEffect(() => {
    refresh();
  }, [userId]);

  useEffect(() => {
    const s = getSocket();
    if (!userId) return;
    s.emit('join-user', userId);              // ✅ subscribe only to my room
    const onNotify = (evt) => {
      // evt is already for this user (server emitted to user:<userId>)
      // Just refresh or optimistically prepend:
      refresh();
    };
    s.on('notify', onNotify);
    return () => s.off('notify', onNotify);
  }, [userId]);

  const card = {
    background:'#fff', border:'1px solid #e5e7eb', borderRadius:14,
    padding:16, boxShadow:'0 6px 18px rgba(0,0,0,.06)', display:'grid', gap:8
  };

  return (
    <div style={{ display:'flex', justifyContent:'center', padding:'24px 16px' }}>
      <div style={{ width:'100%', maxWidth:800 }}>
        <h2 style={{ margin:'0 0 16px', fontSize:28, fontWeight:800, color:'#111' }}>Notifications</h2>

        <div style={{ display:'grid', gap:12 }}>
          {rows.map(n => {
            const inv = n?.payload?.invoiceBase64;
            const href = inv ? `data:application/pdf;base64,${inv}` : null;
            const label = (n.type || '').replace('_', ' ');

            return (
              <div key={n.id} style={card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <div style={{ fontWeight:800, textTransform:'capitalize' }}>{label}</div>
                  {n.payload?.auctionId && (
                    <Link to={`/auction/${n.payload.auctionId}`} style={{ fontSize:12, color:'#2563eb' }}>
                      View Auction →
                    </Link>
                  )}
                </div>
                {n.payload?.message && <div style={{ color:'#374151' }}>{n.payload.message}</div>}
                {typeof n.payload?.amount === 'number' && (
                  <div style={{ color:'#6b7280', fontSize:14 }}>Amount: <b>₹{n.payload.amount}</b></div>
                )}
                {href && (
                  <div>
                    <a
                      href={href}
                      download="invoice.pdf"
                      style={{
                        display:'inline-block',
                        padding:'8px 12px',
                        borderRadius:10,
                        border:'1px solid #111827',
                        background:'#111827',
                        color:'#fff',
                        textDecoration:'none'
                      }}
                    >
                      Download Invoice (PDF)
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {rows.length === 0 && (
          <p style={{ textAlign:'center', color:'#6b7280', marginTop:24 }}>No notifications yet</p>
        )}
      </div>
    </div>
  );
}
