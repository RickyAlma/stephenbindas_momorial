document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelector('#all-tributes-list');
  const search = document.querySelector('#guestbook-search');
  const status = document.querySelector('#guestbook-status');
  let tributes = [];
  const previewLength = 300;

  const formatDate = (date) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
  const render = () => {
    const query = search.value.trim().toLowerCase();
    const matches = tributes.filter((tribute) => `${tribute.fullName} ${tribute.relationship} ${tribute.message}`.toLowerCase().includes(query));
    list.replaceChildren();
    matches.forEach((tribute) => {
      const card = document.createElement('article');
      card.className = 'tribute-card';
      const title = document.createElement('h3');
      title.textContent = tribute.fullName;
      const meta = document.createElement('div');
      meta.className = 'tribute-meta';
      meta.textContent = [tribute.relationship, formatDate(tribute.createdAt)].filter(Boolean).join('  •  ');
      const message = document.createElement('p');
      const isLong = tribute.message.length > previewLength;
      message.textContent = isLong ? `${tribute.message.slice(0, previewLength).trim()}...` : tribute.message;
      card.append(title, meta, message);
      if (isLong) {
        const readMore = document.createElement('button');
        readMore.className = 'read-more';
        readMore.type = 'button';
        readMore.textContent = 'Read more';
        readMore.addEventListener('click', () => {
          const expanded = readMore.getAttribute('aria-expanded') === 'true';
          message.textContent = expanded ? `${tribute.message.slice(0, previewLength).trim()}...` : tribute.message;
          readMore.textContent = expanded ? 'Read more' : 'Show less';
          readMore.setAttribute('aria-expanded', String(!expanded));
        });
        readMore.setAttribute('aria-expanded', 'false');
        card.append(readMore);
      }
      list.append(card);
    });
    status.textContent = matches.length ? `${matches.length} ${matches.length === 1 ? 'tribute' : 'tributes'}` : 'No tributes found.';
  };

  fetch('api/tributes.php', { headers: { Accept: 'application/json' } })
    .then((response) => {
      if (!response.ok) throw new Error('Unable to load tributes.');
      return response.json();
    })
    .then((data) => {
      tributes = Array.isArray(data.tributes) ? data.tributes : [];
      render();
    })
    .catch(() => {
      status.textContent = 'Tributes are temporarily unavailable. Please try again later.';
    });

  search.addEventListener('input', render);
});
