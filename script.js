/* ============================================
   SCAN CONSOLE — count-up stats on first view
   ============================================ */
(function countUp(){
  const items = document.querySelectorAll('.scan-value');
  if (!items.length) return;

  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    function tick(now){
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        items.forEach(animate);
        io.disconnect();
      }
    });
  }, { threshold: 0.4 });

  io.observe(items[0]);
})();

/* ============================================
   3D TILT — project case files react to cursor
   ============================================ */
(function tiltCards(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const cards = document.querySelectorAll('.case-file, .cert-badge, .activity-card');

  cards.forEach(card => {
    let raf = null;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform =
          `perspective(800px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 10).toFixed(2)}deg) translateY(-4px)`;
      });
    });

    card.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
})();

/* ============================================
   SCROLL-TRIGGERED SECTION REVEAL
   ============================================ */
(function reveal(){
  const targets = document.querySelectorAll('.section');
  targets.forEach(t => { t.style.opacity = 0; t.style.transform = 'translateY(24px)'; t.style.transition = 'opacity 0.7s ease, transform 0.7s ease'; });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(t => io.observe(t));
})();
