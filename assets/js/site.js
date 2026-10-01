/* =========================================================
   Ankara Madeni Yağ — ortak site betiği
   - Mobil menü
   - Teklif listesi (tarayıcıda saklanır, WhatsApp ile gönderilir)
   - Ürün / blog filtreleme ve arama
   - Çalışma saati durumu, yorum kaydırma, formlar
   ========================================================= */
(function () {
  'use strict';

  var PHONE = '905015421422';
  var STORE_KEY = 'amy-teklif-listesi';
  var PACKS = ['Bidon / Koli', 'Teneke (16–20 L)', 'Kova (15–18 kg)', 'Varil (180–209 L)', 'IBC Tank (1000 L)'];

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var icon = function (name) { return '<svg class="icon" aria-hidden="true"><use href="/assets/img/icons.svg#' + name + '"/></svg>'; };
  var waLink = function (text) { return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  // Türkçe karakterleri sadeleştirerek arama yapar (ı/i, ş/s, ğ/g ...)
  var norm = function (s) {
    return String(s).toLocaleLowerCase('tr-TR')
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[\s\-_/.,()]+/g, ' ').trim();
  };

  /* ---------- Header gölgesi ---------- */
  var header = $('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobil menü ---------- */
  var menuBtn = $('.menu-toggle');
  var closeMenu = function () {
    document.body.classList.remove('menu-open');
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Menüyü aç'); }
  };
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    });
    $$('.main-nav a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) closeMenu(); });
  }

  /* ---------- Bildirim (toast) ---------- */
  var toastEl, toastTimer;
  var toast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = icon('check') + '<span>' + esc(msg) + '</span>';
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
  };

  /* ---------- Teklif listesi ---------- */
  var load = function () {
    try { var d = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); return d && d.items ? d : { items: [], note: '' }; }
    catch (e) { return { items: [], note: '' }; }
  };
  var state = load();
  var save = function () {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* gizli sekme vb. */ }
  };
  var findItem = function (id) {
    for (var i = 0; i < state.items.length; i++) if (state.items[i].id === id) return state.items[i];
    return null;
  };

  var drawer = $('#quote-drawer');
  var backdrop = $('#quote-backdrop');
  var lastFocus = null;

  var updateCounts = function () {
    var n = state.items.length;
    $$('.quote-count').forEach(function (el) { el.textContent = n; el.setAttribute('data-count', n); });
    $$('[data-add]').forEach(function (btn) {
      var added = !!findItem(btn.getAttribute('data-id'));
      btn.classList.toggle('is-added', added);
      btn.setAttribute('aria-pressed', String(added));
      var label = btn.querySelector('.label');
      if (label) label.textContent = added ? 'Listede' : (btn.getAttribute('data-label') || 'Listeye ekle');
      if (btn.classList.contains('icon-btn')) {
        btn.innerHTML = icon(added ? 'check' : 'plus');
        btn.setAttribute('aria-label', (added ? 'Teklif listesinde: ' : 'Teklif listesine ekle: ') + btn.getAttribute('data-name'));
      }
    });
  };

  var buildMessage = function () {
    var lines = ['Merhaba Ankara Madeni Yağ,', 'aşağıdaki ürünler için güncel fiyat ve stok bilgisi almak istiyorum:', ''];
    state.items.forEach(function (it, i) {
      lines.push((i + 1) + ') ' + it.name + ' — ' + it.qty + ' adet' + (it.pack ? ' — ' + it.pack : ''));
    });
    if (state.note && state.note.trim()) { lines.push('', 'Not: ' + state.note.trim()); }
    lines.push('', '(ankaramdeniyaglar.com.tr teklif listesi)');
    return lines.join('\n');
  };

  var render = function () {
    if (!drawer) return;
    var body = $('.drawer-body', drawer);
    var send = $('[data-quote-send]', drawer);
    var clear = $('[data-quote-clear]', drawer);
    if (!state.items.length) {
      body.innerHTML = '<div class="q-empty">' + icon('list') + '<b>Teklif listeniz boş</b>Ürün kartlarındaki <strong>“Listeye ekle”</strong> düğmesiyle ürün ekleyin, ardından listeyi tek mesajla WhatsApp’tan gönderin.</div>';
      send.setAttribute('aria-disabled', 'true');
      send.removeAttribute('href');
      clear.hidden = true;
      return;
    }
    var html = '<ul class="q-list">';
    state.items.forEach(function (it) {
      var opts = '<option value="">Ambalaj seçin</option>' + PACKS.map(function (p) {
        return '<option' + (p === it.pack ? ' selected' : '') + '>' + esc(p) + '</option>';
      }).join('');
      html += '<li class="q-item" data-qid="' + esc(it.id) + '">' +
        '<div class="q-item-top"><b>' + (it.url ? '<a href="' + esc(it.url) + '">' + esc(it.name) + '</a>' : esc(it.name)) +
        (it.cat ? '<small>' + esc(it.cat) + '</small>' : '') + '</b>' +
        '<button type="button" class="q-remove" data-q="remove" aria-label="' + esc(it.name) + ' ürününü listeden çıkar">' + icon('trash') + '</button></div>' +
        '<div class="q-controls"><div class="qty"><button type="button" data-q="dec" aria-label="Adedi azalt">−</button>' +
        '<input type="number" inputmode="numeric" min="1" max="999" value="' + it.qty + '" data-q="qty" aria-label="Adet">' +
        '<button type="button" data-q="inc" aria-label="Adedi artır">+</button></div>' +
        '<select data-q="pack" aria-label="Ambalaj">' + opts + '</select></div></li>';
    });
    html += '</ul><div class="q-note" style="margin-top:14px"><label for="q-note">Not (firma adı, şehir, teslimat vb.)</label>' +
      '<textarea id="q-note" data-q="note" placeholder="Örn: Ankara Sincan şantiyemize teslim, faturalı.">' + esc(state.note || '') + '</textarea></div>';
    body.innerHTML = html;
    send.removeAttribute('aria-disabled');
    send.setAttribute('href', waLink(buildMessage()));
    clear.hidden = false;
  };

  var refreshSend = function () {
    var send = drawer && $('[data-quote-send]', drawer);
    if (send && state.items.length) send.setAttribute('href', waLink(buildMessage()));
  };

  var openDrawer = function () {
    if (!drawer) return;
    lastFocus = document.activeElement;
    render();
    closeMenu();
    backdrop.hidden = false;
    drawer.hidden = false;
    requestAnimationFrame(function () {
      backdrop.classList.add('is-open');
      drawer.classList.add('is-open');
    });
    document.body.classList.add('drawer-lock');
    $$('[data-quote-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    setTimeout(function () { var c = $('.drawer-head .icon-btn', drawer); if (c) c.focus(); }, 60);
  };
  var closeDrawer = function () {
    if (!drawer || drawer.hidden) return;
    backdrop.classList.remove('is-open');
    drawer.classList.remove('is-open');
    document.body.classList.remove('drawer-lock');
    $$('[data-quote-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    setTimeout(function () { drawer.hidden = true; backdrop.hidden = true; }, 280);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  var addItem = function (btn) {
    var id = btn.getAttribute('data-id');
    var existing = findItem(id);
    if (existing) { openDrawer(); return; }
    state.items.push({
      id: id,
      name: btn.getAttribute('data-name'),
      cat: btn.getAttribute('data-sub') || '',
      url: btn.getAttribute('data-url') || '',
      qty: 1,
      pack: ''
    });
    save();
    updateCounts();
    toast('Teklif listesine eklendi');
  };

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement;
    var add = t.closest('[data-add]');
    if (add) { e.preventDefault(); addItem(add); return; }
    if (t.closest('[data-quote-open]')) { e.preventDefault(); openDrawer(); return; }
    if (t.closest('[data-quote-close]')) { e.preventDefault(); closeDrawer(); return; }
    if (t.closest('[data-quote-clear]')) {
      e.preventDefault();
      if (window.confirm('Teklif listesindeki tüm ürünler silinsin mi?')) {
        state = { items: [], note: '' }; save(); updateCounts(); render();
      }
      return;
    }
    var send = t.closest('[data-quote-send]');
    if (send && send.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
    var q = t.closest('[data-q]');
    if (q && drawer && drawer.contains(q)) {
      var li = q.closest('[data-qid]');
      var item = li && findItem(li.getAttribute('data-qid'));
      if (!item) return;
      var action = q.getAttribute('data-q');
      if (action === 'remove') {
        state.items = state.items.filter(function (x) { return x !== item; });
        save(); updateCounts(); render();
        var nextFocus = $('.q-remove', drawer) || $('.drawer-head .icon-btn', drawer);
        if (nextFocus) nextFocus.focus();
      } else if (action === 'inc' || action === 'dec') {
        item.qty = Math.min(999, Math.max(1, item.qty + (action === 'inc' ? 1 : -1)));
        $('input[data-q="qty"]', li).value = item.qty;
        save(); refreshSend();
      }
    }
  });

  if (drawer) {
    drawer.addEventListener('change', function (e) {
      var li = e.target.closest('[data-qid]');
      var item = li && findItem(li.getAttribute('data-qid'));
      if (!item) return;
      if (e.target.getAttribute('data-q') === 'qty') {
        var v = parseInt(e.target.value, 10);
        item.qty = isNaN(v) ? 1 : Math.min(999, Math.max(1, v));
        e.target.value = item.qty;
      }
      if (e.target.getAttribute('data-q') === 'pack') item.pack = e.target.value;
      save(); refreshSend();
    });
    drawer.addEventListener('input', function (e) {
      if (e.target.getAttribute('data-q') === 'note') { state.note = e.target.value; save(); refreshSend(); }
    });
    // Panel içinde Tab tuşu ile odak döngüsü
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = $$('a[href], button:not([disabled]), input, select, textarea', drawer).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeDrawer(); closeMenu(); }
  });
  // Başka sekmede liste değişirse güncelle
  window.addEventListener('storage', function (e) {
    if (e.key === STORE_KEY) { state = load(); updateCounts(); if (drawer && !drawer.hidden) render(); }
  });
  updateCounts();

  /* ---------- Filtre + arama (ürün kataloğu ve blog) ---------- */
  $$('[data-filter-root]').forEach(function (root) {
    var items = $$('[data-cat]', root.querySelector('[data-filter-items]') || root);
    var chips = $$('[data-filter]', root);
    var input = $('[data-filter-search]', root);
    var status = $('[data-filter-status]', root);
    var empty = $('[data-filter-empty]', root);
    var current = '';
    // data-limit: filtre/arama yokken yalnızca ilk N ürün gösterilir ("Tümünü göster" ile açılır)
    var limit = parseInt(root.getAttribute('data-limit'), 10) || 0;
    var hasFeatured = items.some(function (el) { return el.hasAttribute('data-featured'); });
    var showAll = $('[data-show-all]', root);
    var expanded = false;
    var apply = function () {
      var q = input ? norm(input.value) : '';
      var words = q ? q.split(' ') : [];
      var matched = 0, shown = 0;
      var capped = limit && !expanded && !current && !q;
      items.forEach(function (el) {
        var okCat = !current || el.getAttribute('data-cat') === current;
        var hay = el._hay || (el._hay = norm(el.getAttribute('data-search') || el.textContent));
        var okQ = words.every(function (w) { return hay.indexOf(w) !== -1; });
        var match = okCat && okQ;
        if (match) matched++;
        var show = match && (!capped || (hasFeatured ? el.hasAttribute('data-featured') : matched <= limit));
        el.hidden = !show;
        if (show) shown++;
      });
      if (status) status.textContent = capped && matched > shown ? (matched + ' üründen öne çıkan ' + shown + ' tanesi gösteriliyor') : (matched + ' sonuç gösteriliyor');
      if (empty) empty.hidden = matched !== 0;
      if (showAll) showAll.hidden = !(capped && matched > shown);
    };
    if (showAll) {
      showAll.addEventListener('click', function () {
        expanded = true;
        var firstHidden = items.filter(function (el) { return el.hidden; })[0];
        apply();
        if (firstHidden) { var link = firstHidden.querySelector('a, button'); if (link) link.focus({ preventScroll: true }); }
      });
    }
    var setCat = function (cat) {
      current = cat || '';
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String((c.getAttribute('data-filter') || '') === current)); });
      apply();
    };
    chips.forEach(function (c) { c.addEventListener('click', function () { setCat(c.getAttribute('data-filter')); }); });
    if (input) input.addEventListener('input', apply);
    root._setCat = setCat;

    // Adres çubuğundan kategori (?kategori=hidrolik) veya arama (?ara=46)
    var params = new URLSearchParams(window.location.search);
    if (params.get('ara') && input) input.value = params.get('ara');
    setCat(params.get('kategori') || '');
  });

  // Kategori kartı tıklanınca katalogda filtrele
  $$('[data-goto-cat]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var root = $('#urunler[data-filter-root]');
      if (!root || !root._setCat) return;
      e.preventDefault();
      root._setCat(el.getAttribute('data-goto-cat'));
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', '?kategori=' + el.getAttribute('data-goto-cat') + '#urunler');
    });
  });

  /* ---------- Yorum kaydırma düğmeleri ---------- */
  $$('[data-track]').forEach(function (wrap) {
    var track = $('.review-track', wrap);
    $$('[data-track-dir]', wrap).forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = b.getAttribute('data-track-dir') === 'next' ? 1 : -1;
        track.scrollBy({ left: dir * Math.min(track.clientWidth * 0.9, 380), behavior: 'smooth' });
      });
    });
  });

  /* ---------- Çalışma saatleri: açık / kapalı ---------- */
  (function () {
    var els = $$('[data-open-status]');
    var rows = $$('[data-day]');
    if (!els.length && !rows.length) return;
    var now;
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var get = function (t) { for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parts[i].value; return ''; };
      var dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      now = { day: dayMap[get('weekday')], min: parseInt(get('hour'), 10) % 24 * 60 + parseInt(get('minute'), 10) };
    } catch (e) { return; }
    var open = now.day >= 1 && now.day <= 6 && now.min >= 510 && now.min < 1110; // 08:30–18:30
    els.forEach(function (el) {
      el.textContent = open ? 'Şu an açık' : 'Şu an kapalı';
      el.style.color = open ? '#34d399' : '#fca5a5';
      el.hidden = false;
    });
    rows.forEach(function (r) { r.classList.toggle('is-today', String(now.day) === r.getAttribute('data-day')); });
  })();

  /* ---------- Formlar → WhatsApp / e-posta ---------- */
  $$('form[data-wa-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var title = form.getAttribute('data-wa-form');
      var lines = [title, ''];
      $$('[name]', form).forEach(function (f) {
        var v = (f.value || '').trim();
        if (v) lines.push((f.getAttribute('data-label') || f.name) + ': ' + v);
      });
      var text = lines.join('\n');
      var via = e.submitter && e.submitter.getAttribute('data-via');
      if (via === 'mail') {
        window.location.href = 'mailto:iletisim@ankaramdeniyaglar.com.tr?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(text);
      } else {
        window.open(waLink(text), '_blank', 'noopener');
      }
    });
  });

  /* ---------- Yıl ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
