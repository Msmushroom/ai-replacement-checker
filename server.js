const express = require('express');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { generateCheck } = require('./lib/generator');

const app = express();
const PORT = process.env.PORT || 3000;

const GENERATED_DIR = path.join(__dirname, 'generated');
if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });

let lastFingerprint = '';

function escapeHtml(s = '') {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function fingerprintOf(result) {
  return `${result.rate}|${result.human_remaining}|${result.quote}|${result.mode}`;
}

function generateWithoutRepeat(sentence = '') {
  const first = generateCheck(sentence, { nonce: 1 });
  const firstFingerprint = fingerprintOf(first);

  if (firstFingerprint === lastFingerprint) {
    const second = generateCheck(sentence, { nonce: 2 });
    const secondFingerprint = fingerprintOf(second);
    lastFingerprint = secondFingerprint;
    return second;
  }

  lastFingerprint = firstFingerprint;
  return first;
}

async function renderCardPng({ rate, human_remaining, quote, mode }) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });

    const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <style>
    :root {
      --bg: #0B0D10;
      --panel: #11151B;
      --text: #E6E7EA;
      --muted: #9AA3AF;
      --green: #A6FF4D;
      --red: #FF4D4D;
      --line: #232832;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 1080px;
      height: 1350px;
      background: var(--bg);
      color: var(--text);
      font-family: 'Noto Sans SC', 'PingFang SC', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 2px, transparent 4px);
      opacity: 0.28;
      pointer-events: none;
    }
    .card {
      width: 900px;
      min-height: 1080px;
      border: 1px solid var(--line);
      border-radius: 20px;
      background: linear-gradient(160deg, #11151B 0%, #0D1116 100%);
      padding: 54px;
      display: grid;
      grid-template-rows: auto auto auto 1fr auto;
      gap: 20px;
    }
    .title { font-size: 46px; font-weight: 700; letter-spacing: 0.05em; }
    .badge {
      justify-self: start;
      font-family: 'JetBrains Mono', monospace;
      font-size: 22px;
      color: var(--muted);
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 8px 18px;
    }
    .mode { font-size: 26px; color: var(--text); }
    .numbers { display: grid; gap: 16px; margin-top: 8px; }
    .line { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid var(--line); padding-bottom: 12px; }
    .name { color: var(--muted); font-size: 24px; }
    .value { font-family: 'JetBrains Mono', monospace; font-size: 78px; color: var(--green); }
    .human .value { color: var(--red); }
    .remark {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 18px 20px;
      font-size: 30px;
      line-height: 1.45;
      background: #0B1016;
    }
    .bottom { display: grid; gap: 10px; }
    .bar-title { color: var(--muted); font-size: 22px; }
    .bar {
      height: 16px;
      border-radius: 999px;
      background: #0A0D12;
      border: 1px solid var(--line);
      overflow: hidden;
    }
    .fill {
      height: 100%;
      width: ${escapeHtml(String(rate))}%;
      background: linear-gradient(90deg, #88DA38 0%, #A6FF4D 100%);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">《今天被AI替代了吗》</div>
    <div class="badge">Existential-v0.3/未通过伦理审查</div>
    <div class="mode">模式：${escapeHtml(mode)}</div>
    <div class="numbers">
      <div class="line ai"><span class="name">AI替代率</span><span class="value">${escapeHtml(String(rate))}%</span></div>
      <div class="line human"><span class="name">剩余人类性</span><span class="value">${escapeHtml(String(human_remaining))}%</span></div>
      <div class="remark">系统备注：${escapeHtml(quote)}</div>
    </div>
    <div class="bottom">
      <div class="bar-title">AI接管进度条</div>
      <div class="bar"><div class="fill"></div></div>
    </div>
  </div>
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const fileName = `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const outPath = path.join(GENERATED_DIR, fileName);
    await page.screenshot({ path: outPath, type: 'png' });

    return `/generated/${fileName}`;
  } finally {
    await browser.close();
  }
}

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/generated', express.static(GENERATED_DIR));

app.post('/check', async (req, res) => {
  try {
    const sentence = typeof req.body?.sentence === 'string' ? req.body.sentence.slice(0, 120) : '';

    const result = generateWithoutRepeat(sentence);
    const image_url = await renderCardPng(result);

    res.json({
      rate: result.rate,
      human_remaining: result.human_remaining,
      quote: result.quote,
      mode: result.mode,
      image_url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '生成失败' });
  }
});

app.listen(PORT, () => {
  console.log(`今天被AI替代了吗 已启动：http://localhost:${PORT}`);
});
