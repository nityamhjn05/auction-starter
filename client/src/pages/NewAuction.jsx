import React, { useState } from 'react';
import { createAuction } from '../api.js';
import { useUser } from '../user.jsx';

export default function NewAuction(){
  const { userId } = useUser();
  const [f, setF] = useState({
    itemName: '', description: '', startPrice: 100, bidIncrement: 10,
    goLiveAt: '', durationMinutes: 2,
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const onChange = e => {
    const { name, value, type } = e.target;
    setF(s => ({ ...s, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }));
  };

  const submit = async e => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (!f.itemName.trim()) return setErr('Item name is required');
    if (!f.goLiveAt)        return setErr('Go Live At is required');
    if (!(f.bidIncrement > 0)) return setErr('Bid increment must be > 0');
    if (!(f.durationMinutes > 0)) return setErr('Duration must be > 0');

    const goLiveISO = new Date(f.goLiveAt).toISOString();
    const endISO = new Date(new Date(f.goLiveAt).getTime() + f.durationMinutes*60*1000).toISOString();

    try{
      const res = await createAuction({
        sellerId: userId,
        itemName: f.itemName.trim(),
        description: f.description || '',
        startPrice: Number(f.startPrice),
        bidIncrement: Number(f.bidIncrement),
        goLiveAt: goLiveISO,
        endAt: endISO,
      });
      setMsg(`Created: ${res.id}`);
      setErr('');
    }catch(e){
      const issues = e?.response?.data?.issues;
      if (issues?.length) setErr(issues.map(i => `${i.path}: ${i.message}`).join('; '));
      else setErr(e?.response?.data?.error || e.message);
    }
  };

  // updated label style → bold + black
  const label = { fontSize:14, fontWeight:700, color:'#000', margin:'6px 0 6px' };
  const input = { padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:10, outline:'none' };
  const primary = { background:'#111827', borderColor:'#111827', color:'#fff', fontWeight:700 };

  return (
    <div style={{ display:'flex', justifyContent:'center', padding:'28px 16px' }}>
      <form onSubmit={submit}
        style={{
          width:'100%', maxWidth:640, background:'#fff',
          border:'1px solid #e5e7eb', borderRadius:16, padding:24,
          boxShadow:'0 6px 24px rgba(0,0,0,.08)', display:'grid', gap:14
        }}
      >
        <div style={{ marginBottom:2 }}>
          <div style={{ fontSize:13, color:'#6b7280', fontWeight:600 }}>SELLER</div>
          <div style={{ fontWeight:700, fontSize:16, color:'#000' }}>{userId}</div>
        </div>

        <div>
          <div style={label}>Item Name</div>
          <input name="itemName" value={f.itemName} onChange={onChange} placeholder="e.g., MacBook Air M2" style={input} required/>
        </div>

        <div>
          <div style={label}>Description</div>
          <textarea name="description" value={f.description} onChange={onChange} placeholder="Short description"
            style={{ ...input, resize:'vertical', minHeight:80 }} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <div style={label}>Start Price (₹)</div>
            <input type="number" name="startPrice" value={f.startPrice} onChange={onChange} style={input}/>
          </div>
          <div>
            <div style={label}>Bid Increment (₹)</div>
            <input type="number" name="bidIncrement" value={f.bidIncrement} onChange={onChange} min={1} style={input}/>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <div style={label}>Go Live At</div>
            <input type="datetime-local" name="goLiveAt" value={f.goLiveAt} onChange={onChange} style={input} required/>
          </div>
          <div>
            <div style={label}>Duration (minutes)</div>
            <input type="number" name="durationMinutes" value={f.durationMinutes} onChange={onChange} min={1} style={input}/>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:10 }}>
          <button type="submit"
            style={{ padding:'12px 16px', border:'1px solid', borderRadius:10, cursor:'pointer', ...primary }}
          >
            Create Auction
          </button>
        </div>

        {msg && <div style={{ color:'#065f46', background:'#ecfdf5', border:'1px solid #a7f3d0', borderRadius:10, padding:'8px 10px' }}>{msg}</div>}
        {err && <div style={{ color:'#7f1d1d', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'8px 10px' }}>{err}</div>}
      </form>
    </div>
  );
}
