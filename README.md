# 开心连连看

小红书离线小工具首版。根据 [issue #1](https://github.com/springwq/garden-connect-mini-tool/issues/1) 与用户后续要求重新设计命名、美术、元素与玩法。

明快的原创玩具小镇风格连连看：三档棋盘：轻松4×4、标准6×6、挑战6×8；十二种小物，三档分别出现8/10/12种。相同图案沿空路连接，最多两次转弯，支持棋盘外侧绕行。每对消除收集一件，分别清盘收集8/18/24件；无倒计时，可提示，无路可连时自动重排。

通关后自动获得一张1080×1440奖励卡，无拼贴或填写步骤。分数越高卡片星级越高：元气、闪亮（700分）、珍藏（2400分）、梦幻（4300分）、典藏（4800分）。12种原创小物主题，按本局固定id生成，刷新不重抽；自动保留最近12张卡，旧拼贴仍可查看。界面与成品均使用中文。

记分按难度每对50/100/150分，连续正确配对逐次额外加10分、最高额外50分；提示、误配或重排中断连续加分，不扣已有得分。清盘再加基础分两倍，各难度分别保存通关最高分。

0.7.1配乐改为原创程序合成（108 BPM、16小节循环），音效也使用Web Audio；默认配乐关、音效开，用户主动触发，后台停止。原ACE-Step模型配乐保留在工作区，来源见 `docs/music-source.md`。首页小镇、立体小物、图形道具、弹跳消除和收藏卡统一采用玩具风格。

## 本地运行

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory src
```

浏览器访问 http://127.0.0.1:4173 。普通浏览器不会调用相册/笔记；本地回归不构成小红书容器验收。

## 构建

```sh
python3 scripts/build.py
```

静态目录 `dist/0.8.0/`；产物 `artifacts/kaixin-lianliankan-0.8.0.zip`，校验记录 `artifacts/build-report.json`。构建依赖 Python 3 和 Node.js，无运行时第三方依赖。包内只有经典脚本、样式、HTML、WebP图集、JPEG场景与能力标记，不包含音频文件。

## 验证

本轮实施前失败场景见 `docs/score-difficulty-acceptance.md`；连连看恢复的历史场景见 `docs/connect-acceptance.md`。连线、外圈绕行、三次转弯拒绝、布局可解性和有界重排检查由 `node scripts/connect-check.cjs` 执行；这些隔离检查先于新规则模块编写。

`scripts/browser-regression.mjs` 导出 Codex Browser skill 的 `regression(tab, browser, fs, outputDir, runs=3)`。前提为本地服务器启动、页面位于一局新的或部分完成的连连看棋盘。它继续清盘并轮换布局，检查四种宽度、十八件奖励、搭配库存、进度恢复、最近作品，保存截图和报告。单次完整三局调用应设置足够的执行超时（如180秒），或分局运行。

玩具风格端到端回归脚本为 `scripts/toy-regression.mjs` 的 `toyRegression(tab,browser,fs,output)`，从无最高分的独立预览来源运行，检查三档通关、四种宽度、刷新恢复及新收藏卡；证据保存在 `artifacts/toy-0.6.0/`。

之前三档记分回归在 `artifacts/features-0.5.0/`（脚本 `scripts/feature-regression.mjs`），旧版三对存档迁移报告为该目录下 `migration.json`。之前连连看版本的证据在 `artifacts/connect-regression/`。`reshuffle.json` 记录第3种棋盘的十六步配对顺序（索引从零开始）；照此点选可复现实际自动重排，重排后剩余四张牌、库存共十六件。历史路线玩法回归保留在 `scripts/route-regression-legacy.mjs`，不适用于当前版本。

真实发布前，须用相同ZIP在创服平台模拟器、Android真机和iOS真机验证；相册实际输出、权限拒绝、发布取消、Chrome 61兼容性及存储故障注入尚待实测。API实现依据2026-11-04获取的官方文档。

## 设计与来源

`docs/design.md` 记录新版玩法、与原PRD的差异及素材来源。原六种物件与小镇场景使用内置 imagegen 生成，图形道具由原创SVG绘制，收藏卡由Canvas构图；生成提示词和来源见 docs/art-v6.md。使用系统字体，未使用竞品素材、音乐、关卡或代码。工作名未作完整重名/商标检索。未设置开源许可，后续由仓库所有者决定。

0.6.1统一更名为“开心连连看”，包含新的本地玩具风配乐、普通配对/连消/通关四种原创短音效。音效默认开启、配乐默认关闭，分别控制；音效验收场景为docs/audio-feedback-acceptance.md，专项UI回归为scripts/audio-regression.mjs，证据位于artifacts/audio-0.6.1/。

0.7.0新增草莓、冰淇淋、柠檬、礼物、风车和小熊，详见docs/art-v7.md。旧六种存档继续使用旧分布，新局采用扩充目录；规则验收场景见docs/catalog-acceptance.md，UI回归脚本为scripts/catalog-regression.mjs，证据目录artifacts/catalog-0.7.0/。

0.7.1修复平台拒绝MP3包的问题。验收场景见docs/web-audio-acceptance.md；scripts/prepare-audio-qa.py生成独立的真实Web Audio观测页，scripts/web-audio-regression.mjs通过实际UI通关，报告在artifacts/audio-0.7.1/browser-audio.json。观测脚本和诊断控件不进入上传包。

0.8.0奖励验收：docs/reward-acceptance.md。scripts/reward-regression.mjs验证三档整局自动发卡和收藏恢复；scripts/prepare-reward-qa.mjs生成隔离边界及旧存档场景，使用scripts/serve-preview.py在4187端口启动后运行scripts/reward-boundaries.mjs。报告和截图位于artifacts/rewards-0.8.0/。
