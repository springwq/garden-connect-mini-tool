(function () {
  "use strict";
  var names = ["咖啡", "相机", "花束", "可颂", "布包", "樱桃", "草莓", "冰淇淋", "柠檬", "礼物", "风车", "小熊"],
    papers = ["#c7eef4", "#ffe6bc", "#eddcf5"],
    inks = ["#9c3f3c", "#354e69"];
  var $ = function (id) {
      return document.getElementById(id);
    },
    key = "fengwu.v1",
    state = null,
    recent = [],
    records = [0, 0, 0],
    draftDifficulty = 1,
    musicEnabled = false,
    effectsEnabled = true, effects = null,
    sound = null,
    rules = window.WeekendConnect,
    hintPair = null,
    matching = false,
    matchTimer = null,
    activeLine = null,
    busy = false,
    version = 0,
    platform = null,
    storePlatform = false,
    queue = Promise.resolve(),
    lastSeed = 0, draftTheme = 0;
  function say(t) {
    $("notice").textContent = t;
  }
  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }
  function date() {
    var d = new Date();
    return (
      d.getFullYear() +
      "." +
      String(d.getMonth() + 1).padStart(2, "0") +
      "." +
      String(d.getDate()).padStart(2, "0")
    );
  }
  function motif(c, k, x, y, r) {
    window.FengwuArt.stamp(c, k, x, y, r);
  }
  function icon(k, size) {
    var ca = document.createElement("canvas");
    ca.width = ca.height = size || 96;
    motif(ca.getContext("2d"), k, ca.width / 2, ca.height / 2, ca.width * 0.46);
    return ca;
  }
  function btn(text, fn) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = text;
    b.addEventListener("click", fn);
    return b;
  }
  function clear(id) {
    $(id).textContent = "";
  }
  function show(id, preserve) {
    var changed = $(id).hidden;
    $("app").dataset.screen = id;
    if (changed) $("help").open = false;
    ["landing", "game", "result"].forEach(function (s) {
      $(s).hidden = s !== id;
    });
    if (state && !preserve && id !== "landing") state.screen = id;
    if (changed) window.scrollTo(0, 0);
  }
  function validRecipe(r) {
    if (r && r.type === "reward") return window.GameRewards.valid(r);
    return (
      r &&
      Array.isArray(r.slots) &&
      r.slots.length === 5 &&
      r.slots.every(function (v) {
        return Number.isInteger(v) && v >= 0 && v < names.length;
      }) &&
      Number.isInteger(r.paper) &&
      r.paper >= 0 &&
      r.paper < 3 &&
      Number.isInteger(r.ink) &&
      r.ink >= 0 &&
      r.ink < 2 &&
      typeof r.message === "string" &&
      Array.from(r.message).length <= 20 &&
      typeof r.date === "string" &&
      /^\d{4}\.\d{2}\.\d{2}$/.test(r.date) &&
      typeof r.id === "string"
    );
  }
  function validState(s) {
    if (!s || s.v !== 4 || ![0, 1].includes(s.catalog) || !Number.isInteger(s.level) || !rules.difficulty(s.level) || !Number.isInteger(s.seed) || s.seed < 1 || s.seed > 3 ||
        !Array.isArray(s.board) || s.board.length !== rules.difficulty(s.level).cols * rules.difficulty(s.level).rows ||
        !Array.isArray(s.inventory) || s.inventory.length !== names.length ||
        !Array.isArray(s.slots) || s.slots.length !== 5 ||
        !["game", "studio", "result"].includes(s.screen) ||
        !Number.isInteger(s.reorders) || s.reorders < 0 || s.reorders > rules.difficulty(s.level).pairs ||
        typeof s.message !== "string" || Array.from(s.message).length > 20 ||
        !Number.isInteger(s.paper) || s.paper < 0 || s.paper > 2 ||
        !Number.isInteger(s.ink) || s.ink < 0 || s.ink > 1 ||
        typeof s.id !== "string" || typeof s.date !== "string" ||
        !/^\d{4}\.\d{2}\.\d{2}$/.test(s.date)) return false;
    var spec = rules.difficulty(s.level, s.catalog);
    var left = names.map(function(){return 0;}), used = names.map(function(){return 0;});
    if (!s.board.every(function (k) {
      if (k === null) return true;
      if (!Number.isInteger(k) || k < 0 || k >= names.length) return false;
      left[k]++; return true;
    })) return false;
    if (!s.inventory.every(function (v, k) {
      return Number.isInteger(v) && v >= 0 && v <= spec.counts[k] / 2 && left[k] + v * 2 === spec.counts[k];
    })) return false;
    if (!s.slots.every(function (k) {
      if (k === null) return true;
      if (!Number.isInteger(k) || k < 0 || k >= names.length) return false;
      used[k]++; return used[k] <= s.inventory[k];
    })) return false;
    if (s.selected !== null && (!Number.isInteger(s.selected) || s.selected < 0 ||
        s.selected >= s.board.length || s.board[s.selected] === null)) return false;
    var pairs = s.inventory.reduce(function (a, b) { return a + b; }, 0);
    var bonus = pairs === spec.pairs ? spec.base * 2 : 0;
    if (!Number.isInteger(s.score) || s.score % 10 !== 0 || s.score < pairs * spec.base + bonus ||
        s.score > pairs * (spec.base + 50) + bonus || !Number.isInteger(s.streak) ||
        s.streak < 0 || s.streak > Math.min(pairs, 6)) return false;
    if (s.reward === 1 && !window.GameRewards.valid(window.GameRewards.create(s))) return false;
    return (s.screen === "game" || s.board.every(function (k) { return k === null; })) &&
      (s.screen !== "result" || s.reward === 1 || s.slots.every(function (k) { return k !== null; }));
  }
  function persist() {
    var data = JSON.stringify({
      state: state,
      recent: recent,
      lastSeed: lastSeed,
      records: records, difficulty: draftDifficulty, musicEnabled: musicEnabled, effectsEnabled: effectsEnabled,
    });
    queue = queue.then(async function () {
      try {
        if (storePlatform) await platform.setStorage({ key: key, data: data });
        else localStorage.setItem(key, data);
      } catch (e) {
        say("本次无法保存进度；可以继续玩，退出后可能无法恢复。");
      }
    });
    return queue;
  }
  function config() { return rules.difficulty(state.level, state.catalog); }
  function migrate(s) {
    if (!s || ![2,3].includes(s.v) || !Array.isArray(s.inventory) || s.inventory.length !== 6) return s;
    var copy = clone(s);
    if (copy.v === 2) {
      var pairs = copy.inventory.reduce(function (a,b) {return a+b;},0);
      copy.level = 1; copy.streak = 0;
      copy.score = pairs * 100 + (pairs === 18 ? 200 : 0);
    }
    copy.v = 4; copy.catalog = 0;
    copy.inventory = copy.inventory.concat([0,0,0,0,0,0]);
    return copy;
  }
  function countPairs() {
    return state.inventory.reduce(function (a, b) { return a + b; }, 0);
  }
  function newGame() {
    if (busy || matching) return;
    if (state && state.screen !== "result" &&
        !confirm("开新的一局会替换当前进度，继续吗？")) return;
    lastSeed = (lastSeed % 3) + 1;
    state = {
      v: 4, catalog: 1, id: String(Date.now()), seed: lastSeed, level: draftDifficulty, score: 0, streak: 0,
      board: rules.createBoard(lastSeed, draftDifficulty), selected: null, reorders: 0,
      inventory: names.map(function(){return 0;}), slots: [null, null, null, null, null],
      paper: draftTheme, ink: 0, message: "今天也收获了开心", date: date(), screen: "game"
    };
    hintPair = null;
    say(""); renderGame(); persist();
    if (musicEnabled) sound.resume();
  }
  function ensureMoves() {
    if (countPairs() === config().pairs || rules.findPair(state.board, config().cols)) return;
    state.reorders++;
    state.board = rules.reshuffle(state.board, state.seed * 31 + state.reorders, 12, config().cols);
    state.selected = null; hintPair = null; state.streak = 0;
    say("刚才没有能连的小物，已重新摆好；收集到的都还在。");
    persist();
  }
  function renderGame() {
    if (countPairs() === config().pairs) { grantReward(); return; }
    show("game");
    ensureMoves();
    var spec = config(), count = countPairs(), done = count === spec.pairs;
    $("chapter").textContent = spec.name + "小镇";
    $("matched").textContent = count + " / " + spec.pairs;
    $("score").textContent = state.score;
    $("best").textContent = records[state.level] || "—";
    $("streak").textContent = state.streak > 1 ? "连消 " + state.streak + " 次 · 下对 +" + Math.min(state.streak, 5) * 10 : "找一对喜欢的小物";
    $("score-rules").textContent = "每对 " + spec.base + " 分；连续配对从第二对额外加10分，逐次增加，上限50分。误配、提示或重排中断连续加分；不扣已有得分。通关另加 " + spec.base * 2 + " 分。";
    $("board").style.gridTemplateColumns = "repeat(" + spec.cols + ",minmax(0,1fr))";
    $("board").setAttribute("aria-label", spec.rows + "行" + spec.cols + "列连连看棋盘");
    $("progress").setAttribute("aria-valuemax", String(spec.pairs));
    $("progress").setAttribute("aria-valuenow", String(count));
    $("progress-fill").style.width = (count / spec.pairs * 100) + "%";
    clear("board");
    state.board.forEach(function (k, i) {
      var b = btn("", function () { select(i); });
      b.setAttribute("aria-label", "第" + (i + 1) + "格 " + (k === null ? "已收集" : names[k]));
      b.setAttribute("aria-pressed", String(i === state.selected));
      b.dataset.cell = i;
      if (k !== null) b.dataset.kind = k;
      if (k !== null) b.appendChild(icon(k));
      b.className = k === null ? "empty" : (i === state.selected ? "chosen" : "");
      if (hintPair && (hintPair.a === i || hintPair.b === i)) b.classList.add("hinted");
      b.disabled = k === null || matching;
      $("board").appendChild(b);
    });
    drawConnection(null);
    $("game-status").textContent = done ? "已收集 " + spec.pairs + " 件小物，通关得分 " + state.score + "。" :
      state.selected === null ? "点两件相同的小物，把它们连起来。" : "再选一件相同的小物。";
    $("victory").hidden = !done;
    $("undo").disabled = matching || state.selected === null;
    $("hint").disabled = matching || done;
    clear("collection");
    names.forEach(function (n,k) {
      if(!spec.counts[k])return;
      var el=document.createElement("span"), count=document.createElement("small");
      el.setAttribute("aria-label",n+" "+state.inventory[k]);
      el.appendChild(icon(k,64));count.textContent=state.inventory[k];el.appendChild(count);$("collection").appendChild(el);
    });
  }
  function drawConnection(points) {
    var spec = config(), ca = $("connection"), board = $("board"), rect = board.getBoundingClientRect();
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    ca.width = Math.round(rect.width * ratio); ca.height = Math.round(rect.height * ratio);
    var c = ca.getContext("2d"); c.scale(ratio, ratio);
    if (!points) return;
    function center(p) {
      var cell = board.children[Math.max(0, Math.min(spec.rows - 1, p.y)) * spec.cols + Math.max(0, Math.min(spec.cols - 1, p.x))];
      var r = cell.getBoundingClientRect();
      return { x: p.x < 0 ? 4 : p.x >= spec.cols ? rect.width - 4 : r.left - rect.left + r.width / 2,
        y: p.y < 0 ? 4 : p.y >= spec.rows ? rect.height - 4 : r.top - rect.top + r.height / 2 };
    }
    c.strokeStyle = "#fff3a1"; c.lineWidth = 5; c.shadowColor="#e8a639"; c.shadowBlur=7; c.lineJoin = c.lineCap = "round";
    c.beginPath();
    points.forEach(function (p, i) { var q = center(p); if (i) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y); });
    c.stroke();
  }
  function finishMatch() {
    if (!matching) return;
    clearTimeout(matchTimer); matchTimer = null; matching = false; activeLine = null;
    renderGame(); persist();
  }
  function select(i) {
    if (matching || busy || document.hidden || state.board[i] === null) return;
    hintPair = null;
    if (state.selected === i) {
      state.selected = null; say(""); renderGame(); persist(); return;
    }
    if (state.selected === null) {
      state.selected = i; say(""); renderGame(); persist(); return;
    }
    var a = state.selected, route = rules.connect(state.board, a, i, config().cols);
    if (!route) {
      state.streak = 0;
      say(state.board[a] !== state.board[i] ? "选两件相同的小物试试。" : "这里被挡住了，连线最多转两次弯。");
      state.selected = i; renderGame(); persist(); return;
    }
    matching = true;
    var kind = state.board[i];
    // Commit the pair and reward together before the purely visual transition.
    state.board[a] = state.board[i] = null; state.inventory[kind]++; state.selected = null;
    var previousScore = state.score;
    var result = rules.award(state.level, state.score, state.streak, countPairs() === config().pairs);
    state.score = result.score; state.streak = result.streak;
    if(effects)effects.play(state.streak,countPairs() === config().pairs);
    if (countPairs() === config().pairs) records[state.level] = Math.max(records[state.level], state.score);
    persist(); say("");
    Array.from($("board").children).forEach(function (button, index) {
      button.disabled = true;
      if (index === a || index === i) button.classList.add("matched");
    });
    $("hint").disabled = $("undo").disabled = true;
    $("game-status").textContent = "找到一件" + names[kind] + "。";
    activeLine = route; drawConnection(route);
    burst(i, state.score - previousScore);
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    matchTimer = setTimeout(finishMatch, reduced ? 0 : 340);
  }
  function burst(index, points) {
    var target=$("board").children[index].getBoundingClientRect(), base=$("board-wrap").getBoundingClientRect();
    var x=target.left-base.left+target.width/2,y=target.top-base.top+target.height/2;
    var layer=$("match-fx"), score=document.createElement("span");
    score.className="score-pop";score.textContent="+"+points;score.style.left=x+"px";score.style.top=y+"px";layer.appendChild(score);
    var elements=[score], colors=["#ffe565","#ff897b","#fffbd4","#a0d89b"];
    for(var n=0;n<8;n++){
      var p=document.createElement("i"), angle=n*Math.PI/4;p.className="confetti";
      p.style.left=x+"px";p.style.top=y+"px";p.style.background=colors[n%4];
      p.style.setProperty("--dx",Math.cos(angle)*46+"px");p.style.setProperty("--dy",Math.sin(angle)*42-20+"px");
      layer.appendChild(p);elements.push(p);
    }
    setTimeout(function(){elements.forEach(function(el){if(el.parentNode)el.parentNode.removeChild(el);});},700);
  }
  function grantReward() {
    if (countPairs() !== config().pairs) return;
    state.reward = 1; state.screen = "result";
    remember(); say(""); renderResult();
  }
  function recipe() {
    if (state.reward === 1) return window.GameRewards.create(state);
    return {
      id: state.id,
      slots: state.slots.slice(),
      paper: state.paper,
      ink: state.ink,
      message: state.message,
      date: state.date,
    };
  }
  function remember() {
    var r = recipe();
    recent = [r]
      .concat(
        recent.filter(function (v) {
          return v.id !== r.id;
        }),
      )
      .slice(0, 12);
    persist();
  }
  function drawCard(ca, r) {
    var c = ca.getContext("2d");
    if (!c) throw Error("canvas");
    if (r.type === "reward") window.FengwuArt.reward(c, r);
    else window.FengwuArt.page(c, r, papers[r.paper], inks[r.ink]);
  }
  var viewing = null;
  function renderResult(old) {
    show("result", !!old);
    viewing = old || null;
    var r = old || recipe();
    try {
      drawCard($("card"), r);
    } catch (e) {
      say("卡片暂时没能显示，奖励已收藏；可回首页再次打开。");
    }
    var isReward = r.type === "reward", grade = isReward ? window.GameRewards.tier(r.score) : 0;
    $("result-title").textContent = isReward ? window.GameRewards.titles[r.kind] : "快乐已收藏";
    $("reward-grade").textContent = isReward ? window.GameRewards.tiers[grade].name + "卡 · " + (grade + 1) + "星" : "往日收藏";
    $("reward-grade").style.background = isReward ? window.GameRewards.tiers[grade].color : "#4a9b80";
    $("round-summary").textContent = isReward ? rules.difficulty(r.level).name + "通关 · " + r.score + "分" : r.date;
    $("reward-next").textContent = !isReward ? "" : grade === 4 ? "最高等级，漂亮的一局！" :
      window.GameRewards.tiers[grade + 1].min > [750,2750,4950][r.level] ? "试试更高难度，收集更高星级的卡" :
      "再多 " + (window.GameRewards.tiers[grade + 1].min - r.score) + " 分，可获" + window.GameRewards.tiers[grade + 1].name + "卡";
    $("card").setAttribute("aria-label", isReward ? window.GameRewards.tiers[grade].name + "卡：" + window.GameRewards.titles[r.kind] + "，" + r.score + "分" : "往日收藏卡");
    $("save").disabled = !(
      platform &&
      version >= 9420 &&
      typeof platform.saveImageToPhotosAlbum === "function"
    );
    $("share").disabled = !(
      platform && typeof platform.postNote === "function"
    );
    $("export-notice").textContent = $("save").disabled && $("share").disabled
      ? "当前环境不支持相册和笔记入口。卡片已在本机收藏。" : "";
    if (!old) persist();
  }
  async function exportCard(kind) {
    if (busy) return;
    busy = true;
    var button = $(kind);
    button.disabled = true;
    try {
      var data = $("card").toDataURL("image/png");
      if (platform && typeof platform.writeTempFile === "function") {
        var tmp = await platform.writeTempFile({ data: data });
        if (!tmp || !tmp.filePath) throw Error("missing path");
        data = tmp.filePath;
      }
      if (kind === "save") {
        await platform.saveImageToPhotosAlbum({ filePath: data });
        say("已保存到相册。");
      } else {
        await platform.postNote({
          title: "开心连连看：我的快乐收藏",
          content: (viewing || recipe()).message,
          pageType: "photo_publish",
          mediaInfo: { image_resources: [{ url: data }] },
        });
        say("笔记流程已返回；发布与审核结果请在小红书中确认。");
      }
    } catch (e) {
      say(
        kind === "save"
          ? "未能保存到相册，请检查权限后重试。作品仍在。"
          : "未完成笔记操作，可以重试，作品仍在。",
      );
    } finally {
      busy = false;
      button.disabled = false;
    }
  }
  function themeTabs() {
    clear('themes');
    ['快乐出发','甜甜补给','花开好心情'].forEach(function(label,i){
      var b=btn(label,function(){draftTheme=i;themeTabs();});
      b.setAttribute('aria-pressed',String(i===draftTheme));
      b.setAttribute('aria-label',label);b.title=label;b.textContent='';b.appendChild(icon([1,0,2][i],72));
      b.className=i===draftTheme?'active':'';
      $('themes').appendChild(b);
    });
    window.FengwuArt.cover($('hero').getContext('2d'), draftTheme);
  }
  function difficultyTabs() {
    clear("difficulties");
    [0, 1, 2].forEach(function (level) {
      var spec = rules.difficulty(level), b = btn("", function () {
        draftDifficulty = level; difficultyTabs(); persist();
      });
      var name = document.createElement("strong"), detail = document.createElement("small");
      name.textContent = spec.name; detail.textContent = spec.cols + "×" + spec.rows + " · " + spec.pairs + "对";
      var mark=document.createElement("span");mark.className="difficulty-mark";mark.setAttribute("aria-hidden","true");
      for(var dot=0;dot<3;dot++){var shape=document.createElement("i");if(dot<=level)shape.className="on";mark.appendChild(shape);}
      b.appendChild(mark);b.appendChild(name); b.appendChild(detail);
      b.setAttribute("aria-label",spec.name+"，"+spec.pairs+"对");b.title=spec.name+" · "+spec.pairs+"对 · "+spec.counts.filter(function(n){return n>0;}).length+"种小物";
      b.className = level === draftDifficulty ? "selected" : "";
      b.setAttribute("aria-pressed", String(level === draftDifficulty));
      $("difficulties").appendChild(b);
    });
    var best = records[draftDifficulty];
    $("difficulty-note").textContent = best ? "最高纪录 " + best + " 分" : "不限时 · 选好就出发";
  }
  function landing() {
    show("landing");
    $("resume").hidden = !state;
    themeTabs();
    difficultyTabs();
    clear("recent");
    if (recent.length) {
      var h = document.createElement("h3");
      h.textContent = "我的收藏卡";
      $("recent").appendChild(h);
      recent.forEach(function (r) {
        $("recent").appendChild(
          (function () {
            var reward = r.type === "reward";
            var title = reward ? window.GameRewards.tiers[window.GameRewards.tier(r.score)].name + " · " + window.GameRewards.titles[r.kind] : "往日收藏";
            var button = btn("", function () { say(""); renderResult(r); });
            button.setAttribute("aria-label", title + " · " + r.date);
            if (reward) button.appendChild(icon(r.kind));
            var label = document.createElement("strong"); label.textContent = title; button.appendChild(label);
            var detail = document.createElement("small"); detail.textContent = reward ? r.score + "分" : r.date; button.appendChild(detail);
            return button;
          })(),
        );
      });
    }
  }
  async function safeArea() {
    if (
      platform &&
      version >= 9490 &&
      typeof platform.getWindowInfo === "function"
    )
      try {
        var w = await platform.getWindowInfo(),
          top = Math.max(20, w.safeArea ? w.safeArea.top : 0);
        Object.keys(w.menuButtons || {}).forEach(function (k) {
          var b = w.menuButtons[k];
          if (b && b.top < 120) top = Math.max(top, b.bottom + 12);
        });
        $("app").classList.add("native-safe-area");
        document.documentElement.style.setProperty("--top", top + "px");
        document.documentElement.style.setProperty(
          "--bottom",
          Math.max(20, w.safeArea ? w.windowHeight - w.safeArea.bottom : 0) +
            "px",
        );
      } catch (e) {}
  }
  async function init() {
    try {
      await window.FengwuArt.ready;
    } catch (error) {
      say("小物件图片没加载出来，再试一次吧。");
      $("notice").appendChild(
        btn("重新加载", function () {
          window.location.reload();
        }),
      );
      return;
    }

    platform = window.xhs && window.xhs.miniTool;
    var opt = window.xhs && window.xhs.launchOptions;
    try {
      if (
        !(opt && opt.miniToolEnv) &&
        platform &&
        typeof platform.getLaunchOptions === "function"
      )
        opt = await platform.getLaunchOptions();
    } catch (e) {}
    version = Math.floor(
      Number((opt && opt.miniToolEnv && opt.miniToolEnv.buildVersion) || 0) /
        1000,
    );
    storePlatform = !!(
      version >= 9460 &&
      platform &&
      typeof platform.getStorage === "function" &&
      typeof platform.setStorage === "function"
    );
    try {
      var raw;
      if (storePlatform) {
        var answer = await platform.getStorage({ key: key });
        raw = answer && answer.data;
        if (!raw) {
          try {
            raw = localStorage.getItem(key);
          } catch (e) {}
        }
      } else raw = localStorage.getItem(key);
      if (raw) {
        var saved = JSON.parse(raw);
        recent = Array.isArray(saved.recent)
          ? saved.recent.filter(validRecipe).slice(0, 12)
          : [];
        lastSeed =
          Number.isInteger(saved.lastSeed) &&
          saved.lastSeed >= 0 &&
          saved.lastSeed <= 3
            ? saved.lastSeed
            : 0;
        if (Number.isInteger(saved.difficulty) && rules.difficulty(saved.difficulty)) draftDifficulty = saved.difficulty;
        musicEnabled = saved.musicEnabled === true;
        effectsEnabled = saved.effectsEnabled !== false;
        if (Array.isArray(saved.records)) records = [0,1,2].map(function (level) {
          var value = saved.records[level], spec = rules.difficulty(level);
          return Number.isInteger(value) && value >= 0 && value <= spec.pairs * (spec.base + 50) + spec.base * 2 ? value : 0;
        });
        if (saved.state) {
          var candidate = migrate(saved.state);
          if (validState(candidate)) {
            state = candidate;
            if (countPairs() === config().pairs) records[state.level] = Math.max(records[state.level], state.score);
          } else say(saved.state.v === 1 ? "玩法已换回连连看，请开始新一局；之前完成的拼贴仍保留。" : "上次进度无法恢复。可以重新开始；可读取的旧作品仍保留。");
        }
      }
    } catch (e) {
      say("未能读取上次进度，可以开始新的一局。");
    }
    sound = window.SmallThingsSound($("music-toggle"), function (enabled) {
      musicEnabled = enabled; persist();
    }, function (message) { say(message); });
    effects = window.SmallThingsEffects($("sfx-toggle"),effectsEnabled,function(enabled){effectsEnabled=enabled;persist();},say);
    await safeArea();
    landing();
    $("start").disabled = false;
  }
  $("start").addEventListener("click", newGame);
  $("again").addEventListener("click", newGame);
  $("resume").addEventListener("click", function () {
    if (musicEnabled) sound.resume();
    if (state.screen === "result") renderResult();
    else if (countPairs() === config().pairs) grantReward();
    else renderGame();
  });
  $("home").addEventListener("click", function () {
    if (!busy && !matching) landing();
  });
  $("undo").addEventListener("click", function () {
    if (!matching) { state.selected = null; hintPair = null; say(""); renderGame(); persist(); }
  });
  $("hint").addEventListener("click", function () {
    if (matching || countPairs() === config().pairs) return;
    ensureMoves(); hintPair = rules.findPair(state.board, config().cols); state.selected = null; state.streak = 0;
    renderGame(); persist();
  });
  $("save").addEventListener("click", function () {
    exportCard("save");
  });
  $("share").addEventListener("click", function () {
    exportCard("share");
  });
  window.addEventListener("resize", function () { safeArea(); if (matching) drawConnection(activeLine); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { finishMatch(); persist(); }
  });
  var greetTimer=null, greetingIndex=0;
  $("world-play").addEventListener("click",function(){
    clearTimeout(greetTimer);$("world-greeting").textContent=["今天想带谁一起出发？","咖啡准备好啦！","给你一朵好心情"][greetingIndex++%3];
    $("world-play").parentNode.classList.remove("is-greeting");
    void $("hero").offsetWidth;$("world-play").parentNode.classList.add("is-greeting");
    greetTimer=setTimeout(function(){$("world-greeting").textContent="";$("world-play").parentNode.classList.remove("is-greeting");},1800);
  });
  document.addEventListener("keydown",function(e){if(e.key==="Escape")$("help").open=false;});
  init();
})();
