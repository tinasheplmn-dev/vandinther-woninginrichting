/* motion.js: de motion- en interactielaag. Uitbreiding op reveal.js.
   Kopieer dit naar js/main.js en bouw er de site-eigen dingen omheen.
   Hoort bij assets/motion.css.

   Wat erin zit (alles vanilla, alles fail-open, alles uit bij reduced motion):
   - de vier vangnetten voor reveals uit reveal.js, met een slimmer vierde
   - stagger voor kinderen ([data-stagger], zet --i per kind)
   - scroll-voortgang: --scroll op <html>, --sectie-p per [data-sectie-p]
   - muis-parallax ([data-parallax] met [data-laag]-kinderen), alleen pointer: fine
   - 3D-kantel op hover ([data-kantel]), alleen pointer: fine
   - zwevende lagen ([data-zweef]) met een eigen fase per element
   - hero-opening ([data-hero]) en crossfade ([data-hero-dia])
   - header-schaduw en header die zich terugtrekt, mobiel menu, tellers,
     mobiele actiebalk, accordeon (ongewijzigd uit reveal.js)

   Uitgangspunt: zichtbaarheid hangt nooit van één mechanisme af.
   Gaat JavaScript stuk, dan staat er gewoon een complete, leesbare site. */
(function () {
  'use strict';

  var html = document.documentElement;
  var kalm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var muis = window.matchMedia('(pointer: fine)').matches;

  /* ?foto=1 zet alles statisch neer, handig voor screenshots.
     De js-klasse is de schakelaar: zonder JavaScript blijft alles zichtbaar,
     want de verbergregels in CSS staan achter html.js:not(.klaar). */
  var foto = /[?&]foto=1/.test(location.search);
  if (!foto) html.classList.add('js');

  /* Geeft het script op (fout, of iets dat in beeld hoort te zijn blijft
     verborgen), dan zet .klaar alles zichtbaar. Liever een gemiste animatie
     dan een onzichtbare kop. */
  function geefOp() { html.classList.add('klaar'); }
  window.addEventListener('error', geefOp);
  window.addEventListener('beforeprint', geefOp);

  /* rAF-throttle: één uitvoering per frame, hoe vaak het event ook vuurt */
  function perFrame(fn) {
    var bezig = false;
    return function () {
      if (bezig) return;
      bezig = true;
      requestAnimationFrame(function () { bezig = false; fn(); });
    };
  }

  /* ---------- Header ---------- */
  var balk = document.querySelector('[data-balk]');
  var vorigeY = 0;
  function balkStand() {
    if (!balk) return;
    var y = window.scrollY;
    balk.classList.toggle('zweeft', y > 10);
    /* trekt zich terug bij scrollen omlaag voorbij 700 px, komt terug bij omhoog */
    if (balk.hasAttribute('data-balk-verstopt')) {
      var menuOpen = document.body.classList.contains('menu-open');
      balk.classList.toggle('verstopt', y > 700 && y > vorigeY && !menuOpen);
    }
    vorigeY = y;
  }
  window.addEventListener('scroll', perFrame(balkStand), { passive: true });
  balkStand();

  /* ---------- Mobiel menu ---------- */
  var knop = document.querySelector('[data-menuknop]');
  var menu = document.querySelector('[data-menu]');
  if (knop && menu) {
    var sluit = function () {
      knop.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
    };
    knop.addEventListener('click', function () {
      var open = knop.getAttribute('aria-expanded') === 'true';
      if (open) { sluit(); return; }
      knop.setAttribute('aria-expanded', 'true');
      menu.classList.add('open');
      document.body.classList.add('menu-open');
      document.body.style.overflow = 'hidden';
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', sluit);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') sluit();
    });
  }

  /* ---------- Tellers ----------
     De eindwaarde staat in de HTML. De animatie telt er alleen naartoe,
     dus draait de animatie niet, dan staat het juiste getal er gewoon. */
  function tel(el) {
    if (el.dataset.geteld) return;
    el.dataset.geteld = '1';
    var doelTekst = el.dataset.tel;
    var doel = parseFloat(doelTekst.replace(',', '.'));
    if (isNaN(doel)) return;
    var komma = doelTekst.indexOf(',') !== -1;
    if (kalm) { el.textContent = doelTekst; return; }
    var start = null;
    var duur = 1600;
    function stapje(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / duur, 1);
      var z = 1 - Math.pow(1 - p, 3);
      var n = doel * z;
      el.textContent = komma ? n.toFixed(1).replace('.', ',') : Math.round(n);
      if (p < 1) requestAnimationFrame(stapje);
      else el.textContent = doelTekst;
    }
    requestAnimationFrame(stapje);
  }

  /* ---------- Stagger: --i per kind ----------
     De CSS vertraagt elk kind met --i keer --stap. Hier alleen nummeren. */
  document.querySelectorAll('[data-stagger]').forEach(function (ouder) {
    [].slice.call(ouder.children).forEach(function (kind, i) {
      kind.style.setProperty('--i', i);
    });
  });
  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    hero.querySelectorAll('[data-hero-item]').forEach(function (item, i) {
      if (!item.style.getPropertyValue('--i')) item.style.setProperty('--i', i);
    });
  });

  /* ---------- Reveals, fail-open ----------
     Vier vangnetten:
     1. controle direct bij laden (alles binnen beeld verschijnt meteen)
     2. controle bij scroll, resize, load en pageshow
     3. IntersectionObserver waar beschikbaar
     4. een waakhond: elke 800 ms een rect-controle (vangt gemiste
        scroll-events), en na 1,2 s de toets of iets dat in beeld hoort te
        zijn nog verborgen is. Zo ja, dan geeft het script op en toont
        .klaar alles.

     Verschil met reveal.js: dat toonde na 1,2 s hoe dan ook ALLES, ook
     onder de vouw, waardoor daar niets meer bewoog bij het scrollen. */
  var wachtend = [].slice.call(document.querySelectorAll('[data-rev]'));

  /* Na de reveal (600 ms plus maximaal 560 ms stagger) zet .af de
     reveal-transitie uit, zodat .lift en [data-kantel] hun eigen korte
     transitie terugkrijgen. */
  function rondAf(el) {
    setTimeout(function () { el.classList.add('af'); }, 1300);
  }

  function onthul(el) {
    el.classList.add('in');
    rondAf(el);
    [].slice.call(el.querySelectorAll('[data-tel]')).forEach(tel);
    if (el.hasAttribute('data-tel')) tel(el);
  }

  function inBeeld(el, grens) {
    var r = el.getBoundingClientRect();
    return r.top < grens && r.bottom > -40;
  }

  function controleer() {
    if (!wachtend.length) return;
    var grens = window.innerHeight * 0.92;
    wachtend = wachtend.filter(function (el) {
      if (inBeeld(el, grens)) { onthul(el); return false; }
      return true;
    });
  }

  /* Bij verminder-beweging draaien de reveals gewoon mee: de CSS maakt er
     dan zachte fades zonder verplaatsing van (de fade-variant). Alleen
     ?foto=1 zet alles direct neer. */
  if (foto) {
    wachtend.forEach(onthul);
    wachtend = [];
    geefOp();
  } else {
    var vraagControle = perFrame(controleer);
    window.addEventListener('scroll', vraagControle, { passive: true });
    window.addEventListener('resize', vraagControle, { passive: true });
    window.addEventListener('load', vraagControle);
    window.addEventListener('pageshow', vraagControle);

    if ('IntersectionObserver' in window) {
      var kijker = new IntersectionObserver(function (items) {
        items.forEach(function (it) {
          if (!it.isIntersecting) return;
          var i = wachtend.indexOf(it.target);
          if (i !== -1) wachtend.splice(i, 1);
          onthul(it.target);
          kijker.unobserve(it.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
      wachtend.forEach(function (el) { kijker.observe(el); });
    }

    controleer();

    /* Vangnet 4a: waakhond */
    var waakhond = setInterval(function () {
      controleer();
      if (!wachtend.length) clearInterval(waakhond);
    }, 800);

    /* Vangnet 4b: na 1,2 s mag niets dat in beeld staat nog verborgen zijn.
       Is dat toch zo, dan is er iets mis en tonen we alles. */
    setTimeout(function () {
      var vast = [].slice.call(document.querySelectorAll('[data-rev]:not(.in)'))
        .some(function (el) { return inBeeld(el, window.innerHeight); });
      if (vast) {
        document.querySelectorAll('[data-rev]:not(.in)').forEach(onthul);
        wachtend = [];
        geefOp();
      }
    }, 1200);
  }

  /* ---------- Hero-opening ----------
     .in binnen twee frames, en hoe dan ook na 400 ms. */
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add('in'); });
    });
    setTimeout(function () { hero.classList.add('in'); }, 400);
    rondAf(hero);

    /* crossfade van meerdere hero-beelden: het eerste staat al .aan in de HTML */
    var dias = hero.querySelectorAll('[data-hero-dia]');
    if (dias.length > 1 && !kalm) {
      var huidig = 0;
      dias[0].classList.add('aan');
      setInterval(function () {
        dias[huidig].classList.remove('aan');
        huidig = (huidig + 1) % dias.length;
        dias[huidig].classList.add('aan');
      }, 5000);
    }
  }

  /* ---------- Scroll-voortgang: --scroll en --sectie-p ----------
     --scroll (0 tot 1) op <html>: voor de voortgangsbalk.
     --sectie-p (0 tot 1) per [data-sectie-p]: 0 als de bovenkant net
     onderin beeld komt, 1 als de onderkant net bovenaan verdwijnt.
     Formule uit Bazen: (vh - top) / (vh + hoogte). */
  var secties = [].slice.call(document.querySelectorAll('[data-sectie-p]'));
  var balkje = document.querySelector('.scroll-balk');
  if (!kalm && (secties.length || balkje)) {
    var voortgang = function () {
      var vh = window.innerHeight;
      if (balkje) {
        var max = html.scrollHeight - html.clientHeight;
        html.style.setProperty('--scroll', max > 0 ? (html.scrollTop / max).toFixed(4) : 0);
      }
      secties.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;   /* ver buiten beeld: overslaan */
        var p = (vh - r.top) / (vh + r.height);
        p = Math.max(0, Math.min(1, p));
        el.style.setProperty('--sectie-p', p.toFixed(4));
      });
    };
    var vraagVoortgang = perFrame(voortgang);
    window.addEventListener('scroll', vraagVoortgang, { passive: true });
    window.addEventListener('resize', vraagVoortgang, { passive: true });
    window.addEventListener('load', vraagVoortgang);
    voortgang();
  }

  /* ---------- Muis-parallax (alleen met muis) ----------
     Zet --mx en --my (van -1 tot 1) op de container. De CSS vermenigvuldigt
     per laag met --laag. De waarde loopt met een lerp van 0,08 achter de
     muis aan (Bazen) en de loop stopt zichzelf als hij stilstaat. */
  if (muis && !kalm) {
    document.querySelectorAll('[data-parallax]').forEach(function (zone) {
      var dx = 0, dy = 0, x = 0, y = 0, raf = null;
      var loop = function () {
        x += (dx - x) * 0.08;
        y += (dy - y) * 0.08;
        zone.style.setProperty('--mx', x.toFixed(3));
        zone.style.setProperty('--my', y.toFixed(3));
        if (Math.abs(dx - x) > 0.002 || Math.abs(dy - y) > 0.002) raf = requestAnimationFrame(loop);
        else raf = null;
      };
      var tik = function () { if (!raf) raf = requestAnimationFrame(loop); };
      zone.addEventListener('pointermove', function (e) {
        var r = zone.getBoundingClientRect();
        dx = ((e.clientX - r.left) / r.width) * 2 - 1;
        dy = ((e.clientY - r.top) / r.height) * 2 - 1;
        tik();
      });
      zone.addEventListener('pointerleave', function () { dx = 0; dy = 0; tik(); });
    });
  }

  /* ---------- 3D-kantel op hover (alleen met muis) ----------
     Maximaal --kantel-max graden (standaard 6). Tijdens het volgen staat
     .kantelt aan (korte transition), bij verlaten valt hij zacht terug. */
  if (muis && !kalm) {
    document.querySelectorAll('[data-kantel]').forEach(function (el) {
      var max = parseFloat(el.dataset.kantel) || 6;
      var raf = null, ex = 0, ey = 0;
      var zet = function () {
        raf = null;
        var r = el.getBoundingClientRect();
        var px = (ex - r.left) / r.width;      /* 0 tot 1 */
        var py = (ey - r.top) / r.height;
        el.style.setProperty('--ry', ((px - 0.5) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - py) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      };
      el.addEventListener('pointerenter', function () { el.classList.add('kantelt'); });
      el.addEventListener('pointermove', function (e) {
        ex = e.clientX; ey = e.clientY;
        if (!raf) raf = requestAnimationFrame(zet);
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('kantelt');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Zwevende lagen ----------
     Elk [data-zweef] krijgt .zweef plus een eigen fase en duur, zodat
     meerdere zwevers nooit in de maat bewegen. Deterministisch op index,
     dus bij elke lading hetzelfde. */
  if (!kalm) {
    document.querySelectorAll('[data-zweef]').forEach(function (el, i) {
      var afstand = parseFloat(el.dataset.zweef);
      if (!isNaN(afstand)) el.style.setProperty('--zweef-afstand', (-Math.abs(afstand)) + 'px');
      el.style.setProperty('--zweef-fase', (-(i * 1.3) % 6).toFixed(2) + 's');
      el.style.setProperty('--zweef-duur', (5.5 + (i % 3) * 0.8).toFixed(1) + 's');
      el.classList.add('zweef');
    });
  }

  /* ---------- Vaste actiebalk op mobiel ----------
     Verschijnt zodra de hero uit beeld is, verdwijnt bij de footer. */
  var actiebalk = document.querySelector('[data-mobielcta]');
  if (actiebalk && hero) {
    var toon = function () {
      var voorbij = hero.getBoundingClientRect().bottom < 0;
      var footer = document.querySelector('footer');
      var bijFooter = footer && footer.getBoundingClientRect().top < window.innerHeight;
      actiebalk.classList.toggle('zichtbaar', voorbij && !bijFooter);
    };
    window.addEventListener('scroll', perFrame(toon), { passive: true });
    window.addEventListener('resize', perFrame(toon), { passive: true });
    toon();
  }

  /* ---------- Accordeon (veelgestelde vragen) ---------- */
  document.querySelectorAll('[data-vouw]').forEach(function (kop) {
    kop.addEventListener('click', function () {
      var open = kop.getAttribute('aria-expanded') === 'true';
      kop.setAttribute('aria-expanded', String(!open));
      var paneel = document.getElementById(kop.getAttribute('aria-controls'));
      if (paneel) paneel.hidden = open;
    });
  });
})();

/* ==========================================================================
   Van Dinther: site-eigen gedrag. Alles fail-open: zonder JavaScript staat
   het eerste hero-beeld er, liggen de stalen recht en werkt elke link.
   ========================================================================== */
(function () {
  'use strict';
  var kalm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var muis = window.matchMedia('(pointer: fine)').matches;

  function perFrame(fn) {
    var bezig = false;
    return function () {
      if (bezig) return;
      bezig = true;
      requestAnimationFrame(function () { bezig = false; fn(); });
    };
  }

  /* ---------- Stalenwaaier in de hero ----------
     Vier tabs wisselen het beeld. Ze lopen ook rustig vanzelf door,
     pauzeren bij hover of focus en staan stil bij minder beweging. */
  var waaier = document.querySelector('[data-waaier-tabs]');
  if (waaier) {
    var tabs = [].slice.call(waaier.querySelectorAll('[role="tab"]'));
    var dias = [].slice.call(document.querySelectorAll('.hero-dia'));
    var actiefLabel = waaier.querySelector('.waaier-actief');
    var duur = 6500, huidig = 0, klok = null, pauze = false;

    var kies = function (i, focus) {
      huidig = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, n) {
        var aan = n === huidig;
        t.setAttribute('aria-selected', aan ? 'true' : 'false');
        t.tabIndex = aan ? 0 : -1;
        /* herstart de voortgangsbalk */
        var balk = t.querySelector('.tab-voortgang');
        if (balk && aan) { balk.style.animation = 'none'; void balk.offsetWidth; balk.style.animation = ''; }
      });
      dias.forEach(function (d, n) {
        d.classList.toggle('aan', n === huidig);
        if (n === huidig) {
          var img = d.querySelector('img');
          if (img && img.loading === 'lazy') img.loading = 'eager';
        }
      });
      if (actiefLabel) {
        var t = tabs[huidig];
        actiefLabel.innerHTML = '<b>' + t.dataset.nr + '</b>' + t.dataset.naam;
      }
      if (focus) tabs[huidig].focus();
      herstart();
    };
    var herstart = function () {
      clearTimeout(klok);
      if (kalm || pauze) return;
      klok = setTimeout(function () { kies(huidig + 1); }, duur);
    };
    tabs.forEach(function (t, n) {
      t.addEventListener('click', function () { kies(n); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); kies(huidig + 1, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); kies(huidig - 1, true); }
      });
    });
    var houd = function () { pauze = true; waaier.classList.add('pauze'); clearTimeout(klok); };
    var laat = function () { pauze = false; waaier.classList.remove('pauze'); kies(huidig); };
    waaier.addEventListener('mouseenter', houd);
    waaier.addEventListener('mouseleave', laat);
    waaier.addEventListener('focusin', houd);
    waaier.addEventListener('focusout', function (e) { if (!waaier.contains(e.relatedTarget)) laat(); });
    if (kalm) waaier.classList.add('pauze');
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearTimeout(klok); else herstart(); });
    herstart();
  }

  /* ---------- Signatuur: de stalenrij waaiert open bij scrollen ----------
     --dicht gaat van 1 (gestapeld en gedraaid) naar 0 (op hun plek).
     Alleen met muis, op brede schermen en zonder minder-beweging. */
  var rij = document.querySelector('[data-waaier]');
  if (rij && !kalm && muis) {
    var breed = window.matchMedia('(min-width: 1021px)');
    var zet = function () {
      if (!breed.matches) { rij.style.setProperty('--dicht', 0); return; }
      var vh = window.innerHeight;
      var top = rij.getBoundingClientRect().top;
      var d = (top - vh * 0.3) / (vh * 0.55);
      d = Math.max(0, Math.min(1, d));
      d = d * d * (3 - 2 * d);               /* zachte S-curve */
      rij.style.setProperty('--dicht', d.toFixed(3));
    };
    var vraag = perFrame(zet);
    window.addEventListener('scroll', vraag, { passive: true });
    window.addEventListener('resize', vraag, { passive: true });
    zet();
  }

  /* ---------- Openingstijden: vandaag markeren en live status ----------
     Zonder JavaScript staat de vaste regel "op afspraak" er gewoon. */
  var tijden = { 1: [9, 21], 2: [9, 21], 3: [9, 21], 4: [9, 21], 5: [9, 18], 6: [10, 17], 0: null };
  var dagnamen = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  var nu = new Date();
  var dag = nu.getDay();
  var uur = nu.getHours() + nu.getMinutes() / 60;
  document.querySelectorAll('[data-dag="' + dag + '"]').forEach(function (el) { el.classList.add('vandaag'); });
  var tweeCijfers = function (h) { return (h < 10 ? '0' : '') + h + '.00'; };
  var statusTekst = function () {
    var t = tijden[dag];
    if (t && uur < t[0]) return { open: true, tekst: 'Vandaag op afspraak vanaf ' + tweeCijfers(t[0]) };
    if (t && uur < t[1]) return { open: true, tekst: 'Vandaag op afspraak tot ' + tweeCijfers(t[1]) };
    for (var i = 1; i <= 7; i++) {
      var d = (dag + i) % 7;
      if (tijden[d]) return { open: false, tekst: (i === 1 ? 'Morgen' : dagnamen[d].charAt(0).toUpperCase() + dagnamen[d].slice(1)) + ' weer op afspraak vanaf ' + tweeCijfers(tijden[d][0]) };
    }
    return null;
  };
  var st = statusTekst();
  document.querySelectorAll('[data-status]').forEach(function (el) {
    if (!st) return;
    el.querySelector('span').textContent = st.tekst;
    el.classList.toggle('dicht', !st.open);
  });

  /* ---------- Carrouselknoppen ---------- */
  document.querySelectorAll('[data-carrousel]').forEach(function (knoppen) {
    var doel = document.getElementById(knoppen.getAttribute('data-carrousel'));
    if (!doel) return;
    knoppen.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        var stap = doel.firstElementChild ? doel.firstElementChild.getBoundingClientRect().width + 16 : 300;
        doel.scrollBy({ left: b.dataset.richting === 'terug' ? -stap : stap, behavior: kalm ? 'auto' : 'smooth' });
      });
    });
  });

  /* ---------- Uitgelichte review die rustig wisselt ----------
     De gouden voortgangslijn bepaalt het tempo: is hij vol, dan komt de
     volgende review. Hover of focus zet de lijn (en dus de wissel) op
     pauze. Bij minder beweging wisselt er niets vanzelf; de knoppen
     werken altijd. Zonder JavaScript staan de reviews onder elkaar. */
  document.querySelectorAll('[data-reviewwissel]').forEach(function (box) {
    var dias = [].slice.call(box.querySelectorAll('[data-review-dia]'));
    var knoppen = [].slice.call(box.querySelectorAll('[data-review-knop]'));
    var lijn = box.querySelector('[data-review-loop]');
    if (dias.length < 2) return;
    var nu = 0;
    function start() {
      if (kalm || !lijn) return;
      lijn.classList.remove('loopt');
      void lijn.offsetWidth;
      lijn.classList.add('loopt');
    }
    var lijst = box.querySelector('[data-review-dias]');
    /* Vaste hoogte (de langste review), zodat de pagina niet verspringt.
       Niet-actieve dia's gaan na de crossfade echt weg (hidden). */
    function maat() {
      if (!lijst) return;
      lijst.style.minHeight = '';
      dias.forEach(function (d) { d.hidden = false; });
      lijst.style.minHeight = lijst.getBoundingClientRect().height + 'px';
      dias.forEach(function (d, k) { d.hidden = k !== nu; });
    }
    function zet(n, vanzelf) {
      nu = (n + dias.length) % dias.length;
      dias.forEach(function (d, k) {
        var aan = k === nu;
        if (aan) { d.hidden = false; void d.offsetWidth; }
        d.classList.toggle('aan', aan);
        d.setAttribute('aria-hidden', String(!aan));
        if (!aan) setTimeout(function () { if (k !== nu) d.hidden = true; }, kalm ? 0 : 750);
      });
      knoppen.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === nu)); });
      if (lijst) lijst.setAttribute('aria-live', vanzelf ? 'off' : 'polite');
      start();
    }
    knoppen.forEach(function (b, k) { b.addEventListener('click', function () { zet(k, false); }); });
    if (lijn) lijn.addEventListener('animationend', function () { zet(nu + 1, true); });
    var pauze = function () { box.classList.add('pauze'); };
    var verder = function () { if (!box.contains(document.activeElement) && !box.matches(':hover')) box.classList.remove('pauze'); };
    box.addEventListener('pointerenter', pauze);
    box.addEventListener('pointerleave', verder);
    box.addEventListener('focusin', pauze);
    box.addEventListener('focusout', function () { setTimeout(verder, 0); });
    /* Alleen lopen als de sectie in beeld is */
    if ('IntersectionObserver' in window && lijn) {
      new IntersectionObserver(function (items) {
        items.forEach(function (it) { box.classList.toggle('uit-beeld', !it.isIntersecting); });
      }).observe(box);
    }
    maat();
    window.addEventListener('resize', perFrame(maat), { passive: true });
    window.addEventListener('load', maat);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(maat);
    zet(0, true);
  });

  /* ---------- Afspraak- en offerteformulier ----------
     Bouwt een net bericht op en opent het mailprogramma, met alles al
     ingevuld. Daarna een echte bevestiging op de pagina. */
  var form = document.querySelector('[data-aanvraag]');
  if (form) {
    var params = new URLSearchParams(location.search);
    var type = params.get('type');
    if (type) {
      var radio = form.querySelector('input[name="soort"][value="' + type + '"]');
      if (radio) radio.checked = true;
    }
    var onderwerp = params.get('onderwerp');
    if (onderwerp) {
      var vink = form.querySelector('input[name="interesse"][value="' + onderwerp + '"]');
      if (vink) vink.checked = true;
    }
    var meld = function (veld, tekst) {
      var fout = form.querySelector('[data-fout="' + veld + '"]');
      if (fout) { fout.textContent = tekst; fout.hidden = !tekst; }
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var naam = form.naam.value.trim();
      var tel = form.telefoon.value.trim();
      var mail = form.email.value.trim();
      var ok = true;
      meld('naam', ''); meld('contact', '');
      if (!naam) { meld('naam', 'Vul uw naam in, dan weten we wie we terugbellen.'); ok = false; }
      if (!tel && !mail) { meld('contact', 'Vul een telefoonnummer of e-mailadres in, zodat we u kunnen bereiken.'); ok = false; }
      if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { meld('contact', 'Dit e-mailadres lijkt niet compleet. Kijkt u het even na?'); ok = false; }
      if (!ok) { var eerste = form.querySelector('.veld-fout:not([hidden])'); if (eerste) eerste.scrollIntoView({ block: 'center', behavior: kalm ? 'auto' : 'smooth' }); return; }
      var soort = form.querySelector('input[name="soort"]:checked');
      var soortTekst = soort ? soort.dataset.tekst : 'Een vraag';
      var interesses = [].slice.call(form.querySelectorAll('input[name="interesse"]:checked')).map(function (i) { return i.value; });
      var regels = [
        'Beste Van Dinther Woninginrichting,',
        '',
        'Ik wil graag: ' + soortTekst.toLowerCase() + '.',
        'Interesse in: ' + (interesses.length ? interesses.join(', ') : 'nog niet bekend'),
        '',
        form.bericht.value.trim() ? 'Toelichting: ' + form.bericht.value.trim() : '',
        '',
        'Naam: ' + naam,
        tel ? 'Telefoon: ' + tel : '',
        mail ? 'E-mail: ' + mail : '',
        '',
        'Met vriendelijke groet,',
        naam
      ].filter(function (r, i, a) { return r !== '' || a[i - 1] !== ''; });
      var href = 'mailto:s.vandinther@home.nl?subject=' + encodeURIComponent(soortTekst + ' via de website') + '&body=' + encodeURIComponent(regels.join('\n'));
      window.location.href = href;
      var bev = document.querySelector('[data-bevestiging]');
      if (bev) {
        bev.querySelector('[data-mailto]').setAttribute('href', href);
        form.hidden = true;
        bev.hidden = false;
        bev.focus();
      }
    });
  }

  /* ---------- Jaartal in de footer ---------- */
  document.querySelectorAll('[data-jaar]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
