'use client';

import { useEffect, useRef, useCallback } from 'react';

const SPRITE_SRC = '/game404character.png';
/** Oyunçu sıçrayışı — max hündürlük hesabı ilə eyni olmalıdır */
const JUMP_IMPULSE = 11.25;
/** Sıçrayış hündürlüyü +15% */
const JUMP_HEIGHT_MULT = 1.15;
const SPEED_START = 2.95;
/** Üst hədd bir az aşağı — addım-addım çatılır */
const SPEED_MAX = 10.4;
/** Hər bu qədər maneə spawn olandan sonra +SPEED_BUMP (yavaş, pilləli artım) */
const OBSTACLES_PER_SPEED_STEP = 5;
const SPEED_BUMP = 0.26;

/** Səma + statik bulud mövqeləri (en/hündürlüyə görə faiz) */
const CLOUD_LAYOUT = [
  { px: 0.06, py: 0.12, sc: 1.05, a: 0.95 },
  { px: 0.28, py: 0.08, sc: 0.78, a: 0.88 },
  { px: 0.52, py: 0.14, sc: 1.12, a: 0.92 },
  { px: 0.72, py: 0.06, sc: 0.72, a: 0.85 },
  { px: 0.88, py: 0.16, sc: 0.95, a: 0.9 },
  { px: 0.18, py: 0.22, sc: 0.65, a: 0.8 },
  { px: 0.42, py: 0.04, sc: 0.55, a: 0.75 },
  { px: 0.62, py: 0.2, sc: 0.7, a: 0.82 },
];

/**
 * Canvas runner: sprite, statik buludlu səma, bina maneələri.
 */
