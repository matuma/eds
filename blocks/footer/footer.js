import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-content';
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  const brand = footer.querySelector('a');
  if (brand) {
    brand.className = 'footer-brand';
    brand.closest('p')?.classList.remove('button-wrapper');
  }

  const navigation = footer.querySelector('ul');
  if (navigation) {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Footer navigation');
    navigation.replaceWith(nav);
    nav.append(navigation);
  }

  block.append(footer);
}
