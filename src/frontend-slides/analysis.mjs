/**
 * Scrolling review document, deliberately separate from the fixed-stage samples.
 * All original notes come from the PPTX inventory; review text is passed in.
 * No filesystem or network access is performed by this renderer.
 */
const REFERENCE = {
  template: 'https://github.com/zarazhangrui/beautiful-html-templates/blob/main/templates/blue-professional/template.html',
  skill: 'https://github.com/zarazhangrui/frontend-slides/blob/main/SKILL.md',
};
const SAMPLE_PAGES = new Map([[1, 1], [18, 2], [25, 3]]);
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const numberLabel = number => String(number).padStart(2, '0');
const imagePath = number => `assets/original-slides/slide-${numberLabel(number)}.png`;
const paragraphs = value => escapeHtml(value).replace(/\r?\n/g, '<br>');
const pageType = number => ({1:'封面',3:'目录 / 路线',39:'讨论 / 结尾'}[number] || '内容页');

function collectReviews(input, result = { rows: [], audits: [] }) {
  if (Array.isArray(input)) {
    input.forEach(item => collectReviews(item, result));
  } else if (input && typeof input === 'object') {
    if ('原页码' in input) result.rows.push(input);
    else {
      if (Array.isArray(input.numericAndObjectAudit)) result.audits.push(...input.numericAndObjectAudit);
      for (const [key, value] of Object.entries(input)) {
        if (key !== 'numericAndObjectAudit' && (Array.isArray(value) || (value && typeof value === 'object'))) collectReviews(value, result);
      }
    }
  }
  return result;
}

/**
 * @param {{deck: object, inventory: object, reviews: object|object[]}} input
 * @returns {string} A complete Chinese HTML review document.
 * `reviews` accepts [review01To20, review21To39] or their combined row array.
 */
