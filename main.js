/* ============================================================================
   Sparsh Rastogi — portfolio
   Vanilla port of the Claude Design `class Component extends DCLogic`.
   The original used React only to hold refs; every behaviour inside it was
   already plain DOM work, so the React shell and the support.js runtime are
   gone and nothing else changed. Theme is now a data-theme attribute the
   stylesheet reacts to, rather than JS writing custom properties one by one.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var root      = $('root');
  var nav       = $('nav');
  var wave      = $('wave');
  var typed     = $('typed');
  var themeLbl  = $('theme-label');
  var pubList   = $('pub-list');
  var pubBar    = $('pub-toolbar');
  var dirBtn    = $('dir-btn');

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- theme ------------------------------------------------------------ */
  var theme = 'dark';

  function applyTheme(mode, persist) {
    theme = mode;
    document.documentElement.setAttribute('data-theme', mode);
    if (themeLbl) themeLbl.textContent = mode === 'dark' ? '◑ Dark' : '◐ Light';
    if (persist) { try { localStorage.setItem('sr-theme', mode); } catch (e) {} }
  }

  function toggleTheme() { applyTheme(theme === 'dark' ? 'light' : 'dark', true); }

  /* ---- nav --------------------------------------------------------------- */
  function onScrollNav() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 60);
  }

  /* ---- hero canvas wave --------------------------------------------------
     The loop is gated on visibility. Left ungated it repaints forever, including
     when the hero is scrolled far off a long page — constant GPU work for
     something nobody can see, which on a laptop is measurable battery drain.
     ---------------------------------------------------------------------- */
  function startWave() {
    if (!wave || reduceMotion) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var fit = function () {
      wave.width  = Math.max(1, wave.clientWidth * dpr);
      wave.height = Math.max(1, wave.clientHeight * dpr);
    };
    fit();
    window.addEventListener('resize', fit, { passive: true });

    var t = 0, raf = null, visible = true;
    var lines = [
      { a: .34, amp: .05, f: 16, s: 1.1, y: .54, w: 1.6 },
      { a: .19, amp: .08, f: 11, s: .7,  y: .64, w: 1.1 },
      { a: .12, amp: .11, f: 7,  s: .45, y: .74, w: 1 },
      { a: .07, amp: .14, f: 5,  s: .3,  y: .84, w: 1 }
    ];

    function frame() {
      var ctx = wave.getContext('2d');
      var W = wave.width, H = wave.height;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = theme === 'light' ? '#0f9d63' : '#57e0a0';
      for (var i = 0; i < lines.length; i++) {
        var ln = lines[i];
        ctx.globalAlpha = ln.a * (theme === 'light' ? .8 : 1);
        ctx.lineWidth = dpr * ln.w;
        ctx.beginPath();
        var amp = H * ln.amp, yB = H * ln.y;
        for (var x = 0; x <= W; x += 6 * dpr) {
          var k = x / W;
          var y = yB
            + Math.sin(k * ln.f + t * ln.s) * amp * Math.sin(k * 3 + t * .2)
            + Math.sin(k * 38 + t * 2) * amp * .16;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      t += .028;
      raf = requestAnimationFrame(frame);
    }

    function start() { if (raf === null) raf = requestAnimationFrame(frame); }
    function stop()  { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && document.visibilityState === 'visible') start(); else stop();
      }, { threshold: 0 }).observe(wave);
    }
    // A backgrounded tab throttles rAF but does not stop it; be explicit.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && visible) start(); else stop();
    });
    start();
  }

  /* ---- hero typing ------------------------------------------------------- */
  function startTyping() {
    if (!typed) return;
    var words = [
      'an Applied Scientist at Amazon',
      'an IndiaAI Fellow',
      'an AAAI Scholar',
      'working on multimodal representational learning',
      'building time-series language models'
    ];
    if (reduceMotion) { typed.textContent = words[0]; return; }
    var wi = 0, ci = 0, dir = 1, hold = 0;
    setInterval(function () {
      var w = words[wi];
      if (dir === 1) { ci++; if (ci >= w.length) { dir = 0; hold = 22; } }
      else if (dir === 0) { if (--hold <= 0) dir = -1; }
      else { ci--; if (ci <= 0) { dir = 1; wi = (wi + 1) % words.length; } }
      typed.textContent = w.slice(0, Math.max(0, ci));
    }, 55);
  }

  /* ---- scroll reveals ---------------------------------------------------- */
  function setupReveals() {
    if (!root) return;
    var els = all('[data-reveal]', root);
    var show = function (el) {
      if (el._shown) return;
      el._shown = true;
      var d = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
      setTimeout(function () { el.style.opacity = '1'; el.style.transform = 'none'; }, d);
    };
    var revealAll = function () { els.forEach(show); };

    // Not actively rendering (print/export/backgrounded tab): never hide.
    if (document.visibilityState !== 'visible' || reduceMotion) { revealAll(); return; }

    els.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      el.style.transition = 'opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1)';
    });

    var check = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight || 800;
      els.forEach(function (el) {
        if (el._shown) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > -40) show(el);
      });
    };
    var raf = null;
    var queue = function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = null; check(); });
    };

    check(); // reveal whatever is already on screen — no observer dependency
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') queue(); else revealAll();
    });
    setTimeout(revealAll, 2500); // safety net: nothing can stay hidden
  }

  /* NOTE: the source carried a setupCounts() count-up animation driven by
     [data-count-to]. No element in the markup has ever carried that attribute,
     so it was dead code in the original and is not ported. If you want animated
     stats later, add the attribute and the routine comes back in ~20 lines. */

  /* ---- work timeline ----------------------------------------------------- */
  function setupWorkTimeline() {
    if (!root) return;
    var fill = root.querySelector('[data-tl-fill]');
    var grid = fill && fill.parentElement;
    var lefts  = all('[data-tl-left]', root);
    var rights = all('[data-tl-right]', root);
    var nodes  = lefts.map(function (l) { return l.querySelector('[data-node]'); });
    if (!rights.length || !grid) return;

    var nodeCenter = function (i) {
      var b = nodes[i].getBoundingClientRect();
      return b.top + b.height / 2;
    };

    var upd = function () {
      var cy = (window.innerHeight || 800) * 0.44;
      var active = 0, bd = 1e9;
      rights.forEach(function (r, i) {
        var b = r.getBoundingClientRect();
        var d = Math.abs((b.top + b.height / 2) - cy);
        if (d < bd) { bd = d; active = i; }
      });
      var gr = grid.getBoundingClientRect();
      var first = nodeCenter(0), last = nodeCenter(nodes.length - 1);
      var end = Math.max(first, Math.min(cy, last));
      // Rail is laid out once at full height; progress is a compositor-only
      // scaleY. Animating height/top instead forces layout + paint every
      // scroll frame, which is what the original did.
      var span = last - first;
      fill.style.top = (first - gr.top) + 'px';
      fill.style.height = span + 'px';
      fill.style.transform = 'scaleY(' + (span > 0 ? (end - first) / span : 0) + ')';
      nodes.forEach(function (n, i) {
        if (!n) return;
        var on = i <= active;
        n.style.background  = on ? 'var(--accent)' : 'var(--panel)';
        n.style.borderColor = on ? 'var(--accent)' : 'var(--line)';
        n.style.animation   = (i === active && !reduceMotion) ? 'pulseRing 2s ease-in-out infinite' : 'none';
        var chk = n.querySelector('[data-check]');
        if (chk) chk.style.opacity = on ? '1' : '0';
      });
      rights.forEach(function (r, i) { r.style.opacity = i === active ? '1' : '.4'; });
    };

    var raf = null;
    var queue = function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = null; upd(); });
    };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    upd();
  }

  /* ---- active nav -------------------------------------------------------- */
  function setupActiveNav() {
    if (!root || !('IntersectionObserver' in window)) return;
    var links = {};
    all('a[data-nav]', root).forEach(function (a) { links[a.getAttribute('data-nav')] = a; });
    var ids = Object.keys(links);
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (!e.isIntersecting) return;
        ids.forEach(function (id) { if (links[id]) links[id].style.color = 'var(--muted)'; });
        var a = links[e.target.id];
        if (a) a.style.color = 'var(--ink)';
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  /* ---- publication sorting ----------------------------------------------- */
  var sortKey = 'year', sortDir = 'desc';

  var ARROW_UP   = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  var ARROW_DOWN = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';

  function sortPubs(key) {
    if (key) sortKey = key;
    var dir = sortDir === 'asc' ? 1 : -1;
    if (pubList) {
      var cards = all('a[data-pub]', pubList);
      var base = {
        // data-cites survives as the year tiebreak only. Sorting BY it went away
        // with the visible counts: reordering rows by a quantity that appears
        // nowhere on the page just moves them for no reason the reader can see.
        year:  function (a, b) { return (a.dataset.year - b.dataset.year) || (a.dataset.cites - b.dataset.cites); },
        title: function (a, b) { return a.dataset.title.localeCompare(b.dataset.title); }
      }[sortKey];
      cards.sort(function (a, b) { return base(a, b) * dir; });
      cards.forEach(function (el) { pubList.appendChild(el); });
    }
    if (pubBar) {
      all('button[data-sort]', pubBar).forEach(function (b) {
        var on = b.dataset.sort === sortKey;
        b.style.color       = on ? 'var(--ink)' : 'var(--muted)';
        b.style.borderColor = on ? 'var(--accent)' : 'var(--line)';
        b.style.background  = on ? 'var(--accent-soft)' : 'transparent';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
  }

  function toggleDir() {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    if (dirBtn) {
      dirBtn.innerHTML = sortDir === 'asc' ? ARROW_UP : ARROW_DOWN;
      dirBtn.setAttribute('aria-label', 'Sort ' + (sortDir === 'asc' ? 'ascending' : 'descending'));
      // the swapped-in arrow is decorative; keep it out of the a11y tree too
      var svg = dirBtn.querySelector('svg');
      if (svg) { svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false'); }
    }
    sortPubs();
  }

  /* ---- mobile nav menu ---------------------------------------------------
     Below 1040px the links have nowhere to sit, so they become a panel behind
     a toggle. The same six anchors serve both layouts — no duplicated markup
     to drift out of sync. */
  var navToggle = $('nav-toggle');
  var navPanel  = $('navlinks');

  var BURGER = '<svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var CLOSE  = '<svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function setNav(open) {
    if (!nav || !navToggle) return;
    nav.toggleAttribute('data-nav-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    navToggle.innerHTML = open ? CLOSE : BURGER;
  }

  function toggleNav() {
    setNav(!(nav && nav.hasAttribute('data-nav-open')));
  }

  if (navPanel) {
    // a jump link has done its job; get out of the way
    navPanel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setNav(false);
  });
  document.addEventListener('click', function (e) {
    if (!nav || !nav.hasAttribute('data-nav-open')) return;
    if (!e.target.closest('#nav')) setNav(false);
  });

  /* ---- analytics ---------------------------------------------------------
     PostHog is loaded from index.html; this only names events. Every call goes
     through track(), which is a no-op when posthog is missing — blocked by an
     extension, offline, or simply not configured — so nothing on the page can
     break because analytics failed. That is the whole reason this indirection
     exists rather than calling posthog.capture() at each site.

     What is worth capturing here is not pageviews, which autocapture already
     gets, but the two questions a portfolio actually raises: which paper did
     they open, and how far did they read. Hence named events with real
     properties, and one section-depth observer. */
  function track(name, props) {
    try {
      if (window.posthog && typeof window.posthog.capture === 'function') {
        window.posthog.capture(name, props || {});
      }
    } catch (e) { /* analytics must never surface to the visitor */ }
  }

  // hostname -> the name a human would use for it, so the dashboard reads as
  // "scholar" rather than "scholar.google.com"
  var NETWORKS = {
    'scholar.google.com': 'google-scholar', 'dblp.org': 'dblp',
    'orcid.org': 'orcid', 'openreview.net': 'openreview',
    'www.semanticscholar.org': 'semantic-scholar', 'aclanthology.org': 'acl-anthology',
    'github.com': 'github', 'www.linkedin.com': 'linkedin'
  };

  function trackClick(e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var pub = a.matches('[data-pub]') ? a : null;

    if (pub) {
      var rows = pubList ? all('a[data-pub]', pubList) : [];
      track('publication_click', {
        title:    pub.dataset.title,
        year:     pub.dataset.year,
        venue:    (pub.querySelector('[data-r="pubvenue"]') || {}).textContent,
        badge:    (pub.querySelector('[data-r="pubbadge"]') || {}).textContent,
        // position under the CURRENT sort — tells you whether people open what
        // is at the top or hunt for something specific
        position: rows.indexOf(pub) + 1,
        sort_key: sortKey,
        sort_dir: sortDir,
        href:     href
      });
      return;
    }
    if (/\.pdf($|\?)/i.test(href)) {
      track('resume_download', { href: href });
      return;
    }
    try {
      var u = new URL(href, location.href);
      if (u.host && u.host !== location.host) {
        track('outbound_click', {
          host: u.host,
          network: NETWORKS[u.host] || null,
          section: (a.closest('section') || {}).id || null,
          text: (a.textContent || '').trim().slice(0, 60)
        });
      }
    } catch (err) { /* not a parseable URL — nothing to report */ }
  }

  /* How far down the page a visitor actually got. Section depth is more
     legible than a scroll percentage: "reached publications" is a fact you can
     act on, "scrolled 62%" is not. Each section fires once. */
  function setupDepth() {
    var seen = {};
    var secs = all('section[id]');
    if (!secs.length || !('IntersectionObserver' in window)) return;
    /* A mid-viewport band, not an intersection ratio. A ratio threshold is
       unreachable for any section taller than the screen — publications is
       several viewports long, so `threshold: 0.35` could never fire and the
       event silently never existed. The band asks the question that was meant
       all along: did this section pass under the reader's eye? Same technique
       the active-nav observer already uses. */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        if (seen[id]) return;
        seen[id] = true;
        track('section_view', { section: id, order: secs.indexOf(en.target) + 1 });
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* The cookie / analytics notice. Shown once, answered once, remembered in
     localStorage — the choice belongs to the visitor's device, and re-asking
     someone who already answered is the thing that makes these bars hated.

     Declining calls opt_out_capturing, so the button does what it says rather
     than only hiding the bar. Accepting records the answer and leaves capture
     as it is. Note that capture runs from page load: this is a notice with a
     working opt-out, not a consent gate that withholds collection until asked.
     Making it a true gate is one flag — opt_out_capturing_by_default — at the
     cost of losing everyone who ignores the bar. */
  var NOTICE_KEY = 'sr-cookie-notice';

  function noticeAnswered() {
    try { return !!localStorage.getItem(NOTICE_KEY); } catch (e) { return false; }
  }

  function answerNotice(value) {
    try { localStorage.setItem(NOTICE_KEY, value); } catch (e) {}
    var bar = $('cookie-notice');
    if (bar) bar.hidden = true;
  }

  function setupNotice() {
    var bar = $('cookie-notice');
    if (!bar || noticeAnswered()) return;
    // a visitor with Do Not Track has already answered, in the strongest way
    // available to them; asking again would be rude and pointless
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    bar.hidden = false;
  }

  /* ---- wiring ------------------------------------------------------------ */
  var ACTIONS = {
    cookieAccept: function () { answerNotice('accepted'); },
    cookieDecline: function () {
      try {
        if (window.posthog && window.posthog.opt_out_capturing) {
          window.posthog.opt_out_capturing();
        }
      } catch (e) {}
      answerNotice('declined');
    },
    toggleTheme: function () { toggleTheme(); track('theme_toggle', { to: theme }); },
    toggleNav:   toggleNav,
    toggleDir:   function () { toggleDir(); track('pub_sort', { key: sortKey, dir: sortDir }); },
    sortYear:    function () { sortPubs('year'); track('pub_sort', { key: 'year', dir: sortDir }); },
    sortTitle:   function () { sortPubs('title'); track('pub_sort', { key: 'title', dir: sortDir }); }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var fn = ACTIONS[el.getAttribute('data-action')];
    if (fn) { e.preventDefault(); fn(); }
  });

  function init() {
    var saved = null;
    try { saved = localStorage.getItem('sr-theme'); } catch (e) {}
    applyTheme(saved === 'light' || saved === 'dark' ? saved : 'dark', false);

    startWave();
    startTyping();
    setupReveals();
    setupActiveNav();
    setupWorkTimeline();
    sortPubs();
    setupDepth();
    setupNotice();

    /* A hardcoded year in a footer is stale the moment January arrives, and it
       is the sort of thing nobody notices for months. Written at render from
       the visitor's own clock; the markup carries 2026 so the line is correct
       for anyone with scripting disabled. */
    var yr = $('colophon-year');
    if (yr) yr.textContent = '\u00a9 ' + new Date().getFullYear() + ' Sparsh Rastogi';

    // capture phase, so a click is recorded even though the handler that
    // navigates away runs on the same event
    document.addEventListener('click', trackClick, true);
    window.addEventListener('scroll', onScrollNav, { passive: true });
    onScrollNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
