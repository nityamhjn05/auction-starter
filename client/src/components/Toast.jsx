import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';

const ToastCtx = createContext(null);

const THEME = {
  info:    { bg:'#111827', fg:'#fff',   border:'#111827', icon:'🔔' },
  success: { bg:'#065f46', fg:'#ecfdf5', border:'#10b981', icon:'✅' },
  error:   { bg:'#7f1d1d', fg:'#fee2e2', border:'#ef4444', icon:'❌' },
  warn:    { bg:'#7c2d12', fg:'#fff7ed', border:'#f59e0b', icon:'⚠️' },
  outbid:  { bg:'#7c2d12', fg:'#fff7ed', border:'#f59e0b', icon:'⚠️' },
  counter: { bg:'#1e3a8a', fg:'#eff6ff', border:'#60a5fa', icon:'🤝' },
  accepted:{ bg:'#065f46', fg:'#ecfdf5', border:'#10b981', icon:'🏁' },
  rejected:{ bg:'#7f1d1d', fg:'#fee2e2', border:'#ef4444', icon:'❌' },
};

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([]);

  const show = useCallback((t)=>{
    const id = Math.random().toString(36).slice(2);
    const item = { id, type: t.type || 'info', title: t.title || '', message: t.message || '' };
    setToasts(s => [...s, item]);
    setTimeout(()=> dismiss(id), t.duration ?? 3500);
  }, []);

  const dismiss = useCallback((id)=>{
    setToasts(s => s.filter(x => x.id !== id));
  }, []);

  const value = useMemo(()=>({ show, dismiss }), [show, dismiss]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div style={{
        position:'fixed', top:16, right:16, display:'grid', gap:10, zIndex:9999, width:'min(380px, 90vw)'
      }}>
        {toasts.map(t => {
          const th = THEME[t.type] || THEME.info;
          return (
            <div key={t.id}
              style={{
                background: th.bg, color: th.fg, border:`1px solid ${th.border}`,
                borderRadius:12, padding:'12px 14px', boxShadow:'0 8px 30px rgba(0,0,0,.25)',
                display:'grid', gridTemplateColumns:'28px 1fr auto', alignItems:'center', gap:10
              }}
            >
              <div style={{ fontSize:20 }}>{th.icon}</div>
              <div style={{ overflow:'hidden' }}>
                {t.title && <div style={{ fontWeight:700, marginBottom:4, whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden' }}>{t.title}</div>}
                {t.message && <div style={{ opacity:.95 }}>{t.message}</div>}
              </div>
              <button onClick={()=>dismiss(t.id)}
                style={{ background:'transparent', color:th.fg, border:'none', cursor:'pointer', fontSize:18, lineHeight:1 }}
                aria-label="Close toast">×</button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(){
  return useContext(ToastCtx);
}
