# 小红书送审资料 0.8.0

- 名称：开心连连看（5/14）
- 简介：连一连，收集开心卡（9/14）
- 类目：休闲玩法（casual_game）
- 权限：相册（photos），用于用户主动保存奖励卡。无需麦克风、摄像头或定位。
- 图标：icon.png，512×512 PNG，1:1。
- 封面：cover.png，1080×1440 PNG，3:4。
- 代码包：运行 python3 scripts/build.py，产物 artifacts/kaixin-lianliankan-0.8.0.zip。
- SHA256：b51b231781095a3acf98ee25e5205784014154e6615d59ca8270753c1a95d399。

素材由 scripts/release-art.js 使用现有原创 Canvas 图形和游戏图集排版绘制，非测试占位图；源图出处见 docs/art-v6.md 和 art-v7.md。scripts/prepare-release-art.py 创建本地导出页，由页面下载图标和封面。图标与封面不进入游戏包。

送审依次使用 redapp upload、preview、submit 的 dry-run/confirm 协议。提交前须由用户扫码确认绑定同一代码包、图标、版本的预览通过。接口受理送审不等于已发布，须查询审核和展示状态。账户、fileId、计划与二维码记录存储在本机状态目录，不提交凭证。
