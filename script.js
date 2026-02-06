/* ========================================
   BILTRIO — fredrikchr
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ── Navigation scroll behavior ──
  const nav = document.getElementById('nav');
  let lastScroll = 0;

  const handleScroll = () => {
    const scrollY = window.scrollY;

    if (scrollY > 40) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }

    // Back to top button
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
      if (scrollY > 300) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }

    lastScroll = scrollY;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ── Back to top ──
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Mobile menu ──
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ── FAQ Accordion ──
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-item__question');

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all items
      faqItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
      });

      // Open clicked item (if it wasn't already open)
      if (!isActive) {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ── Scroll Reveal ──
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = nav.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ── Registration input formatting ──
  const regnrInput = document.getElementById('regnr');
  if (regnrInput) {
    regnrInput.addEventListener('input', (e) => {
      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, '');

      // Auto-format: AB 12345
      if (value.length > 2 && value.charAt(2) !== ' ') {
        value = value.slice(0, 2) + ' ' + value.slice(2);
      }

      e.target.value = value.slice(0, 8);
    });
  }

  // ── Kilometer input formatting ──
  const kmInput = document.getElementById('km');
  if (kmInput) {
    kmInput.addEventListener('input', (e) => {
      let raw = e.target.value.replace(/\D/g, '');
      if (raw) {
        e.target.value = parseInt(raw, 10).toLocaleString('nb-NO');
      }
    });
  }

  // ── Timeline Horizontal Scroll (Vertical scroll -> Horizontal movement) ──
  const timelineSpacer = document.getElementById('timelineScrollSpacer');
  const timelineContainer = document.getElementById('timelineScrollContainer');
  const timelineTrack = timelineContainer?.querySelector('.timeline__track');
  const timelineProgress = document.getElementById('timelineProgress');
  const timelineScrollHint = document.getElementById('timelineScrollHint');

  if (timelineSpacer && timelineContainer && timelineTrack && timelineProgress) {
    const updateTimelinePosition = () => {
      // Only apply on desktop
      if (window.innerWidth <= 900) {
        timelineTrack.style.transform = 'translateX(0)';
        timelineProgress.style.width = '0%';
        return;
      }

      const spacerRect = timelineSpacer.getBoundingClientRect();
      const spacerTop = spacerRect.top;
      const spacerHeight = spacerRect.height;
      const windowHeight = window.innerHeight;

      // Calculate scroll progress through the spacer
      // Start when spacer top hits middle of screen
      const startOffset = windowHeight * 0.2;
      const scrollStart = -spacerTop + startOffset;
      const scrollRange = spacerHeight - windowHeight;

      // Calculate progress (0 to 1)
      let progress = scrollStart / scrollRange;
      progress = Math.max(0, Math.min(1, progress));

      // Calculate how far to translate the track
      const trackWidth = timelineTrack.scrollWidth;
      const containerWidth = timelineContainer.clientWidth;
      const maxTranslate = trackWidth - containerWidth;

      // Apply horizontal translation
      const translateX = -progress * maxTranslate;
      timelineTrack.style.transform = `translateX(${translateX}px)`;

      // Update progress bar
      timelineProgress.style.width = `${progress * 100}%`;

      // Hide scroll hint after scrolling starts
      if (timelineScrollHint) {
        if (progress > 0.05) {
          timelineScrollHint.classList.add('hidden');
        } else {
          timelineScrollHint.classList.remove('hidden');
        }
      }
    };

    // Update on scroll
    window.addEventListener('scroll', updateTimelinePosition, { passive: true });

    // Update on resize
    window.addEventListener('resize', updateTimelinePosition, { passive: true });

    // Initial call
    updateTimelinePosition();
  }

});
