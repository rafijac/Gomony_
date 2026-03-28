import { useState, useEffect } from 'react';

export function useBoardSizer(boardAreaRef: React.RefObject<HTMLDivElement>) {
  const [boardPx, setBoardPx] = useState(480);

  useEffect(() => {
    const el = boardAreaRef.current;
    if (!el) return;
    const P = 1100;
    const theta = 42 * Math.PI / 180;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      const topBuf = 48;  // space above board for tall stacks (kings)
      const botBuf = 140;  // space below: perspective overflow (~80px) + visible padding (~60px)
      const availH = height - topBuf - botBuf;
      const fromH = (availH * P) / (P * cosT + availH * sinT);
      const fromW = width * 0.97;
      setBoardPx(Math.max(200, Math.min(fromH, fromW)));
    };
    // @ts-ignore
    const ro = new (window.ResizeObserver || (globalThis as any).ResizeObserver)(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, [boardAreaRef]);

  return boardPx;
}