export default function NotFoundGame() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef(null);
  const spriteRef = useRef({ img: null, ready: false, nw: 0, nh: 0 });

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.gameOver) return;
    if (s.player.onGround) {
      s.player.vy = -JUMP_IMPULSE * JUMP_HEIGHT_MULT * s.jumpMul;
      s.player.onGround = false;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    const computeLayout = () => {
      const pad = 16;
      const inner = typeof window !== 'undefined' ? window.innerWidth : 400;
      const cssW = Math.min(920, Math.max(300, inner - pad * 2));
      const cssH = Math.min(340, Math.max(210, Math.round(cssW * 0.42)));
      const groundY = cssH - Math.round(Math.min(52, cssH * 0.14));
      const playerH = Math.round(Math.min(58, Math.max(46, cssH * 0.17)));
      const playerW = Math.round(playerH * 0.72);
      return { cssW, cssH, groundY, playerH, playerW };
    };

    let layout = computeLayout();

    const applySize = (L) => {
      const { cssW, cssH, groundY, playerH, playerW } = L;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = `${cssW}px`;
      canvas.style.maxWidth = 'min(920px, calc(100vw - 32px))';
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const s = stateRef.current;
      if (s) {
        const prevGround = s.groundY;
        s.w = cssW;
        s.h = cssH;
        s.groundY = groundY;
        s.player.w = playerW;
        s.player.h = playerH;
        s.jumpMul = Math.min(1.08, cssH / 220);
        if (prevGround !== groundY) {
          s.player.y = groundY - s.player.h;
        } else {
          s.player.y = Math.min(s.player.y, groundY - s.player.h);
        }
      }
    };

    applySize(layout);

    const state = {
      w: layout.cssW,
      h: layout.cssH,
      groundY: layout.groundY,
      score: 0,
      best: 0,
      gameOver: false,
      player: {
        x: 64,
        y: layout.groundY - layout.playerH,
        w: layout.playerW,
        h: layout.playerH,
        vy: 0,
        onGround: true,
      },
      jumpMul: Math.min(1.08, layout.cssH / 220),
      obstacles: [],
      coins: [],
      nextObs: 100,
      nextCoin: 140,
      coinStreak: 0,
      /** spawn olunan bina sayı — sürət pillələri üçün */
      spawnedObstacles: 0,
    };

    try {
      state.best = Number(localStorage.getItem('ev404best') || '0') || 0;
    } catch {
      state.best = 0;
    }
    stateRef.current = state;

    const img = new Image();
    img.decoding = 'async';
    img.src = SPRITE_SRC;
    img.onload = () => {
      spriteRef.current = {
        img,
        ready: true,
        nw: img.naturalWidth,
        nh: img.naturalHeight,
      };
    };
    img.onerror = () => {
      spriteRef.current = { img: null, ready: false, nw: 0, nh: 0 };
    };

    /** Qalxış — əvvəlki tək cazibəyə yaxın; eniş daha yavaş (platformer hissi) */
    const GRAVITY_UP = 0.5;
    const GRAVITY_DOWN = 0.36;

    const stepGravity = (vy) => (vy < 0 ? GRAVITY_UP : GRAVITY_DOWN);

    /**
     * Ayaqların torpaqdan maksimum nə qədər yuxarı qalxa biləcəyi (px) — spawn hündürlüyü bu dəyərdən aşağı olmalıdır.
     * Oyun döngüsü ilə eyni: vy += g(vy), y += vy, torpaq şərti.
     */
    function computeMaxFeetClearancePx(jumpMul, ph, groundY) {
      let vy = -JUMP_IMPULSE * JUMP_HEIGHT_MULT * jumpMul;
      let y = groundY - ph;
      let best = 0;
      for (let i = 0; i < 500; i++) {
        vy += stepGravity(vy);
        y += vy;
        if (y + ph >= groundY) break;
        const feet = y + ph;
        best = Math.max(best, groundY - feet);
      }
      return best;
    }

    const speedFromSpawnCount = (spawned) => {
      const steps = Math.max(0, Math.floor((spawned - 1) / OBSTACLES_PER_SPEED_STEP));
      return Math.min(SPEED_MAX, SPEED_START + steps * SPEED_BUMP);
    };

    const rectHit = (a, b) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    /** Statik bulud — bir neçə dairə ilə “puff” forması */
    function drawCloudPuff(cx, cy, scale) {
      const base = 14 * scale;
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      const circles = [
        [0, 0, base * 1.05],
        [-base * 1.15, base * 0.15, base * 0.85],
        [base * 1.05, base * 0.2, base * 0.9],
        [-base * 0.55, -base * 0.35, base * 0.75],
        [base * 0.65, -base * 0.25, base * 0.7],
        [0, base * 0.45, base * 0.95],
      ];
      for (const [dx, dy, r] of circles) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawStaticSky(s) {
      const skyH = s.groundY - 2;
      const g = ctx.createLinearGradient(0, 0, 0, skyH);
      g.addColorStop(0, '#7dd3fc');
      g.addColorStop(0.45, '#bae6fd');
      g.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s.w, skyH);

      for (const c of CLOUD_LAYOUT) {
        const cx = s.w * c.px;
        const cy = skyH * c.py;
        ctx.save();
        ctx.globalAlpha = c.a;
        drawCloudPuff(cx, cy, c.sc * Math.min(1.15, s.w / 400));
        ctx.restore();
      }
    }

    /** Bina silueti: dam, fasad şəbəkəsi, pəncərələr, bəzən antena (hitbox tam hündürlükdə) */
    function drawBuilding(o) {
      const { x, y, w, h, spireH, bodyH } = o;
      const roofH = Math.min(8, Math.max(4, Math.floor(bodyH * 0.1)));
      const topBody = y + spireH;

      if (spireH > 0) {
        ctx.fillStyle = o.roof;
        ctx.fillRect(x + w * 0.38, y, w * 0.24, spireH);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x + w * 0.46, y - 3, w * 0.08, 4);
      }

      ctx.fillStyle = o.facade;
      ctx.fillRect(x, topBody + roofH, w, bodyH - roofH);

      ctx.fillStyle = o.roof;
      ctx.fillRect(x, topBody, w, roofH);

      ctx.strokeStyle = 'rgba(15,23,42,0.14)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, topBody + 0.5, w - 1, bodyH - 1);

      const pad = Math.max(3, Math.floor(w * 0.12));
      const innerW = w - pad * 2;
      const innerTop = topBody + roofH + 5;
      const innerBot = topBody + bodyH - 5;
      const cellH = 11;
      const rows = Math.max(1, Math.floor((innerBot - innerTop) / (cellH + 4)));
      const cols = Math.max(1, Math.floor(innerW / 10));
      const cellW = innerW / cols;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const wx = x + pad + col * cellW + 2;
          const wy = innerTop + row * (cellH + 4);
          const idx = row * cols + col;
          const lit = idx < o.lights.length ? o.lights[idx] : false;
          ctx.fillStyle = lit ? '#fef9c3' : 'rgba(30,41,59,0.38)';
          ctx.fillRect(wx, wy, cellW - 4, cellH);
          if (lit) {
            ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
            ctx.fillRect(wx, wy, cellW - 4, 2);
          }
        }
      }
    }

    function spawnBuilding(s) {
      const maxClear = computeMaxFeetClearancePx(s.jumpMul, s.player.h, s.groundY);
      /** Həmişə maxClear-dan aşağı — kiçik ekranda da ayaq zirvədə binanın üstündən keçir */
      const maxTotalH = Math.min(
        92,
        Math.floor(maxClear * 0.92),
        Math.max(18, Math.floor(maxClear - 3)),
      );

      const w = 28 + Math.random() * 24;
      const variant = Math.floor(Math.random() * 3);

      const bodyLo = Math.min(26, maxTotalH);
      let bodyH = bodyLo + Math.random() * Math.max(0, maxTotalH - bodyLo);
      let spireH = 0;
      if (maxTotalH - bodyH >= 10 && bodyH > 38 && variant === 2) {
        spireH = Math.min(6 + Math.random() * 10, maxTotalH - bodyH);
      }
      let totalH = bodyH + spireH;
      if (totalH > maxTotalH) {
        spireH = Math.max(0, maxTotalH - bodyH);
        totalH = bodyH + spireH;
      }

      const cols = Math.max(2, Math.floor((w - 16) / 10));
      const rows = Math.max(2, Math.floor((bodyH - 24) / 15));
      const lights = [];
      for (let i = 0; i < cols * rows; i++) {
        lights.push(Math.random() > 0.38);
      }
      const facades = ['#64748b', '#57534e', '#475569', '#52525b', '#5b6b8c'];
      const roofs = ['#334155', '#3f3f46', '#1e293b', '#44403c'];

      s.obstacles.push({
        x: s.w + 28,
        y: s.groundY - totalH,
        w,
        h: totalH,
        bodyH,
        spireH,
        facade: facades[Math.floor(Math.random() * facades.length)],
        roof: roofs[Math.floor(Math.random() * roofs.length)],
        lights,
      });
      s.spawnedObstacles += 1;
    }

    const drawPlayer = (s) => {
      const sp = spriteRef.current;
      if (sp.ready && sp.img) {
        const drawH = s.player.h;
        const drawW = (sp.nw / sp.nh) * drawH;
        const drawX = s.player.x + (s.player.w - drawW) / 2;
        ctx.drawImage(sp.img, drawX, s.player.y, drawW, drawH);
      } else {
        ctx.fillStyle = '#1e40af';
        roundRect(ctx, s.player.x, s.player.y, s.player.w, s.player.h, 6);
        ctx.fill();
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(s.player.x + s.player.w * 0.62, s.player.y + 10, 8, 18);
      }
    };

    const loop = () => {
      const s = stateRef.current;
      if (!s || !ctx) return;

      const spd = s.gameOver ? 0 : speedFromSpawnCount(s.spawnedObstacles);

      drawStaticSky(s);

      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, s.groundY, s.w, s.h - s.groundY);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, s.groundY, s.w, 4);

      if (!s.gameOver) {
        s.player.vy += stepGravity(s.player.vy);
        s.player.y += s.player.vy;
        if (s.player.y + s.player.h >= s.groundY) {
          s.player.y = s.groundY - s.player.h;
          s.player.vy = 0;
          s.player.onGround = true;
        }

        s.nextObs -= spd;
        if (s.nextObs <= 0) {
          spawnBuilding(s);
          const gap = 260 + Math.random() * 160;
          s.nextObs = gap + (SPEED_MAX - spd) * 8;
        }

        s.nextCoin -= spd;
        if (s.nextCoin <= 0) {
          s.coins.push({
            x: s.w + 16,
            y: s.groundY - 56 - Math.random() * Math.min(48, s.h * 0.12),
            r: 12,
            got: false,
          });
          s.nextCoin = 200 + Math.random() * 220 + (SPEED_MAX - spd) * 6;
        }

        for (const o of s.obstacles) {
          o.x -= spd;
        }
        s.obstacles = s.obstacles.filter((o) => o.x > -50);

        for (const c of s.coins) {
          if (c.got) continue;
          c.x -= spd;
          if (c.x < -12) s.coinStreak = 0;
          const pr = { x: s.player.x, y: s.player.y, w: s.player.w, h: s.player.h };
          const cr = { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 };
          if (rectHit(pr, cr)) {
            c.got = true;
            s.coinStreak += 1;
            const bonus = 5 + Math.min(25, s.coinStreak * 2);
            s.score += 10 + bonus;
          }
        }
        s.coins = s.coins.filter((c) => c.x > -30 && !c.got);

        for (const o of s.obstacles) {
          if (rectHit(s.player, o)) {
            s.gameOver = true;
            s.coinStreak = 0;
            if (s.score > s.best) {
              s.best = s.score;
              try {
                localStorage.setItem('ev404best', String(s.best));
              } catch {
                /* ignore */
              }
            }
          }
        }
      }

      drawPlayer(s);

      for (const o of s.obstacles) {
        drawBuilding(o);
      }

      for (const c of s.coins) {
        if (c.got) continue;
        ctx.beginPath();
        ctx.fillStyle = '#fbbf24';
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 12px system-ui,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', c.x, c.y + 0.5);
      }

      const hudTop = Math.max(10, s.h * 0.035);
      ctx.fillStyle = '#0f172a';
      ctx.font = '600 14px system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`$ ${s.score}`, 12, hudTop + 4);
      ctx.fillStyle = '#64748b';
      ctx.font = '600 12px system-ui,sans-serif';
      ctx.fillText(`best ${s.best}`, 12, hudTop + 22);

      if (s.gameOver) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
        ctx.fillRect(0, 0, s.w, s.h);
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 15px system-ui,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Klik / Space — yenidən', s.w / 2, s.h / 2 - 6);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    const startLoop = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(loop);
    };

    function roundRect(context, x, y, w, h, r) {
      context.beginPath();
      context.moveTo(x + r, y);
      context.lineTo(x + w - r, y);
      context.quadraticCurveTo(x + w, y, x + w, y + r);
      context.lineTo(x + w, y + h - r);
      context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      context.lineTo(x + r, y + h);
      context.quadraticCurveTo(x, y + h, x, y + h - r);
      context.lineTo(x, y + r);
      context.quadraticCurveTo(x, y, x + r, y);
      context.closePath();
    }

    const resetRun = () => {
      const st = stateRef.current;
      if (!st) return;
      st.gameOver = false;
      st.score = 0;
      st.coinStreak = 0;
      st.obstacles = [];
      st.coins = [];
      st.player.y = st.groundY - st.player.h;
      st.player.vy = 0;
      st.player.onGround = true;
      st.nextObs = 100;
      st.nextCoin = 140;
      st.spawnedObstacles = 0;
    };

    let resizeT;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        layout = computeLayout();
        applySize(layout);
      }, 120);
    };

    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        const st = stateRef.current;
        if (st?.gameOver) resetRun();
        else jump();
      }
    };

    const onPointer = () => {
      const st = stateRef.current;
      if (st?.gameOver) resetRun();
      else jump();
    };

    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('pointerdown', onPointer);
    document.addEventListener('visibilitychange', onVisibility);

    startLoop();

    return () => {
      clearTimeout(resizeT);
      stopLoop();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      stateRef.current = null;
    };
  }, [jump]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="404 mini oyun"
      style={{
        display: 'block',
        margin: '0 auto 16px',
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        touchAction: 'manipulation',
        maxWidth: 'min(920px, calc(100vw - 32px))',
      }}
    />
  );
}
