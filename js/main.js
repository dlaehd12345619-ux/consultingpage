/* ===== Scroll Animation ===== */
const observeElements = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
};

/* ===== Sticky Header ===== */
const handleHeader = () => {
  const header = document.querySelector('.header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
};

/* ===== Floating CTA ===== */
const handleFloatCta = () => {
  const cta = document.getElementById('floatCta');
  if (!cta) return;

  const onScroll = () => {
    cta.classList.toggle('visible', window.scrollY > 200);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
};

/* ===== Active Nav Link by URL ===== */
const handleActiveNav = () => {
  const filename = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link[href]').forEach((link) => {
    const href = link.getAttribute('href');
    link.classList.toggle('active',
      href === filename || (filename === '' && href === 'index.html')
    );
  });
};

/* ===== Hamburger / Mobile Menu ===== */
const handleMobileMenu = () => {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileClose = document.querySelector('.mobile-close');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!hamburger || !mobileMenu) return;

  const openMenu = () => {
    mobileMenu.classList.add('open');
    hamburger.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', openMenu);
  mobileClose?.addEventListener('click', closeMenu);
  mobileLinks.forEach((link) => link.addEventListener('click', closeMenu));
};

/* ===== Smooth Scroll for all anchor links ===== */
const handleSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
};

/* ===== Counter Animation ===== */
const animateCounter = (el, target, suffix = '') => {
  const duration = 1800;
  const start = performance.now();

  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
};

const handleCounters = () => {
  const counters = document.querySelectorAll('[data-count]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'), 10);
          const suffix = el.getAttribute('data-suffix') || '';
          animateCounter(el, target, suffix);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => observer.observe(counter));
};

/* ===== Contact Form Validation ===== */
const handleForm = () => {
  const form = document.querySelector('#contactForm');
  if (!form) return;

  const showError = (field, msg) => {
    clearError(field);
    field.style.borderColor = '#EF4444';
    const error = document.createElement('span');
    error.className = 'form-error';
    error.style.cssText = 'color:#EF4444;font-size:0.8rem;margin-top:4px;display:block;';
    error.textContent = msg;
    field.parentElement.appendChild(error);
  };

  const clearError = (field) => {
    field.style.borderColor = '';
    const existing = field.parentElement.querySelector('.form-error');
    existing?.remove();
  };

  const validate = () => {
    let valid = true;
    const name = form.querySelector('#name');
    const phone = form.querySelector('#phone');
    const service = form.querySelector('#service');
    const message = form.querySelector('#message');

    if (!name.value.trim()) { showError(name, '이름을 입력해주세요.'); valid = false; }
    else clearError(name);

    if (!phone.value.trim()) { showError(phone, '연락처를 입력해주세요.'); valid = false; }
    else clearError(phone);

    if (!service.value) { showError(service, '문의 유형을 선택해주세요.'); valid = false; }
    else clearError(service);

    if (!message.value.trim()) { showError(message, '문의 내용을 입력해주세요.'); valid = false; }
    else clearError(message);

    return valid;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;

    // 서버가 없는 정적 사이트이므로 입력 내용으로 메일 작성 창을 연다.
    const val = (id) => (form.querySelector('#' + id)?.value || '').trim();
    const serviceSel = form.querySelector('#service');
    const serviceText = serviceSel.options[serviceSel.selectedIndex].text;
    const body = [
      `학교/기관명: ${val('school')}`,
      `담당자: ${val('name')}`,
      `연락처: ${val('phone')}`,
      `이메일: ${val('email')}`,
      `문의 유형: ${serviceText}`,
      '',
      val('message')
    ].join('\n');
    const subject = `[도입 문의] ${serviceText} - ${val('school') || val('name')}`;

    window.location.href =
      `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const success = form.querySelector('.form-success');
    if (success) {
      success.style.display = 'block';
      success.innerHTML = '메일 작성 창이 열립니다.<br>열리지 않으면 아래 이메일로 직접 보내주세요.';
    }
  });
};

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  observeElements();
  handleHeader();
  handleActiveNav();
  handleMobileMenu();
  handleSmoothScroll();
  handleCounters();
  handleForm();
  handleFloatCta();
});
