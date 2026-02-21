const sentenceInput = document.getElementById('sentence');
const checkBtn = document.getElementById('checkBtn');
const loadingLine = document.getElementById('loadingLine');
const resultCard = document.getElementById('resultCard');
const modeLine = document.getElementById('modeLine');
const rateValue = document.getElementById('rateValue');
const humanValue = document.getElementById('humanValue');
const quoteBox = document.getElementById('quoteBox');
const progressFill = document.getElementById('progressFill');
const rerunBtn = document.getElementById('rerunBtn');

const loadingTexts = [
  '正在扫描你剩余的人类性…',
  '正在比对你与模板人生的相似度…',
  '系统正在假装认真地计算中…',
  '正在把你的日常转换成可替代指标…'
];

function normalizeQuote(quote = '') {
  return String(quote).replace(/^系统备注[:：]\s*/, '');
}

function pickLoadingText() {
  const index = Math.floor(Math.random() * loadingTexts.length);
  return loadingTexts[index];
}

function setLoading(active) {
  checkBtn.disabled = active;
  rerunBtn.disabled = active;

  if (active) {
    checkBtn.textContent = '检测进行中…';
    loadingLine.textContent = pickLoadingText();
    loadingLine.classList.remove('hidden');
    return;
  }

  checkBtn.textContent = '启动替代检测';
  loadingLine.classList.add('hidden');
}

async function runCheck() {
  setLoading(true);

  try {
    const resp = await fetch('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence: sentenceInput.value || '' })
    });

    if (!resp.ok) throw new Error('请求失败');

    const data = await resp.json();

    rateValue.textContent = `${data.rate}%`;
    humanValue.textContent = `${data.human_remaining}%`;
    modeLine.textContent = '';
    quoteBox.textContent = normalizeQuote(data.quote);
    progressFill.style.width = `${data.rate}%`;

    resultCard.classList.remove('hidden');
  } catch (error) {
    alert('生成失败，请稍后再试。');
  } finally {
    setLoading(false);
  }
}

checkBtn.addEventListener('click', runCheck);
rerunBtn.addEventListener('click', runCheck);
