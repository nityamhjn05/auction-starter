import React, { useEffect, useState } from 'react';
import { listAwaitingSeller, sellerDecision } from '../api.js';
import { useUser } from '../user.jsx';

export default function SellerDesk(){
  const { userId } = useUser();
  const [items, setItems] = useState([]);
  const [amt, setAmt] = useState({});

  const refresh = async()=> setItems(await listAwaitingSeller(userId));
  useEffect(()=>{ refresh(); },[userId]);

  const act = async (id, action) => {
    const amount = action==='counter' ? Number(amt[id]||0) : undefined;
    try{
      await sellerDecision(id, action, amount, userId);
      await refresh();
    }catch(e){
      alert(e?.response?.data?.error || e.message);
    }
  };

  const btn = {
    base: {
      padding:'8px 12px',
      borderRadius:8,
      color:'#fff',
      border:'1px solid transparent',
      cursor:'pointer'
    },
    accept: { background:'#16a34a', borderColor:'#16a34a' }, // green
    reject: { background:'#dc2626', borderColor:'#dc2626' }, // red
    counter:{ background:'#111827', borderColor:'#111827' }, // black
  };

  return (
    <div style={{maxWidth:800, margin:'24px auto', padding:'0 16px'}}>
      <h3>Seller Decision (you: {userId})</h3>
      {items.length === 0 && <div>No items awaiting your decision.</div>}
      <div style={{ display:'grid', gap:12 }}>
        {items.map(a => (
          <div key={a.id} style={{border:'1px solid #e5e7eb', borderRadius:12, padding:14, background:'#fff'}}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
              <div>
                <div style={{ fontWeight:700 }}>{a.itemName}</div>
                <div style={{ fontSize:13, color:'#6b7280' }}>
                  Highest ₹{a.highest?.amount ?? a.startPrice} • Seller: {a.sellerId}
                </div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <button style={{...btn.base, ...btn.accept}} onClick={()=>act(a.id,'accept')}>Accept</button>
                <button style={{...btn.base, ...btn.reject}} onClick={()=>act(a.id,'reject')}>Reject</button>
                <input
                  type="number"
                  placeholder="Counter ₹"
                  value={amt[a.id]||''}
                  onChange={e=>setAmt(s=>({...s,[a.id]:e.target.value}))}
                  style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #d1d5db', width:120 }}
                />
                <button style={{...btn.base, ...btn.counter}} onClick={()=>act(a.id,'counter')}>Counter</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
 