import { flattenBlock } from '../../scripts/block-utils.js';

export default function decorate(block) {
  if (!block.classList.contains('intro')) return;
  const content = flattenBlock(block);
  content.className = 'hero-content';
  const specialties = content.querySelector('p:has(em):not(:has(a))');
  specialties?.classList.add('hero-specialties');
  const buttons = [...content.querySelectorAll('.button-wrapper')];
  if (buttons.length) {
    const actions = document.createElement('div');
    actions.className = 'hero-actions';
    actions.append(...buttons);
    content.append(actions);
  }
}
