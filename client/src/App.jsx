import React, { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import NewAuction from './pages/NewAuction.jsx';
import AuctionRoom from './pages/AuctionRoom.jsx';
import SellerDesk from './pages/SellerDesk.jsx';
import Notifications from './pages/Notifications.jsx';
import { getSocket } from './socket.js';
import { ToastProvider, useToast } from './components/Toast.jsx';
import { useUser, UserProvider } from './user.jsx';

function Header(){
  const { userId, setUserId, ALL_USERS } = useUser();

  const wrapperStyle = { display: 'flex', justifyContent: 'center', marginBottom: 32 };
  const headerStyle = {
    background: '#111', color: '#fff', padding: '20px 32px',
    display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 20, boxShadow: '0 8px 24px rgba(0,0,0,.3)',
    width: '90%', maxWidth: '1200px'
  };
  const linkStyle = {
    color: '#fff', textDecoration: 'none', padding: '8px 14px', borderRadius: 12, fontWeight: 500
  };
  const linkHoverStyle = { background: 'rgba(255,255,255,0.2)' };

  const hoverOn = e => Object.assign(e.currentTarget.style, linkHoverStyle);
  const hoverOff = e => Object.assign(e.currentTarget.style, { background:'transparent' });

  return (
    <div style={wrapperStyle}>
      <header style={headerStyle}>
        <h1 style={{ margin:0, fontSize:'1.6rem' }}>BidBuzz</h1>

        <nav style={{ display:'flex', gap:14 }}>
          <Link to="/" style={linkStyle} onMouseOver={hoverOn} onMouseOut={hoverOff}>HOME</Link>
          <Link to="/sell/new" style={linkStyle} onMouseOver={hoverOn} onMouseOut={hoverOff}>SELL</Link>
          <Link to="/seller" style={linkStyle} onMouseOver={hoverOn} onMouseOut={hoverOff}>SELLER DESK</Link>
          <Link to="/notifications" style={linkStyle} onMouseOver={hoverOn} onMouseOut={hoverOff}>NOTIFICATIONS</Link>
        </nav>

        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <small style={{ color:'#bbb', fontSize:'0.9rem' }}>Signed in as:</small>
          <select
            value={userId}
            onChange={e=>setUserId(e.target.value)}
            style={{
              background:'#222', color:'#fff', border:'1px solid #444',
              borderRadius:12, padding:'8px 10px', outline:'none', fontSize:'0.95rem'
            }}
          >
            {ALL_USERS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </header>
    </div>
  );
}

function SocketToasts(){
  const { userId } = useUser();
  const { show } = useToast();

  useEffect(() => {
    const s = getSocket();
    // join ONLY this user's room
    s.emit('join-user', userId);

    const handler = (n) => {
      const amount = n?.payload?.amount != null ? `₹${n.payload.amount}` : '';
      switch(n?.type){
        case 'outbid':
          show({ type:'outbid', title:'You were outbid', message:`Higher bid placed. ${amount}` });
          break;
        case 'counter':
          show({ type:'counter', title:'Seller countered', message:`New offer ${amount}` });
          break;
        case 'accepted':
          show({ type:'accepted', title:'Bid accepted', message:`Congrats! ${amount}` });
          break;
        case 'rejected':
          show({ type:'rejected', title:'Bid rejected', message:`Better luck next time.` });
          break;
        case 'counter_accepted':
          show({ type:'accepted', title:'Counter accepted', message:`Finalized at ${amount}` });
          break;
        default:
          show({ type:'info', title:'Notification', message:n?.payload?.message || '' });
      }
    };

    s.on('notify', handler);
    return () => s.off('notify', handler);
  }, [userId, show]);

  return null;
}

function AppShell(){
  return (
    <div style={{ background:'#fff', minHeight:'100vh' }}>
      <div style={{ fontFamily:'system-ui' }}>
        <div style={{ width:'90%', maxWidth:1200, margin:'0 auto', padding:'24px 0' }}>
          <Header/>
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/sell/new" element={<NewAuction/>} />
            <Route path="/auction/:id" element={<AuctionRoom/>} />
            <Route path="/seller" element={<SellerDesk/>} />
            <Route path="/notifications" element={<Notifications/>} />
          </Routes>
        </div>
      </div>
      <SocketToasts/>
    </div>
  );
}

export default function App(){
  return (
    <ToastProvider>
      <UserProvider>
        <AppShell/>
      </UserProvider>
    </ToastProvider>
  );
}
