/**
 * トップページの演出。
 * - いつでも：進み具合（0〜n）と前へ／次への更新、オープニングを2回目以降は出さない
 * - 動きを減らす設定でないときだけ（html.motion）：
 *   なめらかスクロール（Lenis）、背景の入れかえ、シーン間をすけおが歩いて移動、
 *   文字が順に現れる、スクショがスクロールに合わせて切り替わる・視差で動く
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { blink, climb, reducedMotion, sleep, wagTail, wake, walkCycle, wave } from './sukeo';

const html = document.documentElement;
const sections = [...document.querySelectorAll<HTMLElement>('.scene')];
const INTRO_KEY = 'sukeo-intro-seen';

/** sessionStorage が使えない環境（プライベートモードなど）でも止まらないようにする */
const storage = {
  get(key: string) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      /* 使えなくても演出が毎回出るだけ */
    }
  },
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

// ---------------------------------------------------------------------------
// 進み具合と前へ／次へ（JS があれば常に動く）
// ---------------------------------------------------------------------------
const dots = [...document.querySelectorAll<HTMLAnchorElement>('[data-dot]')];
const prev = document.querySelector<HTMLAnchorElement>('[data-prev]');
const next = document.querySelector<HTMLAnchorElement>('[data-next]');
let current = -1;

function setCurrent(i: number) {
  if (i === current || i < 0 || i >= sections.length) return;
  current = i;
  dots.forEach((d, k) => (k === i ? d.setAttribute('aria-current', 'step') : d.removeAttribute('aria-current')));
  const last = sections.length - 1;
  if (prev) {
    prev.href = `#scene-${Math.max(0, i - 1)}`;
    prev.setAttribute('aria-disabled', String(i === 0));
  }
  if (next) {
    next.href = `#scene-${Math.min(last, i + 1)}`;
    next.setAttribute('aria-disabled', String(i === last));
  }
  html.dataset.scene = sections[i]?.dataset.scene ?? 'wall';
}

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) if (e.isIntersecting) setCurrent(Number((e.target as HTMLElement).dataset.index));
  },
  { rootMargin: '-50% 0px -50% 0px' },
);
sections.forEach((s) => io.observe(s));
setCurrent(0);

// ---------------------------------------------------------------------------
// オープニング：最初のシーンで、すけおが目を覚まして壁をのぼり、サイト名が1文字ずつ現れる（2秒以内）。
// 2回目以降（同じタブで開き直したとき）は、出来上がった状態ですぐ見せる。
// ---------------------------------------------------------------------------
const introSeen = storage.get(INTRO_KEY) === '1';
storage.set(INTRO_KEY, '1');
const motion = !reducedMotion();

