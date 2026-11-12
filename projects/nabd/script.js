(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'nabd-state-v1';
  const GOAL = 10800;
  const defaults = {
    steps: 8432, cal: 420, km: 6.1, min: 58,
    workoutDone: true, collapsed: false,
    trainingDone: {}, water: 5, meals: [{ n: 'Oats & berries', k: 380 }, { n: 'Chicken bowl', k: 620 }],
    mood: null, sleepGoal: 8, joined: {}
  };
  let state;
  try { state = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { state = { ...defaults }; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* greeting + date */
  const hr = new Date().getHours();
  $('.greet').textContent = (hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening') + ',';
  $('#today').textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  /* activity ring */
  const C = 2 * Math.PI * 86;
  const ring = $('#ringProg');
  ring.style.strokeDasharray = C;
  ring.style.strokeDashoffset = C;
  let shownPct = 0;
  function countTo(el, from, to, dur = 1200, dec = 0) {
    const out = v => { el.textContent = dec ? v.toFixed(dec) : fmt(v); };
    if (reduce) { out(to); return; }
    const t0 = performance.now();
    (function f(t) {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      out(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }
  const prev = { steps: 0, cal: 0, km: 0, min: 0 };
  function renderActivity() {
    const pct = Math.min(100, Math.round(state.steps / GOAL * 100));
    ring.style.strokeDashoffset = C * (1 - pct / 100);
    countTo($('#pct'), shownPct, pct); shownPct = pct;
    countTo($('#stSteps'), prev.steps, state.steps);
    countTo($('#stCal'), prev.cal, state.cal);
    countTo($('#stKm'), prev.km, state.km, 1200, 1);
    countTo($('#stMin'), prev.min, state.min);
    Object.assign(prev, { steps: state.steps, cal: state.cal, km: state.km, min: state.min });
    $('#ringWrap').setAttribute('aria-label', `Daily goal ${pct}% complete`);
    $('#trendPct').textContent = '+' + Math.round(12 + Math.max(0, state.steps - 8432) / 400) + '%';
    renderWorkoutBadge();
  }
  function renderWorkoutBadge() {
    const b = $('#doneBadge');
    b.classList.toggle('pending', !state.workoutDone);
    b.lastChild.textContent = state.workoutDone ? 'Completed' : 'Not started';
  }
  function addSteps(n) {
    state.steps += n; state.cal += n * 0.04; state.km += n * 0.00072; state.min += n / 125;
    save(); renderActivity(); toast(`+${fmt(n)} steps logged`);
  }
  const logDlg = $('#logDlg');
  $('#logBtn').onclick = () => { logDlg.showModal(); $('#logSteps').select(); };
  $$('#logChips .chip').forEach(c => c.onclick = () => { $('#logSteps').value = c.dataset.v; });
  $('#logForm').onsubmit = e => {
    e.preventDefault();
    const n = Math.max(1, Math.min(50000, parseInt($('#logSteps').value, 10) || 0));
    logDlg.close(); addSteps(n);
  };
  $('#resetBtn').onclick = () => {
    Object.assign(state, { steps: defaults.steps, cal: defaults.cal, km: defaults.km, min: defaults.min });
    save(); renderActivity(); toast('Day reset');
  };

  /* weekly chart */
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const metrics = {
    steps: { data: [4200, 5400, 8000, 6800, 8300, 11500, 8700], max: 12000, ticks: 4, unit: 'steps', f: v => v / 1000 + 'K' },
    calories: { data: [310, 360, 520, 440, 480, 640, 420], max: 800, ticks: 4, unit: 'kcal', f: v => v },
    minutes: { data: [32, 41, 62, 48, 55, 78, 58], max: 90, ticks: 3, unit: 'min', f: v => v }
  };
  const W = 700, H = 230, L = 44, R = 14, T = 12, B = 34;
  const X = i => L + (W - L - R) * (0.035 + 0.93 * i / 6);
  function smooth(pts) {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    return d;
  }
  const chart = $('#chart'), tip = $('#tip');
  function drawChart(key) {
    const m = metrics[key], Y = v => T + (H - T - B) * (1 - v / m.max);
    const pts = m.data.map((v, i) => [X(i), Y(v)]);
    let g = '';
    for (let i = 0; i <= m.ticks; i++) {
      const v = m.max * i / m.ticks, y = Y(v);
      g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text x="${L - 10}" y="${y + 4}" text-anchor="end">${m.f(v)}</text>`;
    }
    days.forEach((d, i) => { g += `<line class="grid" x1="${X(i)}" x2="${X(i)}" y1="${T}" y2="${H - B}"/><text x="${X(i)}" y="${H - 8}" text-anchor="middle">${d}</text>`; });
    const line = smooth(pts);
    const area = `${line} L${pts[6][0]},${H - B} L${pts[0][0]},${H - B} Z`;
    const dots = pts.map((p, i) => `<circle class="pt" tabindex="0" cx="${p[0]}" cy="${p[1]}" r="4.5" data-i="${i}" role="img" aria-label="${days[i]}: ${fmt(m.data[i])} ${m.unit}"/>`).join('');
    chart.querySelector('svg')?.remove();
    chart.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Weekly ${key} chart"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6ff3b" stop-opacity=".22"/><stop offset="1" stop-color="#b6ff3b" stop-opacity="0"/></linearGradient></defs>${g}<path d="${area}" fill="url(#ag)"/><path class="line" id="chartLine" d="${line}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${reduce ? 0 : 1}"/>${dots}</svg>`);
    if (!reduce) {
      const ln = $('#chartLine'); ln.getBoundingClientRect();
      ln.style.transition = 'stroke-dashoffset 1s ease'; ln.style.strokeDashoffset = 0;
    }
    const show = el => {
      const i = +el.dataset.i, svg = chart.querySelector('svg'), r = svg.getBoundingClientRect(), c = chart.getBoundingClientRect();
      tip.hidden = false;
      tip.innerHTML = `${days[i]} · <b>${fmt(m.data[i])}</b> ${m.unit}`;
      tip.style.left = (r.left - c.left + pts[i][0] / W * r.width) + 'px';
      tip.style.top = (r.top - c.top + pts[i][1] / H * r.height) + 'px';
      $$('.pt', chart).forEach(p => p.classList.toggle('on', p === el));
    };
    const hide = () => { tip.hidden = true; $$('.pt', chart).forEach(p => p.classList.remove('on')); };
    $$('.pt', chart).forEach(p => {
      p.addEventListener('focus', () => show(p)); p.addEventListener('blur', hide);
    });
    chart.onpointermove = e => {
      const svg = chart.querySelector('svg'), r = svg.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * W;
      let best = 0; pts.forEach((p, i) => { if (Math.abs(p[0] - x) < Math.abs(pts[best][0] - x)) best = i; });
      show($$('.pt', chart)[best]);
    };
    chart.onpointerleave = hide;
  }
  $('#metric').onchange = e => drawChart(e.target.value);

  /* heart-rate sparkline + sleep bars */
  function sparkline() {
    const d = [64, 66, 63, 67, 65, 68, 64, 66, 70, 67, 69, 72, 71, 74];
    const w = 300, h = 60, pts = d.map((v, i) => [i / 13 * w, h - 8 - (v - 60) / 16 * (h - 16)]);
    const p = pts.map(q => q.join(',')).join(' L');
    $('#hrSpark').innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4d57" stop-opacity=".3"/><stop offset="1" stop-color="#ff4d57" stop-opacity="0"/></linearGradient></defs><path d="M${p} L${w},${h} L0,${h} Z" fill="url(#hg)"/><path d="M${p}" fill="none" stroke="#ff4d57" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
    const s = [5.5, 6.5, 6, 8, 7, 8.5, 7.5, 8, 7, 8.5, 7.8, 8.4, 6.8, 7.6];
    const bw = 300 / 14;
    $('#sleepBars').innerHTML = `<svg viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true">${s.map((v, i) => `<rect x="${i * bw + 3}" y="${60 - v * 5.5}" width="${bw - 8}" height="${v * 5.5}" rx="1.5" fill="${i % 2 ? '#6d5bd9' : '#5546c0'}"/>`).join('')}</svg>`;
  }

  /* workout modal */
  const exercises = [['Dumbbell shoulder press', '4 × 10'], ['Bent-over row', '4 × 12'], ['Incline push-up', '3 × 15'], ['Bicep curl', '3 × 12'], ['Tricep dips', '3 × 12'], ['Plank hold', '3 × 45s']];
  const wdlg = $('#workoutDlg');
  $('#exList').innerHTML = exercises.map(e => `<li><button class="tick" aria-pressed="false" aria-label="Mark ${e[0]} done"><svg aria-hidden="true"><use href="#i-check"/></svg></button><span class="grow">${e[0]}</span><small>${e[1]}</small></li>`).join('');
  $('#exList').onclick = e => {
    const b = e.target.closest('.tick'); if (!b) return;
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
    if ($$('#exList .tick[aria-pressed=true]').length === exercises.length) { state.workoutDone = true; save(); renderWorkoutBadge(); toast('Workout complete!'); }
  };
  const total = 45 * 60;
  let left = total, tid = null;
  const tout = $('#timerOut'), tstart = $('#tStart');
  const drawT = () => { tout.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`; };
  function stopT() { clearInterval(tid); tid = null; tstart.textContent = left === total ? 'Start' : 'Resume'; }
  tstart.onclick = () => {
    if (tid) { stopT(); return; }
    tstart.textContent = 'Pause';
    tid = setInterval(() => {
      left--; drawT();
      if (left <= 0) { stopT(); left = total; drawT(); tstart.textContent = 'Start'; toast('Time! Workout finished'); }
    }, 1000);
  };
  $('#tReset').onclick = () => { stopT(); left = total; drawT(); tstart.textContent = 'Start'; };
  $('#viewWorkout').onclick = () => wdlg.showModal();
  wdlg.addEventListener('close', stopT);
  $$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

  /* ICS */
  $('#icsBtn').onclick = () => {
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NABD//Fitness//EN', 'BEGIN:VEVENT', 'UID:nabd-full-body-strength@nabd',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]|\.\d{3}/g, ''), 'DTSTART:20250430T070000', 'DTEND:20250430T074500',
      'SUMMARY:Full Body Strength - NABD', 'DESCRIPTION:Build power\\, improve endurance\\, and keep your momentum going.', 'LOCATION:NABD Gym',
      'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Session starts soon', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'nabd-full-body-strength.ics';
    document.body.append(a); a.click(); a.remove(); toast('Calendar event downloaded');
  };

  /* other views */
  const tick = (on, label) => `<button class="tick" aria-pressed="${on}" aria-label="${label}"><svg aria-hidden="true"><use href="#i-check"/></svg></button>`;
  const workouts = [['Upper Body Power', 'Mon · 45 min · Strength'], ['Mobility Flow', 'Tue · 30 min · Mobility'], ['Lower Body Strength', 'Wed · 50 min · Strength'], ['Active Recovery', 'Thu · 25 min · Recovery'], ['Full Body Strength', 'Fri · 45 min · Strength'], ['Yoga & Stretch', 'Sat · 30 min · Mobility'], ['Meditation', 'Sun · 15 min · Recovery']];
  function renderTraining() {
    const done = workouts.filter((_, i) => state.trainingDone[i]).length;
    $('#tCount').textContent = `${done} / ${workouts.length}`;
    $('#tBar').style.width = done / workouts.length * 100 + '%';
    $('#workoutList').innerHTML = workouts.map((w, i) => `<li class="item ${state.trainingDone[i] ? 'done-i' : ''}" data-search="${w[0]} ${w[1]}" data-i="${i}">${tick(!!state.trainingDone[i], 'Mark ' + w[0] + ' complete')}<div class="grow"><b>${w[0]}</b><span class="muted">${w[1]}</span></div></li>`).join('');
  }
  $('#workoutList').onclick = e => {
    const li = e.target.closest('.item'); if (!li || !e.target.closest('.tick')) return;
    const i = li.dataset.i; state.trainingDone[i] = !state.trainingDone[i]; save(); renderTraining();
    $(`#workoutList [data-i="${i}"] .tick`).focus();
  };
  function renderNutrition() {
    $('#glasses').innerHTML = Array.from({ length: 8 }, (_, i) => `<button class="glass" aria-pressed="${i < state.water}" aria-label="Glass ${i + 1}" data-i="${i}"></button>`).join('');
    $('#wCount').textContent = `${state.water} / 8`;
    const tot = state.meals.reduce((a, m) => a + m.k, 0);
    $('#kcalTotal').textContent = `${fmt(tot)} / 2,200 kcal`;
    $('#kcalBar').style.width = Math.min(100, tot / 22) + '%';
    $('#macros').innerHTML = [['Protein', tot * .3 / 4], ['Carbs', tot * .45 / 4], ['Fat', tot * .25 / 9]].map(m => `<li><span>${m[0]}</span><b>${fmt(m[1])} g</b></li>`).join('');
    $('#mealList').innerHTML = state.meals.map((m, i) => `<li class="item" data-i="${i}"><span class="grow"><b></b></span><span class="muted">${m.k} kcal</span><button class="link-btn" data-del="${i}" aria-label="Remove meal">Remove</button></li>`).join('');
    $$('#mealList .item b').forEach((b, i) => { b.textContent = state.meals[i].n; });
  }
  $('#glasses').onclick = e => {
    const g = e.target.closest('.glass'); if (!g) return;
    const i = +g.dataset.i; state.water = state.water === i + 1 ? i : i + 1; save(); renderNutrition();
    $(`#glasses [data-i="${i}"]`).focus();
  };
  $('#mealList').onclick = e => { const d = e.target.closest('[data-del]'); if (d) { state.meals.splice(+d.dataset.del, 1); save(); renderNutrition(); } };
  $('#mealForm').onsubmit = e => {
    e.preventDefault();
    state.meals.push({ n: $('#mealName').value.trim(), k: Math.max(1, parseInt($('#mealKcal').value, 10) || 0) });
    e.target.reset(); save(); renderNutrition(); toast('Meal added');
  };

  const moods = [['😄', 'Great', 'Love the energy! Channel it into your workout.'], ['🙂', 'Good', 'Nice and steady. Keep going.'], ['😐', 'Okay', 'A light mobility session could help.'], ['😴', 'Tired', 'Rest is training too. Try some recovery.'], ['😟', 'Stressed', 'Try the breathing exercise.']];
  function renderMoods() {
    $('#moods').innerHTML = moods.map((m, i) => `<button class="mood" role="radio" aria-checked="${state.mood === i}" aria-label="${m[1]}" data-i="${i}">${m[0]}</button>`).join('');
    $('#moodMsg').textContent = state.mood == null ? 'Pick how you feel today.' : moods[state.mood][2];
  }
  $('#moods').onclick = e => { const b = e.target.closest('.mood'); if (!b) return; state.mood = +b.dataset.i; save(); renderMoods(); $(`#moods [data-i="${state.mood}"]`).focus(); };
  const sr = $('#sleepRange'); sr.value = state.sleepGoal;
  const sleepOut = () => { $('#sleepOut').textContent = state.sleepGoal + ' h'; };
  sr.oninput = () => { state.sleepGoal = +sr.value; sleepOut(); save(); };
  let bt = null;
  $('#breathBtn').onclick = e => {
    const orb = $('#orb'), txt = $('#orbTxt');
    if (bt) { clearInterval(bt); bt = null; orb.classList.remove('big'); txt.textContent = 'Ready'; e.target.textContent = 'Start'; return; }
    e.target.textContent = 'Stop';
    const ph = ['Inhale', 'Hold', 'Exhale', 'Hold']; let i = 0;
    const step = () => { txt.textContent = ph[i % 4]; orb.classList.toggle('big', i % 4 < 2); i++; };
    step(); bt = setInterval(step, 4000);
  };

  function renderProgress() {
    const k = [['Workouts', '24', 'this month'], ['Avg. steps', '8,150', 'per day'], ['Streak', '12', 'days']];
    $('#kpis').innerHTML = k.map(x => `<article class="card kpi" data-search="${x[0]} ${x[2]}"><span>${x[0]}</span><b>${x[1]}</b><span>${x[2]}</span></article>`).join('');
    const v = [52, 61, 58, 70, 66, 78, 74, 88], w = 700, h = 200, bw = w / 8;
    $('#barChart').innerHTML = `<svg viewBox="0 0 ${w} ${h + 24}" role="img" aria-label="Weekly activity score for the last 8 weeks">${v.map((x, i) => `<rect class="bar-r ${i === 7 ? 'last' : ''}" x="${i * bw + 14}" y="${h - x * 2}" width="${bw - 28}" height="${x * 2}" rx="6"><title>Week ${i + 1}: ${x}</title></rect><text x="${i * bw + bw / 2}" y="${h + 18}" text-anchor="middle">W${i + 1}</text>`).join('')}</svg>`;
    $('#prList').innerHTML = [['Deadlift', '95 kg'], ['Bench press', '55 kg'], ['5K run', '27:40'], ['Plank', '3:12']].map(p => `<li class="item" data-search="${p[0]} record"><b class="grow">${p[0]}</b><span class="badge">${p[1]}</span></li>`).join('');
  }
  const challenges = [['10K Steps Streak', '1,284 members · 7 days'], ['Sunrise Strength', '642 members · 14 days'], ['Mindful Minutes', '903 members · 30 days']];
  function renderCommunity() {
    $('#challengeList').innerHTML = challenges.map((c, i) => `<li class="item" data-search="${c[0]} challenge"><div class="grow"><b>${c[0]}</b><span class="muted">${c[1]}</span></div><button class="btn join ${state.joined[i] ? 'ghost' : ''}" data-i="${i}" aria-pressed="${!!state.joined[i]}">${state.joined[i] ? 'Joined ✓' : 'Join'}</button></li>`).join('');
    $('#board').innerHTML = [['Layla', 92400], ['Rawan', 81300], ['Omar', 77850], ['Sara', 70120]].map((p, i) => `<li><span class="rk">${i + 1}</span><span class="grow">${p[0]}</span><em>${fmt(p[1])}</em></li>`).join('');
  }
  $('#challengeList').onclick = e => {
    const b = e.target.closest('.join'); if (!b) return;
    const i = b.dataset.i; state.joined[i] = !state.joined[i]; save(); renderCommunity();
    toast(state.joined[i] ? 'Challenge joined' : 'Left challenge');
  };

  /* search: filters [data-search] blocks in the active view */
  const search = $('#search');
  function applySearch() {
    const q = search.value.trim().toLowerCase(), v = $('.view:not([hidden])');
    let any = false;
    $$('[data-search]', v).forEach(el => {
      const hit = !q || el.dataset.search.toLowerCase().includes(q) || el.textContent.toLowerCase().includes(q);
      el.hidden = !hit; if (hit) any = true;
    });
    $('#noResults').hidden = any || !q;
  }
  search.addEventListener('input', applySearch);

  /* hash router */
  const names = ['dashboard', 'training', 'nutrition', 'wellbeing', 'progress', 'community'];
  function route() {
    const r = location.hash.replace(/^#\/?/, '') || 'dashboard';
    const name = names.includes(r) ? r : 'dashboard';
    $$('.view').forEach(v => { v.hidden = v.dataset.view !== name; });
    $$('[data-nav]').forEach(a => {
      const on = a.dataset.nav === name;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = name[0].toUpperCase() + name.slice(1) + ' — NABD';
    if (name === 'dashboard') drawChart($('#metric').value);
    applySearch(); window.scrollTo(0, 0);
  }
  addEventListener('hashchange', route);

  /* sidebar + notifications */
  const app = $('#app'), cb = $('#collapseBtn');
  const setCollapsed = c => { app.classList.toggle('collapsed', c); cb.setAttribute('aria-expanded', String(!c)); state.collapsed = c; save(); };
  cb.onclick = () => setCollapsed(!app.classList.contains('collapsed'));
  setCollapsed(!!state.collapsed);
  const bell = $('#bellBtn'), pop = $('#notifs');
  bell.onclick = () => { pop.hidden = !pop.hidden; bell.setAttribute('aria-expanded', String(!pop.hidden)); $('#bellDot').hidden = true; };
  document.addEventListener('click', e => { if (!pop.hidden && !e.target.closest('.bell-wrap')) { pop.hidden = true; bell.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { pop.hidden = true; bell.focus(); } });

  sparkline(); renderTraining(); renderNutrition(); renderMoods(); sleepOut(); renderProgress(); renderCommunity(); drawT();
  route();
  setTimeout(renderActivity, 150);
})();
