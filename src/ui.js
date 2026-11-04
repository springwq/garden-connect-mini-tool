/* Original, code-native interface icons. No remote font or icon dependency. */
(function () {
  "use strict";
  var paths = {
    speaker: '<path d="M3 9h4l5-5v16l-5-5H3ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    home: '<path d="M3 11 12 3l9 8v10h-6v-7H9v7H3Z"/>',
    music: '<path d="M9 18V6l11-3v12M9 9l11-3"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="17" cy="15" rx="3" ry="3"/>',
    undo: '<path d="m9 4-6 6 6 6M3 10h11a7 7 0 0 1 0 14" transform="translate(0 -2)"/>',
    hint: '<path d="M8 16c0-3-3-3-3-7a7 7 0 0 1 14 0c0 4-3 4-3 7ZM9 20h6M11 23h2"/>',
    play: '<path d="m8 4 13 8-13 8Z" fill="currentColor" stroke-linejoin="round"/>',
    arrow: '<path d="M3 12h18m-7-7 7 7-7 7"/>',
    check: '<path d="m4 12 5 5L21 5"/>',
    trophy: '<path d="M7 3h10v7a5 5 0 0 1-10 0ZM7 5H3v3a5 5 0 0 0 5 5m9-8h4v3a5 5 0 0 1-5 5M12 15v6m-5 0h10"/>',
    spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="currentColor"/>',
    save: '<path d="M12 2v13m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    share: '<path d="M12 16V2m-5 5 5-5 5 5M5 11H3v11h18V11h-2"/>',
    edit: '<path d="m4 16-1 5 5-1L21 7l-4-4ZM14 6l4 4"/>',
    replay: '<path d="M4 10a9 9 0 1 1 1 9M4 3v7h7"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 16h10l1-16M10 10v8m4-8v8"/>'
  };
  function svg(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' + (paths[name] || paths.spark) + '</svg>'; }
  function decorate(el, name, label) {
    el.innerHTML = svg(name);
    if (label) { el.setAttribute('aria-label', label); el.setAttribute('title', label); }
  }
  Array.from(document.querySelectorAll('[data-icon]')).forEach(function (el) { decorate(el, el.dataset.icon); });
  window.GameUI = { svg: svg, decorate: decorate };
})();
