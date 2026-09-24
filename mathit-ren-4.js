/**
 * mathit-ren.js v3.0 (Ultimate Readability Edition)
 * - Cognitive Hierarchy Color Palette (시각 피로도 최소화, 위계 명확화)
 * - Auto Background Luminance Detection (부모 배경색 지능형 감지)
 * - Zero Container Pollution (컨테이너 여백/그림자 간섭 0%)
 */
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    global.MathitRen = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // =========================================================================
  // 1. 가독성 최적화 팔레트 (다크 / 라이트 배경 자동 대응)
  // =========================================================================
  const PALETTE_STYLES = `
/* ── [다크 배경 모드] (VS Code Dark Modern + GitHub Dark 베이스) ── */
.mr-dark-env .mr-comment     { color: #8b949e !important; font-style: italic; }
.mr-dark-env .mr-global      { color: #ff7b72 !important; font-weight: 700; }
.mr-dark-env .mr-directive   { color: #79c0ff !important; font-weight: 700; } /* 1순위: 선명한 블루 */
.mr-dark-env .mr-keyword     { color: #d2a8ff !important; font-weight: 700; }
.mr-dark-env .mr-geom        { color: #ffa657 !important; font-weight: 600; } /* 2순위: 따뜻한 앰버 */
.mr-dark-env .mr-builtin     { color: #7ee787 !important; }
.mr-dark-env .mr-prop        { color: #a5d6ff !important; }
.mr-dark-env .mr-param       { color: #c9d1d9 !important; font-weight: 400; } /* 3순위: 채도 낮춤 (피로 방지) */
.mr-dark-env .mr-unit        { color: #56d364 !important; font-weight: 600; }
.mr-dark-env .mr-number      { color: #79c0ff !important; }
.mr-dark-env .mr-color       { color: #f2cc60 !important; }
.mr-dark-env .mr-tag         { color: #ff7b72 !important; font-weight: 700; }
.mr-dark-env .mr-string      { color: #a5d6ff !important; }
.mr-dark-env .mr-latex       { color: #f2cc60 !important; font-style: italic; font-weight: 500; } /* 수식 강조 */
.mr-dark-env .mr-operator    { color: #c9d1d9 !important; font-weight: 600; } /* 연산자는 튀지 않는 뉴트럴 */
.mr-dark-env .mr-solver      { color: #ffffff !important; background: #da3633; font-weight: 900; padding: 1px 4px; border-radius: 3px; } /* ? 독점 강조 */
.mr-dark-env .mr-direction   { color: #39c5bb !important; font-weight: 600; }
.mr-dark-env .mr-punctuation { color: #6e7681 !important; }

/* ── [라이트 배경 모드] (Academic Paper + GitHub Light 베이스) ── */
.mr-light-env .mr-comment     { color: #6e7781 !important; font-style: italic; }
.mr-light-env .mr-global      { color: #cf222e !important; font-weight: 700; }
.mr-light-env .mr-directive   { color: #0969da !important; font-weight: 700; } /* 1순위: 딥 블루 */
.mr-light-env .mr-keyword     { color: #8250df !important; font-weight: 700; }
.mr-light-env .mr-geom        { color: #bc4c00 !important; font-weight: 600; } /* 2순위: 딥 오렌지 */
.mr-light-env .mr-builtin     { color: #116329 !important; }
.mr-light-env .mr-prop        { color: #0550ae !important; }
.mr-light-env .mr-param       { color: #57606a !important; font-weight: 400; } /* 3순위: 차분한 그레이 */
.mr-light-env .mr-unit        { color: #1a7f37 !important; font-weight: 600; }
.mr-light-env .mr-number      { color: #0550ae !important; }
.mr-light-env .mr-color       { color: #9a6700 !important; }
.mr-light-env .mr-tag         { color: #cf222e !important; font-weight: 700; }
.mr-light-env .mr-string      { color: #0a3069 !important; }
.mr-light-env .mr-latex       { color: #9a6700 !important; font-style: italic; font-weight: 600; }
.mr-light-env .mr-operator    { color: #24292f !important; font-weight: 600; }
.mr-light-env .mr-solver      { color: #ffffff !important; background: #cf222e; font-weight: 900; padding: 1px 4px; border-radius: 3px; }
.mr-light-env .mr-direction   { color: #0086b3 !important; font-weight: 600; }
.mr-light-env .mr-punctuation { color: #8c959f !important; }
`;

  // =========================================================================
  // 2. 어휘 사전 및 토큰 규칙 (완전판)
  // =========================================================================
  const DIRECTIVES = [
    'axis_break', 'right_ang', 'arrow_mark', 'regular_poly', 'tangent_line',
    'dist_normal', 'axis', 'ticks', 'grid', 'line', 'poly', 'circle',
    'ellipse', 'path', 'fill', 'shade', 'ang', 'tick', 'dim', 'dot',
    'draw', 'surface', 'field', 'tree', 'graph', 'label'
  ].join('|');

  const BUILTINS = [
    'incenter', 'inradius', 'circumcenter', 'circumradius', 'centroid',
    'orthocenter', 'excenter', 'mid', 'on', 'ext', 'proj', 'reflect',
    'rot', 'bisect', 'isect', 'controls', 'between', 'under', 'riemann',
    'tangent_line', 'param', 'polar', 'regular_poly', 'cube', 'sphere',
    'cylinder', 'plane', 'dist_normal', 'vec', 'norm', 'dist', 'ang',
    'sin', 'cos', 'tan', 'sqrt', 'rect', 'circle', 'poly', 'arc',
    'cam', 'crosshatch', 'pi'
  ].join('|');

  const NAMED_COLORS = [
    'red', 'blue', 'green', 'black', 'white', 'gray', 'orange', 'purple', 'cyan'
  ].join('|');

  const TOKEN_RULES = [
    { type: 'comment',     regex: /^\/\/[^\n]*/ },
    { type: 'string',      regex: /^"([^"\\]|\\.)*"/ },
    { type: 'global',      regex: /^@[a-zA-Z0-9_]+\b/ },
    { type: 'tag',         regex: /^#(top|bottom|left|right|\d{1,2})\b/ },
    { type: 'color',       regex: /^#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4}|[a-zA-Z]+)(?:\/\d+)?\b/ },
    { type: 'directive',   regex: new RegExp(`^(${DIRECTIVES}|[A-Z][a-zA-Z0-9_]*)(?=\\s*:)`) },
    { type: 'keyword',     regex: /^(solve|component|for|in|step)\b/ },
    { type: 'builtin',     regex: new RegExp(`^(${BUILTINS})\\b`) },
    { type: 'color',       regex: new RegExp(`^(${NAMED_COLORS})\\b`) },
    { type: 'direction',   regex: /^\((c|n|s|e|w|ne|nw|se|sw)\)/ },
    { type: 'prop',        regex: /^\.(x|y|z)\b/ },
    { type: 'param',       regex: /^[a-zA-Z_][a-zA-Z0-9_]*(?=\s*=)/ },
    { type: 'geom',        regex: /^[A-Z][a-zA-Z0-9_]*/ },
    { type: 'unit',        regex: /^\b\d+(\.\d+)?(mm|pt|px|deg|rad|pi)\b/ },
    { type: 'number',      regex: /^\b\d+(\.\d+)?\b/ },
    { type: 'solver',      regex: /^\?/ },
    { type: 'operator',    regex: /^(---|--|\+\+|\.\.|\->|=>|==|!=|<=|>=|[-+*/^=&|<>!%~])/ },
    { type: 'punctuation', regex: /^[{}\[\](),;:]/ },
    { type: 'ident',       regex: /^[a-z_][a-zA-Z0-9_]*/ },
    { type: 'whitespace',  regex: /^\s+/ },
    { type: 'unknown',     regex: /^./ }
  ];

  // =========================================================================
  // 3. 지능형 환경 분석 (부모 배경색 밝기 계산기)
  // =========================================================================
  function getEffectiveBgColor(element) {
    let cur = element;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      const bg = window.getComputedStyle(cur).backgroundColor;
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
        return bg;
      }
      cur = cur.parentElement;
    }
    return window.getComputedStyle(document.body).backgroundColor || 'rgb(255, 255, 255)';
  }

  function isDarkBackground(element) {
    if (typeof window === 'undefined') return true;
    const rgbStr = getEffectiveBgColor(element);
    const m = rgbStr.match(/\d+/g);
    if (!m || m.length < 3) return false;
    const r = parseInt(m[0], 10);
    const g = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    // W3C 권장 상대 휘도(Luminance) 공식
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function injectStyles() {
    if (typeof document === 'undefined') return;
    const ID = 'mathit-ren-pro-styles';
    if (!document.getElementById(ID)) {
      const el = document.createElement('style');
      el.id = ID;
      el.textContent = PALETTE_STYLES;
      document.head.appendChild(el);
    }
  }

  function highlight(code) {
    let cursor = 0;
    let html = '';
    const len = code.length;

    while (cursor < len) {
      const sub = code.slice(cursor);
      let matched = false;

      for (let i = 0; i < TOKEN_RULES.length; i++) {
        const rule = TOKEN_RULES[i];
        const m = rule.regex.exec(sub);

        if (m) {
          const raw = m[0];
          cursor += raw.length;
          matched = true;

          if (rule.type === 'whitespace') {
            html += raw;
          } else if (rule.type === 'string') {
            const cls = raw.includes('$') ? 'mr-string mr-latex' : 'mr-string';
            html += `<span class="${cls}">${escapeHtml(raw)}</span>`;
          } else if (rule.type === 'unknown' || rule.type === 'ident') {
            html += escapeHtml(raw);
          } else {
            html += `<span class="mr-${rule.type}">${escapeHtml(raw)}</span>`;
          }
          break;
        }
      }

      if (!matched) {
        html += escapeHtml(code[cursor]);
        cursor++;
      }
    }

    return html;
  }

  function highlightElement(el) {
    if (!el) return;
    el.innerHTML = highlight(el.textContent || '');

    // 부모의 실제 배경색을 실시간 분석하여 환경 클래스만 부착 (레이아웃 간섭 없음)
    const isDark = isDarkBackground(el);
    el.classList.remove('mr-dark-env', 'mr-light-env');
    el.classList.add(isDark ? 'mr-dark-env' : 'mr-light-env');
  }

  function highlightAll() {
    if (typeof document === 'undefined') return;
    injectStyles();

    const targets = document.querySelectorAll(
      'pre code.language-mathit, code.language-mathit, pre.mathit code, pre.mathit, code.mathit'
    );

    targets.forEach((node) => {
      if (node.tagName.toLowerCase() === 'pre' && node.querySelector('code')) {
        return;
      }
      highlightElement(node);
    });
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', highlightAll);
    } else {
      highlightAll();
    }
  }

  return {
    highlight: highlight,
    highlightElement: highlightElement,
    highlightAll: highlightAll
  };
});