// ---------------------------------------------------------------------------
// 演出（動きを減らす設定のときは何もしない）
// ---------------------------------------------------------------------------
if (motion) {
  html.classList.add('motion');
  gsap.registerPlugin(ScrollTrigger);

  // なめらかスクロール。ページ内リンク（#scene-n）も Lenis で動かす
  const lenis = new Lenis({ anchors: true, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.addEventListener('menu:open', () => lenis.stop());
  document.addEventListener('menu:close', () => lenis.start());

  // 背景を1か所に集める（重ねて、スクロールに合わせて入れかえる）
  const stage = document.querySelector<HTMLElement>('[data-stage]');
  const arts = sections.map((s) => s.querySelector<HTMLElement>('[data-art]'));
  arts.forEach((a, i) => {
    if (!a || !stage) return;
    stage.append(a);
    a.style.opacity = i === 0 ? '1' : '0';
    a.style.visibility = i === 0 ? 'visible' : 'hidden';
  });

  // PC では、背景の絵の真ん中あたりを見せる（スマホでは床が見えるよう下をそろえる）
  const wide = window.matchMedia('(min-width: 960px)');
  const fitArt = () =>
    document.querySelectorAll('.scene-bg').forEach((svg) => svg.setAttribute('preserveAspectRatio', wide.matches ? 'xMidYMid slice' : 'xMidYMax slice'));
  fitArt();
  wide.addEventListener('change', () => {
    fitArt();
    ScrollTrigger.refresh();
  });

  // まばたき・しっぽ：画面に見えているすけおだけ動かす（見えないところで描き直し続けないように）
  const loops = new Map<Element, gsap.core.Animation[]>();
  document.querySelectorAll('.sukeo').forEach((svg) => {
    const list = [blink(svg), svg.matches('.talker-svg, .relax-svg') ? wagTail(svg, 5) : null].filter(
      (a): a is gsap.core.Timeline | gsap.core.Tween => a !== null,
    );
    list.forEach((a) => a.pause());
    if (list.length) loops.set(svg, list);
  });
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) loops.get(e.target)?.forEach((a) => (e.isIntersecting ? a.resume() : a.pause()));
  });
  loops.forEach((_, svg) => seen.observe(svg));

  // 文字が順に現れる
  const revealed = new Set<HTMLElement>();
  function reveal(section: HTMLElement) {
    if (revealed.has(section)) return;
    revealed.add(section);
    let d = 0;
    section.querySelectorAll<HTMLElement>('.ch').forEach((ch) => {
      ch.style.setProperty('--d', `${d}s`);
      d += 0.035;
    });
    d = Math.min(d, 0.5);
    section.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
      el.style.setProperty('--d', `${d}s`);
      d += 0.12;
    });
    section.classList.add('is-revealed');
  }

  // スクショが多いシーンは、そのぶん長くスクロールして、スクショを1枚ずつ見せる
  sections.forEach((s) => {
    const shots = Number(s.dataset.shots ?? 0);
    if (shots > 1) s.style.height = `calc(100svh + ${(shots - 1) * 32}svh)`;
  });
  sections.forEach((s) => {
    const phone = s.querySelector<HTMLElement>('[data-phone]');
    if (!phone) return;
    const imgs = [...phone.querySelectorAll<HTMLElement>('[data-shot]')];
    if (imgs.length > 1) {
      ScrollTrigger.create({
        trigger: s,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const k = Math.min(imgs.length - 1, Math.floor(self.progress * imgs.length));
          imgs.forEach((img, j) => img.classList.toggle('is-on', j === k));
        },
      });
    }
    // 視差：スマホの枠が、スクロールより少しゆっくり動く
    gsap.fromTo(phone, { y: 40 }, { y: -40, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ------- シーン間を歩くすけお -------
  const walkerBox = document.querySelector<HTMLElement>('[data-walker]');
  const walkerSvg = walkerBox?.querySelector<SVGSVGElement>('svg');
  const cycle = walkerSvg ? walkCycle(walkerSvg) : null;
  const stands = sections.map((s) => s.querySelector<HTMLElement>('[data-stand]'));
  const waved = new Set<number>();

  /** 落ち着いたときの、すけおの位置（画面の左端からの x と、下端からの高さ）と幅 */
  const spot = (i: number) => {
    const stand = stands[i];
    const inner = sections[i]?.querySelector<HTMLElement>('.scene-inner');
    if (!stand || !inner) return null;
    const r = stand.getBoundingClientRect();
    const ir = inner.getBoundingClientRect();
    return { x: r.left - ir.left, bottom: ir.bottom - r.bottom, width: r.width };
  };

  /**
   * シーン i へ入っていくときの進み具合（0〜1）。i=0 は使わない。
   * シーンは画面1つぶん以上の高さがあるので、同時に動いている切り替えは1つだけ。
   */
  const P: number[] = sections.map((_, i) => (i === 0 ? 1 : 0));
  let spots = sections.map((_, i) => spot(i));

  /** すべての切り替えの進み具合から、背景・すけお・歩くすけおの状態をまとめて決める */
  function render() {
    // 背景：後ろのシーンほど上に重なっているので、入ってくる側の濃さだけ決めればよい
    arts.forEach((art, i) => {
      if (!art) return;
      const o = i === 0 ? 1 : range(P[i]!, 0.38, 0.62);
      art.style.opacity = String(o);
      // 完全に消えている背景は描かない（上に重なった背景で完全に隠れているものも）
      const covered = i + 1 < arts.length && range(P[i + 1]!, 0.38, 0.62) >= 1;
      art.style.visibility = o > 0 && !covered ? 'visible' : 'hidden';
    });

    // 各シーンのすけお：歩いてきて着いたら出し、次のシーンへ出発したら消す（0 壁のすけおは上へ登っていく）
    stands.forEach((st, i) => {
      if (!st || i === 0) return;
      const arrived = range(P[i]!, 0.95, 1);
      const left = i + 1 < sections.length ? 1 - range(P[i + 1]!, 0, 0.06) : 1;
      st.style.opacity = String(arrived * left);
    });

    // 歩くすけお：いま動いている切り替えがあるときだけ出す
    if (!walkerBox || !cycle) return;
    const k = P.findIndex((p, i) => i > 0 && p > 0 && p < 1);
    if (k < 0) {
      walkerBox.style.opacity = '0';
      return;
    }
    const p = P[k]!;
    const a = k - 1 > 0 ? spots[k - 1] : null; // 0 壁からは、画面の外から歩きはじめる
    const b = spots[k];
    const vw = window.innerWidth;
    walkerBox.style.width = `${Math.max(150, (b?.width ?? a?.width ?? 200) * 1.15)}px`;
    const ww = walkerBox.offsetWidth;

    let x: number;
    let bottom: number;
    let visible: number;
    if (p < 0.5) {
      // 前のシーンから、右へ歩いて出ていく
      const startX = a ? a.x : -ww;
      x = startX + (vw + 20 - startX) * range(p, a ? 0.03 : 0.08, 0.42);
      bottom = a ? a.bottom : (b?.bottom ?? 16);
      visible = a ? range(p, 0, 0.04) : range(p, 0.08, 0.12);
    } else {
      // 左から、次のシーンのすけおの場所まで歩いてくる
      const endX = b ? b.x : vw * 0.1;
      x = -ww + (endX + ww) * range(p, 0.56, 0.94);
      bottom = b ? b.bottom : 16;
      visible = range(p, 0.55, 0.56) * (1 - range(p, 0.95, 1));
    }
    walkerBox.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    walkerBox.style.bottom = `${bottom.toFixed(1)}px`;
    walkerBox.style.opacity = String(visible);
    cycle.progress((p * 16) % 1);
  }

  for (let i = 1; i < sections.length; i++) {
    ScrollTrigger.create({
      trigger: sections[i]!,
      start: 'top bottom',
      end: 'top top',
      onRefresh: (self) => {
        // 位置の測りなおしと描きなおしは、全部の再計算が終わったあとに1回だけ（下の refresh）
        P[i] = self.progress;
        if (self.progress >= 0.97) reveal(sections[i]!);
      },
      onUpdate: (self) => {
        P[i] = self.progress;
        render();
        if (self.progress >= 0.97) {
          reveal(sections[i]!);
          // 着いたら手を振る（しゃべるポーズのとき）
          if (!waved.has(i)) {
            waved.add(i);
            const svg = stands[i]?.querySelector('svg');
            if (svg?.matches('.sukeo--talk')) wave(svg);
          }
        } else if (self.progress < 0.02) {
          waved.delete(i);
        }
      },
    });
  }

  // 0 壁：オープニングのあと、すけおが目を覚まして少しのぼる。スクロールすると上へ登っていく
  const wall = document.querySelector<HTMLElement>('[data-wall]');
  const wallSvg = wall?.querySelector('svg');
  if (introSeen) {
    // 2回目以降：演出なしで、出来上がった状態にする
    html.classList.add('instant');
    reveal(sections[0]!);
    requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove('instant')));
  } else {
    if (wallSvg) {
      sleep(wallSvg);
      gsap.timeline({ delay: 0.35 }).add(wake(wallSvg)).add(climb(wallSvg, 14, 1), '+=0.1');
    }
    reveal(sections[0]!);
  }
  // ページの途中で開いたときは、その場所のシーンの文字も出しておく
  if (current > 0) reveal(sections[current]!);
  if (wall) {
    gsap.to(wall, {
      yPercent: -120,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: sections[0]!, start: 'top top', end: 'bottom 30%', scrub: true },
    });
  }

  // 画面の大きさが変わるなどして位置を計算しなおしたら、すけおの位置を測りなおして1回だけ描く
  ScrollTrigger.addEventListener('refresh', () => {
    spots = sections.map((_, j) => spot(j));
    render();
  });
}
