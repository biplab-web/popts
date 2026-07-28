const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

function resize() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));
  canvas.width = w;
  canvas.height = h;
}
resize();
window.addEventListener('resize', resize);

const W = () => canvas.width;
const H = () => canvas.height;

const SONGS = ['relax.mp3', 'relax2.mp3'];
let audio = null;
let audioUnlocked = false;
let actx = null;

function getACtx() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  return actx;
}

async function unlockAudio() {
  if (audioUnlocked) return;
  try {
    const ac = getACtx();
    if (ac.state === 'suspended') await ac.resume();
    audioUnlocked = true;
    if (!audio) playRandomSong();
    else if (audio.paused) await audio.play();
  } catch (e) {}
}

function playRandomSong() {
  if (!audioUnlocked) return;
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  audio = new Audio(SONGS[Math.floor(Math.random() * SONGS.length)]);
  audio.preload = 'auto';
  audio.volume = 0.35;
  audio.playsInline = true;
  audio.setAttribute('playsinline', 'true');
  audio.load();
  audio.play().catch(() => {});
  audio.onended = playRandomSong;
}

function playPop() {
  try {
    const ac = getACtx();
    if (ac.state === 'suspended') return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g);
    g.connect(ac.destination);
    o.frequency.setValueAtTime(700 + Math.random() * 200, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.12);
    g.gain.setValueAtTime(0.3, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
    o.start();
    o.stop(ac.currentTime + 0.12);
  } catch (e) {}
}

function playMiss() {
  try {
    const ac = getACtx();
    if (ac.state === 'suspended') return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g);
    g.connect(ac.destination);
    o.frequency.setValueAtTime(200, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.25);
    g.gain.setValueAtTime(0.4, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
    o.start();
    o.stop(ac.currentTime + 0.25);
  } catch (e) {}
}

function loadHS() {
  return parseInt(localStorage.getItem('pragya_hs') || '0');
}

function saveHS(s) {
  localStorage.setItem('pragya_hs', s);
}

const rnd = (a, b) => Math.random() * (b - a) + a;
const rndI = (a, b) => Math.floor(rnd(a, b + 1));
const COLORS = ['#ff78b4', '#78c8ff', '#b4ffa0', '#ffdc64', '#c88cff', '#64ffdc', '#ffa064', '#ff6496'];
const MESSAGES = [
  'How are you so perfect? 💖',
  'Pragya = Pure Magic ✨',
  'You light up every room 🌟',
  'Sunshine in human form ☀️',
  'Literally flawless 💅',
  "The universe's favourite person 🌸",
  'Too cute to be real 🥺',
  'Spreading joy everywhere 🌈',
  "Pragya, you're amazing! 💕",
  'Smile more, it suits you 😊'
];

