document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navItems = [...document.querySelectorAll('.nav-link')];
  const sections = [...document.querySelectorAll('[data-section]')];
  const backToTop = document.querySelector('#back-to-top');
  const form = document.querySelector('#tribute-form');
  const nameInput = document.querySelector('#full-name');
  const relationshipInput = document.querySelector('#relationship');
  const messageInput = document.querySelector('#tribute-message');
  const wordCount = document.querySelector('#word-count');
  const notification = document.querySelector('#form-notification');
  const tributeList = document.querySelector('#tribute-list');
  const emptyState = document.querySelector('#empty-state');
  const searchInput = document.querySelector('#tribute-search');
  const loadMore = document.querySelector('#load-more');
  const carousel = document.querySelector('.tribute-carousel');
  const carouselPrev = document.querySelector('#carousel-prev');
  const carouselNext = document.querySelector('#carousel-next');
  const carouselStatus = document.querySelector('#carousel-status');
  const storageKey = 'memorialTributes';
  const pageSize = 4;
  let visibleCount = pageSize;
  let activeTributes = [];
  let carouselIndex = 0;
  let carouselTimer;

  const visibleTributeCount = () => Math.min(activeTributes.length, visibleCount);

  menuToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  });
  navItems.forEach((item) => item.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }));

  const updateScrollUi = () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
    backToTop.classList.toggle('visible', window.scrollY > 500);
  };
  window.addEventListener('scroll', updateScrollUi, { passive: true });
  updateScrollUi();

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navItems.forEach((item) => item.classList.toggle('active', item.getAttribute('href') === `#${entry.target.id}`));
      }
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  sections.forEach((section) => sectionObserver.observe(section));
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const updateWordCount = () => {
    const words = messageInput.value.trim() ? messageInput.value.trim().split(/\s+/).length : 0;
    wordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
    messageInput.style.height = 'auto';
    messageInput.style.height = `${messageInput.scrollHeight}px`;
  };
  messageInput.addEventListener('input', updateWordCount);

  const getTributes = () => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || []; } catch (error) { return []; }
  };
  const saveTributes = (tributes) => {
    // localStorage is suitable for this frontend/demo only; production needs a real backend/database.
    localStorage.setItem(storageKey, JSON.stringify(tributes));
  };
  const formatDate = (date) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
  const updateCarousel = () => {
    const total = visibleTributeCount();
    carouselIndex = total ? Math.min(carouselIndex, total - 1) : 0;
    tributeList.style.transform = total ? `translateX(calc(-${carouselIndex} * (100% + 18px)))` : '';
    carouselPrev.disabled = total < 2;
    carouselNext.disabled = total < 2;
    carouselPrev.hidden = total < 2;
    carouselNext.hidden = total < 2;
    carouselStatus.textContent = total > 1 ? `Tribute ${carouselIndex + 1} of ${total}` : '';
  };
  const moveCarousel = (direction) => {
    const total = visibleTributeCount();
    if (total < 2) return;
    carouselIndex = (carouselIndex + direction + total) % total;
    updateCarousel();
  };
  const restartCarouselTimer = () => {
    window.clearInterval(carouselTimer);
    if (visibleTributeCount() > 1) carouselTimer = window.setInterval(() => moveCarousel(1), 6500);
  };
  const renderTributes = () => {
    const query = searchInput.value.trim().toLowerCase();
    activeTributes = getTributes().filter((tribute) => `${tribute.fullName} ${tribute.relationship} ${tribute.message}`.toLowerCase().includes(query));
    tributeList.replaceChildren();
    activeTributes.slice(0, visibleCount).forEach((tribute) => {
      const card = document.createElement('article');
      card.className = 'tribute-card';
      const title = document.createElement('h4');
      title.textContent = tribute.fullName;
      const meta = document.createElement('div');
      meta.className = 'tribute-meta';
      meta.textContent = [tribute.relationship, formatDate(tribute.createdAt)].filter(Boolean).join('  •  ');
      const message = document.createElement('p');
      message.textContent = tribute.message;
      card.append(title, meta, message);
      tributeList.append(card);
    });
    carouselIndex = 0;
    updateCarousel();
    restartCarouselTimer();
    emptyState.hidden = activeTributes.length > 0;
    loadMore.hidden = activeTributes.length <= visibleCount;
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    document.querySelector('#name-error').textContent = '';
    document.querySelector('#message-error').textContent = '';
    notification.textContent = '';
    notification.classList.remove('error');
    let valid = true;
    if (!nameInput.value.trim()) { document.querySelector('#name-error').textContent = 'Please enter your name.'; valid = false; }
    if (!messageInput.value.trim()) { document.querySelector('#message-error').textContent = 'Please share a tribute.'; valid = false; }
    if (!valid) { notification.textContent = 'Please check the required fields.'; notification.classList.add('error'); return; }
    const tributes = getTributes();
    tributes.unshift({ fullName: nameInput.value.trim(), relationship: relationshipInput.value.trim(), message: messageInput.value.trim(), createdAt: new Date().toISOString() });
    saveTributes(tributes);
    form.reset();
    updateWordCount();
    visibleCount = pageSize;
    carouselIndex = 0;
    notification.textContent = 'Your tribute has been added. Thank you for sharing.';
    renderTributes();
  });
  searchInput.addEventListener('input', () => { visibleCount = pageSize; carouselIndex = 0; renderTributes(); });
  loadMore.addEventListener('click', () => { visibleCount += pageSize; renderTributes(); });
  carouselPrev.addEventListener('click', () => { moveCarousel(-1); restartCarouselTimer(); });
  carouselNext.addEventListener('click', () => { moveCarousel(1); restartCarouselTimer(); });
  carousel.addEventListener('mouseenter', () => window.clearInterval(carouselTimer));
  carousel.addEventListener('mouseleave', restartCarouselTimer);
  carousel.addEventListener('focusin', () => window.clearInterval(carouselTimer));
  carousel.addEventListener('focusout', (event) => { if (!carousel.contains(event.relatedTarget)) restartCarouselTimer(); });
  renderTributes();

  const galleryItems = [...document.querySelectorAll('.gallery-item')];
  const lightbox = document.querySelector('#lightbox');
  const lightboxImage = document.querySelector('#lightbox-image');
  const lightboxCaption = document.querySelector('#lightbox-caption');
  let galleryIndex = 0;
  const showImage = (index) => {
    galleryIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[galleryIndex];
    const sourceImage = item.querySelector('.image-placeholder img');
    const expandedImage = sourceImage.cloneNode(true);
    expandedImage.removeAttribute('alt');
    lightboxImage.replaceChildren(expandedImage);
    lightboxCaption.textContent = item.querySelector('.gallery-caption').textContent;
  };
  const closeLightbox = () => { lightbox.hidden = true; document.body.classList.remove('menu-open'); };
  galleryItems.forEach((item, index) => item.addEventListener('click', () => { lightbox.hidden = false; showImage(index); document.querySelector('.lightbox-close').focus(); }));
  document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  document.querySelector('.lightbox-prev').addEventListener('click', () => showImage(galleryIndex - 1));
  document.querySelector('.lightbox-next').addEventListener('click', () => showImage(galleryIndex + 1));
  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') showImage(galleryIndex - 1);
    if (event.key === 'ArrowRight') showImage(galleryIndex + 1);
  });
});