/** Move authored cell contents without depending on a fixed number of cells. */
export function moveRow(row, target) {
  [...row.children].forEach((cell) => target.append(...cell.childNodes));
  return target;
}

/** Simple collections keep one authored row per list item. */
export function createItems(block, className) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('img')) return;
    const item = document.createElement('li');
    item.className = className;
    moveRow(row, item);
    list.append(item);
  });
  block.replaceChildren(list);
  return list;
}

export function flattenBlock(block) {
  const content = document.createElement('div');
  [...block.children].forEach((row) => moveRow(row, content));
  block.replaceChildren(content);
  return content;
}

export function decorateBadge(content) {
  const first = content.querySelector(':scope > p:first-child');
  if (first?.querySelector('em') && !first.querySelector('a')) first.classList.add('eyebrow');
}
