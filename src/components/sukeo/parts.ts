/**
 * すけおの色と形の部品。
 * 輪郭線は SoftDefs のフィルターで「外側のシルエットだけ」に細く付けるので、
 * ここの形はすべて塗りだけ（線なし）で作る。
 */
export const C = {
  /** シルエットの細い線（あたたかい焦げ茶） */
  line: '#7B4420',
  /** 体の基本色 */
  body: '#E9A04E',
  /** 奥の脚など、少し暗い部分 */
  far: '#CF8A42',
  /** 背中側のくすみ（グラデーション） */
  dorsal: '#C97A35',
  /** お腹・のど */
  belly: '#F7DBA8',
  /** クレスト（まつげ・ふち飾り） */
  crest: '#F3B96E',
  /** 指先の吸盤 */
  pad: '#F5CF96',
  /** まだら模様 */
  blotch: '#A65E26',
  olive: '#8F7436',
  /** 明るい細かい点 */
  speckle: '#FCE4B6',
  /** 目のまわりのふち */
  lid: '#C77E3A',
  irisEdge: '#6B3F1F',
  irisMid: '#3A2010',
  irisCore: '#140B06',
  mouth: '#6B3517',
  mouthIn: '#8E3B2F',
  tongue: '#E98A80',
  sweat: '#BFE3F2',
} as const;

export type Pt = readonly [number, number];

const rad = (deg: number) => (deg * Math.PI) / 180;
export const f = (n: number) => Math.round(n * 10) / 10;

/** 塗りだけの形（clipPath にもそのまま使える） */
export type Shape =
  | { kind: 'path'; d: string }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rot?: number };

export const ellipse = (cx: number, cy: number, rx: number, ry: number, rot = 0): Shape => ({
  kind: 'ellipse',
  cx,
  cy,
  rx,
  ry,
  rot,
});
export const circle = (cx: number, cy: number, r: number): Shape => ({ kind: 'circle', cx, cy, r });
export const path = (d: string): Shape => ({ kind: 'path', d });

/** 角度の範囲を等間隔に分ける */
export function range(from: number, to: number, n: number) {
  return Array.from({ length: n }, (_, i) => from + ((to - from) * i) / (n - 1));
}

/** 点列をなめらかな曲線（Catmull-Rom）でたどった点を返す */
export function spline(points: Pt[], perSegment = 12): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) =>
        0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]!);
  return out;
}

/** 曲線上の点と、進む向きの単位ベクトル・法線 */
function frames(points: Pt[]) {
  const pts = spline(points);
  const lens = [0];
  for (let i = 1; i < pts.length; i++) {
    lens.push(lens[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]));
  }
  const total = lens[lens.length - 1]!;
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)]!;
    const b = pts[Math.min(pts.length - 1, i + 1)]!;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const tx = (b[0] - a[0]) / l;
    const ty = (b[1] - a[1]) / l;
    return { p, t: lens[i]! / total, tx, ty, nx: -ty, ny: tx };
  });
}

/**
 * 中心線 points に沿って、太さ w0（始点）→ w1（終点）へ変わる形。終点は丸くする。
 * しっぽ・手足・指に使う。
 */
export function taper(points: Pt[], w0: number, w1: number, curve = 1.1): Shape {
  return taperW(points, (t) => w0 + (w1 - w0) * Math.pow(t, curve));
}

/**
 * 太さを途中で変えられる版。widths は始点〜終点に等間隔で置く太さ（例：肩・ひじ・手首）。
 * 両端は丸くするので、体に重ねても付け根に切れ目が見えない。
 */
export function taperW(points: Pt[], widths: number[] | ((t: number) => number)): Shape {
  const width =
    typeof widths === 'function'
      ? widths
      : (t: number) => {
          const k = t * (widths.length - 1);
          const i = Math.min(widths.length - 2, Math.floor(k));
          const u = k - i;
          const s = u * u * (3 - 2 * u); // なめらかにつなぐ
          return widths[i]! + (widths[i + 1]! - widths[i]!) * s;
        };
  const fr = frames(points);
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (const { p, t, nx, ny } of fr) {
    const hw = width(t) / 2;
    left.push([p[0] + nx * hw, p[1] + ny * hw]);
    right.push([p[0] - nx * hw, p[1] - ny * hw]);
  }
  const r1 = width(1) / 2;
  const r0 = width(0) / 2;
  const L = left.map((p) => `${f(p[0])} ${f(p[1])}`);
  const R = right.reverse().map((p) => `${f(p[0])} ${f(p[1])}`);
  return path(`M${L.join(' L')} A${f(r1)} ${f(r1)} 0 0 0 ${R[0]} L${R.join(' L')} A${f(r0)} ${f(r0)} 0 0 0 ${L[0]} Z`);
}

