/* Yufei Wang · Ecology Portfolio — interactions */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav: scroll shadow ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var toggle = document.getElementById('navToggle');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    var links = nav.querySelectorAll('.nav-links a');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- flagship accordion ---------- */
  var flagships = Array.prototype.slice.call(document.querySelectorAll('.flagship'));
  var mobileMq = window.matchMedia('(max-width: 860px)');

  function setDetailHeight(card) {
    var detail = card.querySelector('.flagship-detail');
    if (!detail) return;
    if (card.classList.contains('open')) {
      detail.style.maxHeight = detail.scrollHeight + 'px';
    } else {
      detail.style.maxHeight = '0px';
    }
  }

  function initAccordion() {
    var mobile = mobileMq.matches;
    flagships.forEach(function (card) {
      var head = card.querySelector('.flagship-head');
      // mobile: all open by default; desktop: all closed
      var open = mobile;
      card.classList.toggle('open', open);
      setDetailHeight(card);
      if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  flagships.forEach(function (card) {
    var head = card.querySelector('.flagship-head');
    if (!head) return;
    head.addEventListener('click', function () {
      var willOpen = !card.classList.contains('open');
      if (!mobileMq.matches) {
        // desktop: exclusive
        flagships.forEach(function (other) {
          if (other !== card && other.classList.contains('open')) {
            other.classList.remove('open');
            var oh = other.querySelector('.flagship-head');
            if (oh) oh.setAttribute('aria-expanded', 'false');
            setDetailHeight(other);
          }
        });
      }
      card.classList.toggle('open', willOpen);
      head.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      setDetailHeight(card);
    });
    head.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        head.click();
      }
    });
  });

  mobileMq.addEventListener('change', function () {
    flagships.forEach(function (card) {
      card.classList.add('open');
      card.firstElementChild.setAttribute('aria-expanded', 'true');
      setDetailHeight(card);
    });
  });
  initAccordion();

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- skills marquee (ScrollVelocity-style) ---------- */
  var marquee = document.querySelector('[data-marquee]');
  if (marquee) {
    var track = marquee.querySelector('.skill-track');
    var group = track.querySelector('.skill-group');
    if (!reduceMotion && track && group) {
      marquee.classList.add('marquee-on');
      for (var i = 0; i < 3; i++) track.appendChild(group.cloneNode(true));
      var x = 0;
      var dir = 1;
      var baseVel = 50; // px per second
      var lastY = window.scrollY;
      var lastT = performance.now();
      var smoothV = 0;
      var copyW = 0;

      function measure() {
        copyW = group.offsetWidth + 8; // group width + flex gap
      }
      function wrapVal(min, max, v) {
        var range = max - min;
        return (((v - min) % range) + range) % range + min;
      }
      window.addEventListener('resize', measure);
      measure();

      function tick(now) {
        var dt = Math.min((now - lastT) / 1000, 0.05);
        lastT = now;
        var sy = window.scrollY;
        var vy = dt > 0 ? (sy - lastY) / dt : 0;
        lastY = sy;
        smoothV += (vy - smoothV) * 0.1;
        if (smoothV < -2) dir = -1; else if (smoothV > 2) dir = 1;
        var f = Math.min(Math.abs(smoothV) / 200, 5); // input 0..1000 -> 0..5
        x += dir * baseVel * dt * (1 + f);
        if (copyW > 0) x = wrapVal(-copyW, 0, x);
        track.style.transform = 'translate3d(' + x + 'px, 0, 0)';
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  /* ---------- hero title pressure (TextPressure-style variable font) ---------- */
  var tpTitle = document.getElementById('heroTitle');
  if (tpTitle) {
    (function () {
      var cursor = { x: 0, y: 0 };
      var mouse = { x: 0, y: 0 };
      var chars = [];
      var maxDist = 200;

      // collect text nodes first, then replace (avoids live-NodeList drift)
      var textNodes = [];
      (function collect(node) {
        Array.prototype.forEach.call(node.childNodes, function (child) {
          if (child.nodeType === 3) textNodes.push(child);
          else if (child.nodeType === 1) collect(child);
        });
      })(tpTitle);
      textNodes.forEach(function (tn) {
        var frag = document.createDocumentFragment();
        var text = tn.nodeValue;
        // split into word / whitespace runs so line breaks only happen between words
        var runs = text.split(/(\s+)/);
        runs.forEach(function (run) {
          if (!run) return;
          if (/^\s+$/.test(run)) {
            for (var j = 0; j < run.length; j++) {
              var sp = document.createElement('span');
              sp.className = 'tp-char';
              sp.textContent = '\u00A0';
              frag.appendChild(sp);
              chars.push(sp);
            }
          } else {
            var wrap = document.createElement('span');
            wrap.className = 'tp-word';
            for (var k = 0; k < run.length; k++) {
              var s = document.createElement('span');
              s.className = 'tp-char';
              s.textContent = run.charAt(k);
              wrap.appendChild(s);
              chars.push(s);
            }
            frag.appendChild(wrap);
          }
        });
        tn.parentNode.replaceChild(frag, tn);
      });

      function cacheCenters() {
        chars.forEach(function (s) {
          var r = s.getBoundingClientRect();
          s._cx = r.left + r.width / 2;
          s._cy = r.top + r.height / 2;
        });
        var tr = tpTitle.getBoundingClientRect();
        maxDist = tr.width / 2 || 200;
      }
      cacheCenters();
      window.addEventListener('resize', cacheCenters, { passive: true });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(cacheCenters);
      }

      function setWeights(mx, my) {
        for (var i = 0; i < chars.length; i++) {
          var s = chars[i];
          var dx = mx - s._cx;
          var dy = my - s._cy;
          var d = Math.sqrt(dx * dx + dy * dy);
          var ratio = Math.min(d / maxDist, 1);
          var w = Math.round(900 - 800 * ratio);
          var next = "'wght' " + w;
          if (s._fv !== next) {
            s._fv = next;
            s.style.fontVariationSettings = next;
          }
        }
      }

      if (reduceMotion) {
        // static presentation: heaviest in the middle
        var tr0 = tpTitle.getBoundingClientRect();
        setWeights(tr0.left + tr0.width / 2, tr0.top + tr0.height / 2);
        return;
      }

      var init = tpTitle.getBoundingClientRect();
      cursor.x = mouse.x = init.left + init.width / 2;
      cursor.y = mouse.y = init.top + init.height / 2;

      window.addEventListener('mousemove', function (e) {
        cursor.x = e.clientX;
        cursor.y = e.clientY;
      }, { passive: true });
      window.addEventListener('touchmove', function (e) {
        if (e.touches && e.touches[0]) {
          cursor.x = e.touches[0].clientX;
          cursor.y = e.touches[0].clientY;
        }
      }, { passive: true });

      function tick() {
        mouse.x += (cursor.x - mouse.x) / 15;
        mouse.y += (cursor.y - mouse.y) / 15;
        setWeights(mouse.x, mouse.y);
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    })();
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();