import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8080',
});

export async function listAuctions(){
  const {data} = await api.get('/api/auctions');
  return data;
}

export async function createAuction(payload){
  const {data} = await api.post('/api/auctions', payload);
  return data;
}

export async function getAuction(id){
  const {data} = await api.get(`/api/auctions/${id}`);
  return data;
}

export async function placeBid(id, amount, bidderId){
  const {data} = await api.post(`/api/auctions/${id}/bids`, { amount, bidderId });
  return data;
}

export async function listAwaitingSeller(sellerId){
  const {data} = await api.get('/api/auctions', { params: { status: 'awaiting_seller', sellerId } });
  return data;
}

export async function sellerDecision(id, action, amount, actorId){
  const body = { action, actorId };
  if (action === 'counter') body.amount = amount;
  const {data} = await api.post(`/api/auctions/${id}/decision`, body);
  return data;
}

export async function listNotifications(userId){
  const {data} = await api.get('/api/notifications', { params: { userId } });
  return data;
}

export async function endAuctionNow(id){
  const { data } = await api.post(`/api/auctions/${id}/end-now`);
  return data;
}
export async function getCounter(id){
  const {data} = await api.get(`/api/auctions/${id}/counter`);
  return data; // null or { amount, sellerId, bidderId }
}

export async function respondCounter(id, action, bidderId){
  const {data} = await api.post(`/api/auctions/${id}/counter/decision`, { action, bidderId });
  return data;
}

