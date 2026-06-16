# Word Cards — 儿童双语学习卡片

一个面向学龄前及小学低年级儿童的交互式双语学习卡片项目，帮助孩子在趣味中学习中文和英文词汇。

## 整体规划

```
首页 (index.html)
├── 🦁 动物卡片     ← 当前开发中
├── 🍎 水果卡片     (待规划)
├── 🚗 交通工具     (待规划)
├── 🌈 颜色形状     (待规划)
└── ...更多类别
```

### 首页设计

- 卡片网格展示所有学习类别
- 每个类别配有图标和名称
- 点击进入对应的学习卡片页

### 当前进度：动物卡片

📍 在线预览：[https://simiely.github.io/word-cards/animal-cards.html](https://simiely.github.io/word-cards/animal-cards.html)

#### 功能清单

- **20 种常见动物**：狮子、大象、熊猫、老虎、长颈鹿、斑马、企鹅、海豚、猴子、兔子、猫、狗、马、牛、羊、鸡、鸭、鱼、蝴蝶、青蛙、鲨鱼
- **双语名称**：中文 + 英文，点击朗读发音
- **一张实拍照片**：每种动物配一张真实照片，点击图片播放叫声
- **动物叫声**：点击图片播放真实动物叫声（18 种已收录）
- **循环导航**：上一个 / 下一个 / 随机，键盘左右箭头翻页、空格随机
- **竖屏优先**：3:4 比例适配，iPhone 17 Pro Max 优化，UI 固定不跳动
- **文件结构**：图片和声音外部引用，HTML 仅 18KB

#### 文件结构

```
animal-cards.html          ← 动物卡片页面
animal/
├── images/                ← 动物图片（{英文名}.jpg）
│   ├── lion.jpg
│   ├── elephant.jpg
│   ├── cat.jpg
│   └── dog.jpg
└── sounds_normalized/     ← 动物叫声（{英文名}.mp3）
    ├── lion.mp3
    ├── elephant.mp3
    ├── cat.mp3
    ├── dog.mp3
    └── ... (共 17 个)
```

#### 待完善

- [ ] 补充剩余动物的真实照片
- [ ] 补充熊猫、海豚、兔子的叫声
- [ ] 切换动物时可选自动播放叫声

## 技术栈

- 纯 HTML/CSS/JS，无框架依赖
- Web Speech API — 文字转语音
- Web Audio — 动物叫声播放
- GitHub Pages — 静态托管
- 响应式设计 — 移动端优先

## 本地运行

直接浏览器打开 `animal-cards.html`，或使用任意 HTTP 服务器：

```bash
python3 -m http.server 8080
# 访问 http://localhost:8080/animal-cards.html
```

## 贡献指南

欢迎贡献图片素材和动物叫声！

- 图片：600×400 JPG，放入 `animal/images/`，命名 `{英文}.jpg`
- 声音：≤4 秒 MP3，放入 `animal/sounds_normalized/`，命名 `{英文}.mp3`
- 然后在 HTML 的 `animals` 数组中补充对应路径
