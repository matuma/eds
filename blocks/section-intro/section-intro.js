import { decorateBadge, flattenBlock } from '../../scripts/block-utils.js';

export default function decorate(block) {
  const content = flattenBlock(block);
  content.className = 'section-intro-copy';
  decorateBadge(content);
  const action = content.querySelector('.button-wrapper');
  if (action) block.append(action);
}