/** 中心線の途中の点（0〜1）と、その向き（度） */
export function along(points: Pt[], t: number) {
  const fr = frames(points);
  const i = Math.min(fr.length - 1, Math.max(0, Math.round(t * (fr.length - 1))));
  const q = fr[i]!;
  return { x: q.p[0], y: q.p[1], deg: (Math.atan2(q.ty, q.tx) * 180) / Math.PI, nx: q.nx, ny: q.ny };
}

/**
 * 曲線に沿って並ぶ、うしろへなびく小さなトゲ（クレスト）。
 * side=1 で法線の向き、-1 で反対側に生える。
 */
export function spines(points: Pt[], count: number, len: number, w: number, side: 1 | -1 = 1, lean = 0.45): Shape[] {
  return Array.from({ length: count }, (_, i) => {
    const q = along(points, count === 1 ? 0.5 : i / (count - 1));
    const nx = q.nx * side;
    const ny = q.ny * side;
    const tx = Math.cos(rad(q.deg));
    const ty = Math.sin(rad(q.deg));
    const b1 = [q.x - tx * (w / 2) - nx, q.y - ty * (w / 2) - ny];
    const b2 = [q.x + tx * (w / 2) - nx, q.y + ty * (w / 2) - ny];
    // 先は少しうしろ（進行方向と逆）へなびかせる
    const tip = [q.x + nx * len - tx * len * lean, q.y + ny * len - ty * len * lean];
    return path(
      `M${f(b1[0]!)} ${f(b1[1]!)} Q ${f(q.x + nx * len * 0.55)} ${f(q.y + ny * len * 0.55)}, ${f(tip[0]!)} ${f(tip[1]!)} Q ${f(q.x + nx * len * 0.3 + tx * w * 0.2)} ${f(q.y + ny * len * 0.3 + ty * w * 0.2)}, ${f(b2[0]!)} ${f(b2[1]!)} Z`,
    );
  });
}

/** 円弧（中心・半径・角度の範囲）を点列にする。spines の土台に使う */
export function arc(cx: number, cy: number, r: number, from: number, to: number, n = 8): Pt[] {
  return range(from, to, n).map((a) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))] as const);
}

/**
 * 指：手のひら (x,y) から dirs の向きへ。先は吸盤で少し広がる。
 * shapes はシルエット用、pads は明るい吸盤の色を重ねる用。
 */
export function toes(x: number, y: number, dirs: number[], len = 10, w = 5) {
  const shapes: Shape[] = [];
  const pads: Shape[] = [];
  for (const a of dirs) {
    const ex = x + len * Math.cos(rad(a));
    const ey = y + len * Math.sin(rad(a));
    shapes.push(taper([[x, y], [x + len * 0.5 * Math.cos(rad(a)), y + len * 0.5 * Math.sin(rad(a))], [ex, ey]], w, w * 0.85));
    shapes.push(ellipse(f(ex), f(ey), w * 0.72, w * 0.6, a));
    pads.push(ellipse(f(ex), f(ey), w * 0.5, w * 0.42, a));
  }
  return { shapes, pads };
}

/** まだら模様のぶち：少しゆがんだ丸。seed で形を変える */
export function blob(x: number, y: number, rx: number, ry = rx * 0.75, rot = 0, seed = 1) {
  const n = 7;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n;
    const k = 0.78 + 0.22 * Math.abs(Math.sin(seed * 12.9898 + i * 78.233));
    const px = Math.cos(a) * rx * k;
    const py = Math.sin(a) * ry * k;
    const c = Math.cos(rad(rot));
    const s = Math.sin(rad(rot));
    return [x + px * c - py * s, y + px * s + py * c] as const;
  });
  const mid = (a: Pt, b: Pt) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as const;
  const first = mid(pts[n - 1]!, pts[0]!);
  let d = `M${f(first[0])} ${f(first[1])}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i]!;
    const m = mid(p, pts[(i + 1) % n]!);
    d += ` Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d + 'Z';
}

/** 決まった範囲に、決まった並びで散らす（毎回同じ結果になる疑似乱数） */
export function scatter(x0: number, y0: number, x1: number, y1: number, n: number, seed = 1) {
  let s = seed * 9301 + 49297;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: n }, () => ({ x: f(x0 + (x1 - x0) * rnd()), y: f(y0 + (y1 - y0) * rnd()), k: rnd() }));
}

/** ページ内で重ならない id（clipPath・filter・gradient 用） */
export const uid = () => `sk${Math.random().toString(36).slice(2, 8)}`;
