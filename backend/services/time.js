export function isAuctionLive(goLiveAt, durationMins) {
  const start = new Date(goLiveAt).getTime();
  const end = start + durationMins * 60_000;
  const t = Date.now();
  return t >= start && t <= end;
}
export function endTime(goLiveAt, durationMins) {
  return new Date(new Date(goLiveAt).getTime() + durationMins * 60_000);
}
