/**
 * mathit-ren.js v1.0.0
 * Mathit v2.0 Syntax Highlighter (Standalone, Zero-Dependency)
 * https://github.com/mathit/mathit-ren
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

  // ==========================================
  // 1. 내장 테마 CSS (자동 주입)
  // ==========================================
  const DEFAULT_STYLES = `
/* MathitRen Container Base */
pre.mathit-container {
  margin: 1.2em 0;
  padding: 1.1em 1.3em;
  border-radius: 8px;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.92rem;
  line-height: 1.6;
  tab-size: 4;
  letter-spacing: 0.02em;
}

pre.mathit-container code {
  font-family: inherit;
  background: transparent !important;
  padding: 0 !important;
  border: none !important;
}

/* Dark Theme (Default) */
.mathit-dark, pre.mathit-container:not(.mathit-light) {
  background-color: #1a1b26;
  color: #c0caf5;
  border: 1px solid #292e42;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.mathit-dark .mr-comment      { color: #565f89; font-style: italic; }
.mathit-dark .mr-global       { color: #f7768e; font-weight: 700; }
.mathit-dark .mr-directive    { color: #7aa2f7; font-weight: 600; }
.mathit-dark .mr-keyword      { color: #bb9af7; font-weight: 600; }
.mathit-dark .mr-geom         { color: #ff9e64; font-weight: 600; }
.mathit-dark .mr-builtin      { color: #7dcfff; }
.mathit-dark .mr-param        { color: #e0af68; }
.mathit-dark .mr-unit         { color: #2ac3de; font-weight: 600; }
.mathit-dark .mr-number       { color: #ff9e64; }
.mathit-dark .mr-color        { color: #b4f9f8; font-weight: 500; }
.mathit-dark .mr-tag          { color: #f7768e; font-weight: 600; }
.mathit-dark .mr-string       { color: #9ece6a; }
.mathit-dark .mr-latex        { color: #e0af68; font-style: italic; background: rgba(224, 175, 104, 0.1); border-radius: 3px; padding: 0 2px; }
.mathit-dark .mr-operator     { color: #bb9af7; font-weight: 600; }
.mathit-dark .mr-solver       { color: #f7768e; font-weight: 800; background: rgba(247, 118, 142, 0.2); padding: 0 3px; border-radius: 3px; }
.mathit-dark .mr-direction    { color: #73daca; font-weight: 600; }
.mathit-dark .mr-punctuation  { color: #565f89; }
.mathit-dark .mr-ident        { color: #c0caf5; }

/* Light Theme */
.mathit-light {
  background-color: #f8fafc;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.mathit-light .mr-comment     { color: #94a3b8; font-style: italic; }
.mathit-light .mr-global      { color: #e11d48; font-weight: 700; }
.mathit-light .mr-directive   { color: #2563eb; font-weight: 600; }
.mathit-light .mr-keyword     { color: #7c3aed; font-weight: 600; }
.mathit-light .mr-geom        { color: #d97706; font-weight: 600; }
.mathit-light .mr-builtin     { color: #0284c7; }
.mathit-light .mr-param       { color: #475569; }
.mathit-light .mr-unit        { color: #059669; font-weight: 600; }
.mathit-light .mr-number      { color: #ea580c; }
.mathit-light .mr-color       { color: #0d9488; }
.mathit-light .mr-tag         { color: #be123c; font-weight: 600; }
.mathit-light .mr-string      { color: #15803d; }
.mathit-light .mr-latex       { color: #b45309; font-style: italic; background: rgba(180, 83, 9, 0.08); border-radius: 3px; padding: 0 2px; }
.mathit-light .mr-operator    { color: #6366f1; font-weight: 600; }
.mathit-light .mr-solver      { color: #e11d48; font-weight: 800; background: rgba(225, 29, 72, 0.12); padding: 0 3px; border-radius: 3px; }
.mathit-light .mr-direction   { color: #0891b2; font-weight: 600; }
.mathit-light .mr-punctuation { color: #94a3b8; }
.mathit-light .mr-ident       { color: #334155; }
`;

  // ==========================================
  // 2. 토크나이저 규칙 정의 (우선순위 순서 엄수)
  // ==========================================
  const DIRECTIVE_NAMES = [
    'axis_break', 'right_ang', 'arrow_mark', 'regular_poly', 'tangent_line',
    'dist_normal', 'axis', 'ticks', 'grid', 'line', 'poly', 'circle',
    'ellipse', 'path', 'fill', 'shade', 'ang', 'tick', 'dim', 'dot',
    'draw', 'surface', 'field', 'tree', 'graph', 'label'
  ].join('|');

  const BUILTIN_NAMES = [
    'incenter', 'inradius', 'circumcenter', 'circumradius', 'centroid',
    'orthocenter', 'excenter', 'mid', 'on', 'ext', 'proj', 'reflect',
    'rot', 'bisect', 'isect', 'controls', 'between', 'under', 'riemann',
    'tangent_line', 'param', 'polar', 'regular_poly', 'cube', 'sphere',
    'cylinder', 'plane', 'dist_normal', 'vec', 'norm', 'dist', 'ang',
    'sin', 'cos', 'tan', 'sqrt', 'rect', 'circle', 'poly'
  ].join('|');

  const NAMED_COLORS = [
    'red', 'blue', 'green', 'black', 'white', 'gray', 'orange', 'purple', 'cyan'
  ].join('|');

  const TOKEN_RULES = [
    // 1. 주석
    { type: 'comment', regex: /^\/\/[^\n]*/ },

    // 2. 문자열 (LaTeX 및 일반 텍스트)
    { type: 'string', regex: /^"([^"\\]|\\.)*"/ },

    // 3. 글로벌 설정 지시어 (@view, @3d, @canvas)
    { type: 'global', regex: /^@(view|3d|canvas)\b/ },

    // 4. 해/위치 필터 태그 (#top, #bottom, #left, #right, #1, #2 등)
    { type: 'tag', regex: /^#(top|bottom|left|right|\d+)\b/ },

    // 5. Hex 색상 및 투명도 리터럴 (#3b82f6, #red/20, #000000/50)
    { type: 'color', regex: /^#([0-9a-fA-F]{3,8}|[a-zA-Z]+)(\/\d+)?\b/ },

    // 6. 렌더링 지시어 및 컴포넌트 호출 (뒤에 ':'가 오는 식별자)
    { type: 'directive', regex: new RegExp(`^(${DIRECTIVE_NAMES}|[A-Z][a-zA-Z0-9_]*)(?=\\s*:)`) },

    // 7. 예약 키워드
    { type: 'keyword', regex: /^(solve|component|for|in|step)\b/ },

    // 8. 내장 기하 & 해석학 함수
    { type: 'builtin', regex: new RegExp(`^(${BUILTIN_NAMES})\\b`) },

    // 9. 리터럴 색상명
    { type: 'color', regex: new RegExp(`^(${NAMED_COLORS})\\b`) },

    // 10. 8방위 배치 방향 태그 ((nw), (se) 등)
    { type: 'direction', regex: /^\((c|n|s|e|w|ne|nw|se|sw)\)/ },

    // 11. 파라미터 키 ('=' 직전에 오는 식별자)
    { type: 'param', regex: /^[a-zA-Z_][a-zA-Z0-9_]*(?=\s*=)/ },

    // 12. 기하 객체 (대문자로 시작하는 식별자)
    { type: 'geom', regex: /^[A-Z][a-zA-Z0-9_]*/ },

    // 13. 단위 수치 리터럴 (10mm, 45deg, 2pi 등)
    { type: 'unit', regex: /^\b\d+(\.\d+)?(mm|pt|px|deg|rad|pi)\b/ },

    // 14. 일반 수치 리터럴
    { type: 'number', regex: /^\b\d+(\.\d+)?\b/ },

    // 15. solve 블록 전용 미지수 기호
    { type: 'solver', regex: /^\?/ },

    // 16. 연산자 (특수 연산자 길이순 우선 매칭: --- -> -- -> 기타)
    { type: 'operator', regex: /^(---|--|\+\+|\.\.|\->|=>|==|!=|<=|>=|[+\-*\/^=&|<>!])/ },

    // 17. 구분 기호
    { type: 'punctuation', regex: /^[{}\[\](),;:]/ },

    // 18. 일반 변수 / 스칼라 식별자 (소문자 시작)
    { type: 'ident', regex: /^[a-z_][a-zA-Z0-9_]*/ },

    // 19. 공백 및 줄바꿈
    { type: 'whitespace', regex: /^\s+/ },

    // 20. 매칭되지 않은 임의의 문자
    { type: 'unknown', regex: /^./ }
  ];

  // ==========================================
  // 3. 유틸리티 및 코어 렌더링 로직
  // ==========================================
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function injectDefaultStyles() {
    if (typeof document === 'undefined') return;
    const styleId = 'mathit-ren-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = DEFAULT_STYLES;
      document.head.appendChild(style);
    }
  }

  /**
   * Mathit v2.0 코드를 파싱하여 하이라이트된 HTML 문자열 반환
   */
  function highlight(code) {
    let cursor = 0;
    let html = '';
    const length = code.length;

    while (cursor < length) {
      const remaining = code.slice(cursor);
      let matched = false;

      for (let i = 0; i < TOKEN_RULES.length; i++) {
        const rule = TOKEN_RULES[i];
        const match = rule.regex.exec(remaining);

        if (match) {
          const rawToken = match[0];
          cursor += rawToken.length;
          matched = true;

          if (rule.type === 'whitespace') {
            html += rawToken;
          } else if (rule.type === 'string') {
            // LaTeX 수식($...$) 포함 여부에 따른 세부 스타일 분기
            const isLatex = rawToken.includes('$');
            const cls = isLatex ? 'mr-string mr-latex' : 'mr-string';
            html += `<span class="${cls}">${escapeHtml(rawToken)}</span>`;
          } else if (rule.type === 'unknown') {
            html += escapeHtml(rawToken);
          } else {
            html += `<span class="mr-${rule.type}">${escapeHtml(rawToken)}</span>`;
          }
          break;
        }
      }

      // 안전 장치: 매칭 실패 시 1글자 전진
      if (!matched) {
        html += escapeHtml(code[cursor]);
        cursor++;
      }
    }

    return html;
  }

  /**
   * 단일 DOM 요소를 하이라이트 처리
   */
  function highlightElement(el) {
    if (!el) return;
    const code = el.textContent || '';
    el.innerHTML = highlight(code);
    
    // 부모 <pre>가 있다면 mathit 컨테이너 클래스 부여
    const pre = el.closest('pre');
    if (pre && !pre.classList.contains('mathit-container')) {
      pre.classList.add('mathit-container');
    }
  }

  /**
   * 문서 내 모든 Mathit 블록 자동 감지 및 하이라이트
   */
  function highlightAll() {
    if (typeof document === 'undefined') return;
    injectDefaultStyles();

    const targets = document.querySelectorAll(
      'pre code.language-mathit, code.language-mathit, pre.mathit code, pre.mathit, code.mathit'
    );

    targets.forEach((el) => {
      // pre 자체에 걸려있고 내부에 code 태그가 있는 중복 케이스 방지
      if (el.tagName.toLowerCase() === 'pre' && el.querySelector('code')) {
        return;
      }
      highlightElement(el);
    });
  }

  /**
   * 전역 테마 전환 ('dark' | 'light')
   */
  function setTheme(themeName) {
    if (typeof document === 'undefined') return;
    const containers = document.querySelectorAll('.mathit-container');
    containers.forEach((el) => {
      if (themeName === 'light') {
        el.classList.add('mathit-light');
        el.classList.remove('mathit-dark');
      } else {
        el.classList.add('mathit-dark');
        el.classList.remove('mathit-light');
      }
    });
  }

  // DOM 로드 완료 시 자동 실행
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
    injectStyles: injectDefaultStyles
  };
});
