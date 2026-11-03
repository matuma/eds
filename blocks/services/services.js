import { createItems } from '../../scripts/block-utils.js';

export default function decorate(block) {
  const list = createItems(block, 'services-card');
  const feature = list.firstElementChild;
  if (feature) {
    feature.classList.add('services-feature');
    const content = document.createElement('div');
    content.className = 'services-feature-content';
    content.append(...feature.childNodes);
    feature.append(content);
  }
}
