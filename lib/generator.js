const MODES = ['存在主义', '干幽默', '低电量助理'];

const MODE_MODULES = {
  '存在主义': {
    prefix: ['系统沉默了两秒：', '归档记录显示：', '低频播报：', '宇宙客服回复：', '冷静结论：', '本日诊断：'],
    state: ['你的岗位正被温和地拆分', '你的人类权限仍在续费', '你的意义感还在排队', '你暂时没有被完全函数化', '你和算法保持尴尬共存', '你仍在扮演可替换主角'],
    infix: ['但工位上的咖啡渍还属于你', '只是会议纪要先学会了自我繁殖', '而你的叹气声仍未被标准化', '只是灵魂模块继续低功耗运行', '但生活说明书依然缺失', '只是你还记得下班后的天空'],
    ending: ['建议继续假装热爱工作。', '请勿对命运提交工单。', '可以先把焦虑放进草稿箱。', '本系统暂不提供意义补丁。', '请先活着，再考虑优化。', '建议把尊严调成手动模式。'],
    tail: ['', ' 如果你愿意，今天就到这里。', ' 请保留一点不合逻辑。', ' 明天再假装一切可控。']
  },
  '干幽默': {
    prefix: ['系统备注：', '自动化日报：', '客观播报：', '老板看不见的旁白：', '冷处理通知：', '理性提示：'],
    state: ['你被替代得非常礼貌', '你的人类味道暂未过期', '你的效率已被脚本围观', '你的工作流正在被借鉴', '你今天像一个可维护模块', '你还保留手动操作资格'],
    infix: ['至少键盘依然认识你的指纹', '只是周报已经能自己写周报', '但工位植物仍需要你浇水', '只是焦虑被自动同步到全设备', '但你的冷笑话尚未被索引', '只是系统把你标记为可观察对象'],
    ending: ['暂不建议立即转行。', '请先喝水再申请离职。', '可以微笑，但没必要太真诚。', '本次崩溃建议延后到晚饭后。', '你仍可领取“人类补贴”。', '明天再继续和算法谈判。'],
    tail: ['', ' 工位仍为你保留。', ' 你看起来还能撑一会儿。', ' 今天先算你赢半局。']
  },
  '低电量助理': {
    prefix: ['低电量报告：', '我努力清醒地说：', '半睡眠播报：', '懒洋洋更新：', '打工人辅助模块提示：', '省电模式通知：'],
    state: ['你还没被脚本整体收编', '你的人类权限剩余一点点', '你暂时不用和机器人抢工位', '你依旧算是正式员工', '你还可以手动按下回车', '你的人类身份卡仍可刷开门禁'],
    infix: ['但我建议把期待值调低两格', '只是今天的精力条已经见底', '而自动化同事已经开始加班', '只是你和我都不想再开会', '但你的眼神还在坚持在线', '只是我们都在靠惯性续命'],
    ending: ['先这样，晚点再努力。', '今天先活下来就算 KPI 达标。', '我先替你叹口气。', '请把雄心留给充电后。', '建议把闹钟延后五分钟。', '本助理建议立即补糖。'],
    tail: ['', ' 我会假装这叫从容。', ' 你先别对自己太严格。', ' 现在摸鱼也算策略。']
  }
};

const KEYWORD_EFFECTS = [
  { pattern: /写代码|编码|debug|调试|脚本|自动化|爬虫|sql|报表|excel|ppt|表格|文档|总结|周报|翻译|剪辑|配音/i, impact: 11 },
  { pattern: /会议|开会|汇报|排期|流程|审批|复盘|录入|整理|对账|发票/i, impact: 8 },
  { pattern: /客服|回复|邮件|排版|运营|投放|数据分析|简历/i, impact: 6 },
  { pattern: /画画|创作|写诗|即兴|安慰|陪伴|散步|发呆|做梦|拥抱|发脾气/i, impact: -9 },
  { pattern: /手工|烹饪|做饭|冥想|运动|聊天|恋爱|哭|笑|发疯/i, impact: -7 }
];

function hashString(input = '') {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mixSeed({ inputHash, timeMs, subTime, nonce }) {
  let seed = (inputHash ^ timeMs ^ subTime ^ nonce) >>> 0;
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return seed >>> 0;
}

function makePrng(seed) {
  let s = seed >>> 0;
  return function next() {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(next, min, max) {
  return Math.floor(next() * (max - min + 1)) + min;
}

function pick(next, list) {
  return list[randInt(next, 0, list.length - 1)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function dayBias(todayStr) {
  const dayHash = hashString(`daily:${todayStr}`);
  return (dayHash % 13) - 6;
}

function keywordImpact(text, next) {
  if (!text) return 0;

  let score = 0;
  for (const rule of KEYWORD_EFFECTS) {
    if (rule.pattern.test(text)) {
      score += rule.impact;
      score += randInt(next, -2, 2);
    }
  }

  return clamp(score, -18, 18);
}

function buildQuote(next, mode) {
  const modules = MODE_MODULES[mode];
  return `${pick(next, modules.prefix)}${pick(next, modules.state)}，${pick(next, modules.infix)}。${pick(next, modules.ending)}${pick(next, modules.tail)}`;
}

function generateCheck(sentence = '', options = {}) {
  const normalized = String(sentence || '').trim().slice(0, 120);
  const inputHash = hashString(normalized || '空输入');
  const timeMs = Date.now();
  const subTime = Number(process.hrtime.bigint() % 1000000n);
  const nonce = (options.nonce || 0) + randInt(makePrng((timeMs ^ subTime) >>> 0), 1, 10_000);
  const seed = mixSeed({ inputHash, timeMs, subTime, nonce });
  const next = makePrng(seed);

  const mode = pick(next, MODES);
  const base = randInt(next, 30, 70);
  const impact = keywordImpact(normalized, next);
  const daily = dayBias(new Date(timeMs).toISOString().slice(0, 10));
  const micro = randInt(next, -6, 6);

  const rate = clamp(Math.round(base + impact + daily + micro), 5, 95);
  const human_remaining = 100 - rate;
  const quote = buildQuote(next, mode);

  return {
    rate,
    human_remaining,
    quote,
    mode,
    _debug: {
      seed,
      inputHash,
      timeMs,
      base,
      impact,
      daily,
      micro
    }
  };
}

function getCombinationEstimate() {
  return MODES.reduce((sum, mode) => {
    const group = MODE_MODULES[mode];
    const count = group.prefix.length * group.state.length * group.infix.length * group.ending.length * group.tail.length;
    return sum + count;
  }, 0);
}

module.exports = {
  MODES,
  MODE_MODULES,
  generateCheck,
  getCombinationEstimate,
  hashString,
  mixSeed,
  makePrng
};
