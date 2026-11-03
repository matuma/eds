import { moveRow } from '../../scripts/block-utils.js';

export default function decorate(block) {
  const rows = [...block.children];
  block.replaceChildren();
  rows.forEach((row, index) => {
    if (!row.textContent.trim() && !row.querySelector('img')) return;
    const card = document.createElement('article');
    card.className = index === 0 ? 'work-intro' : 'work-project';
    const content = document.createElement('div');
    content.className = 'work-copy';
    moveRow(row, content);
    card.append(content);
    if (index > 0) {
      const media = document.createElement('div');
      media.className = 'work-media';
      const picture = content.querySelector('picture') || content.querySelector('img');
      if (picture) media.append(picture);
      else media.setAttribute('aria-hidden', 'true');
      card.append(media);
    }
    block.append(card);
  });
}