class Bubble {
  constructor(speedMult = 1) {
    this.sm = speedMult;
    this.reset();
  }
  reset() {
    this.r = rndI(18, 40);
    this.x = rnd(this.r, W() - this.r);
    this.y = H() + this.r + rnd(20, 120);
    this.vy = rnd(0.7, 1.1) * this.sm;
    this.vx = rnd(-0.25, 0.25);
    this.col = COLORS[rndI(0, COLORS.length - 1)];
    this.a = rndI(160, 220) / 255;
    this.wb = rnd(0, Math.PI * 2);
    this.missed = false;
  }
  update() {
    this.wb += 0.03;
    this.x += this.vx + Math.sin(this.wb) * 0.3;
    this.y -= this.vy;

    const maxX = W() - this.r;

    if (this.x < this.r) {
      this.x = this.r;
      this.vx = Math.abs(this.vx);
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = -Math.abs(this.vx);
    }

    if (this.y + this.r < 0) {
      this.missed = true;
    }
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.a;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.col;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  hit(x, y) {
    return Math.hypot(x - this.x, y - this.y) <= this.r;
  }
}

class Particle {
  constructor(x, y, col) {
    this.x = x;
    this.y = y;
    this.col = col;
    const a = rnd(0, Math.PI * 2);
    const s = rnd(2, 6);
    this.vx = Math.cos(a) * s;
    this.vy = Math.sin(a) * s;
    this.life = 1;
    this.r = rndI(3, 7);
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15;
    this.life -= 0.045;
  }
  draw() {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.col;
    ctx.fill();
    ctx.restore();
  }
}

class Petal {
  constructor(spawn = false) {
    this.reset(spawn);
  }
  reset(spawn = false) {
    this.x = rnd(0, W());
    this.y = spawn ? rnd(0, H()) : -10;
    this.vy = rnd(0.8, 2);
    this.vx = rnd(-0.8, 0.8);
    this.rot = rnd(0, 360);
    this.rs = rnd(-2, 2);
    this.sz = rndI(5, 12);
    this.a = rndI(120, 200) / 255;
    const pc = ['#ffb6c1', '#ffa0b4', '#ffc8d2', '#ffdce6'];
    this.col = pc[rndI(0, pc.length - 1)];
  }
  update() {
    this.x += this.vx + Math.sin(this.y * 0.02) * 0.5;
    this.y += this.vy;
    this.rot += this.rs;
    if (this.y > H() + 10) this.reset();
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.a;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot * Math.PI / 180);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = ((i * 72) - 90) * Math.PI / 180;
      const a2 = ((i * 72 + 36) - 90) * Math.PI / 180;
      if (i === 0) ctx.moveTo(Math.cos(a) * this.sz, Math.sin(a) * this.sz);
      else ctx.lineTo(Math.cos(a) * this.sz, Math.sin(a) * this.sz);
      ctx.lineTo(Math.cos(a2) * this.sz * 0.4, Math.sin(a2) * this.sz * 0.4);
    }
    ctx.closePath();
    ctx.fillStyle = this.col;
    ctx.fill();
    ctx.restore();
  }
}

class FloatMsg {
  constructor(x, y, text) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.life = 1;
  }
  update() {
    this.y -= 1.2;
    this.life -= 0.018;
  }
  draw() {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(this.life * 2, 1);
    ctx.fillStyle = '#ffccff';
    ctx.font = 'bold 16px Segoe UI Emoji';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

class HeartShard {
  constructor(x, y, left) {
    this.x = x;
    this.y = y;
    this.vx = left ? rnd(-3, -0.5) : rnd(0.5, 3);
    this.vy = rnd(-4, -1);
    this.rot = 0;
    this.rs = rnd(-8, 8);
    this.life = 1;
    this.left = left;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.rot += this.rs;
    this.life -= 0.025;
  }
  draw() {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot * Math.PI / 180);
    ctx.beginPath();
    if (this.left) {
      ctx.moveTo(0, 14);
      ctx.lineTo(-12, -2);
      ctx.lineTo(-6, -10);
      ctx.lineTo(0, -4);
    } else {
      ctx.moveTo(0, 14);
      ctx.lineTo(12, -2);
      ctx.lineTo(6, -10);
      ctx.lineTo(0, -4);
    }
    ctx.closePath();
    ctx.fillStyle = '#dc3250';
    ctx.fill();
    ctx.restore();
  }
}

function drawHeart(x, y, size, alive, shake = false) {
  const ox = shake ? rndI(-3, 3) : 0;
  const oy = shake ? rndI(-3, 3) : 0;
  ctx.save();
  ctx.translate(x + ox, y + oy);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.3);
  ctx.bezierCurveTo(-size * 1.2, -size * 0.6, -size * 2, size * 0.4, 0, size * 1.4);
  ctx.bezierCurveTo(size * 2, size * 0.4, size * 1.2, -size * 0.6, 0, size * 0.3);
  ctx.fillStyle = alive ? '#ff5078' : '#3c1422';
  ctx.fill();
  if (!alive) {
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.lineTo(0, size * 1.4);
    ctx.strokeStyle = '#6e1030';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawBg() {
  const grad = ctx.createLinearGradient(0, 0, 0, H());
  grad.addColorStop(0, '#140a28');
  grad.addColorStop(1, '#3c1450');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W(), H());
}

let state = 'menu';
let titleTimer = 220;
let bubbles = [];
let petals = [];
let particles = [];
let messages = [];
let shards = [];
let lives = 3;
let score = 0;
let missedCount = 0;
let speedMult = 1;
let highScore = loadHS();
let shakeTimer = 0;
let gameoverBubbles = [];
let started = false;
let lastTapTime = 0;
let tapPulse = 0;
let pauseHintVisible = true;

