const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// This page owns the visible notes. The audience window only sends slide state.
export function renderPresenter(title, notes) {
  const data = JSON.stringify(notes).replace(/[<>&\u2028\u2029]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>讲者视图 · ${escapeHtml(title)}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#eef2f6;color:#10243d;font-family:Arial,"Microsoft YaHei",sans-serif;line-height:1.6}main{max-width:1180px;margin:auto;padding:26px 32px}header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;border-bottom:1px solid #cbd5e1;padding-bottom:18px}.eyebrow{margin:0;color:#52647b;font-size:14px}h1{font-size:22px;margin:2px 0 8px}.status{margin:0;color:#52647b;font-size:15px}.status[data-connected="true"]{color:#147559}.privacy{max-width:350px;font-size:14px;color:#52647b;margin:0}.toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:22px 0}button,select{font:inherit;font-size:16px;border:1px solid #bcc9da;border-radius:8px;padding:9px 14px;background:#fff;color:#10243d}button{cursor:pointer}button:hover:not(:disabled){border-color:#2457f5;color:#2457f5}button:disabled,select:disabled{opacity:.45;cursor:default}button:focus-visible,select:focus-visible{outline:3px solid #2457f5;outline-offset:3px}#presenter-page{font-size:18px;font-variant-numeric:tabular-nums;min-width:78px;text-align:center}.jump{margin-left:auto;display:flex;align-items:center;gap:10px}select{max-width:390px}.note-card{background:#fff;border-radius:12px;border:1px solid #dbe3ed;padding:28px 32px}h2{font-size:30px;line-height:1.4;margin:0 0 8px}#presenter-timing{font-size:15px;color:#52647b;margin:0 0 24px}#presenter-notes{font-size:23px;line-height:1.85;overflow-wrap:anywhere}#presenter-notes p{margin:0 0 1em}#presenter-notes p:last-child{margin:0}.next-slide{margin:22px 0;color:#52647b;font-size:17px}details{margin:24px 0 0;border-top:1px solid #dbe3ed;padding-top:18px;font-size:15px;color:#52647b}summary{cursor:pointer}li{margin:10px 0;overflow-wrap:anywhere}a{color:#2457f5}.keys{font-size:14px;color:#52647b;margin:18px 0} @media(max-width:720px){main{padding:18px}header{display:block}.privacy{max-width:none;margin-top:12px}.jump{width:100%;margin-left:0}select{max-width:calc(100vw - 110px)}.note-card{padding:20px}#presenter-notes{font-size:20px}h2{font-size:26px}}
</style></head><body><main>
<header><div><p class="eyebrow">讲者视图</p><h1>${escapeHtml(title)}</h1><p id="presenter-status" class="status" role="status" data-connected="false">请从 deck.html 按 P 打开讲者窗口。</p></div><p class="privacy">将观众窗口放到扩展屏幕或只共享该窗口；本窗口留在自己的屏幕。复制屏幕或共享整个桌面会显示讲稿。</p></header>
<nav class="toolbar" aria-label="演讲控制"><button type="button" id="presenter-prev" disabled>← 上一页</button><strong id="presenter-page" aria-live="polite">— / ${notes.length}</strong><button type="button" id="presenter-next" disabled>下一页 →</button><label class="jump">跳至 <select id="presenter-jump" disabled aria-label="跳至页面"></select></label></nav>
<section class="note-card"><h2 id="presenter-title">等待观众窗口连接</h2><p id="presenter-timing"></p><div id="presenter-notes"></div><details><summary>本页来源</summary><ul id="presenter-sources"></ul></details></section>
<p class="next-slide">下一页：<span id="presenter-up-next">—</span></p><p class="keys">方向键、空格翻页；Home / End 跳到首尾。观众窗口与讲者窗口双向同步。</p>
</main><script type="application/json" id="presenter-data">${data}</script><script>
(() => {
  const slides = JSON.parse(document.getElementById('presenter-data').textContent);
  const audience = window.opener;
  const channel = location.hash.slice(1);
  const status = document.getElementById('presenter-status');
  const previous = document.getElementById('presenter-prev');
  const next = document.getElementById('presenter-next');
  const jump = document.getElementById('presenter-jump');
  let current = -1, connected = false, lastState = 0;
  slides.forEach((slide, index) => {
    const option = document.createElement('option'); option.value = index;
    option.textContent = (index + 1) + '. ' + slide.title.replace(/\\n/g, ' '); jump.append(option);
  });
  function connection(on, text) {
    connected = on; status.dataset.connected = String(on); status.textContent = text;
    previous.disabled = !on || current <= 0; next.disabled = !on || current >= slides.length - 1; jump.disabled = !on;
  }
  function send(message) { if (audience && !audience.closed && channel) audience.postMessage({ ...message, channel }, '*'); }
  function command(action, index) { if (connected) send({ type: 'lip-presenter-command', action, index }); }
  function render(index) {
    if (current === index) return;
    current = index;
    const slide = slides[index];
    document.getElementById('presenter-page').textContent = (index + 1) + ' / ' + slides.length;
    document.getElementById('presenter-title').textContent = slide.title.replace(/\\n/g, ' ');
    document.getElementById('presenter-timing').textContent = slide.timingSeconds ? '本页建议讲解 ' + slide.timingSeconds + ' 秒' : '';
    const paragraphs = slide.notes.map(note => { const p = document.createElement('p'); p.textContent = note; return p; });
    document.getElementById('presenter-notes').replaceChildren(...paragraphs);
    const sources = slide.sources.map(source => {
      const item = document.createElement('li'); const link = document.createElement('a');
      link.textContent = source.title; link.href = /^https?:\\/\\//.test(source.url) ? source.url : '#'; link.target = '_blank'; link.rel = 'noopener noreferrer';
      item.append(link, ' · ' + source.publisher + ' · 核验 ' + source.verifiedOn); return item;
    });
    document.getElementById('presenter-sources').replaceChildren(...sources);
    document.getElementById('presenter-up-next').textContent = slides[index + 1]?.title.replace(/\\n/g, ' ') || '已是最后一页';
    jump.value = index; window.scrollTo(0, 0);
  }
  addEventListener('message', event => {
    const message = event.data;
    if (!audience || event.source !== audience || !message || message.channel !== channel || message.type !== 'lip-presenter-state') return;
    if (!Number.isInteger(message.index) || message.index < 0 || message.index >= slides.length || message.count !== slides.length) return;
    lastState = Date.now(); render(message.index); connection(true, '已连接 · 与观众窗口同步');
  });
  previous.addEventListener('click', () => command('previous'));
  next.addEventListener('click', () => command('next'));
  jump.addEventListener('change', () => command('jump', Number(jump.value)));
  addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable]')) return;
    if (event.target.closest('button,a,summary') && [' ', 'Enter'].includes(event.key)) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); command('next'); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) { event.preventDefault(); command('previous'); }
    else if (event.key === 'Home') { event.preventDefault(); command('jump', 0); }
    else if (event.key === 'End') { event.preventDefault(); command('jump', slides.length - 1); }
  });
  function checkConnection() {
    if (!audience || audience.closed || !channel) { connection(false, '未连接。请从 deck.html 按 P 打开讲者窗口。'); return; }
    if (lastState && Date.now() - lastState > 3500) connection(false, '连接已中断，请回到观众窗口按 P 重新打开。');
    send({ type: 'lip-presenter-ready' });
  }
  checkConnection(); setInterval(checkConnection, 1000);
})();
</script></body></html>`;
}
