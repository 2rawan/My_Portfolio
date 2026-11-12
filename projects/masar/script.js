(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var DEST = {
    petra: { name: 'Petra', country: 'Jordan', img: 'images/petra.jpg',
      text: 'The rose-red city carved into sandstone cliffs by the Nabataeans. Walk the Siq at first light, climb to the Monastery, and stay long enough to see the Treasury glow at dusk.',
      facts: ['Best: Mar–May, Sep–Nov', 'Suggested: 2–3 days', 'UNESCO World Heritage'],
      plan: ['Walk the Siq at sunrise to the Treasury', 'Royal Tombs and the Street of Facades', 'Climb the 800 steps to the Monastery', 'Petra by Night and a slow Bedouin tea', 'Back-trail hike to the High Place of Sacrifice'] },
    alula: { name: 'AlUla', country: 'Saudi Arabia', img: 'images/alula.jpg',
      text: 'A valley of monumental rock formations, oases and ancient tombs. Explore Hegra, wander the old town and watch the sun drop behind Elephant Rock.',
      facts: ['Best: Oct–Mar', 'Suggested: 3–4 days', 'Hegra tombs'],
      plan: ['Sunset at Elephant Rock', 'Guided tour of Hegra’s Nabataean tombs', 'Old Town and the date-palm oasis', 'Jabal Ikmah open-air library', 'Slow morning, desert stargazing'] },
    wadirum: { name: 'Wadi Rum', country: 'Jordan', img: 'images/wadirum.jpg',
      text: 'Vast red canyons and silent sands. Sleep in a desert camp, cross the dunes by 4x4 or on foot, and let the sky do the rest.',
      facts: ['Best: Mar–May, Sep–Nov', 'Suggested: 2 days', 'Desert camp stay'],
      plan: ['Jeep through the red dunes and canyons', 'Hike Burdah rock bridge', 'Sunset tea and camp dinner', 'Stargazing from the camp', 'Camel ride at sunrise'] }
  };
  var KEY = 'masar.trip.v1';
  var ids = Object.keys(DEST);
  var trip = load();
  var lastFocus = null;

  function load() {
    try { var t = JSON.parse(localStorage.getItem(KEY)); if (t && t.items) return t; } catch (e) {}
    return { start: '', items: {} };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(trip)); } catch (e) {} }

  /* header */
  var header = $('#header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 40); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  var burger = $('#burger'), nav = $('#nav');
  function setMenu(o) { nav.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* search */
  var searchBtn = $('#searchBtn'), search = $('#search'), q = $('#q'), res = $('#searchRes');
  searchBtn.addEventListener('click', function () {
    search.hidden = !search.hidden;
    if (!search.hidden) q.focus();
  });
  search.addEventListener('submit', function (e) { e.preventDefault(); });
  q.addEventListener('input', function () {
    var v = q.value.trim().toLowerCase(); res.innerHTML = '';
    if (!v) return;
    var hits = ids.filter(function (k) { return (DEST[k].name + ' ' + DEST[k].country).toLowerCase().indexOf(v) > -1; });
    if (!hits.length) { res.textContent = 'No destinations found.'; return; }
    hits.forEach(function (k) {
      var a = document.createElement('a'); a.tabIndex = 0; a.textContent = DEST[k].name + ' — ' + DEST[k].country;
      a.addEventListener('click', function () { search.hidden = true; openDetail(k); });
      a.addEventListener('keydown', function (e) { if (e.key === 'Enter') a.click(); });
      res.appendChild(a);
    });
  });

  /* reveal on scroll (above-the-fold items shown immediately) */
  var rev = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rev.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in'); else io.observe(el);
    });
  } else rev.forEach(function (el) { el.classList.add('in'); });

  /* toast */
  var toastEl = $('#toast'), tt;
  function toast(m) { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('show'); }, 2600); }

  /* modals with focus trap */
  var openM = null;
  function show(m) {
    lastFocus = document.activeElement; m.hidden = false; openM = m; document.body.classList.add('lock');
    $('.close', m).focus();
  }
  function hide() {
    if (!openM) return;
    openM.hidden = true; openM = null; document.body.classList.remove('lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) hide(); });
  document.addEventListener('keydown', function (e) {
    if (!openM) return;
    if (e.key === 'Escape') { hide(); return; }
    if (e.key !== 'Tab') return;
    var f = $$('button,input,a[href],[tabindex]:not([tabindex="-1"])', openM).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* detail modal */
  var dm = $('#detailModal'), current = null;
  function openDetail(id) {
    var d = DEST[id]; current = id;
    $('#dImg').src = d.img; $('#dImg').alt = d.name + ', ' + d.country;
    $('#dMeta').textContent = d.country; $('#dTitle').textContent = d.name; $('#dText').textContent = d.text;
    $('#dFacts').innerHTML = d.facts.map(function (f) { return '<li>' + f + '</li>'; }).join('');
    syncAdd(); show(dm);
  }
  function syncAdd() { $('#dAdd').textContent = trip.items[current] ? 'Remove from trip' : 'Add to trip'; }
  $$('[data-detail]').forEach(function (b) { b.addEventListener('click', function () { openDetail(b.dataset.detail); }); });
  $('#dAdd').addEventListener('click', function () {
    if (trip.items[current]) { delete trip.items[current]; toast(DEST[current].name + ' removed from your trip'); }
    else { trip.items[current] = 2; toast(DEST[current].name + ' added to your trip'); }
    save(); syncAdd(); render();
  });

  /* planner */
  var pm = $('#plannerModal'), pList = $('#pList'), pDays = $('#pDays'), sd = $('#startDate');
  $$('[data-open-planner]').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); render(); show(pm); }); });
  sd.addEventListener('change', function () { trip.start = sd.value; save(); renderDays(); });
  $('#pClear').addEventListener('click', function () { trip = { start: trip.start, items: {} }; save(); render(); });

  function focusCtl(k, sel) {
    var row = $$('.prow', pList)[ids.indexOf(k)], el = row && $$(sel, row).filter(function (x) { return !x.disabled; })[0];
    if (el) el.focus();
  }
  function renderList() {
    pList.innerHTML = '';
    ids.forEach(function (k) {
      var on = !!trip.items[k], n = trip.items[k] || 0;
      var row = document.createElement('div'); row.className = 'prow' + (on ? ' on' : '');
      row.innerHTML = '<label><input type="checkbox"' + (on ? ' checked' : '') + '> ' + DEST[k].name + '</label>' +
        (on ? '<div class="stepper"><button type="button" aria-label="Fewer days in ' + DEST[k].name + '"' + (n <= 1 ? ' disabled' : '') + '>−</button><output>' + n + (n === 1 ? ' day' : ' days') + '</output><button type="button" aria-label="More days in ' + DEST[k].name + '"' + (n >= 7 ? ' disabled' : '') + '>+</button></div>' : '');
      var cb = $('input', row);
      cb.addEventListener('change', function () { if (cb.checked) trip.items[k] = 2; else delete trip.items[k]; save(); render(); focusCtl(k, 'input'); });
      var bs = $$('button', row);
      if (bs.length) {
        bs[0].addEventListener('click', function () { trip.items[k] = Math.max(1, n - 1); save(); render(); focusCtl(k, 'button'); });
        bs[1].addEventListener('click', function () { trip.items[k] = Math.min(7, n + 1); save(); render(); focusCtl(k, 'button'); });
      }
      pList.appendChild(row);
    });
  }
  function fmt(d) { return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function renderDays() {
    pDays.innerHTML = '';
    var keys = ids.filter(function (k) { return trip.items[k]; });
    var total = keys.reduce(function (s, k) { return s + trip.items[k]; }, 0);
    $('#pTotal').textContent = total ? '· ' + total + (total === 1 ? ' day' : ' days') : '';
    if (!total) { pDays.innerHTML = '<li class="empty" style="display:block;border:0">Choose a destination to see your day-by-day plan.</li>'; $('#pSaved').textContent = ''; return; }
    var base = trip.start ? new Date(trip.start + 'T00:00:00') : null, n = 0;
    keys.forEach(function (k) {
      for (var i = 0; i < trip.items[k]; i++) {
        n++;
        var li = document.createElement('li');
        var date = base ? fmt(new Date(base.getFullYear(), base.getMonth(), base.getDate() + n - 1)) : '';
        li.innerHTML = '<b>Day ' + n + '</b><span>' + DEST[k].name + ' — ' + DEST[k].plan[i % DEST[k].plan.length] + (date ? '<small>' + date + '</small>' : '') + '</span>';
        pDays.appendChild(li);
      }
    });
    $('#pSaved').textContent = 'Saved on this device.';
  }
  function render() { sd.value = trip.start || ''; renderList(); renderDays(); }
  render();

  /* newsletter */
  var form = $('#newsForm'), email = $('#email'), msg = $('#newsMsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    msg.className = 'form-msg' + (ok ? '' : ' err');
    email.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (!ok) { msg.textContent = 'Please enter a valid email address.'; email.focus(); return; }
    msg.textContent = 'Thank you — you’re on the list. Welcome to MASAR.';
    form.reset();
  });
})();
