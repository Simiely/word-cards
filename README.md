# Word Cards — 儿童双语学习卡片

面向学龄前及小学低年级儿童的交互式双语学习卡片，纯静态零依赖，帮助孩子在趣味中学习中文和英文词汇。

📍 **在线访问**：[simiely.github.io/word-cards](https://simiely.github.io/word-cards/)

---

## 功能

### 两种模式

| 模式 | 页面 | 特点 |
|------|------|------|
| 卡片模式 | `animal-cards.html` | 随机排序顺序翻阅，滑动窗口预加载，支持滑动翻页 |
| 浏览模式 | `animal-select.html` | 拼音排序瀑布流方阵，自由选择弹出卡片详情 |

### 核心功能

- 双语学习：中文名 + 英文名 + 科普描述，点击朗读
- 实拍照片：WebP 响应式图片（400w/800w/原图三档），缩放/拖拽/双指缩放/边缘色背景
- 滑动窗口预加载：当前 + 前1张(已看过) + 后3张，翻页零等待
- 左右滑动翻页：全卡片区域手势，zoom 模式自动禁用
- 离线运行：一键下载全部资源到本地，断网可用
- PWA 支持：可添加到主屏幕
- 浏览模式特有：已访问 10% 透明度标记、再来一次清除记录
- 图片失败兜底：显示 emoji + 重试按钮

---

## 项目结构

```
word-cards/
├── index.html              # 首页
├── animal-cards.html       # 卡片模式
├── animal-select.html      # 浏览模式
├── animal-data.js          # 动物数据（唯一数据源，动态驱动）
├── image-interaction.js    # 图片缩放/拖拽交互模块
├── common.css              # 公共样式
├── common.js               # 公共逻辑
├── sw.js                   # Service Worker（版本时间戳自动生成）
├── build.sh                # 构建脚本（自动替换 SW 版本）
├── manifest.json           # PWA 配置
├── dev-log/README.md       # 开发日志
└── animal/
    ├── images/             # WebP 图片（原图 + 400w + 800w）
    ├── speech_zh/en/fact/  # Edge TTS 语音
    └── sounds_normalized/  # 动物叫声（待添加）
```

---

## 技术栈

| 技术 | 用途 |
|------|------|
| HTML/CSS/JS（零依赖） | 纯静态页面 |
| WebP + srcset | 响应式图片，移动端省 90% 流量 |
| Service Worker（时间戳版本） | 离线缓存，三级策略，`build.sh` 自动生成版本号 |
| Canvas API | 边缘色提取（异步，不阻塞渲染） |
| Pointer Events | 跨设备拖拽缩放 |
| Edge TTS | 预录制 MP3 语音 |

---

## 模块

- **`animal-data.js`** — 唯一数据源。新增动物只需追加一条，所有页面自动适配
- **`image-interaction.js`** — `initImageInteraction(config)` 返回 `cleanup()`，封装缩放/拖拽/双指/边缘色
- **`common.css`** — `:root` 变量、reset、pulse 动画、card-image/zoom-toggle/card-body 公共样式
- **`common.js`** — `registerSW()`、`speak()`、`playAnimalSound()`、`collectOfflineUrls()`、`initOfflineButton()`
- **`sw.js`** — 核心文件 Network First，图片音频 Stale-While-Revalidate，支持 MessageChannel 全量下载

---

## 本地运行

```bash
python3 -m http.server 8080
# 首页:    http://localhost:8080/
# 卡片模式: http://localhost:8080/animal-cards.html
# 浏览模式: http://localhost:8080/animal-select.html
```

---

## 新增类别

1. 创建 `{category}-data.js`（参考 `animal-data.js`）
2. 准备素材：图片（WebP 多尺寸）+ 语音 MP3
3. 复制 `animal-cards.html`，修改数据源引用
4. 在 `index.html` 激活类别卡片

### 内容规范

- **科普描述（fact）必须基于可靠科学事实**，参考维基百科、学术期刊或权威科普机构
- **禁止使用未经证实的传说或伪科学**（如"猫呼噜声治疗骨骼"等）
- **避免夸大表述**，"最""唯一"等最高级词汇需有数据支撑
- **描述应简洁准确**，适合儿童理解，但不歪曲事实

---

## 后续规划

**待开发**：水果 / 交通工具 / 颜色形状 / 数字 / 身体部位 / 动物叫声 / 学习统计 / 朗读视觉反馈

**已完成**：详见 [dev-log/README.md](dev-log/README.md)
