/* =========================================================
   山东建业建设发展集团 官网交互脚本
   功能：移动端菜单、滚动揭示、数字滚动、业绩筛选、年份更新
   ========================================================= */
(function () {
  'use strict';

  /* 移动端汉堡菜单 */
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        nav.classList.remove('open');
      });
    });
  }

  /* 当前页导航高亮 */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  /* 页脚年份 */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* 滚动揭示动画 */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => {
      // 高于视口的超大容器无法满足比例阈值，直接显示，避免整块内容一直隐藏
      if (el.getBoundingClientRect().height > window.innerHeight) {
        el.classList.add('active');
      } else {
        revealObserver.observe(el);
      }
    });
  } else {
    revealEls.forEach(el => el.classList.add('active'));
  }

  /* 兜底：长时间未滚动（截图、静态渲染、无交互）时也保证内容可见，避免整块内容一直透明 */
  window.setTimeout(function () {
    revealEls.forEach(function (el) { el.classList.add('active'); });
  }, 1500);

  /* 数字滚动动画（静态 HTML 已写真实值，动画仅作增强，未触发滚动时也不会显示 0） */
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (Number.isNaN(target)) return;
    const duration = 1800;
    const start = performance.now();
    const suffixMatch = el.textContent.match(/[^\d]+$/);
    const suffix = suffixMatch ? suffixMatch[0] : '';
    const prefix = el.textContent.match(/^[^\d]+/) ? el.textContent.match(/^[^\d]+/)[0] : '';
    /* 动画帧可能被切标签页、滚动或低帧率环境打断，用 done 保证最终落到真实值且不再被覆盖 */
    let done = false;
    function finish() {
      if (done) return;
      done = true;
      el.textContent = prefix + target + suffix;
    }
    function step(now) {
      if (done) return;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = prefix + Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else finish();
    }
    requestAnimationFrame(step);
    setTimeout(finish, duration + 120);
  }

  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    counters.forEach(c => counterObserver.observe(c));
  } else {
    counters.forEach(c => animateCounter(c));
  }

  /* 业绩分类筛选 */
  const tabs = document.querySelectorAll('#projectTabs .project-tab');
  const cards = document.querySelectorAll('#projectGrid .project-card');
  if (tabs.length && cards.length) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.getAttribute('data-filter');
        cards.forEach(card => {
          const cat = card.getAttribute('data-cat');
          if (filter === 'all' || cat === filter) {
            card.style.display = '';
            card.classList.remove('active');
            void card.offsetWidth; // 触发重绘
            card.classList.add('active');
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  /* 导航滚动背景增强 */
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.style.background = 'rgba(18, 13, 9, 0.92)';
      } else {
        header.style.background = 'rgba(18, 13, 9, 0.78)';
      }
    }, { passive: true });
  }

  /* 证书荣誉轮播（自动播放 / 箭头 / 指示点 / 悬停暂停 / 键盘，支持页面内多个实例） */
  document.querySelectorAll('.certificate-carousel').forEach(function (carousel) {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    if (!slides.length || !dotsContainer) return;

    slides.forEach(function (_, i) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', '第 ' + (i + 1) + ' 张');
      dot.addEventListener('click', function () { showSlide(i); resetAuto(); });
      dotsContainer.appendChild(dot);
    });
    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    let current = 0;
    let autoTimer = null;

    function showSlide(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      current = index;
      slides.forEach(function (s, i) { s.classList.toggle('active', i === current); });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
    }
    function nextSlide() { showSlide(current + 1); }

    function startAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(nextSlide, 5000);
    }
    function resetAuto() { startAuto(); }

    if (prevBtn) prevBtn.addEventListener('click', function () { showSlide(current - 1); resetAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { showSlide(current + 1); resetAuto(); });

    carousel.addEventListener('mouseenter', function () { if (autoTimer) clearInterval(autoTimer); });
    carousel.addEventListener('mouseleave', startAuto);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { showSlide(current - 1); resetAuto(); }
      if (e.key === 'ArrowRight') { showSlide(current + 1); resetAuto(); }
    });

    /* 移动端手势滑动切换 */
    let tsX = 0, tsY = 0, touching = false;
    carousel.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      tsX = e.touches[0].clientX;
      tsY = e.touches[0].clientY;
      touching = true;
      if (autoTimer) clearInterval(autoTimer);
    }, { passive: true });
    carousel.addEventListener('touchend', function (e) {
      if (!touching) return;
      touching = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - tsX;
      const dy = t.clientY - tsY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        showSlide(dx < 0 ? current + 1 : current - 1);
      }
      startAuto();
    }, { passive: true });

    startAuto();
  });

  /* 证件 / 荣誉 / 团队照点击放大 */
  const zoomTargets = document.querySelectorAll(
    '.certificate-carousel img, .honor-wall img, .certificate-grid img, .team-gallery img, .qual-carousel img, .framework-figure img, .frame-grid img, .screen-wall img'
  );
  if (zoomTargets.length) {
    const box = document.createElement('div');
    box.className = 'img-lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', '图片放大预览');
    box.innerHTML = '<button class="lb-close" aria-label="关闭">&times;</button>' +
      '<img alt="">' +
      '<div class="lb-hint">点击空白处或按 Esc 关闭</div>';
    document.body.appendChild(box);
    const boxImg = box.querySelector('img');
    const closeBtn = box.querySelector('.lb-close');

    function closeBox() {
      box.classList.remove('open');
      document.body.style.overflow = '';
    }
    function openBox(src, alt) {
      boxImg.src = src;
      boxImg.alt = alt || '';
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    zoomTargets.forEach(function (img) {
      img.classList.add('zoomable');
      img.addEventListener('click', function () {
        openBox(img.currentSrc || img.src, img.alt);
      });
    });
    box.addEventListener('click', function (e) {
      if (e.target !== boxImg) closeBox();
    });
    closeBtn.addEventListener('click', closeBox);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('open')) closeBox();
    });
  }
})();
