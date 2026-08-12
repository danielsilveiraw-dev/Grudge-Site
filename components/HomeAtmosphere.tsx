'use client';

import {
  useEffect,
  useState,
} from 'react';

export default function HomeAtmosphere() {
  const [mouse, setMouse] = useState({
    x: 50,
    y: 35,
  });

  useEffect(() => {
    function handleMouseMove(
      event: MouseEvent,
    ) {
      const x =
        (event.clientX /
          window.innerWidth) *
        100;

      const y =
        (event.clientY /
          window.innerHeight) *
        100;

      setMouse({
        x,
        y,
      });
    }

    window.addEventListener(
      'mousemove',
      handleMouseMove,
    );

    return () => {
      window.removeEventListener(
        'mousemove',
        handleMouseMove,
      );
    };
  }, []);

  const moveX =
    (mouse.x - 50) * 0.35;

  const moveY =
    (mouse.y - 50) * 0.25;

  return (
    <div className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden">
      {/* VINHETA */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(4,4,8,0.72)_100%)]" />

      {/* GLOW QUE SEGUE O MOUSE */}
      <div
        className="absolute h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-hot/[0.12] blur-[130px] transition-[left,top] duration-500 ease-out"
        style={{
          left: `${mouse.x}%`,
          top: `${mouse.y}%`,
        }}
      />

      {/* GLOW FIXO ESQUERDO */}
      <div className="absolute left-[-180px] top-[8%] h-[520px] w-[520px] rounded-full bg-accent-hot/[0.07] blur-[140px]" />

      {/* GLOW FIXO DIREITO */}
      <div className="absolute right-[-190px] top-[36%] h-[600px] w-[600px] rounded-full bg-accent-hot/[0.065] blur-[150px]" />

      {/* GLOW INFERIOR */}
      <div className="absolute bottom-[-280px] left-1/2 h-[600px] w-[950px] -translate-x-1/2 rounded-full bg-accent-hot/[0.055] blur-[180px]" />

      {/* GRUDGE LATERAL */}
      <div
        className="absolute left-[-80px] top-1/2 hidden -translate-y-1/2 -rotate-90 select-none 2xl:block"
        style={{
          marginTop:
            `${moveY * 0.6}px`,
        }}
      >
        <span className="font-display text-[6rem] uppercase tracking-[0.38em] text-text-main/[0.045]">
          GRUDGE
        </span>
      </div>

      {/* UNKNOWN LATERAL */}
      <div
        className="absolute right-[-125px] top-[58%] hidden rotate-90 select-none 2xl:block"
        style={{
          marginTop:
            `${-moveY * 0.5}px`,
        }}
      >
        <span className="font-display text-[5rem] uppercase tracking-[0.38em] text-accent-hot/[0.05]">
          UNKNOWN
        </span>
      </div>

      {/* PONTOS DE LUZ */}
      <div
        className="absolute hidden h-1.5 w-1.5 rounded-full bg-accent-hot/70 shadow-[0_0_18px_rgba(255,61,129,0.8)] xl:block"
        style={{
          left:
            `${18 + moveX * 0.015}%`,
          top:
            `${31 + moveY * 0.02}%`,
        }}
      />

      <div
        className="absolute hidden h-1 w-1 rounded-full bg-accent-hot/50 shadow-[0_0_15px_rgba(255,61,129,0.65)] xl:block"
        style={{
          right:
            `${15 - moveX * 0.012}%`,
          top:
            `${48 + moveY * 0.018}%`,
        }}
      />
    </div>
  );
}