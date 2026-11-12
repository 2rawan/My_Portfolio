(function () {
  'use strict';
  var KEY = 'sidr-cart-v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; if (!Array.isArray(cart)) cart = []; } catch (e) { cart = []; }

  var drawer = $('#cartDrawer'), overlay = $('#overlay'), list = $('#cartList'), empty = $('#cartEmpty'),
      count = $('#cartCount'), cartBtn = $('#cartBtn'), sub = $('#cartSubtotal'), note = $('#cartNote'),
      checkout = $('#checkoutBtn'), menuBtn = $('#menuBtn'), nav = $('#nav'), lastFocus = null;

  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function money(n) { return '$' + (n % 1 ? n.toFixed(2) : n); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML.replace(/"/g, '&quot;'); }

  function render(bump) {
    var qty = 0, total = 0;
    list.innerHTML = '';
    cart.forEach(function (i) {
      qty += i.qty; total += i.qty * i.price;
      var li = document.createElement('li'); li.className = 'cart-item';
      li.innerHTML = '<img src="' + esc(i.img) + '" alt="" width="72" height="72">' +
        '<div><h3>' + esc(i.name) + '</h3><div class="qty">' +
        '<button type="button" data-act="dec" data-id="' + esc(i.id) + '" aria-label="Decrease quantity of ' + esc(i.name) + '">−</button>' +
        '<span>' + i.qty + '</span>' +
        '<button type="button" data-act="inc" data-id="' + esc(i.id) + '" aria-label="Increase quantity of ' + esc(i.name) + '">+</button></div></div>' +
        '<div class="item-right">' + money(i.price * i.qty) + '<br><button type="button" class="remove" data-act="rm" data-id="' + esc(i.id) + '" aria-label="Remove ' + esc(i.name) + '">Remove</button></div>';
      list.appendChild(li);
    });
    empty.hidden = cart.length > 0;
    sub.textContent = money(total);
    checkout.disabled = !cart.length;
    count.textContent = qty; count.hidden = !qty;
    cartBtn.setAttribute('aria-label', 'Open cart, ' + qty + (qty === 1 ? ' item' : ' items'));
    if (bump) { count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump'); }
  }

  function openCart() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add('open'); });
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('#closeCart').focus();
  }
  function closeCart() {
    overlay.classList.remove('open'); drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
    setTimeout(function () { if (!drawer.classList.contains('open')) overlay.hidden = true; }, 300);
    if (lastFocus) lastFocus.focus();
  }

  $$('.add-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.dataset.id, f = cart.filter(function (i) { return i.id === id; })[0];
      if (f) f.qty++; else cart.push({ id: id, name: b.dataset.name, price: +b.dataset.price, img: b.dataset.img, qty: 1 });
      note.textContent = ''; save(); render(true); openCart();
    });
  });
  list.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var id = b.dataset.id, i = cart.filter(function (x) { return x.id === id; })[0]; if (!i) return;
    if (b.dataset.act === 'inc') i.qty++;
    else if (b.dataset.act === 'dec') i.qty--;
    else i.qty = 0;
    cart = cart.filter(function (x) { return x.qty > 0; });
    save(); render();
  });
  cartBtn.addEventListener('click', openCart);
  $('#closeCart').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  checkout.addEventListener('click', function () { note.textContent = 'This is a concept store — checkout is not available.'; });
  $('#searchBtn').addEventListener('click', function () { document.getElementById('shop').scrollIntoView({ behavior: 'smooth' }); });

  function toggleMenu(open) {
    open = typeof open === 'boolean' ? open : !nav.classList.contains('open');
    nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open);
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (drawer.classList.contains('open')) closeCart();
      else if (nav.classList.contains('open')) toggleMenu(false);
    }
    if (e.key === 'Tab' && drawer.classList.contains('open')) {
      var f = $$('button:not([disabled])', drawer); if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  menuBtn.addEventListener('click', function () { toggleMenu(); });
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var h = a.getAttribute('href'), t = h.length > 1 && document.querySelector(h);
      if (h === '#top') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
      toggleMenu(false);
    });
  });

  var header = $('.site-header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 20); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var items = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    items.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 80 + 'ms'; io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  render();
})();
