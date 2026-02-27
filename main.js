/* =============================================
   WAKE DESIGN CO. — Main JavaScript
   ============================================= */

// === Supabase config (anon/public key — safe to expose) ===
const SUPABASE_URL = 'https://yezeeffhukxunuxfokyt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_o80asJI2Jjgt0JQYwtxvRw_DcisqN43';

(function () {
  'use strict';

  // === Navigation scroll effect ===
  const nav = document.querySelector('.nav');

  function updateNav() {
    if (!nav) return;
    if (window.scrollY > 70) {
      nav.classList.add('scrolled');
      nav.classList.remove('transparent');
    } else {
      nav.classList.remove('scrolled');
      if (nav.dataset.transparent === 'true') nav.classList.add('transparent');
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // === Mobile menu toggle ===
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
      });
    });
  }

  // === Active nav link ===
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // === Scroll progress bar ===
  const bar = document.querySelector('.scroll-progress');
  if (bar) {
    window.addEventListener('scroll', () => {
      const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      bar.style.width = Math.min(pct, 100) + '%';
    }, { passive: true });
  }

  // === Scroll reveal (Intersection Observer) ===
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .img-wrap').forEach(el => {
    revealObs.observe(el);
  });

  // === Hero load animation ===
  const hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(() => setTimeout(() => hero.classList.add('loaded'), 80));
  }

  // === Animated counters ===
  function runCounter(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const dur = 1800;
    const start = performance.now();

    function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Math.round(target * ease) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target.dataset.ran) {
        e.target.dataset.ran = '1';
        runCounter(e.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));

  // === FAQ accordion ===
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // === Gallery filter ===
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;

      galleryItems.forEach(item => {
        const match = cat === 'all' || item.dataset.cat === cat;
        item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        if (match) {
          item.style.opacity = '1';
          item.style.transform = 'scale(1)';
          item.style.pointerEvents = 'auto';
          item.style.display = 'block';
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          item.style.pointerEvents = 'none';
          setTimeout(() => {
            if (item.style.opacity === '0') item.style.display = 'none';
          }, 400);
        }
      });
    });
  });

  // === Subtle parallax on hero bg ===
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        heroBg.style.transform = `scale(1) translateY(${y * 0.28}px)`;
      }
    }, { passive: true });
  }

  // === Package card → pre-fill form ===
  document.querySelectorAll('.pkg-card .btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const pkgName = this.closest('.pkg-card').querySelector('.pkg-title')?.textContent;
      if (pkgName) {
        const sel = document.querySelector('#pkg-select');
        if (sel) {
          sel.value = pkgName;
          const form = document.querySelector('#order-form');
          if (form) {
            e.preventDefault();
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => sel.focus(), 600);
          }
        }
      }
    });
  });

  // === Order form → Supabase ===
  const orderForm = document.querySelector('#order-form');
  if (orderForm && typeof supabase !== 'undefined') {
    const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const successMsg = document.querySelector('#form-success');
    const errorMsg   = document.querySelector('#form-error');
    const submitBtn  = orderForm.querySelector('[type="submit"]');

    orderForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Button loading state
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending…';
      submitBtn.disabled = true;
      successMsg.style.display = 'none';
      errorMsg.style.display   = 'none';

      const data = {
        first_name: orderForm.fname.value.trim(),
        last_name:  orderForm.lname.value.trim(),
        email:      orderForm.email.value.trim(),
        phone:      orderForm.phone.value.trim() || null,
        package:    orderForm.package.value || null,
        vessel:     orderForm.vessel.value.trim() || null,
        boat_name:  orderForm.boatname.value.trim() || null,
        notes:      orderForm.notes.value.trim() || null,
      };

      const { error } = await db.from('leads').insert(data);

      if (error) {
        console.error('Supabase error:', error);
        errorMsg.style.display = 'block';
        errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        submitBtn.innerHTML = originalText;
        submitBtn.disabled  = false;
      } else {
        successMsg.style.display = 'block';
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        orderForm.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled  = false;
      }
    });
  }

  // === Smooth scroll for anchor links ===
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
