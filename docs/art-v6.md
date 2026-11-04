# 玩具小镇美术 · 0.6.0

2026-11-04。用户要求参考马里奥类游戏的明快、圆润、有趣的整体感，减少文字按钮，避免网页说明书式页面。本版保留连连看规则、记分与三档难度，将首页、棋盘、道具、收藏卡整体替换成原创玩具小镇。

## 视觉与交互

- 天蓝、草绿、奶黄与珊瑚色；圆润立体小物；六种物件保持原语义，旧棋盘和库存能继续恢复。
- 首页直接呈现小镇与开始游戏。主题使用小物图标，难度使用递增图形加短标签；主页、音乐、提示、取消使用原创SVG图形，并保留中文无障碍名称和提示。
- 说明放进右上角帮助；棋盘移至主视觉位置。连消弹跳、积分浮动和八枚彩屑只在操作后短暂运行，700毫秒后删除节点；支持减少动态效果设置。
- 首页可点中间小物，产生短暂问候和弹跳，不改变存档或消除逻辑。
- 完成后出现奖杯和领取收藏卡入口；三种收藏卡版式与游戏统一。
- 模型生成的是静态图像；运行时使用DOM、CSS、Canvas 2D与音频，没有3D引擎、Worker或WASM。

## 图像来源

通过内置 image_gen 工具生成新图，无参考图、无竞品图像、无角色或关卡素材输入。不是本地图片模型；此前“本地模型”要求用于配乐，配乐保持本地ACE-Step成品。

- 图集原件：`/Users/steven/.codex/generated_images/01a1a478-d919-7303-aecf-d26ece0ec85b/exec-e486c4de-4703-40bc-a66f-c3ad164ba0f7.png`
- 项目图集：`src/assets/toys-v6.png`，1280×1280，保留透明通道；绘制时按六个区域裁取，不改原图。
- 场景原件：`/Users/steven/.codex/generated_images/01a1a478-d919-7303-aecf-d26ece0ec85b/exec-5a3b0402-abbc-44a0-af77-88796d9b2704.png`
- 项目场景：`src/assets/world-v6.png`原件；运行时使用`src/assets/world-v6.jpg`，由sips按85质量编码。原PNG不进入发布包。
- 原创界面SVG路径在`src/ui.js`，没有外部图标库或字体。

## 图集生成提示词（原文）

Use case: stylized-concept. Create a production game sprite atlas for an original joyful colorful toy-town matching puzzle, polished stylized 3D platform-adventure art, rounded tactile shapes, vibrant saturated candy colors, soft studio light and crisp silhouettes readable at 44px. Transparent background. Square canvas precisely divided into 3 columns by 2 rows of equal cells, exactly six isolated objects, one centered in each cell with generous transparent gutters, no objects touching another cell. Top row left to right: a coral-red coffee mug filled with cream with a tiny happy face; a chunky sky-blue toy camera with big round navy lens and yellow shutter; a bouquet of three rounded pink and yellow tulips in mint wrapper. Bottom row left to right: a golden-orange croissant with puffy segments; a lavender tote bag with pale yellow handles and a small flower patch; a pair of glossy red cherries with a bright green leaf. Each object occupies about 70 percent cell width and height, orthographic three-quarter view, similar visual scale. Strong simple forms, original designs, clean toy-like materials, no photorealism, no watercolor, no vintage paper, no text, no logos, no Nintendo/Mario characters or franchise symbols. This is a sprite sheet, not a scene or UI mockup.

## 场景生成提示词（原文）

Use case stylized-concept. Create a wide 3:2 landscape background illustration for an original mobile matching puzzle toy-town. High craft cheerful stylized 3D adventure-game world, tactile rounded vinyl toys, vivid sky cyan, grassy lime green, coral roofs, butter yellow pathways. A tiny welcoming hilltop cafe with red-and-cream striped awning on left, a flower shop with lavender roof on right, a winding warm yellow garden path toward foreground center. Friendly tiny original cream-colored round long-eared creature gardener standing by pink tulips, with mint scarf, no clothes or accessories resembling famous game characters. Flower garden, rounded colorful hedges, two big soft white clouds. Simple joyful diorama with clear silhouettes, soft sunlight, no clutter, no text or signs or letters, no UI, no title, no frame. Slight top-down perspective with foreground open green oval clearing, rich layered depth. Inviting playful premium family game art. No existing franchise characters, no mushrooms, pipes, question blocks, coins, castles, or recognizable Nintendo assets. Full bleed image, polished 3D rendered illustration, not watercolor or realistic photo.

本记录说明素材来源和设计边界，不将生成过程视为独占版权或法律清权保证。
