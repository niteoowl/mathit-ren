/**
 * mathit-ren.js v2.0 (Final Production)
 * Perfect Syntax Highlighter for Mathit v2.0 Specification
 * Zero-dependency, Self-contained (Automatic Theme Injection)
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
  // 1. 임베디드 테마 CSS (다크 / 라이트 테마)
  // =========================================================================
  const STYLES = `
pre.mathit-container {
  margin: 1.2em 0;
  padding: 1.2em 1.4em;
  border-radius: 8px;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.92rem;
  line-height: 1.65;
  tab-size: 4;
}

pre.mathit-container code {
  font-family: inherit;
  background: transparent !important;
  padding: 0 !important;
  border: none !important;
}

/* ── Dark Theme (기본값: Catppuccin Mocha 베이스) ── */
.mathit-dark, pre.mathit-container:not(.mathit-light) {
  background-color: #1e1e2e;
  color: #cdd6f4;
  border: 1px solid #313244;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.mathit-dark .mr-comment     { color: #6c7086; font-style: italic; }
.mathit-dark .mr-global      { color: #f38ba8; font-weight: 700; }
.mathit-dark .mr-directive   { color: #89b4fa; font-weight: 600; }
.mathit-dark .mr-keyword     { color: #cba6f7; font-weight: 600; }
.mathit-dark .mr-geom        { color: #fab387; font-weight: 600; }
.mathit-dark .mr-builtin     { color: #a6e3a1; font-weight: 500; }
.mathit-dark .mr-prop        { color: #94e2d5; }
.mathit-dark .mr-param       { color: #f9e2af; }
.mathit-dark .mr-unit        { color: #74c7ec; font-weight: 600; }
.mathit-dark .mr-number      { color: #fab387; }
.mathit-dark .mr-color       { color: #f5c2e7; font-weight: 500; }
.mathit-dark .mr-tag         { color: #f38ba8; font-weight: 700; }
.mathit-dark .mr-string      { color: #a6adc8; }
.mathit-dark .mr-latex       { color: #f9e2af; font-style: italic; background: rgba(249, 226, 175, 0.12); padding: 1px 3px; border-radius: 3px; }
.mathit-dark .mr-operator    { color: #89dceb; font-weight: 600; }
.mathit-dark .mr-solver      { color: #ffffff; background: #e64553; font-weight: 800; padding: 0 4px; border-radius: 3px; }
.mathit-dark .mr-direction   { color: #94e2d5; font-weight: 600; }
.mathit-dark .mr-punctuation { color: #6c7086; }
.mathit-dark .mr-ident       { color: #cdd6f4; }

/* ── Light Theme (수학 시험지/논문 스타일) ── */
.mathit-light {
  background-color: #f8fafc;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.mathit-light .mr-comment     { color: #94a3b8; font-style: italic; }
.mathit-light .mr-global      { color: #e11d48; font-weight: 700; }
.mathit-light .mr-directive   { color: #2563eb; font-weight: 600; }
.mathit-light .mr-keyword     { color: #7c3aed; font-weight: 600; }
.mathit-light .mr-geom        { color: #ea580c; font-weight: 600; }
.mathit-light .mr-builtin     { color: #0284c7; font-weight: 500; }
.mathit-light .mr-prop        { color: #0f766e; }
.mathit-light .mr-param       { color: #b45309; }
.mathit-light .mr-unit        { color: #059669; font-weight: 600; }
.mathit-light .mr-number      { color: #ea580c; }
.mathit-light .mr-color       { color: #be185d; font-weight: 500; }
.mathit-light .mr-tag         { color: #be123c; font-weight: 700; }
.mathit-light .mr-string      { color: #475569; }
.mathit-light .mr-latex       { color: #b45309; font-style: italic; background: rgba(180, 83, 9, 0.08); padding: 1px 3px; border-radius: 3px; }
.mathit-light .mr-operator    { color: #6366f1; font-weight: 600; }
.mathit-light .mr-solver      { color: #ffffff; background: #e11d48; font-weight: 800; padding: 0 4px; border-radius: 3px; }
.mathit-light .mr-direction   { color: #0891b2; font-weight: 600; }
.mathit-light .mr-punctuation { color: #94a3b8; }
.mathit-light .mr-ident       { color: #334155; }
`;

  // =========================================================================
  // 2. Mathit v2.0 정규식 어휘 사전 (보강 및 충돌 해결 완료)
  // =========================================================================
  
  // 렌더링 지시어 목록
  const DIRECTIVES = [
    'axis_break', 'right_ang', 'arrow_mark', 'regular_poly', 'tangent_line',
    'dist_normal', 'axis', 'ticks', 'grid', 'line', 'poly', 'circle',
    'ellipse', 'path', 'fill', 'shade', 'ang', 'tick', 'dim', 'dot',
    'draw', 'surface', 'field', 'tree', 'graph', 'label'
  ].join('|');

  // 내장 기하학/해석학/3D/통계 함수 (arc, cam, crosshatch, pi 추가 완료)
  const BUILTINS = [
    'incenter', 'inradius', 'circumcenter', 'circumradius', 'centroid',
    'orthocenter', 'excenter', 'mid', 'on', 'ext', 'proj', 'reflect',
    'rot', 'bisect', 'isect', 'controls', 'between', 'under', 'riemann',
    'tangent_line', 'param', 'polar', 'regular_poly', 'cube', 'sphere',
    'cylinder', 'plane', 'dist_normal', 'vec', 'norm', 'dist', 'ang',
    'sin', 'cos', 'tan', 'sqrt', 'rect', 'circle', 'poly', 'arc',
    'cam', 'crosshatch', 'pi'
  ].join('|');

  // Mathit 표준 명명 색상 (Section 1)
  const NAMED_COLORS = [
    'red', 'blue', 'green', 'black', 'white', 'gray', 'orange', 'purple', 'cyan'
  ].join('|');

  // 토큰 룰 매트릭스 (우선순위 철저 준수)
  const TOKEN_RULES = [
    // 1. 단일행 주석 (최우선 배제)
    { type: 'comment', regex: /^\/\/[^\n]*/ },

    // 2. 문자열 및 인라인 LaTeX ("...$수식$...")
    { type: 'string', regex: /^"([^"\\]|\\.)*"/ },

    // 3. 전역 설정 지시어 (@view, @3d, @canvas, @config 등)
    { type: 'global', regex: /^@[a-zA-Z0-9_]+\b/ },

    // 4. 교점 해/위치 필터 태그 (#top, #bottom, #left, #right, #1, #2)
    // ※ 6자리 Hex(#000000)와 충돌하지 않도록 태그 수치는 1~2자리 숫자로 제한
    { type: 'tag', regex: /^#(top|bottom|left|right|\d{1,2})\b/ },

    // 5. Hex 및 투명도 색상 리터럴 (#3b82f6, #red/20, #000000/50, #gray/30)
    { type: 'color', regex: /^#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4}|[a-zA-Z]+)(?:\/\d+)?\b/ },

    // 6. 렌더링 지시어 및 컴포넌트 호출문 (콜론 바로 직전의 식별자)
    { type: 'directive', regex: new RegExp(`^(${DIRECTIVES}|[A-Z][a-zA-Z0-9_]*)(?=\\s*:)`) },

    // 7. 언어 제어 키워드
    { type: 'keyword', regex: /^(solve|component|for|in|step)\b/ },

    // 8. 내장 기하/해석/수학 함수
    { type: 'builtin', regex: new RegExp(`^(${BUILTINS})\\b`) },

    // 9. 독립된 명명 색상 리터럴 (color=red 등)
    { type: 'color', regex: new RegExp(`^(${NAMED_COLORS})\\b`) },

    // 10. 8방위 배치 방향 태그 ((nw), (se), (c) 등)
    { type: 'direction', regex: /^\((c|n|s|e|w|ne|nw|se|sw)\)/ },

    // 11. 점 좌표 성분 프로퍼티 (.x, .y, .z)
    { type: 'prop', regex: /^\.(x|y|z)\b/ },

    // 12. 파라미터 이름 ('=' 바로 직전의 식별자)
    { type: 'param', regex: /^[a-zA-Z_][a-zA-Z0-9_]*(?=\s*=)/ },

    // 13. 기하 객체 (대문자로 시작하는 모든 식별자: A, P1, Circle1, Poly)
    { type: 'geom', regex: /^[A-Z][a-zA-Z0-9_]*/ },

    // 14. 단위 결합 수치 리터럴 (10mm, 15pt, 20px, 45deg, 1.5rad, 2pi)
    { type: 'unit', regex: /^\b\d+(\.\d+)?(mm|pt|px|deg|rad|pi)\b/ },

    // 15. 순수 수치 리터럴
    { type: 'number', regex: /^\b\d+(\.\d+)?\b/ },

    // 16. solve 블록 전용 미지수 기호 (?)
    { type: 'solver', regex: /^\?/ },

    // 17. 특수 연산자 (우선순위: 네트워크 '---' -> 경로 '--' -> 증감/범위 '++','..' -> 람다/화살표)
    { type: 'operator', regex: /^(---|--|\+\+|\.\.|\->|=>|==|!=|<=|>=|[-+*/^=&|<>!%~])/ },

    // 18. 구분 기호
    { type: 'punctuation', regex: /^[{}\[\](),;:]/ },

    // 19. 일반 스칼라 변수 및 사용자 정의 함수명 (소문자 시작)
    { type: 'ident', regex: /^[a-z_][a-zA-Z0-9_]*/ },

    // 20. 공백 및 개행
    { type: 'whitespace', regex: /^\s+/ },

    // 21. 기타 문자 안전 처리
    { type: 'unknown', regex: /^./ }
  ];

  // =========================================================================
  // 3. 파서 및 렌더러 코어
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
    const ID = 'mathit-ren-core-styles';
    if (!document.getElementById(ID)) {
      const el = document.createElement('style');
      el.id = ID;
      el.textContent = STYLES;
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
            // LaTeX 수식 포함 여부에 따라 클래스 분기
            const hasLatex = raw.includes('$');
            const cls = hasLatex ? 'mr-string mr-latex' : 'mr-string';
            html += `<span class="${cls}">${escapeHtml(raw)}</span>`;
          } else if (rule.type === 'unknown') {
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
    const pre = el.closest('pre');
    if (pre && !pre.classList.contains('mathit-container')) {
      pre.classList.add('mathit-container');
    }
  }

  function highlightAll() {
    if (typeof document === 'undefined') return;
    injectStyles();

    const selector = 'pre code.language-mathit, code.language-mathit, pre.mathit code, pre.mathit, code.mathit';
    const nodes = document.querySelectorAll(selector);

    nodes.forEach((node) => {
      if (node.tagName.toLowerCase() === 'pre' && node.querySelector('code')) {
        return;
      }
      highlightElement(node);
    });
  }

  function setTheme(theme) {
    if (typeof document === 'undefined') return;
    const containers = document.querySelectorAll('.mathit-container');
    containers.forEach((c) => {
      if (theme === 'light') {
        c.classList.add('mathit-light');
        c.classList.remove('mathit-dark');
      } else {
        c.classList.add('mathit-dark');
        c.classList.remove('mathit-light');
      }
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
    highlightAll: highlightAll,
    setTheme: setTheme,
    injectStyles: injectStyles
  };
});
