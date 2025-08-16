import React, { useEffect, useState } from 'react';
import { listAuctions } from '../api.js';
import { Link } from 'react-router-dom';

export default function Home(){
  const [items, setItems] = useState([]);

  useEffect(() => { (async()=> setItems(await listAuctions()))(); }, []);

  const badge = (text, tone='gray') => {
    const tones = {
      gray:  { bg:'#f3f4f6', fg:'#111827', br:'#e5e7eb' },
      live:  { bg:'#ecfdf5', fg:'#065f46', br:'#a7f3d0' },
      wait:  { bg:'#fff7ed', fg:'#9a3412', br:'#fed7aa' },
      closed:{ bg:'#f3f4f6', fg:'#374151', br:'#e5e7eb' },
    }[tone] || {};
    return (
      <span style={{
        padding:'4px 10px', borderRadius:999, fontSize:12, fontWeight:700,
        background:tones.bg, color:tones.fg, border:`1px solid ${tones.br}`
      }}>{text}</span>
    );
  };

  return (
    <div style={{ display:'flex', justifyContent:'center', padding:'32px 16px' }}>
      <div style={{ width:'100%', maxWidth:1200 }}>
        <h2 style={{
          textAlign:'center', margin:'0 0 28px', fontSize:32, letterSpacing:2, color:'#222', fontWeight:800
        }}>AUCTIONS</h2>

        <div style={{
          display:'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', // bigger cards
          gap:24,
          alignItems:'stretch'
        }}>
          {items.map(a => {
            const statusTone =
              a.status === 'live' ? 'live' :
              a.status === 'awaiting_seller' ? 'wait' : 'closed';

            return (
              <Link key={a.id} to={`/auction/${a.id}`} style={{ textDecoration:'none' }}>
                <div
                  style={{
                    height:'100%',
                    border:'1px solid #e5e7eb',
                    borderRadius:16,
                    padding:20,
                    background:'#fff',
                    boxShadow:'0 8px 24px rgba(0,0,0,.06)',
                    transition:'transform .18s ease, box-shadow .18s ease',
                    display:'grid',
                    gridTemplateRows:'auto 1fr auto',
                    minHeight:220
                  }}
                  onMouseOver={e=>{
                    e.currentTarget.style.transform='translateY(-3px)';
                    e.currentTarget.style.boxShadow='0 14px 32px rgba(0,0,0,.12)';
                  }}
                  onMouseOut={e=>{
                    e.currentTarget.style.transform='none';
                    e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.06)';
                  }}
                >
                  {/* title + badge row */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                    <h3 style={{ margin:0, fontSize:20, fontWeight:800, textTransform:'uppercase', color:'#111', lineHeight:1.2 }}>
                      {a.itemName}
                    </h3>
                    {badge(a.status.replace('_',' '), statusTone)}
                  </div>

                  {/* description */}
                  <p style={{
                    margin:'10px 0 14px', color:'#4b5563', minHeight:44, overflow:'hidden', lineHeight:1.45, fontSize:15
                  }}>
                    {a.description || '—'}
                  </p>

                  {/* stats */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10, fontSize:15 }}>
                    <div>Start: <b>₹{a.startPrice}</b></div>
                    <div>Step: <b>₹{a.bidIncrement}</b></div>
                  </div>

                  <div style={{ marginTop:10, fontSize:14, color:'#4b5563' }}>
                    {a.highest?.amount != null
                      ? <>Highest: <b style={{ color:'#6d28d9' }}>₹{a.highest.amount}</b></>
                      : <span style={{ color:'#6b7280' }}>No bids yet</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {items.length === 0 && (
          <p style={{ textAlign:'center', color:'#6b7280', marginTop:24 }}>No auctions available</p>
        )}
      </div>
    </div>
  );
}
