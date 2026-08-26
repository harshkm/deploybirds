/**
 * DeployBirds - Main Interface Controller
 * Handles HUD Synchronization, Scroll Crossfades, Filters, Counters, and UI Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // 1. Navigation Scroll Effect
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }, { passive: true });

  // 2. Mobile Menu Toggle  (F-25: close on link, Esc and outside tap; announce state)
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const mobileDrawer = document.querySelector('.mobile-nav-drawer');

  if (mobileBtn && mobileDrawer) {
    mobileBtn.setAttribute('aria-expanded', 'false');
    if (!mobileDrawer.id) mobileDrawer.id = 'mobile-nav';
    mobileBtn.setAttribute('aria-controls', mobileDrawer.id);

    const setMenu = (open) => {
      mobileDrawer.classList.toggle('open', open);
      document.body.classList.toggle('nav-open', open);
      mobileBtn.setAttribute('aria-expanded', String(open));
      mobileBtn.textContent = open ? '✕ CLOSE' : '☰ MENU';
      if (!open) mobileBtn.focus();
    };

    const isOpen = () => mobileDrawer.classList.contains('open');

    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setMenu(!isOpen());
    });

    // Navigating away should not leave the drawer open behind the new page
    mobileDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) setMenu(false);
    });

    document.addEventListener('click', (e) => {
      if (isOpen() && !mobileDrawer.contains(e.target) && e.target !== mobileBtn) {
        setMenu(false);
      }
    });

    // A resize past the breakpoint leaves a stranded drawer otherwise
    window.addEventListener('resize', () => {
      if (isOpen() && window.innerWidth > 768) setMenu(false);
    }, { passive: true });
  }

  // 3. Homepage Scroll & HUD Synchronization
  const sections = document.querySelectorAll('.scroll-section');
  const railDots = document.querySelectorAll('.rail-dot');
  const railFill = document.querySelector('.rail-fill');
  const hudSectionLabel = document.querySelector('.hud-section-label');
  const waypoints = document.querySelectorAll('.waypoint-step');

  if (sections.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -30% 0px',
      threshold: 0.15
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          sections.forEach(s => s.classList.remove('active'));
          entry.target.classList.add('active');

          const index = parseInt(entry.target.getAttribute('data-stage') || '1', 10) - 1;
          const sectionTitle = entry.target.getAttribute('data-title') || 'DEPLOYBIRDS';

          // Update Left HUD Progress Rail
          railDots.forEach((dot, idx) => {
            if (idx === index) {
              dot.classList.add('active');
            } else {
              dot.classList.remove('active');
            }
          });

          if (railFill && railDots.length > 1) {
            const fillPct = (index / (railDots.length - 1)) * 100;
            railFill.style.height = `${fillPct}%`;
          }

          // Update Right HUD Rotated Section Label
          if (hudSectionLabel) {
            hudSectionLabel.textContent = `// ${String(index + 1).padStart(2, '0')} · ${sectionTitle.toUpperCase()}`;
          }

          // Update Bottom HUD Waypoints
          const wpMapping = [0, 0, 1, 1, 2, 2, 3, 3, 3];
          const activeWp = wpMapping[index] || 0;
          waypoints.forEach((wp, wIdx) => {
            if (wIdx <= activeWp) {
              wp.classList.add('active');
            } else {
              wp.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(sec => sectionObserver.observe(sec));
  }

  // 4. Ambient Audio Toggle Button
  const audioBtn = document.querySelector('.audio-toggle-btn');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      if (window.ambientAudio) {
        const isPlaying = window.ambientAudio.toggle();
        if (isPlaying) {
          audioBtn.classList.add('audio-playing');
          audioBtn.querySelector('.audio-label').textContent = 'AUDIO: ON';
        } else {
          audioBtn.classList.remove('audio-playing');
          audioBtn.querySelector('.audio-label').textContent = 'AUDIO: OFF';
        }
      }
    });
  }

  // 5. Filterable Category Pills (Services & Insights Pages)
  const filterPills = document.querySelectorAll('.filter-pill');
  const filterCards = document.querySelectorAll('[data-category]');

  if (filterPills.length > 0) {
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const selected = pill.getAttribute('data-filter');
        filterCards.forEach(card => {
          const cardCat = card.getAttribute('data-category');
          if (selected === 'all' || cardCat.includes(selected)) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });

        if (window.ambientAudio) window.ambientAudio.playBlip(750, 0.05);
      });
    });
  }

  // 6. Animated Stat Counters (Flagship / About Pages)
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          entry.target.classList.add('counted');
          const target = parseFloat(entry.target.getAttribute('data-target'));
          const prefix = entry.target.getAttribute('data-prefix') || '';
          const suffix = entry.target.getAttribute('data-suffix') || '';
          const duration = 1600;
          const start = 0;
          const startTime = performance.now();

          const updateCount = (currentTime) => {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic Ease Out
            const val = (target * easeProgress).toFixed(target % 1 === 0 ? 0 : 2);
            entry.target.textContent = `${prefix}${val}${suffix}`;

            if (progress < 1) {
              requestAnimationFrame(updateCount);
            } else {
              entry.target.textContent = `${prefix}${target}${suffix}`;
            }
          };

          requestAnimationFrame(updateCount);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
  }

  // 7. Flagship Program Countdown Timer
  const countdownEl = document.getElementById('cohort-countdown');
  if (countdownEl) {
    // F-22: this used to be `Date.now() + 18 days`, recomputed on every page
    // load, so it never expired. It is now a real fixed date.
    // >>> UPDATE THIS EACH COHORT, or delete the timer block entirely. <<<
    const COHORT_CLOSES = '2026-09-30T18:00:00+05:30';
    const targetDate = new Date(COHORT_CLOSES).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        const wrap = countdownEl.closest('.countdown-wrap') || countdownEl;
        wrap.innerHTML = '<p style="font-family: var(--font-mono); font-size: var(--fs-xs);' +
          ' letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent-green);">' +
          '› Applications for this cohort have closed — talk to us about the next one</p>';
        return;
      }

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const dEl = document.getElementById('cd-days');
        const hEl = document.getElementById('cd-hours');
        const mEl = document.getElementById('cd-min');
        const sEl = document.getElementById('cd-sec');

        if (dEl) dEl.textContent = String(days).padStart(2, '0');
        if (hEl) hEl.textContent = String(hours).padStart(2, '0');
        if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
        if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
      }
    };

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // 8. Contact Form — real submission
  //
  // F-02: this handler used to call preventDefault(), wait one second, and then
  // tell the visitor "MESSAGE TRANSMITTED" without sending anything anywhere.
  // Every enquiry was silently discarded.
  //
  // SET THIS to your endpoint, then the fetch path below goes live:
  //   Web3Forms  -> https://api.web3forms.com/submit   (needs access_key field)
  //   Formspree  -> https://formspree.io/f/xxxxxxxx
  //   Getform    -> https://getform.io/f/xxxxxxxx
  // Leave it empty and the form falls back to a pre-filled mailto: — slower,
  // but honest. It never claims success it cannot verify.
  const FORM_ENDPOINT = '';
  const FALLBACK_EMAIL = 'support@deploybirds.com';

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const statusEl = document.getElementById('form-status');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    // F-06: twelve links point here as contact.html?service=cloud etc.
    // Nothing read the parameter, so the dropdown always opened on its default.
    const preselect = new URLSearchParams(location.search).get('service');
    const serviceSel = document.getElementById('service');
    if (preselect && serviceSel) {
      const match = [...serviceSel.options].find(o => o.value === preselect);
      if (match) serviceSel.value = preselect;
    }

    const setStatus = (msg, kind) => {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.className = 'form-status' + (kind ? ' is-' + kind : '');
    };

    const mailtoFallback = (data) => {
      const body = [
        'Name: ' + (data.get('name') || ''),
        'Email: ' + (data.get('email') || ''),
        'Area: ' + (data.get('service') || ''),
        '',
        data.get('message') || ''
      ].join('\n');
      const href = 'mailto:' + FALLBACK_EMAIL +
        '?subject=' + encodeURIComponent('Discovery request — ' + (data.get('name') || 'website')) +
        '&body=' + encodeURIComponent(body);
      setStatus('Opening your email client so nothing gets lost — press send there and we will reply within 24 hours.', 'warn');
      window.location.href = href;
    };

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const data = new FormData(contactForm);

      // honeypot — a filled hidden field means a bot
      if (data.get('company_url')) {
        setStatus('Thanks — your request has been received.', 'ok');
        contactForm.reset();
        return;
      }

      const originalHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>SENDING…</span>';
      setStatus('Sending your request…');

      if (!FORM_ENDPOINT) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
        mailtoFallback(data);
        return;
      }

      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: data
        });

        if (!res.ok) throw new Error('HTTP ' + res.status);

        submitBtn.innerHTML = '<span>✓ REQUEST SENT</span>';
        setStatus('Received. Our engineering team will review your specs and reply within 24 hours.', 'ok');
        contactForm.reset();
        if (window.ambientAudio) window.ambientAudio.playBlip(1200, 0.15);
      } catch (err) {
        // A silent failure here is worse than no form. Say so, and give
        // the visitor a route that definitely works.
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
        setStatus('That did not go through. Email us directly at ' + FALLBACK_EMAIL +
                  ' or call +91 97081 67283 — we will pick it up either way.', 'error');
        console.error('[contact-form] submission failed:', err);
      }
    });
  }

  // 9. Interactive Hover Blips for Chamfer Buttons
  document.querySelectorAll('.btn-chamfer, .btn-nav-cta, .filter-pill').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (window.ambientAudio) window.ambientAudio.playBlip(980, 0.04);
    });
  });
});
