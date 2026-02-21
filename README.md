# 今天被AI替代了吗

一个纯中文、黑色幽默风格的单页 Web App：输入可以为空，点击按钮后返回“AI替代率 / 剩余人类性 / 系统备注”，并生成同风格 PNG 卡片。

## 技术栈
- Node.js + Express
- 单接口：`POST /check`
- 无数据库
- Puppeteer 生成 PNG 卡片

## 接口响应（固定结构）
```json
{
  "rate": 61,
  "human_remaining": 39,
  "quote": "系统沉默了两秒：你仍在扮演可替换主角，...",
  "mode": "存在主义",
  "image_url": "/generated/card-xxxxxx.png"
}
```

## 分数算法说明
- `rate` 永远在 `5~95`，不会出现 `0` 或 `100`
- 计算方式由三部分组成：
1. 基础随机值（30~70）
2. 关键词影响（高自动化内容上调，强人类行为下调）
3. 当日波动（日字符串哈希映射到 -6~+6）
- 最终结果会被 clamp 到 `5~95`

## 文案组合空间（>=200）
每种模式都由 5 个模块拼接：`prefix + state + infix + ending + tail`。

当前每个模式模块大小均为 `6 x 6 x 6 x 6 x 4 = 5184` 种；
3 种模式总组合空间：

`5184 x 3 = 15552`

远大于 200，避免固定少量文案池。

## 防重复机制
- seed 包含：`用户输入哈希 + 当前时间毫秒 + 高精度子时间`
- 服务端保存上一条完整输出签名：`rate|human_remaining|quote|mode`
- 若连续两次完全一致，会自动重生成一次并返回新结果

## 启动
```bash
npm install
npm start
```
打开 `http://localhost:3000`

## 测试
```bash
npm run test:sanity
npm run test:style
```

`test:sanity` 会验证：
- 返回字段是否齐全
- 分数范围是否在 5~95
- `human_remaining === 100 - rate`
- mode 是否在合法列表
- 组合空间估算是否 >= 200
