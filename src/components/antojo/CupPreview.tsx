"use client";

// The live cup on "Crea tu antojo". Drawn in SVG so every pick shows up
// instantly: the crema color, the specialty layer (pistachio, Biscoff), the
// toppings on the whipped cream and the drizzle across the top. Size scales
// the cup. Unknown toppings (new ones added in the dashboard) still show up
// as colored sprinkles.

export type CupLook = {
  /** "fresa-original" | "fresa-dubai" | "fresa-biscoff" */
  base: string;
  /** choice ids from the item's options */
  size: string;
  crema: string;
  drizzles: string[];
  toppings: string[];
};

const CREMA: Record<string, { fill: string; deep: string }> = {
  casa: { fill: "#fbf1e4", deep: "#f3e2cc" },
  chocolate: { fill: "#b07a62", deep: "#946049" },
  cafe: { fill: "#d6b08f", deep: "#c19672" },
};
const DRIZZLE: Record<string, string> = { nutella: "#5a3226", lechera: "#f4dcb1", pistacho: "#9cb86a", syrup: "#b5651d" };

// How each topping looks on the whipped cream
type Bit = { kind: "dot" | "chunk" | "slice" | "stick" | "lentil" | "shred"; colors: string[] };
const TOPPING: Record<string, Bit> = {
  mms: { kind: "lentil", colors: ["#e63946", "#2a9d8f", "#f4a261", "#3a86ff", "#ffbe0b", "#8338ec"] },
  almendras: { kind: "slice", colors: ["#e2c08d", "#d4a96a"] },
  granola: { kind: "chunk", colors: ["#b07a3c", "#c98e48", "#8f5f2a"] },
  oreo: { kind: "chunk", colors: ["#2b1d1a", "#3a2a26", "#f7f1ea"] },
  kitkat: { kind: "stick", colors: ["#7b4a2e", "#d9a066"] },
  "chocolate-chips": { kind: "dot", colors: ["#4a2a20", "#5c3426"] },
  coco: { kind: "shred", colors: ["#ffffff", "#f6efe6"] },
  biscoff: { kind: "chunk", colors: ["#c27b3a", "#a8652a", "#d89552"] },
};
const fallbackColors = ["#e8506a", "#f48a9a", "#ffd166", "#7bdff2"];

// Fixed scatter spots on the whipped-cream dome (x, y), so toppings don't jump around
const SPOTS = [
  [-66, 0], [-48, -14], [-28, -26], [-8, -36], [14, -34], [36, -24], [58, -10], [-56, 10], [-34, -2], [-12, -12],
  [10, -10], [32, 0], [62, 8], [-20, 10], [2, 12], [24, 12], [-40, -40], [44, -44], [-2, -56], [22, -54],
  [-22, -50], [62, -30], [-62, -22], [6, -24],
];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function ToppingBits({ id, slot }: { id: string; slot: number }) {
  const t = TOPPING[id] ?? { kind: "dot" as const, colors: [fallbackColors[hash(id) % fallbackColors.length]] };
  return (
    <g className="rx-pop" style={{ animationDelay: `${slot * 40}ms` }}>
      {Array.from({ length: 9 }, (_, i) => {
        const [x, y] = SPOTS[(i * 3 + slot * 7) % SPOTS.length];
        const jx = ((hash(id + i) % 9) - 4) * 1.4;
        const jy = ((hash(i + id) % 7) - 3) * 1.2;
        const color = t.colors[i % t.colors.length];
        const rot = hash(id + "r" + i) % 180;
        const at = `translate(${160 + x + jx} ${86 + y + jy}) rotate(${rot}) scale(1.35)`;
        switch (t.kind) {
          case "lentil":
            return <ellipse key={i} transform={at} rx="4.6" ry="3.4" fill={color} stroke="#0002" strokeWidth=".6" />;
          case "slice":
            return <ellipse key={i} transform={at} rx="6" ry="2.6" fill={color} stroke="#b88b55" strokeWidth=".6" />;
          case "chunk":
            return <path key={i} transform={at} d="M-4 -3 L3 -4 L5 2 L0 5 L-5 2 Z" fill={color} />;
          case "stick":
            return (
              <g key={i} transform={at}>
                <rect x="-7" y="-2.4" width="14" height="4.8" rx="1.2" fill={color} />
                <rect x="-6" y="-1" width="12" height="1.2" fill={t.colors[1]} opacity=".8" />
              </g>
            );
          case "shred":
            return <path key={i} transform={at} d="M-5 0 Q0 -2.5 5 0" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />;
          default:
            return <path key={i} transform={at} d="M0 -4 Q3.5 2 0 3.5 Q-3.5 2 0 -4Z" fill={color} />;
        }
      })}
    </g>
  );
}

