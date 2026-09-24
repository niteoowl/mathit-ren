/**
 * mathit-ren.js v2.1 (Pure Syntax Highlighter)
 * 레이아웃 간섭 없음 / 토큰 컬러링 전용
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
  // 1. 순수 토큰 색상 CSS (컨테이너 여백/그림자 일체 건드리지 않음)
  // =========================================================================
  const PURE_STYLES = `
/* 주석: 뮤트 그레이 (이탤릭) */
.mr-comment     { color: #6a737d !important; font-style: italic; }
/* @전역설정: 선명한 핑크/레드 */
.mr-global      { color: #e36209 !important; font-weight: bold; }
/* line:, poly: 등 렌더링 지시어: 블루 */
.mr-directive   { color: #005cc5 !important; font-weight: bold; }
/* solve, component, for 등 키워드: 퍼플 */
.mr-keyword     { color: #6f42c1 !important; font-weight: bold; }
/* A, B, Circle1 등 기하 객체: 오렌지 */
.mr-geom        { color: #e36209 !important; font-weight: bold; }
/* mid, isect, sin 등 내장 함수: 청록/시안 */
.mr-builtin     { color: #0086b3 !important; }
/* .x, .y 좌표 성분: 틸(Teal) */
.mr-prop        { color: #005cc5 !important; }
/* 파라미터명 (thick=, fill=): 다크 골드 */
.mr-param       { color: #b07d00 !important; }
/* 10mm, 45deg 단위 수치: 에메랄드 그린 */
.mr-unit        { color: #22863a !important; font-weight: bold; }
/* 일반 숫자: 블루 */
.mr-number      { color: #005cc5 !important; }
/* #3b82f6, red 등 색상: 마젠타/와인 */
.mr-color       { color: #d73a49 !important; }
/* #top, #1 등 해/필터 태그: 레드 (굵게) */
.mr-tag         { color: #d73a49 !important; font-weight: bold; }
/* 문자열: 그린 */
.mr-string      { color: #22863a !important; }
/* "$...$" LaTeX 수식: 골드/브라운 */
.mr-latex       { color: #b07d00 !important; font-style: italic; }
/* --, ---, =>, .. 등 특수 연산자: 퍼플 */
.mr-operator    { color: #d73a49 !important; font-weight: bold; }
/* solve 미지수 ?: 빨간색 강조 */
.mr-solver      { color: #d73a49 !important; font-weight: 900; }
/* (nw), (se) 8방위: 틸 */
.mr-direction   { color: #0086b3 !important; font-weight: bold; }
/* 괄호, 쉼표, 콜론 등: 기본 다크 그레이 */
.mr-punctuation { color: #586069 !important; }

/* ── 다크 배경 부모를 위한 자동 대응 (선택적) ── */
@media (prefers-color-scheme: dark) {
  .mr-comment     { color: #768390 !important; }
  .mr-global      { color: #f47067 !important; }
  .mr-directive   { color: #54aeff !important; }
  .mr-keyword     { color: #d2a8ff !important; }
  .mr-geom        { color: #ffa657 !important; }
  .mr-builtin     { color: #56d364 !important; }
  .mr-prop        { color: #79c0ff !important; }
  .mr-param       { color: #e3b341 !important; }
  .mr-unit        { color: #7ee787 !important; }
  .mr-number      { color: #79c0ff !important; }
  .mr-color       { color: #f47067 !important; }
  .mr-tag         { color: #f47067 !important; }
  .mr-string      { color: #a5d6ff !important; }
  .mr-latex       { color: #f2cc60 !important; }
  .mr-operator    { color: #f47067 !important; }
  .mr-solver      { color: #ff7b72 !important; font-weight: 900; }
  .mr-direction   { color: #39c5bb !important; }
  .mr-punctuation { color: #8b949e !important; }
}
`;

  // =========================================================================
  // 2. 어휘 사전 및 토큰 규칙
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
  // 3. 렌더러 코어
  // =========================================================================
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
    const ID = 'mathit-ren-colors-only';
    if (!document.getElementById(ID)) {
      const el = document.createElement('style');
      el.id = ID;
      el.textContent = PURE_STYLES;
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
    // pre나 code의 CSS/클래스는 전혀 건드리지 않고, 내부 글자 색칠만 수행
    el.innerHTML = highlight(el.textContent || '');
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

  // DOM 로드 시 즉시 실행
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
