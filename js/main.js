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

  // 2. Mobile Menu Toggle
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const mobileDrawer = document.querySelector('.mobile-nav-drawer');
  if (mobileBtn && mobileDrawer) {
    mobileBtn.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
      mobileBtn.textContent = mobileDrawer.classList.contains('open') ? '✕ CLOSE' : '☰ MENU';
    });
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
    // Set target date 18 days from now
    const targetDate = new Date().getTime() + (18 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000);

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

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

  // 8. Contact Form Fast Feedback
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.innerHTML = `<span>TRANSMITTING...</span>`;
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.innerHTML = `<span style="color:#040705;">✓ MESSAGE TRANSMITTED</span>`;
        submitBtn.style.background = '#4efa7b';
        
        // Show success alert
        const alertBox = document.createElement('div');
        alertBox.className = 'consultation-badge-box';
        alertBox.style.marginTop = '20px';
        alertBox.innerHTML = `
          <h4 style="color:#36E05E; margin-bottom:6px;">› Discovery Request Received</h4>
          <p style="font-size:0.88rem; color:#F2F7F4;">Our senior engineering team will review your specs and send a calendar invite and technical brief within 24 hours.</p>
        `;
        contactForm.appendChild(alertBox);
        contactForm.reset();

        if (window.ambientAudio) window.ambientAudio.playBlip(1200, 0.15);
      }, 1000);
    });
  }

  // 9. Interactive Hover Blips for Chamfer Buttons
  document.querySelectorAll('.btn-chamfer, .btn-nav-cta, .filter-pill').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (window.ambientAudio) window.ambientAudio.playBlip(980, 0.04);
    });
  });
});
