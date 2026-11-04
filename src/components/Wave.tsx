// A soft wave, drawn twice side by side so it can roll sideways forever
// (with the rx-wave / rx-wave-slow classes from globals.css).
const wave = (top: number, dip: number) =>
  `M0 ${top} C240 ${top - dip} 480 ${top - dip} 720 ${top} C960 ${top + dip} 1200 ${top + dip} 1440 ${top} ` +
  `C1680 ${top - dip} 1920 ${top - dip} 2160 ${top} C2400 ${top + dip} 2640 ${top + dip} 2880 ${top} V160 H0 Z`;

export function Wave({ fill, top, dip, className }: { fill: string; top: number; dip: number; className: string }) {
  return (
    <svg viewBox="0 0 2880 160" preserveAspectRatio="none" className={`absolute inset-y-0 left-0 w-[200%] h-full ${className}`} aria-hidden>
      <path d={wave(top, dip)} fill={fill} />
    </svg>
  );
}
