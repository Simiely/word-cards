// ============================================================
// 动物卡片数据 — 共享数据源
// 图片: animal/images/{英文名}.jpg
// 语音: animal/speech_zh/、speech_en/、speech_fact/ (Edge TTS)
// 叫声: animal/sounds_normalized/{英文名}.mp3 (待添加)
//
// ⚠️ 新增动物规范：
//   1. fact 描述必须基于可靠科学事实，禁止使用未经证实的传说或伪科学
//   2. 参考来源：维基百科、学术期刊、权威科普机构（如国家地理、BBC Earth）
//   3. 避免夸大表述（如"最""唯一"等词需有数据支撑）
//   4. 描述应简洁准确，适合儿童理解，但不歪曲事实
//   5. 新增后需同步生成 speech_fact 语音文件
// ============================================================

const animals = [
    { zh:'狮子', en:'Lion', emoji:'🦁', sound:'', speech_zh:'animal/speech_zh/lion.mp3', speech_en:'animal/speech_en/lion.mp3', speech_fact:'animal/speech_fact/lion.mp3', image:'animal/images/lion.jpg',
      fact:'狮子是唯一群居的猫科动物，一个狮群通常由1-2头雄狮和几头母狮组成。雄狮的鬃毛越浓密越受母狮青睐。' },
    { zh:'大象', en:'Elephant', emoji:'🐘', sound:'', speech_zh:'animal/speech_zh/elephant.mp3', speech_en:'animal/speech_en/elephant.mp3', speech_fact:'animal/speech_fact/elephant.mp3', image:'animal/images/elephant.jpg',
      fact:'大象是陆地上最大的哺乳动物。它们的鼻子由超过4万块肌肉组成，既能拔起大树也能捡起一粒花生。' },
    { zh:'熊猫', en:'Panda', emoji:'🐼', sound:'', speech_zh:'animal/speech_zh/panda.mp3', speech_en:'animal/speech_en/panda.mp3', speech_fact:'animal/speech_fact/panda.mp3', image:'animal/images/panda.jpg',
      fact:'大熊猫是中国国宝，虽然属于食肉目，但99%的食物都是竹子，每天要花12-16小时进食。' },
    { zh:'老虎', en:'Tiger', emoji:'🐯', sound:'', speech_zh:'animal/speech_zh/tiger.mp3', speech_en:'animal/speech_en/tiger.mp3', speech_fact:'animal/speech_fact/tiger.mp3', image:'animal/images/tiger.jpg',
      fact:'老虎是世界上最大的猫科动物，每只老虎身上的条纹都是独一无二的，就像人类的指纹一样。' },
    { zh:'长颈鹿', en:'Giraffe', emoji:'🦒', sound:'', speech_zh:'animal/speech_zh/giraffe.mp3', speech_en:'animal/speech_en/giraffe.mp3', speech_fact:'animal/speech_fact/giraffe.mp3', image:'animal/images/giraffe.jpg',
      fact:'长颈鹿是地球上最高的陆地动物，脖子虽然很长，但颈椎骨数量和人类一样都是7块。' },
    { zh:'斑马', en:'Zebra', emoji:'🦓', sound:'', speech_zh:'animal/speech_zh/zebra.mp3', speech_en:'animal/speech_en/zebra.mp3', speech_fact:'animal/speech_fact/zebra.mp3', image:'animal/images/zebra.jpg',
      fact:'斑马的黑白条纹不仅是伪装，还能防蚊虫叮咬。每只斑马的条纹图案都是独一无二的。' },
    { zh:'企鹅', en:'Penguin', emoji:'🐧', sound:'', speech_zh:'animal/speech_zh/penguin.mp3', speech_en:'animal/speech_en/penguin.mp3', speech_fact:'animal/speech_fact/penguin.mp3', image:'animal/images/penguin.jpg',
      fact:'企鹅是鸟类中的游泳高手，帝企鹅可以潜入500米深的海水中，憋气超过20分钟。' },
    { zh:'海豚', en:'Dolphin', emoji:'🐬', sound:'', speech_zh:'animal/speech_zh/dolphin.mp3', speech_en:'animal/speech_en/dolphin.mp3', speech_fact:'animal/speech_fact/dolphin.mp3', image:'animal/images/dolphin.jpg',
      fact:'海豚是非常聪明的海洋哺乳动物，它们用超声波定位和交流，睡觉时大脑一半休息一半保持清醒。' },
    { zh:'猴子', en:'Monkey', emoji:'🐵', sound:'', speech_zh:'animal/speech_zh/monkey.mp3', speech_en:'animal/speech_en/monkey.mp3', speech_fact:'animal/speech_fact/monkey.mp3', image:'animal/images/monkey.jpg',
      fact:'猴子是灵长类动物中种类最丰富的一类，它们有复杂的社会结构，会使用工具和互相梳理毛发。' },
    { zh:'兔子', en:'Rabbit', emoji:'🐰', sound:'', speech_zh:'animal/speech_zh/rabbit.mp3', speech_en:'animal/speech_en/rabbit.mp3', speech_fact:'animal/speech_fact/rabbit.mp3', image:'animal/images/rabbit.jpg',
      fact:'兔子的耳朵可以转动270度，帮助它们听到远处的危险。它们高兴时会跳起来在空中转身，这叫binky。' },
    { zh:'猫', en:'Cat', emoji:'🐱', sound:'', speech_zh:'animal/speech_zh/cat.mp3', speech_en:'animal/speech_en/cat.mp3', speech_fact:'animal/speech_fact/cat.mp3', image:'animal/images/cat.jpg',
      fact:'猫是世界上最受欢迎的宠物之一。它们的胡须能感知空气的细微变化，帮助它们在黑暗中判断方向。' },
    { zh:'狗', en:'Dog', emoji:'🐶', sound:'', speech_zh:'animal/speech_zh/dog.mp3', speech_en:'animal/speech_en/dog.mp3', speech_fact:'animal/speech_fact/dog.mp3', image:'animal/images/dog.jpg',
      fact:'狗是人类最早驯化的动物，它们的嗅觉比人类灵敏1万到10万倍，能嗅出疾病和情绪变化。' },
    { zh:'马', en:'Horse', emoji:'🐴', sound:'', speech_zh:'animal/speech_zh/horse.mp3', speech_en:'animal/speech_en/horse.mp3', speech_fact:'animal/speech_fact/horse.mp3', image:'animal/images/horse.jpg',
      fact:'马可以站着睡觉，但需要躺下才能进入深度睡眠。它们的视野差不多达到360度。' },
    { zh:'牛', en:'Cow', emoji:'🐮', sound:'', speech_zh:'animal/speech_zh/cow.mp3', speech_en:'animal/speech_en/cow.mp3', speech_fact:'animal/speech_fact/cow.mp3', image:'animal/images/cow.jpg',
      fact:'牛有四个胃室来消化草料，它们能看到颜色，而且对红色其实并不敏感。' },
    { zh:'羊', en:'Sheep', emoji:'🐑', sound:'', speech_zh:'animal/speech_zh/sheep.mp3', speech_en:'animal/speech_en/sheep.mp3', speech_fact:'animal/speech_fact/sheep.mp3', image:'animal/images/sheep.jpg',
      fact:'绵羊有极好的记忆力，能记住50多张面孔长达两年。它们还能通过面部表情识别同伴的情绪。' },
    { zh:'鸡', en:'Chicken', emoji:'🐔', sound:'', speech_zh:'animal/speech_zh/chicken.mp3', speech_en:'animal/speech_en/chicken.mp3', speech_fact:'animal/speech_fact/chicken.mp3', image:'animal/images/chicken.jpg',
      fact:'鸡是世界上最常见的鸟类，全球养殖数量超过250亿只。它们能用超过30种不同的叫声来交流。' },
    { zh:'鸭子', en:'Duck', emoji:'🦆', sound:'', speech_zh:'animal/speech_zh/duck.mp3', speech_en:'animal/speech_en/duck.mp3', speech_fact:'animal/speech_fact/duck.mp3', image:'animal/images/duck.jpg',
      fact:'鸭子的脚掌不会感到冷，因为它们脚上的血管排列特殊，能回收热量。小鸭子会把出生后看到的第一个移动物体当妈妈。' },
    { zh:'鱼', en:'Fish', emoji:'🐟', sound:'', speech_zh:'animal/speech_zh/fish.mp3', speech_en:'animal/speech_en/fish.mp3', speech_fact:'animal/speech_fact/fish.mp3', image:'animal/images/fish.jpg',
      fact:'鱼类是地球上最古老的脊椎动物，已经存在超过5亿年。有些鱼能改变性别，有些能发电。' },
    { zh:'蝴蝶', en:'Butterfly', emoji:'🦋', sound:'', speech_zh:'animal/speech_zh/butterfly.mp3', speech_en:'animal/speech_en/butterfly.mp3', speech_fact:'animal/speech_fact/butterfly.mp3', image:'animal/images/butterfly.jpg',
      fact:'蝴蝶用脚来尝味道！它们的翅膀上覆盖着细小的鳞片，这些鳞片能反射光线产生绚丽的色彩。' },
    { zh:'青蛙', en:'Frog', emoji:'🐸', sound:'', speech_zh:'animal/speech_zh/frog.mp3', speech_en:'animal/speech_en/frog.mp3', speech_fact:'animal/speech_fact/frog.mp3', image:'animal/images/frog.jpg',
      fact:'青蛙的皮肤可以吸收水分和氧气，所以它们对环境污染特别敏感。它们是环境健康的"指示物种"。' },
    { zh:'鲨鱼', en:'Shark', emoji:'🦈', sound:'', speech_zh:'animal/speech_zh/shark.mp3', speech_en:'animal/speech_en/shark.mp3', speech_fact:'animal/speech_fact/shark.mp3', image:'animal/images/shark.jpg',
      fact:'鲨鱼比恐龙出现的时间还早，已经在地球上生存超过4亿年。它们一生会换掉超过3万颗牙齿。' }
];
