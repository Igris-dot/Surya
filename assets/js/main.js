(function () {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');

  // Mobile menu toggle
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile menu when a link is clicked
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Active navigation highlight
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function (link) {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkPath = href.split('/').pop().split('#')[0];
    if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Smooth page exit transition for internal navigation
  const main = document.querySelector('main');
  if (main) {
    document.querySelectorAll('a[href]').forEach(function (link) {
      const href = link.getAttribute('href');
      // Skip non-page links (hash only, mailto, tel, javascript, external links)
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        link.getAttribute('target') === '_blank'
      ) {
        return;
      }

      link.addEventListener('click', function (e) {
        // Allow default behavior if user is opening in new tab or using modifier keys
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return;
        }

        // Check if View Transitions API is handling this natively
        if (document.startViewTransition) {
          // Native View Transitions handles cross-document navigation via @view-transition
          return;
        }

        // Fallback smooth transition for browsers without cross-document view transitions
        e.preventDefault();
        main.classList.add('page-leaving');
        setTimeout(function () {
          window.location.href = href;
        }, 180);
      });
    });
  }
})();
