/* Original procedural score and effects. No media files, decoding or network. */
(function () {
  "use strict";
  var context = null, voices = { music: [], effects: [] };
  function ready() {
    try {
      var Constructor = window.AudioContext || window.webkitAudioContext;
      if (!Constructor) throw Error("声音功能暂不可用");
      if (!context || context.state === "closed") context = new Constructor();
      return Promise.resolve(context.resume()).then(function () {
        if (context.state !== "running") throw Error("声音未能启动");
        return context;
      });
    } catch (error) { return Promise.reject(error); }
  }
  function clear(group) {
    voices[group].slice().forEach(function (voice) {
      try { voice.oscillator.stop(); } catch (error) { /* Already ended. */ }
      voice.oscillator.disconnect(); voice.gain.disconnect();
    });
    voices[group] = [];
  }
  function note(group, midi, start, length, volume, type) {
    var oscillator = context.createOscillator(), gain = context.createGain();
    var voice = { oscillator: oscillator, gain: gain };
    oscillator.type = type || "sine";
    oscillator.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + length);
    oscillator.connect(gain); gain.connect(context.destination);
    voices[group].push(voice);
    oscillator.onended = function () {
      oscillator.disconnect(); gain.disconnect();
      var index = voices[group].indexOf(voice);
      if (index >= 0) voices[group].splice(index, 1);
    };
    oscillator.start(start); oscillator.stop(start + length + .02);
  }
  // Sixteen bars, 108 BPM. A soft mallet melody, plucked chords and a round bass.
  // -1 is a rest; all pitches and rhythm are original, not an encoded recording.
  var melody = [
    [72,-1,76,79,-1,76,74,-1], [71,-1,74,79,-1,74,71,-1],
    [69,-1,72,76,79,-1,76,72], [67,-1,71,74,-1,71,69,-1],
    [65,-1,69,72,76,-1,72,69], [67,-1,72,76,-1,74,72,-1],
    [69,-1,74,77,76,-1,74,71], [72,-1,-1,79,76,-1,74,-1],
    [76,-1,79,84,-1,79,76,74], [74,-1,79,83,-1,79,74,-1],
    [72,76,81,-1,79,76,72,-1], [71,-1,74,79,77,-1,74,-1],
    [69,-1,72,77,76,-1,72,69], [67,72,76,-1,79,-1,76,72],
    [74,-1,77,79,77,74,71,-1], [72,-1,76,-1,72,-1,-1,-1]
  ];
  var harmony = [[48,60,64,67],[47,59,62,67],[45,57,60,64],[43,55,59,62],
    [41,57,60,65],[48,55,60,64],[43,59,62,65],[48,60,64,67]];
  window.SmallThingsSound = function (button, preference, notice) {
    var wanted = false, pending = false, playing = false, serial = 0;
    var timer = null, step = 0, next = 0, tick = 60 / 108 / 2;
    function label() {
      var name = pending ? "配乐加载中" : playing ? "关闭配乐" : "开启配乐";
      button.setAttribute("aria-label", name); button.title = name;
      button.classList.toggle("loading", pending);
      button.setAttribute("aria-pressed", String(playing));
    }
    function halt() {
      serial++; wanted = false; pending = false; playing = false;
      clearInterval(timer); timer = null; clear("music"); label();
    }
    function stop() { halt(); preference(false); }
    function failed(request) {
      if (request !== serial) return;
      stop(); notice("配乐暂时没能播放，可以再次开启；不影响游戏。");
    }
    function schedule() {
      if (!playing || document.hidden) return;
      if (context.state !== "running") { halt(); return; }
      if (next < context.currentTime) next = context.currentTime + .025;
      while (next < context.currentTime + .15) {
        var bar = Math.floor(step / 8) % melody.length, beat = step % 8;
        var pitch = melody[bar][beat], chord = harmony[bar % harmony.length];
        if (pitch >= 0) {
          note("music", pitch, next, .26, .045);
          note("music", pitch + 12, next, .09, .009);
        }
        if (beat === 0 || beat === 4) note("music", chord[0] + (beat === 4 ? 7 : 0), next, .42, .055);
        if (beat === 2 || beat === 6) chord.slice(1).forEach(function (p, i) {
          note("music", p, next + i * .012, .19, .012, "triangle");
        });
        next += tick; step = (step + 1) % (melody.length * 8);
      }
    }
    function resume() {
      if (document.hidden || pending || playing) return;
      wanted = true; pending = true; var request = ++serial; label();
      ready().then(function () {
        if (request !== serial || !wanted || document.hidden) return;
        pending = false; playing = true; step = 0; next = context.currentTime + .025;
        schedule();
        timer = setInterval(function () { try { schedule(); } catch (error) { failed(request); } }, 40);
        preference(true); label();
      }).catch(function () { failed(request); });
    }
    button.addEventListener("click", function () { if (wanted) stop(); else resume(); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) halt(); });
    window.addEventListener("pagehide", halt);
    button.disabled = false; label();
    return { resume: resume, stop: stop };
  };
  window.SmallThingsEffects = function (button, initiallyEnabled, preference, notice) {
    var enabled = initiallyEnabled, serial = 0, reported = false;
    function label() {
      var name = enabled ? "关闭音效" : "开启音效";
      button.setAttribute("aria-label", name); button.title = name;
      button.setAttribute("aria-pressed", String(enabled));
    }
    function pause() { serial++; clear("effects"); }
    function play(streak, complete) {
      if (!enabled || document.hidden) return;
      pause(); var request = serial;
      ready().then(function () {
        if (request !== serial || !enabled || document.hidden) return;
        var pitches = complete ? [72,76,79,84,79,84,88] :
          streak >= 4 ? [79,83,86,91] : streak >= 2 ? [76,79,84] : [72,76,79];
        var start = context.currentTime + .015, spacing = complete ? .13 : .065;
        pitches.forEach(function (pitch, index) {
          note("effects", pitch, start + index * spacing, complete ? .4 : .2, .12);
          note("effects", pitch + 12, start + index * spacing, .09, .015);
        });
      }).catch(function () {
        if (request === serial && !reported) {
          pause(); reported = true; notice("音效暂时没能播放，可以关闭后重新开启；不影响游戏。");
        }
      });
    }
    button.addEventListener("click", function () {
      enabled = !enabled; pause(); reported = false; preference(enabled); label();
    });
    document.addEventListener("visibilitychange", function () { if (document.hidden) pause(); });
    window.addEventListener("pagehide", pause);
    button.disabled = false; label();
    return { play: play, pause: pause };
  };
})();
