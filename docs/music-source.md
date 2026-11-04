# 小物连连看 · 本地生成配乐

用户要求使用本地模型，并明确需要用于正式发布。未采用本机原有的MusicGen权重（非商用许可）。采用ACE-Step 1.5，官方模型卡标注MIT并明确支持生成音乐的商业用途；不把这一说明当作对任何输出独创性、独占版权或不侵权的绝对保证。

- 官方模型及说明：https://huggingface.co/ACE-Step/Ace-Step1.5
- 官方代码：https://github.com/ace-step/ACE-Step-1.5
- 代码版本：ca1e85fe9430179831e6bc6be790c332190a3866
- 权重版本：19671f406d603126926c1b7e2adc169acbcade22
- 模型许可原文：artifacts/music/ACE-Step-LICENSE.txt
- 本机安装：/Users/steven/.local/share/codex/music/ace-step-1.5，使用该目录下独立.venv；没有改系统Python。
- 苹果芯片本地推理，生成过程设置HF_HUB_OFFLINE与TRANSFORMERS_OFFLINE；不调用远程生成接口。
- 提示词、种子和输出路径由scripts/generate_music.py及artifacts/music/generation.json记录。
- 不使用参考歌曲、歌手姓名、已有作品旋律、歌词或采样。

下载Hugging Face大文件中断后，从官方链接提供的ModelScope模型仓库获取对应权重，并与所选Hugging Face版本的SHA256比对：

- acestep-v15-turbo/model.safetensors：3f6e0797fad420a39bd33979eb6e840e30989e34a3794e843d23b60ec6e422d7
- acestep-5Hz-lm-1.7B/model.safetensors：f161689da73e5ecefa28ff780d51c2d92a00f056d021d7933c779ed5c6cd7db8

主配乐采用吉他、柔和钢琴、轻打击与低音的纯音乐方向。音乐默认关闭，主动开启后播放，切后台暂停，再次点击开启可继续；音乐加载失败不阻塞游戏。最终包只包含处理后的音频文件，不包含模型或推理依赖。

原始生成音轨保留在artifacts/music；scripts/prepare_music.py用1.5秒等功率交叉淡化处理首尾，随后压缩为包内MP3。循环点、峰值与时长报告会随产物保留。

## 本次成品

原始音轨为32秒、48kHz双声道，生成成功日志与元信息已保存。处理后配乐为30.25秒循环，包内文件src/assets/idle-afternoon.mp3：44.1kHz双声道、96kbps、363,983字节。交叉淡化后的波形峰值0.75、相邻循环点差0.00262；之后使用FFmpeg loudnorm将目标响度设为-20 LUFS、真峰值上限-2 dBTP。处理参数见scripts/prepare_music.py，编码结果见artifacts/music/encoding.log。

试听与正式发布前仍需人工听审具体成品；此记录证明生成和处理来源，不声称经过人工音乐质量或法律清权审核。

## 0.6.1 玩具风配乐与音效

用户反馈原咖啡氛围配乐不合适，改用同一本地ACE-Step 1.5模型生成更轻快的玩具小镇方向：木琴主旋律、拨弦应答、轻铃声、木块与沙锤，108 BPM、C大调、种子20261105。原始32秒音轨、完整提示词和离线推理记录保存在artifacts/music-toy/generation.json及generation.log。经同样交叉淡化和音量处理，运行时切换至src/assets/toy-parade.mp3，30.25秒循环。旧配乐保留在工作区，不进入当前发布包。可以复现：generate_music.py新增--style toy。

新增四个短音效：普通配对、连续配对、较高连消、通关。音效通过scripts/generate_sfx.py在本地以确定性加法合成生成，无外部歌曲、采样或在线生成；它们不是模型生成。波形与音符参数在artifacts/sound-effects/。音效默认开启，仅由成功消除触发；独立按钮可关闭并保存偏好。背景音乐默认关闭，开关互不影响。页面隐藏时暂停所有短音效；延迟播放回调带有请求标记，避免旧回调关闭新的播放。

风格和听感由用户试听判断；自动检查只确认文件、播放状态和交互，不能替代人工听审。

## 0.7.1 平台适配

2026-11-04平台preview接口拒绝assets/toy-parade.mp3，官方文件白名单不含音频类型。用户在独立小红书诊断预览确认三种Web Audio声音均可听见，并选择先用原创程序合成配乐。当前运行时为src/sound.js中的108 BPM、16小节旋律，加正弦木琴、三角波和弦和低音；不是ACE-Step输出或转码，不含现成作品采样。消除、连消、高连消、通关四组音阶实时合成。原模型MP3与生成文件均保留但不打进0.7.1。设备系统未提供，完整游戏仍待手机试听和双端验收。
