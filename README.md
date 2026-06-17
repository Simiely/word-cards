# Word Cards — 儿童双语学习卡片

面向学龄前及小学低年级儿童的交互式双语学习卡片项目，帮助孩子在趣味中学习中文和英文词汇。

📍 **在线访问**：[https://simiely.github.io/word-cards/](https://simiely.github.io/word-cards/)

---

## 整体规划

```
首页 (index.html)
├── 🦁 动物卡片     ← ✅ 已完成
├── 🍎 水果卡片     (待规划)
├── 🚗 交通工具     (待规划)
├── 🌈 颜色形状     (待规划)
├── 🔢 数字         (待规划)
├── 👋 身体部位     (待规划)
└── ...更多类别
```

---

## 动物卡片 — 功能概览

### 两种学习模式

| 模式 | 页面 | 说明 |
|------|------|------|
| **卡片模式** | `animal-cards.html` | 随机洗牌排序，顺序翻阅，分组预加载 |
| **浏览模式** | `animal-select.html` | 拼音排序，瀑布流方阵，自由选择，弹出卡片详情 |

### 21 种动物

狮子、大象、熊猫、老虎、长颈鹿、斑马、企鹅、海豚、猴子、兔子、猫、狗、马、牛、羊、鸡、鸭子、鱼、蝴蝶、青蛙、鲨鱼

### 交互功能

- **双语学习**：中文名称 + 英文名称，点击朗读发音
- **科普知识**：每种动物配有中文科普描述，点击朗读
- **实拍照片**：真实动物照片，支持以下交互：
  - 缩放模式切换（右下角按钮）
  - 鼠标滚轮缩放（以光标为锚点）
  - 双指缩放（移动端）
  - 自由拖拽平移
  - 边缘平均色背景（图片加载后自动提取）
- **叫声播放**：点击卡片上的 emoji 播放当前动物叫声
- **浏览模式**：
  - 瀑布流方阵（自适应 2/3/4 列）
  - 按中文名拼音首字母排序
  - emoji 平均色方块背景
  - 已浏览动物 10% 透明度标记
  - 「再来一次」清除浏览记录
- **分组预加载**：21 个动物随机排序，按 6 个一组切分，首屏预加载 3 组
- **加载动画**：呼吸缩放 emoji，加载完成后自动淡出
- **循环导航**：上一个 / 下一个 / 重新洗牌，键盘快捷键
- **高分辨率适配**：自适应 3:4 竖版高分辨率平板
- **PWA 支持**：可添加到主屏幕

---

## 项目结构

```
word-cards/
├── index.html              ← 首页（类别入口）
├── animal-cards.html       ← 动物卡片模式
├── animal-select.html      ← 动物浏览模式
├── animal-data.js          ← 共享数据源（21 种动物）
├── image-interaction.js    ← 公共图片交互模块（缩放/拖拽/双指缩放/边缘色）
├── manifest.json           ← PWA 配置
├── README.md
└── animal/
    ├── images/             ← 动物实拍照片（{英文名}.jpg，21 张）
    ├── speech_zh/          ← 中文名称语音（Edge TTS MP3，21 个）
    ├── speech_en/          ← 英文名称语音（Edge TTS MP3，21 个）
    ├── speech_fact/        ← 科普描述语音（Edge TTS MP3，21 个）
    └── sounds_normalized/  ← 动物叫声 MP3（待添加）
```

---

## 技术栈

| 技术 | 用途 |
|------|------|
| HTML/CSS/JS（无框架） | 纯静态页面，零依赖 |
| Edge TTS | 预录制 MP3 语音，全平台兼容（含 iOS Safari） |
| Canvas API | 图片边缘色提取、emoji 平均色提取 |
| Pointer Events + setPointerCapture | 跨设备拖拽和缩放 |
| GitHub Pages | 静态托管，自动部署 |
| localStorage | 浏览记录持久化 |
| PWA Manifest | 添加到主屏幕 |

---

## 语音文件生成

使用 Edge TTS 生成中文/英文/科普语音：

```bash
pip install edge-tts

# 中文名称
edge-tts --voice zh-CN-XiaoxiaoNeural --text "狮子" --write-media animal/speech_zh/lion.mp3

# 英文名称
edge-tts --voice en-US-AriaNeural --text "Lion" --write-media animal/speech_en/lion.mp3

# 科普描述
edge-tts --voice zh-CN-XiaoxiaoNeural --text "狮子是唯一群居的猫科动物..." --write-media animal/speech_fact/lion.mp3
```

### 多音字处理

Edge TTS 对部分多音字可能读错声调（如"蛙"读四声）。解决方案：

1. **拆分拼接**：将词拆为单字分别生成，用 pydub 拼接
   ```bash
   edge-tts --voice zh-CN-XiaoxiaoNeural --text "青" --write-media qing.mp3
   edge-tts --voice zh-CN-XiaoxiaoNeural --text "挖" --write-media wa.mp3
   python3 -c "
   from pydub import AudioSegment
   (AudioSegment.from_mp3('qing.mp3') + AudioSegment.from_mp3('wa.mp3')).export('frog.mp3', format='mp3')
   "
   ```

2. **从 fact 语音截取**：fact 描述中的读音通常正确，可从中截取
   ```bash
   python3 -c "
   from pydub import AudioSegment
   fact = AudioSegment.from_mp3('animal/speech_fact/frog.mp3')
   fact[100:500].export('animal/speech_zh/frog.mp3', format='mp3')
   "
   ```

---

## 本地运行

```bash
# 使用 Python HTTP 服务器
python3 -m http.server 8080

# 访问
#   首页:    http://localhost:8080/
#   卡片模式: http://localhost:8080/animal-cards.html
#   浏览模式: http://localhost:8080/animal-select.html
```

也可以直接双击打开 `index.html`（部分浏览器可能因 CORS 限制导致音频播放异常，推荐使用 HTTP 服务器）。

---

## 模块说明

### `animal-data.js`
共享的动物数据源，包含 21 种动物的中英文名称、emoji、图片路径、语音路径和科普描述。两个模式页面通过 `<script src>` 引用，无需重复维护。

### `image-interaction.js`
公共图片交互模块，提供 `initImageInteraction(config)` 函数。封装了缩放切换、鼠标/触摸拖拽、双指缩放、滚轮缩放、边缘色提取等功能。返回 `cleanup()` 函数用于解绑事件。

```js
var cleanup = initImageInteraction({
    container: cardImage,  // 图片容器 DOM
    img: cardImg,          // <img> 元素
    zoomBtn: zoomBtn       // 缩放切换按钮
});
// 切换图片时调用 cleanup() 清理旧事件
```

---

## 新增类别指南

借助已有模块，新增一个类别只需：

1. 创建 `{category}-data.js`（参考 `animal-data.js`）
2. 准备素材：图片（`{category}/images/`）、语音（`{category}/speech_zh/` 等）
3. 复制 `animal-cards.html`，修改标题和数据源引用
4. 在 `index.html` 中激活对应类别卡片

---

## 后续规划

- [ ] 水果卡片类别
- [ ] 交通工具类别
- [ ] 颜色形状类别
- [ ] 数字类别
- [ ] 身体部位类别
- [ ] 补齐动物叫声 MP3
- [ ] Service Worker 离线缓存
- [ ] 学习进度统计
- [ ] 语音朗读视觉反馈
