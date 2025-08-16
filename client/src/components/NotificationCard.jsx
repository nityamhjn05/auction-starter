import React from 'react';
import { Link } from 'react-router-dom';

// Simple template map per notification type
function getTemplate(n){
  const { type, payload = {} } = n;
  const auctionLink = payload.auctionId ? `/auction/${payload.auctionId}` : null;

  const base = {
    icon: '🔔',
    title: 'Notification',
    body: payload.message || '',
    tone: '#e5e7eb',        // bg
    border: '#d1d5db',      // border
    accent: '#111827',      // text
    cta: auctionLink ? { label: 'Open Auction', to: auctionLink } : null,
  };

  switch(type){
    case 'outbid':
      return { ...base, icon:'⚠️', title:'You were outbid', tone:'#fff7ed', border:'#fed7aa', accent:'#7c2d12' };
    case 'accepted':
      return { ...base, icon:'✅', title:'Bid accepted', tone:'#ecfdf5', border:'#a7f3d0', accent:'#065f46',
               cta: auctionLink ? { label:'View Result', to: auctionLink } : base.cta };
    case 'rejected':
      return { ...base, icon:'❌', title:'Bid rejected', tone:'#fef2f2', border:'#fecaca', accent:'#7f1d1d' };
    case 'counter':
      return { ...base, icon:'🤝', title:'Seller countered', tone:'#eff6ff', border:'#bfdbfe', accent:'#1e3a8a' };
    case 'awaiting_seller':
      return { ...base, icon:'🧾', title:'Seller action required', tone:'#f5f3ff', border:'#ddd6fe', accent:'#4c1d95',
               cta: { label:'Go to Seller Desk', to:'/seller' } };
    case 'auction_ended_top':
      return { ...base, icon:'🏁', title:'Auction ended — you’re top', tone:'#f0fdf4', border:'#bbf7d0', accent:'#166534' };
    default:
      return base;
  }
}

export default function NotificationCard({ n }){
  const t = getTemplate(n);
  return (
    <div
      style={{
        background: t.tone,
        border: `1px solid ${t.border}`,
        color: t.accent,
        borderRadius: 12,
        padding: 14,
        display: 'grid',
        gridTemplateColumns: '36px 1fr auto',
        gap: 12,
        alignItems: 'center'
      }}
    >
      <div style={{ fontSize: 22, lineHeight: '22px' }}>{t.icon}</div>

      <div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.title}</div>
        {n.payload?.amount != null && (
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>
            Amount: ₹{n.payload.amount}
          </div>
        )}
        {t.body && <div style={{ fontSize: 14 }}>{t.body}</div>}
      </div>

      <div>
        {t.cta ? (
          <Link
            to={t.cta.to}
            style={{
              background: '#111827',
              color: '#fff',
              padding: '8px 10px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 13
            }}
          >
            {t.cta.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
