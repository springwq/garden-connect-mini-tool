/* Orthogonal matching with at most two corners and one outer lane. */
(function () {
  "use strict";
  function point(i, cols) { return { x: i % cols, y: Math.floor(i / cols) }; }
  function connect(board, a, b, cols) {
    cols = cols || 6;
    var rows = board.length / cols;
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 ||
        a >= board.length || b >= board.length || a === b || board[a] === null || board[a] !== board[b]) return null;
    var start = point(a, cols), end = point(b, cols);
    function clear(p, q) {
      if (p.x !== q.x && p.y !== q.y) return false;
      var dx = Math.sign(q.x - p.x), dy = Math.sign(q.y - p.y), x = p.x, y = p.y;
      while (true) {
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
          var i = y * cols + x;
          if (i !== a && i !== b && board[i] !== null) return false;
        }
        if (x === q.x && y === q.y) return true;
        x += dx; y += dy;
      }
    }
    function route(points) {
      var result = points.filter(function (p, i) {
        return !i || p.x !== points[i - 1].x || p.y !== points[i - 1].y;
      });
      for (var i = 1; i < result.length; i++) if (!clear(result[i - 1], result[i])) return null;
      return result;
    }
    var found = route([start, end]);
    if (found) return found;
    found = route([start, { x: start.x, y: end.y }, end]) ||
      route([start, { x: end.x, y: start.y }, end]);
    if (found) return found;
    for (var n = -1; n <= Math.max(cols, rows); n++) {
      found = (n <= cols && route([start, { x: n, y: start.y }, { x: n, y: end.y }, end])) ||
        (n <= rows && route([start, { x: start.x, y: n }, { x: end.x, y: n }, end]));
      if (found) return found;
    }
    return null;
  }
  function findPair(board, cols) {
    for (var a = 0; a < board.length; a++) {
      if (board[a] === null) continue;
      for (var b = a + 1; b < board.length; b++) {
        if (board[a] !== board[b]) continue;
        var path = connect(board, a, b, cols);
        if (path) return { a: a, b: b, path: path };
      }
    }
    return null;
  }
  function random(seed) {
    var n = seed >>> 0;
    return function () { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
  }
  function shuffle(values, rand) {
    var copy = values.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1)), old = copy[i]; copy[i] = copy[j]; copy[j] = old;
    }
    return copy;
  }
  function solvable(board, cols) {
    var copy = board.slice(), pair;
    while ((pair = findPair(copy, cols))) copy[pair.a] = copy[pair.b] = null;
    return copy.every(function (k) { return k === null; });
  }
  function difficulty(level, catalog) {
    var spec = [
      { name: "轻松", cols: 4, rows: 4, pairs: 8, base: 50 },
      { name: "标准", cols: 6, rows: 6, pairs: 18, base: 100 },
      { name: "挑战", cols: 6, rows: 8, pairs: 24, base: 150 }
    ][level === undefined ? 1 : level];
    if (!spec) return spec;
    var index = level === undefined ? 1 : level;
    spec.counts = catalog === 0 ? [
      [4,2,4,2,2,2,0,0,0,0,0,0],
      [6,6,6,6,6,6,0,0,0,0,0,0],
      [8,8,8,8,8,8,0,0,0,0,0,0]
    ][index] : [
      [2,2,2,2,0,0,2,2,2,2,0,0],
      [4,4,4,4,4,4,4,4,2,2,0,0],
      [4,4,4,4,4,4,4,4,4,4,4,4]
    ][index];
    return spec;
  }
  function award(level, score, streak, complete) {
    var base = difficulty(level).base;
    return { score: score + base + Math.min(streak, 5) * 10 + (complete ? base * 2 : 0),
      streak: Math.min(streak + 1, 6) };
  }
  function createBoard(seed, level, catalog) {
    var spec = difficulty(level, catalog), base = [];
    spec.counts.forEach(function (count, kind) {
      for (var i = 0; i < count; i++) base.push(kind);
    });
    var rand = random(seed * 997 + 17);
    for (var attempt = 0; attempt < 32; attempt++) {
      var board = shuffle(base, rand);
      if (solvable(board, spec.cols)) return board;
    }
    return base;
  }
  function reshuffle(board, seed, attempts, cols) {
    var values = board.filter(function (k) { return k !== null; });
    if (!values.length) return board.slice();
    var rand = random(seed * 997 + 53);
    var limit = attempts === undefined ? 12 : Math.max(0, Math.min(12, attempts));
    for (var n = 0; n < limit; n++) {
      var mixed = shuffle(values, rand), next = 0;
      var candidate = board.map(function (k) { return k === null ? null : mixed[next++]; });
      if (findPair(candidate, cols)) return candidate;
    }
    // Every remaining type has an even count. Packing pairs into even-width rows
    // guarantees adjacent matches; empty cells can move, rewards cannot.
    values.sort(function (a, b) { return a - b; });
    return Array.from({ length: board.length }, function (_, i) { return i < values.length ? values[i] : null; });
  }
  window.WeekendConnect = { difficulty: difficulty, award: award, connect: connect, findPair: findPair, createBoard: createBoard, reshuffle: reshuffle };
})();
