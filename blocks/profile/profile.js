import { decorateBadge, flattenBlock } from '../../scripts/block-utils.js';

export default function decorate(block) {
  const content = flattenBlock(block);
  content.className = 'profile-copy';
  decorateBadge(content);
  const media = document.createElement('div');
  media.className = 'profile-media';
  const picture = content.querySelector('picture') || content.querySelector('img:not(.icon img)');
  if (picture) media.append(picture);
  else media.setAttribute('aria-hidden', 'true');
  block.append(media);
}