function initGame() {
  bubbles = [];
  particles = [];
  messages = [];
  shards = [];
  lives = 3;
  score = 0;
  missedCount = 0;
  speedMult = 1;
  shakeTimer = 0;
  for (let i = 0; i < 5; i++) bubbles.push(new Bubble(1));
  petals = [];
  for (let i = 0; i < 40; i++) petals.push(new Petal(true));
  gameoverBubbles = [];
}

initGame();

async function handleTap(cx, cy) {
  const now = Date.now();
  if (now - lastTapTime < 120) return;
  lastTapTime = now;
  tapPulse = 10;

  if (state === 'menu') {
    state = 'playing';
    document.getElementById('menuOverlay').style.display = 'none';
    if (!started) {
      started = true;
      await unlockAudio();
    }
    return;
  }

  if (!started) {
    started = true;
    await unlockAudio();
  }

  if (state === 'playing') {
    pauseHintVisible = false;
    for (const b of bubbles) {
      if (b.hit(cx, cy)) {
        for (let i = 0; i < 12; i++) particles.push(new Particle(b.x, b.y, b.col));
        messages.push(new FloatMsg(b.x, b.y - b.r, MESSAGES[rndI(0, MESSAGES.length - 1)]));
        playPop();
        score++;
        if (score % 10 === 0) {
          speedMult += 0.12;
          for (const bb of bubbles) {
            bb.sm = speedMult;
            bb.vy = rnd(0.7, 1.1) * speedMult;
          }
        }
        b.reset();
        break;
      }
    }
  } else if (state === 'gameover') {
    highScore = loadHS();
    initGame();
    state = 'playing';
  }
}

document.getElementById('playBtn').addEventListener('click', async () => {
  await handleTap(W() / 2, H() / 2);
});

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  handleTap(e.clientX - r.left, e.clientY - r.top);
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0];
  if (t) {
    const r = canvas.getBoundingClientRect();
    handleTap(t.clientX - r.left, t.clientY - r.top);
  }
}, { passive: false });

function update() {
  for (const p of petals) p.update();
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) p.update();
  messages = messages.filter(m => m.life > 0);
  for (const m of messages) m.update();
  shards = shards.filter(s => s.life > 0);
  for (const s of shards) s.update();
  if (shakeTimer > 0) shakeTimer--;
  if (tapPulse > 0) tapPulse--;

  if (state === 'title') {
    titleTimer--;
    if (titleTimer <= 0) state = 'playing';
  } else if (state === 'playing') {
    const target = Math.min(5 + Math.floor(score / 5), 18);
    while (bubbles.length < target) bubbles.push(new Bubble(speedMult));

    for (const b of bubbles) {
      b.update();
      if (b.missed) {
        b.missed = false;
        playMiss();
        missedCount++;
        b.reset();
        if (missedCount >= 3) {
          missedCount = 0;
          lives--;
          const hx = W() - 112 + lives * 34;
          const hy = 46;
          for (let i = 0; i < 6; i++) {
            shards.push(new HeartShard(hx, hy, true));
            shards.push(new HeartShard(hx, hy, false));
          }
          shakeTimer = 20;
          if (lives <= 0) {
            if (score > highScore) {
              highScore = score;
              saveHS(score);
            }
            state = 'gameover';
            gameoverBubbles = [];
            for (let i = 0; i < 8; i++) {
              const gb = new Bubble(0.3);
              gb.y = rnd(100, H());
              gameoverBubbles.push(gb);
            }
          }
        }
      }
    }
  } else if (state === 'gameover') {
    for (const gb of gameoverBubbles) {
      gb.update();
      if (gb.missed) {
        gb.missed = false;
        gb.reset();
      }
    }
  }
}

