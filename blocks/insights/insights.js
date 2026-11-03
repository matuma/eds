import { moveRow } from '../../scripts/block-utils.js';

export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('img')) return;
    const item = document.createElement('li');
    const article = document.createElement('article');
    const body = document.createElement('div');
    body.className = 'insights-copy';
    moveRow(row, body);
    const picture = body.querySelector('picture') || body.querySelector('img');
    if (picture) {
      const media = document.createElement('div');
      media.className = 'insights-media';
      media.append(picture);
      article.append(media);
    }
    const metadata = document.createElement('div');
    metadata.className = 'insights-meta';
    [...body.querySelectorAll(':scope > p')].forEach((paragraph) => {
      const value = paragraph.textContent.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))) {
        const time = document.createElement('time');
        time.dateTime = value;
        time.textContent = new Intl.DateTimeFormat('en-US', {
          month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC',
        }).format(new Date(value));
        metadata.append(time);
        paragraph.remove();
      } else if (paragraph.querySelector('em') && !paragraph.querySelector('a')) {
        paragraph.className = 'insights-category';
        metadata.append(paragraph);
      } else if (!paragraph.textContent.trim() && !paragraph.children.length) {
        paragraph.remove();
      }
    });
    if (metadata.children.length) body.append(metadata);
    article.append(body);
    item.append(article);
    list.append(item);
  });
  block.replaceChildren(list);
}
