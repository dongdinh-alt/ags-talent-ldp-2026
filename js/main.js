/* AGS Talent 2026 – landing page interactions (no dependencies) */
(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- University logo marquee (17 logos, duplicated for a seamless loop) ---------- */
  const track = $('#uni-track');
  if (track) {
    const logos = Array.from({ length: 17 }, (_, i) => `assets/uni/${String(i + 1).padStart(2, '0')}.svg`);
    const html = logos.map((src) => `<span class="marquee__item"><img src="${src}" alt="" width="129" height="43" decoding="async"></span>`).join('');
    track.innerHTML = html + html.replace(/<span /g, '<span aria-hidden="true" ');
  }

  /* ---------- Header: scrolled state, progress bar, back-to-top, banner parallax ---------- */
  const header = $('.site-header');
  const progress = $('.scroll-progress span');
  const toTop = $('.to-top');
  const banner = $('.banner');
  const bannerImg = $('.banner__media img');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', y > 10);
    progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    toTop.classList.toggle('is-shown', y > window.innerHeight * 0.8);
    if (!reduceMotion && bannerImg && y < window.innerHeight) {
      bannerImg.style.setProperty('--parallax', `${(y * 0.18).toFixed(1)}px`);
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();
  bannerImg?.addEventListener('animationend', () => banner.classList.add('is-loaded'));

  /* ---------- Mobile menu ---------- */
  const toggle = $('.menu-toggle');
  const nav = $('#site-nav');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Mobile sticky CTA: shown after the banner, hidden while the form is on screen ---------- */
  const mobileCta = $('.mobile-cta');
  if (mobileCta) {
    const ctaBtn = $('a', mobileCta);
    const ctaQuery = window.matchMedia('(max-width: 960px)');
    let pastBanner = false;
    let formVisible = false;
    const updateCta = () => {
      const show = ctaQuery.matches && pastBanner && !formVisible;
      mobileCta.classList.toggle('is-shown', show);
      mobileCta.setAttribute('aria-hidden', String(!show));
      ctaBtn.tabIndex = show ? 0 : -1;
      document.body.classList.toggle('cta-open', show);
      document.body.classList.toggle('has-cta', ctaQuery.matches);
    };
    new IntersectionObserver(([e]) => { pastBanner = !e.isIntersecting && e.boundingClientRect.top < 0; updateCta(); }).observe($('.banner'));
    new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; updateCta(); }, { threshold: 0.15 }).observe($('#register'));
    ctaQuery.addEventListener('change', updateCta);
    updateCta();
  }

  /* ---------- Active nav link by section in view ---------- */
  const navLinks = $$('.site-nav__link');
  const navTargets = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navTargets.forEach((t) => navObserver.observe(t));

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      obs.unobserve(el);
      // once the entrance is done, hand transitions back to the component's own hover styles
      setTimeout(() => { el.removeAttribute('data-reveal'); }, 1600 + (parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0) * 90);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach((el) => revealObserver.observe(el));

  /* ---------- Count-up numbers ---------- */
  const formatVN = (n, decimals) => n.toFixed(decimals).replace('.', ',');
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    if (reduceMotion) { el.textContent = formatVN(target, decimals); return; }
    const duration = 1600 + Math.min(target, 400);
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = formatVN(target * eased, decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countObserver.observe(el));

  /* ---------- Pointer effects: tilt + spotlight ---------- */
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach((el) => {
      const strength = el.dataset.tilt === 'strong' ? 10 : 6;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * strength}deg) rotateY(${(px - 0.5) * strength}deg) translateY(-4px)`;
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
        el.style.setProperty('--shine', `${120 - px * 140}%`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
        el.style.removeProperty('--shine');
      });
    });
    $$('[data-magnet]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.transform = `translate(${(px - 0.5) * 18}px, ${(py - 0.5) * 18}px) scale(1.03)`;
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    const heroStat = $('.hero-stat');
    heroStat?.addEventListener('pointermove', (e) => {
      const r = heroStat.getBoundingClientRect();
      heroStat.style.setProperty('--mx', `${e.clientX - r.left}px`);
      heroStat.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }

  /* ---------- Button click ripple ---------- */
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn || reduceMotion) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    btn.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  });

  /* ---------- Intro video (embed only when an ID is configured) ---------- */
  const video = $('.video');
  if (video) {
    const id = video.dataset.youtubeId;
    if (!id) video.classList.add('no-src');
    $('.video__play', video).addEventListener('click', () => {
      if (!id) return;
      video.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" title="AGS Talent" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    });
  }

  /* ---------- Portrait: pinned section, traits reveal one at a time with page scroll ---------- */
  const portrait = $('#portrait');
  if (portrait) {
    const traits = $$('.trait', portrait);
    const dots = $$('.portrait__dots button', portrait);
    const studentImg = $('.portrait__crop img', portrait);
    const pinned = window.matchMedia('(min-width: 961px)');
    let current = -1;

    const setActive = (i) => {
      if (i === current) return;
      current = i;
      traits.forEach((t, j) => {
        t.classList.toggle('is-active', j === i);
        t.classList.toggle('is-past', j < i);
      });
      dots.forEach((d, j) => {
        d.classList.toggle('is-active', j === i);
        d.setAttribute('aria-selected', String(j === i));
      });
    };

    const range = () => portrait.offsetHeight - window.innerHeight;
    const onPortraitScroll = () => {
      if (!pinned.matches) return;
      const progress = Math.min(Math.max(-portrait.getBoundingClientRect().top / range(), 0), 0.9999);
      setActive(Math.floor(progress * traits.length));
      if (!reduceMotion) studentImg.style.setProperty('--zoom', (1 + progress * 0.04).toFixed(3));
    };
    window.addEventListener('scroll', onPortraitScroll, { passive: true });
    window.addEventListener('resize', onPortraitScroll);

    // scroll position at which trait i sits in the middle of its scroll window
    const traitTop = (i) => portrait.getBoundingClientRect().top + window.scrollY + ((i + 0.5) / traits.length) * range();
    const goTo = (i) => window.scrollTo({ top: traitTop(i), behavior: reduceMotion ? 'auto' : 'smooth' });
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

    // Snap points: when scrolling stops between two traits, settle on the nearest one
    const snaps = traits.map(() => {
      const a = document.createElement('span');
      a.className = 'portrait__snap';
      a.setAttribute('aria-hidden', 'true');
      portrait.appendChild(a);
      return a;
    });
    const placeSnaps = () => {
      const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      snaps.forEach((a, i) => { a.style.top = `${((i + 0.5) / traits.length) * range() + pad}px`; });
    };

    // Mouse wheel / trackpad: one gesture = one trait, with a short lock so momentum can't skip ahead.
    // At the first/last trait the wheel scrolls normally, so the section never traps the page.
    const STEP_LOCK = 900;
    let lockUntil = 0;
    let wheelAcc = 0;
    let wasPinned = false;
    window.addEventListener('wheel', (e) => {
      if (!pinned.matches || reduceMotion || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const r = portrait.getBoundingClientRect();
      const isPinned = r.top <= 1 && r.bottom >= window.innerHeight - 1;
      if (!isPinned) { wasPinned = false; wheelAcc = 0; return; }
      const dir = Math.sign(e.deltaY);
      if (!dir) return;
      const now = performance.now();
      if (!wasPinned) {
        // just entered the pinned zone (or first wheel after a reload): settle on the trait on screen before stepping
        wasPinned = true;
        lockUntil = now + 600;
        e.preventDefault();
        goTo(Math.max(current, 0));
        return;
      }
      if (now < lockUntil) { e.preventDefault(); return; }
      const next = current + dir;
      if (next < 0 || next >= traits.length) return; // leave the section with normal scrolling
      e.preventDefault();
      wheelAcc += Math.abs(e.deltaY);
      if (wheelAcc < 30) return; // ignore tiny trackpad jitters
      wheelAcc = 0;
      lockUntil = now + STEP_LOCK;
      goTo(next);
    }, { passive: false });

    // Small screens: no pinning — traits are listed and each one reveals as it scrolls into view
    const stackObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('is-active'); });
    }, { threshold: 0.3 });

    const applyMode = () => {
      current = -1;
      traits.forEach((t) => { t.classList.remove('is-active', 'is-past'); stackObserver.unobserve(t); });
      document.documentElement.classList.toggle('snap-portrait', pinned.matches && !reduceMotion);
      if (pinned.matches) { placeSnaps(); onPortraitScroll(); }
      else traits.forEach((t) => stackObserver.observe(t));
    };
    window.addEventListener('resize', () => { if (pinned.matches) placeSnaps(); });
    pinned.addEventListener('change', applyMode);
    applyMode();
  }

  /* ---------- Mobile card sliders (≤640px): swipe horizontally, dots show and set the current card ---------- */
  $$('[data-m-slider]').forEach((slider) => {
    slider.classList.add('m-slider');
    const items = Array.from(slider.children);
    const scrollToItem = (i) => slider.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
    let stops = [];
    let fill = null;

    if (slider.dataset.mSlider === 'timeline') {
      // Timeline indicator: progress track with one stop per card; phase labels (e.g. 2,5 năm / 0,5 năm) sit on the track
      const spans = JSON.parse(slider.dataset.spans || '[]');
      const pos = (i) => ((i + 0.5) / items.length) * 100;
      const tl = document.createElement('div');
      tl.className = 'm-timeline';
      tl.innerHTML = '<div class="m-timeline__track"><span class="m-timeline__fill"></span></div>';
      const track = $('.m-timeline__track', tl);
      fill = $('.m-timeline__fill', tl);
      // each phase label is centred between the first and last stop it covers
      let first = 0;
      spans.forEach((sp) => {
        const last = first + sp.cards - 1;
        const label = document.createElement('span');
        label.className = 'm-timeline__phase';
        label.style.left = `${(pos(first) + pos(last)) / 2}%`;
        label.textContent = sp.label;
        track.appendChild(label);
        first = last + 1;
      });
      stops = items.map((item, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'm-timeline__stop';
        b.style.left = `${pos(i)}%`;
        b.innerHTML = `<em>${item.dataset.step || i + 1}</em>`;
        b.setAttribute('aria-label', item.dataset.step || `Thẻ ${i + 1}`);
        b.addEventListener('click', () => scrollToItem(i));
        track.appendChild(b);
        return b;
      });
      slider.insertAdjacentElement('beforebegin', tl);
    } else {
      const nav = document.createElement('div');
      nav.className = 'm-dots' + (slider.dataset.mSlider === 'light' ? ' m-dots--light' : '');
      stops = items.map((item, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Thẻ ${i + 1} / ${items.length}`);
        b.addEventListener('click', () => scrollToItem(i));
        nav.appendChild(b);
        return b;
      });
      slider.insertAdjacentElement('afterend', nav);
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const step = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : 1;
      const max = slider.scrollWidth - slider.clientWidth;
      const atEnd = slider.scrollLeft >= max - 2;
      const idx = atEnd ? items.length - 1 : Math.min(items.length - 1, Math.max(0, Math.round(slider.scrollLeft / step)));
      stops.forEach((d, i) => { d.classList.toggle('is-active', i === idx); d.classList.toggle('is-done', i <= idx); });
      if (fill) {
        // fill runs from the first stop to the last, following the swipe continuously
        const p = max > 0 ? Math.min(Math.max(slider.scrollLeft / max, 0), 1) : 0;
        fill.style.setProperty('--p', p.toFixed(4));
      }
    };
    slider.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- Card carousel (≥641px): page-wise arrows + dots; ≤640px the m-slider above takes over ---------- */
  $$('[data-carousel]').forEach((track) => {
    track.classList.add('is-carousel');
    const cards = Array.from(track.children);
    const nav = document.createElement('div');
    nav.className = 'carousel-nav';
    nav.innerHTML = '<button type="button" class="carousel-nav__btn" data-dir="-1" aria-label="Xem các thẻ trước"><img src="assets/ic-arrow-left.svg" alt=""></button>'
      + '<div class="carousel-nav__dots"></div>'
      + '<button type="button" class="carousel-nav__btn" data-dir="1" aria-label="Xem các thẻ tiếp theo"><img src="assets/ic-arrow-right.svg" alt=""></button>';
    const anchorEl = track.nextElementSibling && track.nextElementSibling.classList.contains('m-dots') ? track.nextElementSibling : track;
    anchorEl.insertAdjacentElement('afterend', nav);
    const dotsWrap = $('.carousel-nav__dots', nav);
    const [prev, next] = $$('.carousel-nav__btn', nav);

    const step = () => (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth);
    const perView = () => Math.max(1, Math.round((track.clientWidth + 24) / step()));
    const pageCount = () => Math.ceil(cards.length / perView());
    const goToCard = (i) => track.scrollTo({ left: cards[Math.max(0, Math.min(i, cards.length - 1))].offsetLeft - cards[0].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
    const goToPage = (p) => goToCard(Math.min(p * perView(), cards.length - perView()));

    let builtFor = 0;
    const buildDots = () => {
      const n = pageCount();
      if (n === builtFor) return;
      builtFor = n;
      dotsWrap.innerHTML = '';
      for (let p = 0; p < n; p++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Trang ${p + 1} / ${n}`);
        b.addEventListener('click', () => goToPage(p));
        dotsWrap.appendChild(b);
      }
    };
    const update = () => {
      buildDots();
      const max = track.scrollWidth - track.clientWidth;
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= max - 2;
      const first = Math.round(track.scrollLeft / step());
      const page = atEnd ? pageCount() - 1 : Math.min(pageCount() - 1, Math.round(first / perView()));
      $$('button', dotsWrap).forEach((d, i) => d.classList.toggle('is-active', i === page));
      prev.disabled = atStart;
      next.disabled = atEnd;
    };
    prev.addEventListener('click', () => goToCard(Math.round(track.scrollLeft / step()) - perView()));
    next.addEventListener('click', () => goToCard(Math.round(track.scrollLeft / step()) + perView()));
    let raf = 0;
    track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- Lightbox ---------- */
  const lb = $('.lightbox');
  const lbImg = $('img', lb);
  const lbCount = $('.lightbox__count', lb);
  let lbList = [];
  let lbIndex = 0;
  let lastFocus = null;
  const showLb = (i) => {
    lbIndex = (i + lbList.length) % lbList.length;
    const src = lbList[lbIndex];
    lbImg.classList.remove('is-in');
    const img = new Image();
    img.onload = () => {
      lbImg.src = src.src;
      lbImg.alt = src.alt;
      void lbImg.offsetWidth; // restart the fade/scale-in transition
      lbImg.classList.add('is-in');
    };
    img.src = src.src;
    lbCount.textContent = `${lbIndex + 1} / ${lbList.length}`;
  };
  const openLb = (list, i) => {
    lbList = list;
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    void lb.offsetWidth;
    lb.classList.add('is-open');
    showLb(i);
    $('.lightbox__close', lb).focus();
  };
  const closeLb = () => {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; lbImg.classList.remove('is-in'); }, 350);
    lastFocus?.focus();
  };
  $('.lightbox__close', lb).addEventListener('click', closeLb);
  $('.lightbox__nav--prev', lb).addEventListener('click', () => showLb(lbIndex - 1));
  $('.lightbox__nav--next', lb).addEventListener('click', () => showLb(lbIndex + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
  });

  const boardingPhotos = $$('#boarding .photo');
  const boardingList = boardingPhotos.map((b) => { const i = $('img', b); return { src: i.dataset.full || i.src, alt: i.alt }; });
  boardingPhotos.forEach((b, i) => b.addEventListener('click', () => openLb(boardingList, i)));

  /* ---------- Campus galleries ---------- */
  $$('[data-gallery]').forEach((gallery) => {
    const stage = $('.gallery__stage', gallery);
    const slides = $$(':scope > img', stage);
    const thumbsWrap = $('.gallery__thumbs', gallery);
    let index = parseInt(gallery.dataset.start || '0', 10);

    // Thumbnails mirror the slides (max 4 visible, as in the design)
    const thumbs = slides.slice(0, 4).map((s, i) => {
      const b = document.createElement('button');
      b.className = 'gallery__thumb';
      b.setAttribute('aria-label', `Xem ảnh ${i + 1}`);
      b.innerHTML = `<img src="${s.getAttribute('src')}" alt="" loading="lazy">`;
      b.addEventListener('click', () => go(i));
      thumbsWrap.appendChild(b);
      return b;
    });
    // Fill up to 4 thumbs like the Figma layout when a campus has fewer photos
    while (thumbsWrap.children.length < 4 && slides.length) {
      const i = thumbsWrap.children.length % slides.length;
      const b = thumbs[i].cloneNode(true);
      b.addEventListener('click', () => go(i));
      thumbsWrap.appendChild(b);
    }

    const go = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, j) => s.classList.toggle('is-active', j === index));
      $$('.gallery__thumb', thumbsWrap).forEach((t, j) => t.classList.toggle('is-active', j % slides.length === index && j < slides.length));
    };
    go(index);
    $('.gallery__nav--prev', gallery).addEventListener('click', () => go(index - 1));
    $('.gallery__nav--next', gallery).addEventListener('click', () => go(index + 1));

    // Swipe on touch
    let x0 = null;
    stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
    stage.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    const list = slides.map((s) => ({ src: s.dataset.full || s.src, alt: s.alt }));
    slides.forEach((s) => s.addEventListener('click', () => openLb(list, index)));

    // Gentle autoplay while visible; pauses on hover/focus
    if (!reduceMotion) {
      let timer = null;
      const start = () => { stop(); timer = setInterval(() => go(index + 1), 4500); };
      const stop = () => clearInterval(timer);
      new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.4 }).observe(gallery);
      gallery.addEventListener('pointerenter', stop);
      gallery.addEventListener('pointerleave', start);
      gallery.addEventListener('focusin', stop);
    }
  });

  /* ---------- Register form ---------- */
  const form = $('#register-form');
  if (form) {
    const fields = $$('.field', form).filter((f) => $('[required]', f));
    const validate = (field) => {
      const input = $('input, select, textarea', field);
      let ok = input.checkValidity();
      if (ok && input.type === 'tel') ok = input.value.replace(/\D/g, '').length >= 9;
      field.classList.toggle('is-invalid', !ok);
      field.classList.toggle('is-valid', ok && input.value !== '');
      return ok;
    };
    fields.forEach((field) => {
      const input = $('input, select, textarea', field);
      input.addEventListener('blur', () => { if (input.value) validate(field); });
      input.addEventListener('input', () => { if (field.classList.contains('is-invalid')) validate(field); });
      input.addEventListener('change', () => validate(field));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const invalid = fields.filter((f) => !validate(f));
      if (invalid.length) {
        $('input, select', invalid[0]).focus({ preventScroll: true });
        invalid[0].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        return;
      }
      const btn = $('.form-card__submit', form);
      btn.classList.add('is-loading');
      btn.disabled = true;
      // TODO: send new FormData(form) to the CRM / lead endpoint here.
      setTimeout(() => {
        btn.classList.remove('is-loading');
        btn.disabled = false;
        form.classList.add('is-done');
      }, 1200);
    });

    $('.form-card__again', form).addEventListener('click', () => {
      form.reset();
      $$('.field', form).forEach((f) => f.classList.remove('is-valid', 'is-invalid'));
      const dob = $('#f-dob');
      dob.type = 'text';
      form.classList.remove('is-done');
    });
  }

  /* ---------- CTAs that pre-fill the consultation message (e.g. campus visit) ---------- */
  $$('[data-prefill]').forEach((a) => a.addEventListener('click', () => {
    const note = $('#f-note');
    if (note && !note.value.trim()) note.value = a.dataset.prefill;
  }));

  /* ---------- Placeholder contact links ---------- */
  $$('[data-todo]').forEach((a) => a.addEventListener('click', (e) => {
    if (a.getAttribute('href') === '#') e.preventDefault();
  }));
})();
