import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getAuction,
  placeBid,
  endAuctionNow,
  getCounter,
  respondCounter
} from '../api.js';
import { getSocket } from '../socket.js';
import Countdown from '../components/Countdown.jsx';
import { useUser } from '../user.jsx';
import { useToast } from '../components/Toast.jsx';

export default function AuctionRoom(){
  const { id } = useParams();
  const { userId } = useUser();
  const { show } = useToast();

  const [auction, setAuction] = useState(null);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [counter, setCounter] = useState(null); // { amount, sellerId, bidderId } | null

  // helper to reload both auction + counter
  const reload = async () => {
    const a = await getAuction(id);
    setAuction(a);
    const c = await getCounter(id);
    setCounter(c);
  };

  useEffect(() => {
    let mounted = true;
    (async()=> { if(mounted) await reload(); })();

    const s = getSocket();
    s.emit('join-auction', id);

    const onBid = (evt) => {
      if (evt.auctionId === id) {
        setAuction(a => a ? ({...a, highest: { amount: evt.amount, bidderId: evt.bidderId }}) : a);
      }
    };
    const onEnd = (evt) => {
      if (evt.auctionId === id) {
        setAuction(a => a ? ({...a, status: 'awaiting_seller'}) : a);
      }
    };
    const onNotify = async (n) => {
      if(n?.auctionId !== id) return;
      if(n?.type === 'counter'){
        show({ type:'counter', title:'Seller countered', message:`New amount ₹${n?.payload?.amount ?? ''}` });
        // pull latest persisted counter to avoid stale state
        const c = await getCounter(id);
        setCounter(c);
      }
      if(n?.type === 'accepted'){
        show({ type:'accepted', title:'Bid accepted', message:`₹${n?.payload?.amount ?? ''}` });
      }
      if(n?.type === 'rejected'){
        show({ type:'rejected', title:'Bid rejected' });
      }
    };

    s.on('bid:update', onBid);
    s.on('auction:ended', onEnd);
    s.on('notify', onNotify);

    return () => {
      mounted = false;
      s.off('bid:update', onBid);
      s.off('auction:ended', onEnd);
      s.off('notify', onNotify);
    };
  }, [id, show]);

  // ---- derived values (coerce numbers defensively) ----
  const startPrice = useMemo(() => Number(auction?.startPrice ?? 0), [auction]);
  const bidIncrement = useMemo(() => Number(auction?.bidIncrement ?? 0), [auction]);
  const current = useMemo(
    () => auction ? Number(auction.highest?.amount ?? startPrice) : 0,
    [auction, startPrice]
  );
  const minAllowed = useMemo(
    () => auction ? current + bidIncrement : 0,
    [auction, current, bidIncrement]
  );
  const live = auction?.status === 'live';
  const isSeller = auction?.sellerId === userId;
  const isTopBidder = auction?.highest?.bidderId === userId;

  const doBid = async () => {
    setStatus('');
    if(!auction) return;
    try{
      const val = Number(amount);
      if(!Number.isFinite(val)) return setStatus('Enter a valid amount');
      await placeBid(id, val, userId);
      setStatus('✅ Bid placed!');
      setAmount('');
    }catch(e){
      setStatus(e.response?.data?.error || e.message);
    }
  };

  const endNow = async () => {
    try{
      await endAuctionNow(id);
      await reload();
      setStatus('⏹️ Auction ended');
    }catch(e){
      setStatus(e.response?.data?.error || e.message);
    }
  };

  // Buyer actions on counter
  const acceptCounter = async () => {
    try{
      await respondCounter(id, 'accept', userId);
      show({ type:'accepted', title:'Counter accepted', message:`You accepted ₹${counter.amount}` });
      await reload();
    }catch(e){
      show({ type:'error', title:'Failed', message: e?.response?.data?.error || e.message });
    }
  };
  const rejectCounter = async () => {
    try{
      await respondCounter(id, 'reject', userId);
      show({ type:'rejected', title:'Counter rejected' });
      await reload();
    }catch(e){
      show({ type:'error', title:'Failed', message: e?.response?.data?.error || e.message });
    }
  };

  if(!auction) return <div style={{padding:16}}>Loading...</div>;

  const showCounterBar =
    !!counter && isTopBidder && (auction.status === 'awaiting_seller' || auction.status === 'closed');

  return (
    <div style={{ display:'flex', justifyContent:'center', padding:'24px 16px' }}>
      <div
        style={{
          width:'100%',
          maxWidth:680,
          background:'#fff',
          border:'1px solid #e5e7eb',
          borderRadius:16,
          boxShadow:'0 6px 24px rgba(0,0,0,.08)',
          overflow:'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding:'18px 20px', background:'#0b0b0b', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:14, opacity:.8 }}>AUCTION</div>
            <h2 style={{ margin:'4px 0 0', textTransform:'uppercase' }}>{auction.itemName}</h2>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12, opacity:.8 }}>Seller</div>
            <div style={{ fontWeight:600 }}>{auction.sellerId}</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:20, display:'grid', gap:16 }}>
          <p style={{ margin:0, color:'#374151' }}>{auction.description}</p>

          <div
            style={{
              display:'grid',
              gridTemplateColumns:'1fr 1fr',
              gap:12
            }}
          >
            <Stat label="Start Price" value={`₹${startPrice}`} />
            <Stat label="Increment" value={`₹${bidIncrement}`} />
            <Stat label="Current Highest" value={`₹${current}`} highlight />
            <Stat
              label="Status"
              value={
                live
                  ? <>LIVE •{' '}
                      <span style={{fontVariantNumeric:'tabular-nums'}}>
                        {/* key forces reset if endAt changes */}
                        <Countdown
                          key={auction.endAt}
                          endAt={auction.endAt}
                          onDone={() => {
                            setAuction(a => a ? ({...a, status:'awaiting_seller'}) : a);
                            show({ type:'info', title:'Auction ended', message:'Waiting for seller decision.' });
                          }}
                        />
                      </span>
                    </>
                  : auction.status
              }
            />
          </div>

          {/* Bid box */}
          <div
            style={{
              border:'1px solid #e5e7eb',
              borderRadius:12,
              padding:16,
              display:'grid',
              gap:12,
              background:'#f9fafb'
            }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700 }}>Place a Bid</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>Min Allowed: ₹{minAllowed}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10 }}>
              <input
                type="number"
                value={amount}
                onChange={e=>setAmount(e.target.value)}
                placeholder={`≥ ${minAllowed}`}
                disabled={!live}
                style={{
                  padding:'10px 12px',
                  borderRadius:10,
                  border:'1px solid #d1d5db',
                  outline:'none'
                }}
              />
              <button
                onClick={doBid}
                disabled={!live}
                style={{
                  padding:'10px 14px',
                  borderRadius:10,
                  border:'1px solid #111827',
                  background:'#111827',
                  color:'#fff',
                  cursor: live ? 'pointer' : 'not-allowed'
                }}
              >
                Bid Now
              </button>
            </div>
            {status && <div style={{ fontSize:13, color: status.startsWith('✅') ? '#065f46' : '#b91c1c' }}>{status}</div>}
          </div>

          {/* Buyer: Accept / Reject seller counter */}
          {showCounterBar && (
            <div
              style={{
                border:'1px solid #fde68a',
                background:'#fffbeb',
                borderRadius:12,
                padding:16,
                display:'grid',
                gap:10
              }}
            >
              <div style={{ fontWeight:800 }}>Seller Countered</div>
              <div>Seller proposes: <b>₹{counter.amount}</b></div>
              <div style={{ display:'flex', gap:10 }}>
                <button
                  onClick={acceptCounter}
                  style={{
                    padding:'10px 14px',
                    borderRadius:10,
                    border:'1px solid #16a34a',
                    background:'#16a34a',
                    color:'#fff',
                    cursor:'pointer'
                  }}
                >
                  Accept
                </button>
                <button
                  onClick={rejectCounter}
                  style={{
                    padding:'10px 14px',
                    borderRadius:10,
                    border:'1px solid #dc2626',
                    background:'#dc2626',
                    color:'#fff',
                    cursor:'pointer'
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Seller-only controls: show unless closed (so it's there in edge cases) */}
          {isSeller && auction.status !== 'closed' && (
            <div style={{ marginTop:4 }}>
              <button
                onClick={endNow}
                style={{
                  padding:'10px 14px',
                  borderRadius:10,
                  border:'1px solid #dc2626',
                  background:'#dc2626',
                  color:'#fff',
                  cursor:'pointer'
                }}
              >
                End Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }){
  return (
    <div style={{
      border:'1px solid #e5e7eb',
      borderRadius:12,
      padding:'12px 14px',
      background: highlight ? '#f0fdf4' : '#fff'
    }}>
      <div style={{ fontSize:12, color:'#6b7280' }}>{label}</div>
      <div style={{ fontWeight:700, marginTop:4 }}>{value}</div>
    </div>
  );
}
