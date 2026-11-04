# 0.7.0 十二种小物

用户希望增加实际可配对的图案种类。原六种编号0–5保留，新增加6草莓、7冰淇淋、8柠檬、9礼物、10风车、11小熊。轻松8种/16格，标准10种/36格，挑战12种/48格；所有图案成对出现。轻松与标准先展示易识别的水果和礼物，挑战加入风车、小熊。新图案也可用于收藏卡。

使用内置image_gen工具生成补充图集，原toys-v6.png仅作为视觉风格参考。素材原件：
`/Users/steven/.codex/generated_images/01a1a478-d919-7303-aecf-d26ece0ec85b/exec-393ad2c4-5f23-4536-b474-1dbc5ce7d08c.png`。

项目保留PNG原件`src/assets/toys-v7-extra.png`，运行时使用`src/assets/toys-v7-extra.webp`。两套图集均由本机已有cwebp以-q 90编码，保留透明度；新包约1.3MiB。源PNG与既有版本未覆盖。没有采用竞品素材或角色。

状态从v3更新为v4并增加catalog：0保留旧六种分布，1使用新分布。旧库存补六个零，棋盘编号、得分、槽位与作品保持；旧v2分数转换后同样迁移。新开局才使用新图案分布。校验范围覆盖12种，不允许新编号在库存/作品恢复时丢失。

收集栏最多两行，每行六种；收藏页只显示本局存在的图案，按钮保留中文名称。未出现的种类不会占用空库存按钮。

## 生成提示词原文

Create a NEW supplementary game sprite atlas. Input image is STYLE REFERENCE ONLY: match its bright rounded glossy toy-like 3D game objects, lighting, saturation, bold silhouettes and cheerful original designs. Do NOT reuse any of its six objects. Transparent square canvas, exactly 3 columns × 2 rows, six isolated centered objects separated by generous fully transparent gutters. Top row: one plump coral strawberry with green leaves and pale seeds; one ice cream cone with a single mint-green scoop and a small pink scoop, golden waffle cone; one whole vivid yellow lemon with a single dark green leaf. Bottom row: one sky-blue gift box with broad coral ribbon and bow; one simple four-bladed rainbow pinwheel on a short lavender stick, blades colored red yellow green blue; one small honey-brown teddy bear with round ears, cream muzzle and belly, teal neck bow. All are original, clean polished family game sprites, orthographic slight three-quarter view, soft light, similar scale, objects fit within about 75% cell width and height, no overlapping cells, no background planes or badges, no letters or numbers, no text, no recognizable franchise characters. Readable at 44 pixels. Preserve full alpha transparency.
