/* Jumbo Ventures — page behaviour */
(function () {
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* Mobile menu */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* Hero: scale the 1440×1000 stage to the viewport on desktop */
  var hero = document.querySelector('.hero');
  var stage = document.querySelector('.hero-stage');
  function fitHero() {
    if (!hero || !stage) return;
    if (window.innerWidth >= 900) {
      var s = hero.clientWidth / 1440;
      stage.style.transform = 'scale(' + s + ')';
      hero.style.height = (1000 * s) + 'px';
    } else {
      stage.style.transform = '';
      hero.style.height = '';
    }
  }
  if (hero) { fitHero(); window.addEventListener('resize', fitHero); }

  /* Hero: landscape scene */
  var canvas = document.getElementById('scene');
  if (canvas && window.JVScene) window.JVScene(canvas);

  /* Hero: rolling phrase */
  var track = document.querySelector('.roller-track');
  if (track && !reduceMotion) {
    var n = track.children.length - 1;
    var i = 0;
    var live = document.getElementById('roller-live');
    setTimeout(function () {
      setInterval(function () {
        i += 1;
        track.classList.remove('snap');
        track.style.transform = 'translateY(' + (-i * 1.14) + 'em)';
        if (live) live.textContent = track.children[i % n].textContent;
        if (i >= n) {
          setTimeout(function () {
            track.classList.add('snap');
            i = 0;
            track.style.transform = 'translateY(0)';
          }, 800);
        }
      }, 2400);
    }, 1800);
  }

  /* Paths: tabs */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.path-row'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  function selectTab(k, focus) {
    tabs.forEach(function (t, j) {
      var on = j === k;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach(function (p, j) {
      var on = j === k;
      if (on && !p.classList.contains('is-active')) {
        p.classList.add('is-active');
        p.hidden = false;
      } else if (!on) {
        p.classList.remove('is-active');
        p.hidden = true;
      }
    });
  }
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { selectTab(k); });
    t.addEventListener('mouseenter', function () { if (window.innerWidth >= 900) selectTab(k); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); selectTab((k + 1) % tabs.length, true); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); selectTab((k - 1 + tabs.length) % tabs.length, true); }
    });
  });

  /* FAQ: accordion (one open at a time) */
  var items = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
  function openItem(k, fromToc) {
    var wasOpen = items[k] && items[k].classList.contains('is-open');
    var target = fromToc ? k : (wasOpen ? -1 : k);
    items.forEach(function (it, j) {
      var on = j === target;
      it.classList.toggle('is-open', on);
      it.querySelector('.faq-q').setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    if (fromToc && items[k]) items[k].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
  items.forEach(function (it, k) {
    it.querySelector('.faq-q').addEventListener('click', function () { openItem(k, false); });
  });
  Array.prototype.slice.call(document.querySelectorAll('.faq-toc button')).forEach(function (b, k) {
    b.addEventListener('click', function () { openItem(k, true); });
  });
})();
