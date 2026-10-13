/* Native browser playback, adapted from skJack/-lip- fc02c1e, VLA episode 21. */
(() => {
  const stage = document.getElementById('stage');
  const slides = [...document.querySelectorAll('.slide')];
  const panel = document.getElementById('nav-panel');
  const nav = document.getElementById('nav-btn');
  const hud = document.getElementById('hud');
  let current = -1, counter = false, digits = '', timer;
  function toggleNav(force = !panel.classList.contains('open')) {
    panel.classList.toggle('open', force);
    nav.classList.toggle('open', force);
    document.getElementById('nb-list').setAttribute('aria-expanded', String(force));
  }
  function show(index) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, n) => {
      const on = n === index;
      slide.classList.toggle('active', on);
      slide.querySelectorAll('video').forEach(video => {
        if (on && index !== current) { video.currentTime = 0; video.play().catch(() => {}); }
        else if (!on) video.pause();
      });
    });
    current = index;
    history.replaceState(null, '', `#${index + 1}`);
    document.getElementById('nb-pg').textContent = `${index + 1} / ${slides.length}`;
    hud.textContent = counter ? `${index + 1} / ${slides.length}` : '← → 翻页 · F 全屏 · C 页码 · G 目录';
    panel.querySelectorAll('.it').forEach((item, n) => {
      item.classList.toggle('cur', n === index);
      item.setAttribute('aria-current', n === index ? 'page' : 'false');
    });
  }
  let lastSection;
  slides.forEach((slide, index) => {
    if (slide.dataset.sec !== lastSection) {
      const label = document.createElement('div'); label.className = 'sec-title';
      label.textContent = slide.dataset.sec; panel.append(label); lastSection = slide.dataset.sec;
    }
    const item = document.createElement('button'); item.type = 'button'; item.className = 'it'; item.dataset.k = index;
    const number = document.createElement('span'); number.className = 'k'; number.textContent = index + 1;
    const title = document.createElement('span'); title.textContent = slide.dataset.title;
    item.append(number, title); item.addEventListener('click', () => { show(index); toggleNav(false); }); panel.append(item);
  });
  document.getElementById('nb-list').addEventListener('click', () => toggleNav());
  document.getElementById('nb-prev').addEventListener('click', () => show(current - 1));
  document.getElementById('nb-next').addEventListener('click', () => show(current + 1));
  function fit() { stage.style.transform = `translate(-50%,-50%) scale(${Math.min(innerWidth / 1920, innerHeight / 1080)})`; }
  addEventListener('resize', fit);
  addEventListener('hashchange', () => { const n = Number(location.hash.slice(1)); if (Number.isInteger(n) && n > 0) show(n - 1); });
  addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,[contenteditable]')) return;
    if (event.target.closest('button,a') && [' ', 'Enter'].includes(event.key)) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(event.key)) { event.preventDefault(); show(current + 1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(event.key)) { event.preventDefault(); show(current - 1); }
    else if (event.key === 'Home') { event.preventDefault(); show(0); }
    else if (event.key === 'End') { event.preventDefault(); show(slides.length - 1); }
    else if (event.key === 'Escape') toggleNav(false);
    else if (event.key.toLowerCase() === 'g') toggleNav();
    else if (event.key.toLowerCase() === 'f') {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else document.documentElement.requestFullscreen().catch(() => {});
    } else if (event.key.toLowerCase() === 'c') { counter = !counter; hud.classList.toggle('show', counter); show(current); }
    else if (/^[0-9]$/.test(event.key)) {
      digits = (digits + event.key).slice(-String(slides.length).length); clearTimeout(timer);
      timer = setTimeout(() => { const n = Number(digits); if (n > 0 && n <= slides.length) show(n - 1); digits = ''; }, 500);
    }
  });
  addEventListener('click', event => {
    if (event.target.closest('a,button,video,#nav-panel,#nav-btn,#nav-hot')) return;
    if (panel.classList.contains('open')) { toggleNav(false); return; }
    show(current + (event.clientX / innerWidth < .2 ? -1 : 1));
  });
  fit();
  const initial = Number(location.hash.slice(1)); show(Number.isInteger(initial) && initial > 0 ? initial - 1 : 0);
  if (new URLSearchParams(location.search).get('nav') === '1') toggleNav(true);
  hud.classList.add('show'); setTimeout(() => { if (!counter) hud.classList.remove('show'); }, 4000);
})();