/** A strawberry half pressed against the cup wall, like the real cups */
function BerrySlice({ x, y, r = 19, flip = false }: { x: number; y: number; r?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) ${flip ? "scale(-1 1)" : ""}`}>
      <path d={`M0 ${-r} C${r * 0.95} ${-r} ${r} ${r * 0.2} 0 ${r * 1.05} C${-r} ${r * 0.2} ${-r * 0.95} ${-r} 0 ${-r}Z`} fill="#e23d52" />
      <path d={`M0 ${-r * 0.7} C${r * 0.6} ${-r * 0.7} ${r * 0.62} ${r * 0.15} 0 ${r * 0.7} C${-r * 0.62} ${r * 0.15} ${-r * 0.6} ${-r * 0.7} 0 ${-r * 0.7}Z`} fill="#ff8a9a" />
      <path d={`M0 ${-r * 0.55} L0 ${r * 0.5}`} stroke="#ffd1d8" strokeWidth="2" />
      {[-0.35, 0.35].map((dx) => [-0.2, 0.2].map((dy) => <circle key={`${dx}${dy}`} cx={r * dx} cy={r * dy} r="1" fill="#ffe7a3" />))}
    </g>
  );
}

export function CupPreview({ look, label }: { look: CupLook; label: string }) {
  const crema = CREMA[look.crema] ?? CREMA.casa;
  const big = look.size.startsWith("16");
  const dubai = look.base === "fresa-dubai";
  const biscoff = look.base === "fresa-biscoff";

  return (
    <svg viewBox="0 -24 320 404" role="img" aria-label={label} className="w-full h-auto">
      <defs>
        <clipPath id="rx-cup-inside">
          <path d="M78 112 H242 L222 330 Q160 346 98 330 Z" />
        </clipPath>
        <linearGradient id="rx-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".18" stopColor="#fff" stopOpacity=".05" />
          <stop offset=".82" stopColor="#fff" stopOpacity=".05" />
          <stop offset="1" stopColor="#fff" stopOpacity=".45" />
        </linearGradient>
        <radialGradient id="rx-whip" cx=".4" cy=".35" r=".8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f6e9e2" />
        </radialGradient>
      </defs>

      {/* shadow */}
      <ellipse cx="160" cy="352" rx={big ? 112 : 98} ry="12" fill="#c98b8f" opacity=".25" className="rx-ease" />

      <g className="rx-ease" style={{ transform: `scale(${big ? 1 : 0.88})`, transformOrigin: "160px 345px" }}>
        {/* What's inside, clipped to the cup */}
        <g clipPath="url(#rx-cup-inside)">
          <rect x="60" y="100" width="200" height="260" fill={crema.fill} className="rx-ease" />
          {/* crema swirls */}
          {[150, 205, 262].map((y) => (
            <path key={y} d={`M70 ${y} Q115 ${y - 14} 160 ${y} T250 ${y}`} stroke={crema.deep} strokeWidth="7" fill="none" opacity=".55" className="rx-ease" />
          ))}
          {/* specialty layers */}
          {dubai && (
            <g className="rx-fade">
              <path d="M70 186 Q120 168 160 188 T252 182 L252 204 Q205 190 160 210 T70 206Z" fill="#9cb86a" />
              <path d="M70 250 Q115 236 160 254 T252 246" stroke="#5a3226" strokeWidth="9" fill="none" />
              <path d="M70 296 Q120 282 160 300 T252 292" stroke="#9cb86a" strokeWidth="10" fill="none" />
            </g>
          )}
          {biscoff && (
            <g className="rx-fade">
              <path d="M70 190 Q120 174 160 192 T252 186 L252 208 Q205 196 160 214 T70 210Z" fill="#c27b3a" />
              <path d="M70 282 Q120 266 160 286 T252 278 L252 298 Q205 286 160 304 T70 300Z" fill="#a8652a" />
              {[[100, 196], [150, 200], [205, 194], [125, 290], [185, 288]].map(([x, y]) => (
                <path key={`${x}${y}`} transform={`translate(${x} ${y})`} d="M-5 -3 L4 -4 L6 2 L0 5 L-6 2 Z" fill="#8f5a24" />
              ))}
            </g>
          )}
          {/* strawberry halves on the cup wall */}
          {[
            [100, 150], [160, 140, true], [220, 152], [96, 222, true], [128, 206], [196, 214], [226, 226, true], [104, 300], [160, 312, true], [214, 298],
          ].map(([x, y, f]) => (
            <BerrySlice key={`${x}-${y}`} x={x as number} y={y as number} flip={!!f} />
          ))}
        </g>

        {/* the clear cup */}
        <path d="M74 108 H246 L224 334 Q160 352 96 334 Z" fill="url(#rx-glass)" stroke="#e7c9c9" strokeWidth="3" />
        <rect x="70" y="100" width="180" height="12" rx="6" fill="#fff" stroke="#e7c9c9" strokeWidth="2" opacity=".9" />

        {/* R&X sticker */}
        <g transform="translate(160 258)">
          <circle r="30" fill="#fff8f2" stroke="#e8506a" strokeWidth="2.5" />
          <circle r="25" fill="none" stroke="#7fb069" strokeWidth="1.5" strokeDasharray="3 3" />
          <text y="2" textAnchor="middle" fontFamily="var(--font-script), cursive" fontSize="17" fill="#e8506a">R&amp;X</text>
          <text y="14" textAnchor="middle" fontFamily="system-ui" fontSize="6" fontWeight="700" fill="#4a1d24" letterSpacing=".5">FRESAS</text>
        </g>

        {/* whipped cream dome */}
        <path
          d="M70 108 Q58 84 82 72 Q80 46 110 44 Q116 18 148 24 Q164 2 190 18 Q220 12 224 42 Q254 44 250 72 Q266 88 250 108 Z"
          fill="url(#rx-whip)"
          stroke="#efdcd3"
          strokeWidth="2"
        />
        {dubai && <path d="M96 56 Q130 40 166 52 T232 56" stroke="#9cb86a" strokeWidth="6" fill="none" strokeLinecap="round" className="rx-fade" />}

        {/* drizzles draw themselves across the top */}
        {look.drizzles.map((d, i) => (
          <path
            key={d}
            d={i === 0 ? "M78 78 Q100 54 122 80 T164 66 T206 76 T246 66" : "M74 98 Q98 76 122 98 T168 90 T214 98 T248 90"}
            stroke={DRIZZLE[d] ?? "#b5651d"}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            className="rx-draw"
          />
        ))}

        {/* toppings */}
        {look.toppings.map((t, i) => (
          <ToppingBits key={t} id={t} slot={i} />
        ))}

        {/* a whole strawberry on top */}
        <g transform="translate(176 14) rotate(12) scale(1.2)">
          <path d="M0 -14 C14 -14 16 4 0 18 C-16 4 -14 -14 0 -14Z" fill="#e23d52" />
          <path d="M-9 -13 L-3 -18 L0 -13 L4 -19 L9 -13 L4 -11 L0 -15 L-4 -11Z" fill="#4f9d4a" />
          {[[-5, -4], [4, -6], [-2, 4], [5, 3], [0, 10]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1" fill="#ffe7a3" />
          ))}
        </g>
      </g>
    </svg>
  );
}
