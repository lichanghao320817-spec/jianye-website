/* 内容渲染引擎
 * 读取 js/content.data.js 注入的 window.__CONTENT__，把内容写回带 data-edit 的节点。
 * 找不到内容时不做任何改动，页面自动回退到 HTML 里原有的静态文字。
 */
(function () {
  'use strict';

  var CONTENT = window.__CONTENT__ || {};

  function setHref(a) {
    var t = (a.textContent || '').trim();
    var m;
    if ((m = t.match(/^电话[：:]\s*(.+)$/))) {
      a.setAttribute('href', 'tel:' + m[1].replace(/[^\d+\-]/g, ''));
    } else if ((m = t.match(/^邮箱[：:]\s*(.+)$/))) {
      a.setAttribute('href', 'mailto:' + m[1].trim());
    }
  }

  function applyNode(el, value) {
    var mode = el.getAttribute('data-edit-mode') || 'text';

    if (mode === 'html') {
      el.innerHTML = value;
    } else if (mode === 'src') {
      el.setAttribute('src', value);
    } else if (mode === 'doctitle') {
      document.title = value;
    } else if (mode === 'metadesc') {
      el.setAttribute('content', value);
    } else if (mode === 'hero-title') {
      var lines = value.split('|');
      el.innerHTML = (lines[0] || '') +
        '<br><span class="gradient">' + (lines[1] || '') + '</span>';
    } else if (mode === 'numspan') {
      var parts = value.split('|');
      var num = (parts[0] || '').trim();
      var suffix = (parts[1] || '').trim();
      var tpl = el.getAttribute('data-tpl') || 'none';
      if (tpl === 'pre') {
        el.innerHTML = '<span>' + num + '</span>' + suffix;
      } else if (tpl === 'post') {
        el.innerHTML = num + '<span>' + suffix + '</span>';
      } else {
        el.textContent = num + suffix;
      }
      var digits = num.replace(/[^\d.]/g, '');
      if (el.hasAttribute('data-count') && digits) {
        el.setAttribute('data-count', digits);
      }
    } else {
      el.textContent = value;
    }

    if (el.tagName === 'A') setHref(el);
  }

  // 隐藏入口：页脚版权处连点三下打开本机后台（公网访客点开也连不上，等同无效）
  function bindAdminEntry() {
    var el = document.querySelector('.footer-bottom > span');
    if (!el) return;
    var hits = 0;
    var last = 0;
    el.addEventListener('click', function () {
      var now = Date.now();
      if (now - last > 1200) hits = 0;
      last = now;
      hits += 1;
      if (hits >= 3) {
        hits = 0;
        window.open('http://127.0.0.1:8899/', '_blank');
      }
    });
  }

  function run() {
    var nodes = document.querySelectorAll('[data-edit]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute('data-edit');
      var value = CONTENT[key];
      if (typeof value === 'string' && value.length) applyNode(el, value);
    }
    document.documentElement.setAttribute('data-cms', 'ready');
    bindAdminEntry();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
