document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelector('#all-tributes-list');
  const search = document.querySelector('#guestbook-search');
  const status = document.querySelector('#guestbook-status');
  let tributes = [];

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
      message.textContent = tribute.message;
      card.append(title, meta, message);
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