function draw() {
  drawBg();
  for (const p of petals) p.draw();

  if (state === 'menu') {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W(), H());
    ctx.restore();
  }

  if (state === 'title') {
    const a = titleTimer > 60 ? 1 : titleTimer / 60;
    ctx.save();
    ctx.globalAlpha = a * 0.55;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, H() / 2 - 95, W(), 170);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.min(W() / 11, 36)}px Segoe UI Emoji`;
    ctx.fillStyle = '#ffd2ea';
    ctx.fillText('🌸 For Pragya, with love 🌸', W() / 2, H() / 2 - 20);
    ctx.font = `${Math.min(W() / 18, 18)}px Segoe UI Emoji`;
    ctx.fillStyle = '#ffe8ff';
    ctx.fillText('A tiny bubble game made for your phone ✨', W() / 2, H() / 2 + 16);
    ctx.font = `${Math.min(W() / 20, 16)}px Segoe UI Emoji`;
    ctx.fillStyle = '#ffc8e6';
    ctx.fillText('Tap to begin and pop your way to joy 💖', W() / 2, H() / 2 + 48);
    ctx.font = `${Math.min(W() / 24, 13)}px Segoe UI Emoji`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Tip: keep your taps gentle and playful 🌈', W() / 2, H() / 2 + 78);
    ctx.restore();
  } else if (state === 'playing') {
    for (const b of bubbles) b.draw();
    for (const p of particles) p.draw();
    for (const m of messages) m.draw();

    ctx.textAlign = 'left';
    ctx.font = `bold ${Math.max(14, Math.min(W() / 20, 18))}px Segoe UI Emoji`;
    ctx.fillStyle = '#ffccff';
    ctx.fillText(`🫧 Popped: ${score}`, 16, 28);
    ctx.font = `${Math.max(12, Math.min(W() / 26, 14))}px Segoe UI Emoji`;
    ctx.fillStyle = '#ffdc96';
    ctx.fillText(`🏆 Best: ${highScore}`, 16, 50);
    const lvl = Math.floor((speedMult - 1) / 0.12) + 1;
    ctx.fillStyle = '#b4ffcc';
    ctx.fillText(`⚡ Level ${lvl}`, 16, 70);

    ctx.textAlign = 'center';
    ctx.font = `${Math.max(12, Math.min(W() / 26, 14))}px Segoe UI Emoji`;
    ctx.fillStyle = '#ffb464';
    const dots = '●'.repeat(missedCount) + '○'.repeat(3 - missedCount);
    ctx.fillText(`Missed: ${dots}`, W() / 2, 28);

    const heartX = W() - 112;
    for (let i = 0; i < 3; i++) {
      drawHeart(heartX + i * 34, 46, 12, i < lives, shakeTimer > 0 && i === lives);
    }

    if (pauseHintVisible) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.roundRect(16, H() - 64, W() - 32, 44, 16);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.font = `${Math.max(12, Math.min(W() / 26, 13))}px Segoe UI Emoji`;
      ctx.fillStyle = '#fff4ff';
      ctx.fillText('Tap bubbles gently — they like a little love 💖', W() / 2, H() - 36);
      ctx.restore();
    }

    for (const s of shards) s.draw();
  } else if (state === 'gameover') {
    for (const gb of gameoverBubbles) gb.draw();

    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W(), H());
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.min(W() / 10, 34)}px Segoe UI Emoji`;
    ctx.fillStyle = '#ff6488';
    ctx.fillText('💔 You Lost, Pragya! 💔', W() / 2, H() / 2 - 100);

    ctx.font = `${Math.min(W() / 16, 20)}px Segoe UI Emoji`;
    ctx.fillStyle = '#ffccff';
    ctx.fillText(`🫧 Bubbles Popped: ${score}`, W() / 2, H() / 2 - 45);

    const newHS = score >= highScore && score > 0;
    ctx.fillStyle = newHS ? '#ffdc50' : '#c8b4ff';
    ctx.fillText(newHS ? '🏆 NEW HIGH SCORE!' : `🏆 Best: ${highScore}`, W() / 2, H() / 2 + 5);

    ctx.font = `${Math.min(W() / 20, 16)}px Segoe UI Emoji`;
    ctx.fillStyle = '#ffc8e6';
    ctx.fillText("But you're still perfect 💖", W() / 2, H() / 2 + 50);
    ctx.fillText('Tap anywhere to try again!', W() / 2, H() / 2 + 82);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
