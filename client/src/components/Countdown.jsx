import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';

export default function Countdown({ endAt, onDone }){
  const [left, setLeft] = useState(() => Math.max(0, dayjs(endAt).diff(dayjs(), 'second')));

  useEffect(() => {
    const t = setInterval(() => {
      const s = Math.max(0, dayjs(endAt).diff(dayjs(), 'second'));
      setLeft(s);
      if(s===0){ clearInterval(t); onDone?.(); }
    }, 1000);
    return () => clearInterval(t);
  }, [endAt]);

  const mm = String(Math.floor(left/60)).padStart(2,'0');
  const ss = String(left%60).padStart(2,'0');
  return <span>{mm}:{ss}</span>;
}