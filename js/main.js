import { supabase } from './supabase.js';

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const val = (id) => (form.querySelector('#' + id)?.value || '').trim();
    const serviceSel = form.querySelector('#service');
    const serviceText = serviceSel.options[serviceSel.selectedIndex].text;
    const btn = form.querySelector('.form-submit');
    const success = form.querySelector('.form-success');

    // 개인정보 수집·이용 동의 확인
    const consent = form.querySelector('#consent');
    if (consent && !consent.checked) {
      showError(consent, '개인정보 수집·이용에 동의해 주세요.');
      return;
    }
    if (consent) clearError(consent);

    // 스팸 봇 차단용 숨김 입력칸: 값이 있으면 저장하지 않고 성공한 것처럼 처리
    if (val('website')) {
      form.reset();
      if (success) { success.style.display = 'block'; success.textContent = '문의가 접수되었습니다.'; }
      return;
    }

    // 1) Supabase에 저장
    if (supabase) {
      const originalLabel = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = '전송 중...';

      const { error } = await supabase.from('inquiries').insert({
        school: val('school') || null,
        name: val('name'),
        phone: val('phone'),
        email: val('email') || null,
        interest: serviceText,
        message: val('message'),
        consent: true
      });

      if (!error) {
        form.reset();
        btn.style.display = 'none';
        if (success) {
          success.style.display = 'block';
          success.style.color = '';
          success.innerHTML = '<i class="fas fa-check-circle" style="font-size:2rem;margin-bottom:8px;display:block;"></i>문의가 접수되었습니다.<br>확인 후 연락드리겠습니다.';
        }
        return;
      }

      console.error('문의 저장 실패:', error);
      btn.disabled = false;
      btn.innerHTML = originalLabel;
    }

    // 2) 저장소가 없거나 저장에 실패한 경우: 메일 앱을 강제로 열지 않고 안내만 표시한다.
    //    (입력한 내용은 그대로 두어 다시 시도할 수 있다.)
    if (success) {
      success.style.display = 'block';
      success.style.color = '#C0392B';
      success.innerHTML = '문의 접수 중 문제가 발생했습니다.<br>잠시 후 다시 시도하시거나 '
        + `<a href="mailto:${form.dataset.mailto}" style="text-decoration:underline;">${form.dataset.mailto}</a>`
        + '로 문의해 주세요.';
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
