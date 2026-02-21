const { generateCheck } = require('../lib/generator');

console.log('模式与文案抽样证明（同一输入，多次生成）:');
for (let i = 0; i < 12; i += 1) {
  const result = generateCheck('今天写报告');
  console.log(`${i + 1}. [${result.mode}] ${result.quote}`);
}
