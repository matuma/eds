import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const path = getMetadata('nav') || '/nav';
  const fragment = await loadFragment(new URL(path, window.location).pathname);
  if (!fragment) return;

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Main navigation');
  const brand = fragment.querySelector('a');
  if (brand) {
    brand.className = 'nav-brand';
    const parts = brand.textContent.trim().split(/\s+/);
    const explicitInitials = /^[A-Z]{2,3}$/.test(parts[0]);
    const initials = explicitInitials ? parts.shift() : parts.map((part) => part[0]).slice(0, 2).join('');
    const name = document.createElement('span');
    name.textContent = parts.join(' ');
    const mark = document.createElement('span');
    mark.className = 'nav-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = initials;
    brand.replaceChildren(mark, name);
    nav.append(brand);
  }

  const links = document.createElement('div');
  links.className = 'nav-links';
  links.id = 'nav-links';
  fragment.querySelectorAll('ul').forEach((list) => {
    if (!list.parentElement.closest('ul')) links.append(list);
  });
  const normalize = (value) => value.replace(/\/$/, '') || '/';
  links.querySelectorAll('a').forEach((link) => {
    if (normalize(new URL(link.href).pathname) === normalize(window.location.pathname)) {
      link.setAttribute('aria-current', 'page');
    }
  });

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-controls', links.id);
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  toggle.append(icon);
  const desktop = window.matchMedia('(min-width: 900px)');
  const setExpanded = (expanded) => {
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
    links.hidden = !desktop.matches && !expanded;
    nav.classList.toggle('nav-open', expanded && !desktop.matches);
  };
  toggle.addEventListener('click', () => setExpanded(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !desktop.matches) {
      setExpanded(false);
      toggle.focus();
    }
  });
  links.addEventListener('click', (event) => {
    if (event.target.closest('a')) setExpanded(false);
  });
  nav.addEventListener('focusout', (event) => {
    if (!nav.contains(event.relatedTarget)) setExpanded(false);
  });
  desktop.addEventListener('change', () => setExpanded(false));
  nav.append(toggle, links);
  setExpanded(false);
  block.replaceChildren(nav);
}
