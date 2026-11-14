const nav = document.querySelector('.topbar');
const toggle = document.querySelector('.menu-toggle');
const links = document.querySelectorAll('.topbar nav a');
const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 24);
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

toggle.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!expanded));
  toggle.setAttribute('aria-label', expanded ? 'Open menu' : 'Close menu');
  nav.classList.toggle('menu-open', !expanded);
});
links.forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('menu-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');
}));

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const art = document.querySelector('.hero-art');
  window.addEventListener('scroll', () => {
    const progress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
    art.style.transform = `translate3d(0, ${progress * 34}px, 0)`;
  }, { passive: true });
}