export function renderAnalysis({ deck, inventory, reviews }) {
  if (!Array.isArray(deck?.slides) || !Array.isArray(inventory?.slides)) throw new TypeError('renderAnalysis requires deck.slides and inventory.slides.');
  const collected = collectReviews(reviews);
  const byPage = new Map();
  for (const row of collected.rows) {
    const number = Number(row['原页码']);
    if (byPage.has(number)) throw new Error(`Duplicate review for original page ${number}.`);
    byPage.set(number, row);
  }
  if (inventory.slides.length !== 39 || deck.slides.length !== 39 || byPage.size !== 39) throw new Error('The original review must contain exactly 39 pages.');
  const pages = inventory.slides.map((original, index) => {
    const number = original.number;
    const sourceReview = byPage.get(number);
    if (!sourceReview || typeof original.notes?.bodyText !== 'string') throw new Error(`Missing review or original notes for page ${number}.`);
    const review = { ...sourceReview, '建议版式': String(sourceReview['建议版式']).replaceAll('蓝白', '米黄＋蓝色') };
    if (number === 1) review['建议版式'] = '米黄＋蓝色专业封面：左侧主标题与副标题，右侧按完整比例保留原概念图，不裁切；受众与时长统一放页脚。';
    const content = deck.slides[index];
    return { number, original, content, review, section: content.section, sample: SAMPLE_PAGES.get(number), audits: collected.audits.filter(audit => audit.pages?.includes(number)) };
  });
  const summary = inventory.summary;
  const sections = [...new Set(pages.map(page => page.section))];
  const sectionCounts = sections.map(section => {
    const group = pages.filter(page => page.section === section);
    return { section, start: group[0].number, end: group.at(-1).number };
  });
  const textChanged = 0;
  const rowMarkup = pages.map(page => {
    const { number, review, section, sample } = page;
    return `<tr data-review-row data-page="${number}" data-section="${escapeHtml(section)}" data-sample="${sample ? 'true' : 'false'}">
      <th scope="row"><span class="page-number">${numberLabel(number)}</span><a class="thumbnail" href="${imagePath(number)}" data-lightbox="${number}" aria-label="放大原稿第 ${number} 页"><img src="${imagePath(number)}" alt="原稿第 ${number} 页实际 WPS 渲染" width="160" height="90" loading="lazy"></a>${sample ? `<span class="sample-label">样稿 ${sample}</span>` : ''}</th>
      <td class="title-cell"><span class="section-label">${escapeHtml(section)} · ${pageType(number)}</span><strong>${paragraphs(review['原页标题'])}</strong><a href="#detail-${numberLabel(number)}" class="detail-link" data-open-detail="${number}">核查与原备注 <span aria-hidden="true">↗</span></a></td>
      <td>${paragraphs(review['核心信息'])}</td>
      <td>${paragraphs(review['现有问题'])}</td>
      <td>${paragraphs(review['建议版式'])}</td>
      <td>${paragraphs(review['需要保留的元素'])}</td>
    </tr>`;
  }).join('\n');
  const detailMarkup = pages.map(page => {
    const { number, original, review, content, audits, section } = page;
    const tableCount = original.shapes.filter(shape => shape.table).length;
    const checkItems = [review['核查备注'] || `排版核查：${review['现有问题']}`, `保留核查：${review['需要保留的元素']}`, ...audits.map(audit => `${audit.kind}：${audit.result}`)].filter(Boolean);
    const originalChecks = checkItems.length ? `<ul class="audit-list">${checkItems.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul>` : `<p>该页的具体视觉检查、版式建议与保留项见上方逐页表格。原生对象与完整备注如下，可与原图对照。</p>`;
    return `<details class="page-detail" id="detail-${numberLabel(number)}" data-page-detail="${number}">
      <summary><span class="detail-number">${numberLabel(number)}</span><span>${paragraphs(review['原页标题'])}</span><span class="detail-section">${escapeHtml(section)}</span><span class="expand-mark" aria-hidden="true">＋</span></summary>
      <div class="detail-content"><div class="evidence-top"><a class="detail-image" href="${imagePath(number)}" data-lightbox="${number}" aria-label="放大原稿第 ${number} 页"><img src="${imagePath(number)}" alt="第 ${number} 页：${escapeHtml(review['原页标题'].replace(/\n/g, ''))}" loading="lazy" width="1600" height="900"></a><div class="audit-content"><p class="eyebrow">本页核查</p><p class="object-line">${tableCount} 个原生表格 · ${original.images.length} 个图片对象 · ${original.connectorsAndLines.length} 个线条 / 连接线对象</p>${originalChecks}${[1, 25, 26].includes(number) ? `<a href="#questions" class="question-link">${number === 1 ? '封面微小字迹' : '资金状态证据链'}列为待确认，原稿保持原样 →</a>` : ''}<p class="source-ids">资料编号：${escapeHtml((content.sourceIds || []).join(' · ') || '原稿未列资料编号')}</p></div></div>
      <div class="original-text"><h4>原页可见文字</h4><pre>${escapeHtml(original.allText)}</pre></div>
      <div class="original-notes"><div class="notes-heading"><h4>完整原备注与引用</h4><span>直接提取自 PPTX · 未删节</span></div><pre class="notes-body" data-notes-page="${number}">${escapeHtml(original.notes.bodyText)}</pre></div></div>
    </details>`;
  }).join('\n');
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>39 页原稿审阅 · AI、大语言模型与 Agent</title>
<style>
/* === Local reference palette and typography === */
@font-face{font-family:Noto Sans SC;src:url('assets/fonts/NotoSansSC.ttf') format('truetype');font-weight:100 900;font-display:swap}
@font-face{font-family:Space Grotesk;src:url('assets/fonts/SpaceGrotesk.ttf') format('truetype');font-weight:300 700;font-display:swap}
:root{--paper:#fdfae7;--blue:#1e2bfa;--ink:#111;--muted:#6b6b6b;--rule:#d7d4c3;--soft-blue:#eeefff;--white:#fffef7;--body:'Noto Sans SC','Microsoft YaHei',sans-serif;--display:'Space Grotesk','Noto Sans SC',sans-serif}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:96px}body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.7}a{color:var(--blue);text-underline-offset:4px}button,input,select{font:inherit}button,a,input,select,summary{touch-action:manipulation}button{cursor:pointer}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid var(--blue);outline-offset:4px}[hidden]{display:none!important}img{max-width:100%;height:auto}h1,h2,h3,h4,p{margin-top:0}h1,h2,h3,h4{line-height:1.4}::selection{background:var(--blue);color:white}
.skip-link{position:fixed;top:-80px;left:20px;z-index:100;background:var(--blue);color:#fff;padding:10px 18px}.skip-link:focus{top:12px}.wrap{width:min(1560px,calc(100% - 96px));margin-inline:auto}
/* === Document navigation === */
.site-header{border-bottom:1px solid var(--rule);position:sticky;top:0;z-index:20;background:var(--paper)}.nav-inner{min-height:70px;display:flex;align-items:center;justify-content:space-between;gap:28px}.brand{color:var(--ink);text-decoration:none;font-size:14px;font-weight:700;display:flex;align-items:center;gap:13px}.brand-mark{display:inline-grid;place-items:center;width:31px;height:31px;background:var(--blue);color:white;font:600 13px var(--display)}.nav-links{display:flex;align-items:center;gap:28px;font-size:13px}.nav-links a{color:var(--ink);text-decoration:none}.nav-links a:hover{color:var(--blue)}.nav-links .sample-nav{padding:8px 17px;border:1px solid var(--blue);color:var(--blue)}
/* === Opening spread and scope === */
.hero{padding:69px 0 40px;display:grid;grid-template-columns:minmax(0,1fr) 345px;gap:68px;align-items:end}.eyebrow{font:600 12px var(--display);letter-spacing:.13em;text-transform:uppercase;color:var(--blue);margin-bottom:18px}.hero h1{font-size:clamp(38px,4vw,65px);font-weight:650;letter-spacing:-.035em;line-height:1.18;margin:0 0 24px}.hero h1 em{font-style:normal;color:var(--blue)}.hero-lead{max-width:800px;font-size:17px;line-height:1.9;margin-bottom:0}.hero-index{border-top:5px solid var(--blue);padding-top:15px}.index-number{font:500 92px/1 var(--display);letter-spacing:-.075em;color:var(--blue)}.index-number small{font:500 14px var(--body);letter-spacing:0;margin-left:15px;color:var(--ink)}.index-caption{font-size:13px;color:var(--muted);margin:14px 0 0}.facts{display:grid;grid-template-columns:repeat(4,1fr);border-block:1px solid var(--rule);margin:0}.facts div{padding:21px 25px 23px;border-left:1px solid var(--rule)}.facts div:first-child{padding-left:0;border-left:0}.facts dt{font-size:12px;color:var(--muted)}.facts dd{margin:4px 0 0;font-weight:600;font-size:18px}.facts strong{font-family:var(--display);font-size:25px;color:var(--blue)}.scope-note{font-size:14px;max-width:1100px;margin:22px 0 0;line-height:1.9}.section{padding-block:52px;border-bottom:1px solid var(--rule)}.section-heading{display:flex;align-items:baseline;justify-content:space-between;gap:30px;margin-bottom:20px}.section-heading h2{font-weight:600;font-size:27px;letter-spacing:-.03em;margin:0}.section-heading p{font-size:13px;color:var(--muted);margin:0}.chapter-list{display:flex;flex-wrap:wrap;list-style:none;margin:0;padding:0;gap:10px}.chapter-list li{display:flex;align-items:baseline;gap:10px;font-size:13px;padding:7px 13px;border:1px solid var(--rule)}.chapter-list span{font:500 12px var(--display);color:var(--blue)}
/* === Three original-to-sample correspondences === */
.samples-intro{margin-bottom:25px;font-size:14px}.sample-map{display:grid;grid-template-columns:repeat(3,1fr);gap:30px}.sample-item{border-top:2px solid var(--blue);padding-top:15px}.sample-meta{display:flex;justify-content:space-between;color:var(--blue);font-size:12px;margin-bottom:10px}.sample-item h3{font-weight:600;font-size:20px;min-height:56px;margin:0 0 15px}.sample-item .sample-original{display:block;overflow:hidden;border:1px solid var(--rule);background:var(--white);aspect-ratio:16/9}.sample-item img{display:block;width:100%;height:100%;object-fit:contain}.sample-item p{font-size:13px;color:var(--muted);margin:12px 0 0}.sample-action{display:flex;align-items:center;gap:20px;margin-top:27px}.primary-button{display:inline-block;background:var(--blue);color:#fff;padding:12px 24px;text-decoration:none;font-size:14px;font-weight:600;border:1px solid var(--blue)}.sample-action span{font-size:12px;color:var(--muted)}
/* === Review controls and six-column comparison === */
.review-section{padding-bottom:32px}.review-caption{font-size:14px;max-width:1150px;margin-bottom:20px}.review-tools{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:16px 0 22px}.search-label{flex:1;min-width:220px;position:relative}.search-label>span{position:absolute;left:15px;top:10px;font-size:13px;color:var(--muted)}.search-label input{width:100%;padding:10px 14px 10px 59px;background:var(--white);border:1px solid var(--rule);font-size:13px;color:var(--ink);border-radius:0}.review-tools select{height:44px;background:var(--white);border:1px solid var(--rule);font-size:13px;padding:0 30px 0 13px;border-radius:0;max-width:230px}.filter-button{height:44px;border:1px solid var(--blue);color:var(--blue);background:transparent;padding:0 14px;font-size:13px}.filter-button[aria-pressed=true]{background:var(--blue);color:white}.result-count{font-size:12px;color:var(--muted);min-width:90px;text-align:right;font-variant-numeric:tabular-nums}.table-viewport{overflow:auto;border:1px solid var(--rule);background:var(--white)}.review-table{width:100%;min-width:1260px;border-collapse:collapse;table-layout:fixed;font-size:13px;line-height:1.85}.review-table col:nth-child(1){width:9%}.review-table col:nth-child(2){width:14%}.review-table col:nth-child(3){width:17%}.review-table col:nth-child(4){width:20%}.review-table col:nth-child(5){width:20%}.review-table col:nth-child(6){width:20%}.review-table thead th{background:var(--blue);color:#fff;font-size:12px;font-weight:600;text-align:left;padding:14px 16px;white-space:nowrap}.review-table td,.review-table tbody th{vertical-align:top;padding:22px 16px;border-bottom:1px solid var(--rule);border-right:1px solid #e9e6d7;overflow-wrap:anywhere}.review-table tbody tr:last-child>*{border-bottom:0}.review-table td:last-child{border-right:0}.review-table tbody th{text-align:left;font-weight:400}.review-table tr[data-sample=true]{background:#f3f3ff}.review-table tbody tr:hover{background:#eeefff}.page-number{display:block;font:600 23px/1.2 var(--display);color:var(--blue);margin-bottom:12px}.thumbnail{display:block;line-height:0;border:1px solid var(--rule);background:var(--paper)}.thumbnail img{width:100%;display:block}.sample-label{display:inline-block;font-size:10px;font-weight:600;color:var(--blue);margin-top:9px;border-bottom:1px solid var(--blue)}.title-cell strong{display:block;font-size:15px;line-height:1.7;font-weight:600}.section-label{display:block;font-size:10px;letter-spacing:.03em;color:var(--muted);margin-bottom:8px}.detail-link{display:inline-block;font-size:11px;margin-top:13px;text-decoration:none;border-bottom:1px solid #c2c6ff}.empty-state{text-align:center;font-size:14px;padding:30px;margin:0;background:var(--white)}.table-help{font-size:12px;color:var(--muted);margin:13px 0 0}
/* === Review evidence and unchanged source notes === */
.evidence-intro{max-width:1000px;font-size:14px;margin-bottom:24px}.page-detail{border-top:1px solid var(--rule);scroll-margin-top:94px}.page-detail:last-child{border-bottom:1px solid var(--rule)}.page-detail>summary{display:grid;grid-template-columns:55px 1fr 150px 26px;align-items:center;gap:15px;padding:20px 2px;cursor:pointer;list-style:none;font-size:16px;font-weight:500}.page-detail>summary::-webkit-details-marker{display:none}.detail-number{font:600 20px var(--display);color:var(--blue)}.detail-section{color:var(--muted);font-size:12px;font-weight:400;text-align:right}.expand-mark{color:var(--blue);font-size:21px;text-align:right}.page-detail[open]>summary .expand-mark{transform:rotate(45deg)}.page-detail[open]>summary{color:var(--blue)}.detail-content{padding:4px 0 34px}.evidence-top{display:grid;grid-template-columns:1fr 1fr;gap:34px}.detail-image{align-self:start;display:block;background:var(--white);border:1px solid var(--rule);line-height:0}.detail-image img{display:block;width:100%}.audit-content{font-size:13px;line-height:1.9}.audit-content .eyebrow{margin-bottom:9px}.object-line{font-size:12px;color:var(--muted);margin-bottom:15px}.audit-list{padding-left:18px;margin:0 0 17px}.audit-list li+li{margin-top:8px}.question-link{font-size:12px}.source-ids{font:12px/1.8 var(--display);color:var(--muted);margin-top:17px;overflow-wrap:anywhere}.original-text,.original-notes{margin-top:25px;border-top:1px solid var(--rule);padding-top:18px}.original-text h4,.original-notes h4{font-size:14px;margin-bottom:12px;font-weight:600}.original-text pre,.notes-body{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.95 var(--body);margin:0}.original-text pre{color:var(--muted);columns:2;column-gap:40px}.notes-heading{display:flex;align-items:baseline;justify-content:space-between;gap:20px}.notes-heading span{font-size:11px;color:var(--muted)}.notes-body{background:var(--white);border-left:3px solid var(--blue);padding:22px 27px;tab-size:2}
/* === Questions and reference ledger === */
.questions-grid{display:grid;grid-template-columns:1fr 1fr;gap:35px}.question{border-top:2px solid var(--blue);padding:18px 0 0}.question .question-meta{font-size:11px;color:var(--blue);margin:0 0 9px}.question h3{font-size:18px;font-weight:600;margin-bottom:12px}.question p{font-size:14px;line-height:1.9;margin-bottom:0}.resolved-scope{font-size:13px;color:var(--muted);margin:24px 0 0}.reference-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px}.reference-grid h3{font-size:16px;font-weight:600}.reference-grid p,.reference-grid li{font-size:13px;line-height:1.9}.reference-grid ul{padding-left:18px}.reference-grid li+li{margin-top:8px}.file-path{font-family:var(--display);overflow-wrap:anywhere}.palette{display:flex;gap:16px;flex-wrap:wrap;margin:18px 0}.swatch{font:11px var(--display);display:flex;align-items:center;gap:8px}.swatch i{width:20px;height:20px;display:block;border:1px solid #bbb}.provenance{font-size:11px;color:var(--muted);margin-bottom:0;overflow-wrap:anywhere}.footer{padding:27px 0 38px;display:flex;justify-content:space-between;gap:20px;font-size:11px;color:var(--muted)}
/* === Full-size original-slide viewer === */
.image-dialog{border:0;padding:0;background:var(--paper);color:var(--ink);max-width:min(96vw,1680px);max-height:96vh;width:1600px;box-shadow:0 20px 100px #0005}.image-dialog::backdrop{background:#0c1025cc}.dialog-toolbar{display:flex;justify-content:space-between;align-items:center;padding:12px 18px;gap:20px;border-bottom:1px solid var(--rule)}.dialog-toolbar strong{font-size:13px;font-weight:500}.dialog-controls{display:flex;gap:8px;flex-shrink:0}.dialog-controls button{border:1px solid var(--rule);color:var(--ink);background:transparent;padding:5px 12px;font-size:12px}.dialog-controls .close-dialog{background:var(--blue);color:#fff;border-color:var(--blue)}.dialog-image-wrap{overflow:auto;max-height:calc(96vh - 60px);background:#101729}.dialog-image-wrap img{display:block;width:100%;height:auto}.dialog-hint{font-size:11px;color:var(--muted)}
/* === Responsive reading, reduced motion and printing === */
@media(max-width:1100px){.wrap{width:calc(100% - 48px)}.hero{grid-template-columns:1fr 230px;gap:30px}.hero-index .index-number{font-size:75px}.nav-links{gap:18px}.sample-map{gap:20px}.sample-item h3{font-size:17px}.evidence-top{grid-template-columns:1fr}.detail-image{max-width:850px}.reference-grid{gap:30px}}
@media(max-width:720px){html{scroll-padding-top:124px}.wrap{width:calc(100% - 32px)}.nav-inner{align-items:flex-start;gap:12px;flex-direction:column;padding-block:12px}.nav-links{gap:18px;width:100%;justify-content:space-between;font-size:11px}.nav-links .sample-nav{padding:4px 9px}.brand{font-size:12px}.brand-mark{width:24px;height:24px}.hero{padding-top:38px;grid-template-columns:1fr;gap:25px}.hero h1{font-size:39px}.hero-lead{font-size:15px}.hero-index{display:flex;align-items:center;gap:25px}.hero-index .index-number{font-size:62px;white-space:nowrap}.index-caption{margin:0;font-size:12px}.facts{grid-template-columns:1fr 1fr}.facts div{padding:15px!important}.facts div:nth-child(odd){border-left:0}.facts div:nth-child(-n+2){border-bottom:1px solid var(--rule)}.facts dd{font-size:15px}.facts strong{font-size:22px}.section{padding-block:35px}.section-heading{display:block}.section-heading h2{font-size:24px}.section-heading p{margin-top:8px}.sample-map,.questions-grid,.reference-grid{grid-template-columns:1fr}.sample-map{gap:27px}.sample-item{display:grid;grid-template-columns:1fr 42%;gap:10px 20px}.sample-item .sample-meta{grid-column:1/-1;margin:0}.sample-item h3{min-height:0;margin:0;grid-column:1;grid-row:2;align-self:start;font-size:18px}.sample-item .sample-original{grid-column:2;grid-row:2/4}.sample-item p{grid-column:1;grid-row:3;margin:0;font-size:12px}.sample-action{align-items:flex-start;flex-direction:column;gap:12px}.search-label{flex-basis:100%}.review-tools select{max-width:none;flex:1}.result-count{text-align:left}.page-detail>summary{grid-template-columns:30px 1fr 20px;gap:10px;font-size:14px}.detail-section{display:none}.detail-number{font-size:18px}.original-text pre{columns:1}.notes-heading{display:block}.notes-heading span{display:block;margin-bottom:10px}.notes-body{padding:17px;font-size:12px}.footer{flex-direction:column;gap:6px}.dialog-toolbar{align-items:flex-start;flex-direction:column;gap:10px}.dialog-hint{display:none}.dialog-image-wrap{max-height:calc(96vh - 105px)}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{animation:none!important;transition:none!important}}
@media print{.site-header,.review-tools,.detail-link,.image-dialog,.sample-action,.skip-link{display:none!important}.wrap{width:100%}.hero{padding-top:0;grid-template-columns:1fr 220px}.hero h1{font-size:35px}.section{padding-block:25px}.table-viewport{overflow:visible;border:0}.review-table{min-width:0;font-size:8px}.review-table thead th{font-size:9px}.review-table td,.review-table tbody th{padding:8px 6px}.title-cell strong{font-size:10px}.page-number{font-size:16px}.sample-label,.section-label{font-size:8px}.review-table tr{break-inside:avoid}.page-detail{break-inside:avoid}.page-detail:not([open]){display:none}.reference-grid{gap:20px}a{color:inherit}.footer{padding-bottom:0}}
</style>
</head>
<body>
<a class="skip-link" href="#review">跳转到逐页分析</a>
<header class="site-header"><div class="wrap nav-inner"><a class="brand" href="#top"><span class="brand-mark">AI</span>AI、大语言模型与 Agent</a><nav class="nav-links" aria-label="审阅页面导航"><a href="#overview">原稿概况</a><a href="#review">39 页分析</a><a href="#questions">待确认</a><a href="samples.html" class="sample-nav">查看 3 页样稿 ↗</a></nav></div></header>
<main id="top" class="wrap">
<section id="overview" aria-labelledby="page-title">
<div class="hero"><div><p class="eyebrow">ORIGINAL DECK REVIEW · 2026.10.13</p><h1 id="page-title">先看清原稿，<br><em>再确定改版方向。</em></h1><p class="hero-lead">AI、大语言模型与 Agent · 50 分钟内部分享。逐页对照原始 PPTX 与实际 WPS 渲染，记录内容、排版和保留项，为老板与技术同事保持同一条清晰的讲述路径。</p></div><div class="hero-index"><div class="index-number">39<small>页已逐页检查</small></div><p class="index-caption">可放大原图 · 可查看核查详情<br>完整原备注与引用逐页保留</p></div></div>
<dl class="facts"><div><dt>原生内容对象</dt><dd><strong>${summary.nativeTableCount}</strong> 个表格 / <strong>${summary.imageObjectCount}</strong> 个图片</dd></div><div><dt>源文件结构</dt><dd><strong>${summary.hiddenSlideCount}</strong> 隐藏页 / <strong>${summary.nativeSectionCount}</strong> 原生节</dd></div><div><dt>本轮交付范围</dt><dd>整套分析 + <strong>3</strong> 页样稿</dd></div><div><dt>样稿内容文字变化</dt><dd><strong>${textChanged}</strong> 处</dd></div></dl>
<p class="scope-note">检查覆盖 39 页标题、正文、数字与单位、公式、代码、图例与箭头、图片文字及讲者备注。原稿没有隐藏页或 PowerPoint 原生章节（sections）；保留现有逻辑章节与页序。本轮仅做分析和 3 页样稿，不进行整套批量改版；样稿只允许可见换行与版面重组，正文、标题、数据和教学边界保持原样。</p>
</section>
<section class="section" aria-labelledby="chapters-heading"><div class="section-heading"><h2 id="chapters-heading">原有讲述顺序，完整保留</h2><p>逻辑章节来自内容文件；与 PPTX 原生节区分</p></div><ol class="chapter-list">${sectionCounts.map(group => `<li>${escapeHtml(group.section)}<span>${numberLabel(group.start)}${group.start === group.end ? '' : `–${numberLabel(group.end)}`}</span></li>`).join('')}</ol><p class="scope-note">页型识别：第 1 页为封面，第 3 页为目录 / 路线，第 39 页为讨论 / 结尾；其余 36 页为内容页。原稿没有独立的纯章节分隔页或附录页。</p></section>
<section id="samples" class="section" aria-labelledby="samples-heading"><div class="section-heading"><h2 id="samples-heading">用 3 页检验同一套设计</h2><p>Blue Professional · 米黄底、鲜蓝色与清晰层级</p></div><p class="samples-intro">分别检验封面、技术流程与业务证据表。下方是对应的原稿缩略图；点击可放大，与独立样稿页面对照。</p><div class="sample-map">${[1,18,25].map((number,index) => {const page=pages[number-1];return `<article class="sample-item"><div class="sample-meta"><span>原稿 ${numberLabel(number)} → 样稿 ${index+1}</span><span>${['封面','技术流程','业务证据'][index]}</span></div><h3>${paragraphs(page.review['原页标题'])}</h3><a class="sample-original" href="${imagePath(number)}" data-lightbox="${number}" aria-label="放大原稿第 ${number} 页"><img src="${imagePath(number)}" alt="样稿 ${index+1} 对应的第 ${number} 页原稿" width="1600" height="900" loading="lazy"></a><p>${['保留原图概念与完整标题，检验开场的视觉层级。','保留 RAG 四步原文，检验技术解释的阅读顺序。','保留标题“订单处理：每一步都留有证据”及完整三列表格。'][index]}</p></article>`;}).join('')}</div><div class="sample-action"><a class="primary-button" href="samples.html">打开 3 页样稿 <span aria-hidden="true">↗</span></a><span>此页用于滚动审阅；样稿在独立演示页面中查看。</span></div></section>
<section id="review" class="section review-section" aria-labelledby="review-heading"><div class="section-heading"><h2 id="review-heading">逐页分析</h2><p>39 / 39 页 · 六列记录 · 保持原页对应</p></div><p class="review-caption">“现有问题”区分实际排版问题与可提升之处。没有发现截断或重叠的页面，按实际结果记录；版式建议不意味着原稿已经存在相应图形、箭头或数据。</p><div class="review-tools"><label class="search-label"><span>搜索</span><input id="review-search" type="search" placeholder="页码、标题或核查关键词" aria-label="按页码、标题或关键词搜索原稿分析" autocomplete="off"></label><select id="section-filter" aria-label="按逻辑章节筛选"><option value="">全部章节</option>${sections.map(section=>`<option value="${escapeHtml(section)}">${escapeHtml(section)}</option>`).join('')}</select><button class="filter-button" id="sample-filter" type="button" aria-pressed="false">仅看 3 页样稿</button><span class="result-count" id="result-count" role="status" aria-live="polite">显示 39 / 39 页</span></div><div class="table-viewport" tabindex="0" role="region" aria-label="39 页原稿六列分析表，可横向滚动"><table class="review-table"><colgroup><col><col><col><col><col><col></colgroup><thead><tr><th scope="col">原页码</th><th scope="col">原页标题</th><th scope="col">核心信息</th><th scope="col">现有问题</th><th scope="col">建议版式</th><th scope="col">需要保留的元素</th></tr></thead><tbody>${rowMarkup}</tbody></table><p id="empty-state" class="empty-state" hidden>没有匹配的页面。请调整关键词或章节。</p></div><p class="table-help">点击原图放大；点击“核查与原备注”展开对应页详情。窄屏可左右滚动表格。</p></section>
<section id="evidence" class="section" aria-labelledby="evidence-heading"><div class="section-heading"><h2 id="evidence-heading">原图、核查依据与完整备注</h2><p>39 份原备注 · 共 ${summary.notesBodyCharacterCount.toLocaleString('en-US')} 字符</p></div><p class="evidence-intro">原图为实际 WPS 渲染；可见文字、对象和备注直接提取自原 PPTX。下列备注包括原讲稿、教学示例说明、视频定位和完整资料引用，按原文逐字保留。</p>${detailMarkup}</section>
<section id="questions" class="section" aria-labelledby="questions-heading"><div class="section-heading"><h2 id="questions-heading">两项待确认，原稿保持原样</h2><p>记录疑问，不据此改写内容</p></div><div class="questions-grid"><article class="question"><p class="question-meta">原稿 01 · 图片微小文字</p><h3>封面纸面上的细小字迹</h3><p>实际渲染中无法可靠辨认。它属于概念插画的装饰性细节，本轮不转录、不补写，也不把它作为教学内容的依据；保留原图与原备注中的 AI 生成概念插画说明。</p></article><article class="question"><p class="question-meta">原稿 25–26 · 教学证据链</p><h3>“补偿尚未到账”的已知依据</h3><p>第 26 页的资金状态是否属于独立的虚构已知条件，仍待确认。第 25 页展示审批与工单创建结果，单凭这些结果不能独立推出资金尚未到账。本轮仅列问题，不补充或更改原稿中的业务状态。</p></article></div><p class="resolved-scope">上述为待确认事项，并非已确认事实错误。现稿其余内容未发现准确可证的事实错误；逐页记录的具体问题以排版、可读性及信息层级为主。</p></section>
<section id="references" class="section" aria-labelledby="references-heading"><div class="section-heading"><h2 id="references-heading">参考与交付范围</h2><p>公开参考已本地化 · 页面运行不依赖外部服务</p></div><div class="reference-grid"><div><h3>Blue Professional 视觉参考</h3><p>参考 <a href="${REFERENCE.template}" target="_blank" rel="noreferrer">beautiful-html-templates / Blue Professional 原始模板</a> 的米黄背景、鲜蓝主色与简洁层级，并按中文长文本和逐页审阅需求本地化。</p><div class="palette"><span class="swatch"><i style="background:#fdfae7"></i>#FDFAE7</span><span class="swatch"><i style="background:#1e2bfa;border-color:#1e2bfa"></i>#1E2BFA</span><span class="swatch"><i style="background:#111;border-color:#111"></i>#111111</span><span class="swatch"><i style="background:#6b6b6b;border-color:#6b6b6b"></i>#6B6B6B</span></div><p>制作方式参考 <a href="${REFERENCE.skill}" target="_blank" rel="noreferrer">frontend-slides / SKILL.md</a>。演示样稿采用独立页面；本分析页按阅读用途保持可滚动。字体、原稿图片、样式与脚本均使用本地资源。</p><p class="provenance">核验日期：2026-10-13<br>本地参考：.cache/beautiful-html-templates-reference/templates/blue-professional/template.html<br>.cache/frontend-slides-reference/SKILL.md</p></div><div><h3>本轮保留与对应规则</h3><ul><li>原稿 39 页与逻辑章节不增删、不调序。</li><li>本轮只交付分析及 3 页样稿，样稿映射为 01 → 1、18 → 2、25 → 3。</li><li>内容文字变化为 0；仅允许可见换行与版面重组。</li><li>样稿 3 标题原样保留：订单处理：每一步都留有证据。</li><li>保留 8 个原生表格、2 个图片对象的内容信息与逐页引用；3 页样稿之外的页面仅提出建议。</li></ul><p class="provenance">原稿：${escapeHtml(inventory.source.path)}<br>提取依据：原始 PPTX 包结构 + 实际 WPS 逐页渲染<br>源文件 SHA-256：<span class="file-path">${escapeHtml(inventory.source.sha256)}</span></p></div></div></section>
</main><footer class="wrap footer"><span>AI、大语言模型与 Agent · 原稿审阅与样稿方向</span><span>39 页分析 / 3 页样稿 / 内容文字变化 0</span></footer>
<dialog class="image-dialog" id="image-viewer" aria-labelledby="viewer-title"><div class="dialog-toolbar"><strong id="viewer-title">原稿预览</strong><span class="dialog-hint">可用 ← → 切换原页，Esc 关闭</span><div class="dialog-controls"><button id="previous-image" type="button" aria-label="上一页原稿">← 上一页</button><button id="next-image" type="button" aria-label="下一页原稿">下一页 →</button><button id="close-viewer" class="close-dialog" type="button">关闭</button></div></div><div class="dialog-image-wrap"><img id="viewer-image" alt="原稿大图" width="1600" height="900"></div></dialog>
<script>
/* === Progressive enhancement: filtering, source details, original-image viewer === */
(() => {
  const rows = [...document.querySelectorAll('[data-review-row]')];
  const query = document.getElementById('review-search');
  const section = document.getElementById('section-filter');
  const sample = document.getElementById('sample-filter');
  const count = document.getElementById('result-count');
  const detailByPage = new Map([...document.querySelectorAll('[data-page-detail]')].map(item => [item.dataset.pageDetail, item]));
  function filterRows() {
    const term = query.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const row of rows) {
      const matchesNumber = /^0?\\d{1,2}$/.test(term) && Number(row.dataset.page) === Number(term);
      const textMatch = !term || (/^0?\\d{1,2}$/.test(term) ? matchesNumber : row.textContent.toLocaleLowerCase().includes(term));
      const matches = textMatch && (!section.value || row.dataset.section === section.value) && (sample.getAttribute('aria-pressed') !== 'true' || row.dataset.sample === 'true');
      row.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = '显示 ' + visible + ' / 39 页';
    document.getElementById('empty-state').hidden = visible !== 0;
  }
  query.addEventListener('input', filterRows);
  section.addEventListener('change', filterRows);
  sample.addEventListener('click', () => {sample.setAttribute('aria-pressed', sample.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');filterRows();});
  document.querySelectorAll('[data-open-detail]').forEach(link => link.addEventListener('click', () => { const detail = detailByPage.get(link.dataset.openDetail); if (detail) detail.open = true; }));
  function revealLinkedDetail() { if (/^#detail-\\d+$/.test(location.hash)) { const detail = document.getElementById(location.hash.slice(1)); if (detail) detail.open = true; } }
  window.addEventListener('hashchange', revealLinkedDetail); revealLinkedDetail();
  const dialog = document.getElementById('image-viewer');
  const viewerImage = document.getElementById('viewer-image');
  const viewerTitle = document.getElementById('viewer-title');
  let currentPage = 1;
  function showImage(page) {
    currentPage = Math.max(1, Math.min(39, page));
    const row = rows.find(item => Number(item.dataset.page) === currentPage);
    const title = row.querySelector('.title-cell strong').textContent;
    viewerImage.src = 'assets/original-slides/slide-' + String(currentPage).padStart(2, '0') + '.png';
    viewerImage.alt = '原稿第 ' + currentPage + ' 页：' + title;
    viewerTitle.textContent = '原稿 ' + String(currentPage).padStart(2, '0') + ' / 39 · ' + title;
    document.getElementById('previous-image').disabled = currentPage === 1;
    document.getElementById('next-image').disabled = currentPage === 39;
  }
  document.querySelectorAll('[data-lightbox]').forEach(link => link.addEventListener('click', event => {
    if (typeof dialog.showModal !== 'function') return;
    event.preventDefault();showImage(Number(link.dataset.lightbox));dialog.showModal();
  }));
  document.getElementById('close-viewer').addEventListener('click', () => dialog.close());
  document.getElementById('previous-image').addEventListener('click', () => showImage(currentPage - 1));
  document.getElementById('next-image').addEventListener('click', () => showImage(currentPage + 1));
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
  dialog.addEventListener('keydown', event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {event.preventDefault();showImage(currentPage + (event.key === 'ArrowLeft' ? -1 : 1));} });
})();
</script>
</body>
</html>`;
}
