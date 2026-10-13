import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('../.cache/browser-tools/node_modules/playwright-core');
const out=path.resolve('output/blue-professional-review');
const inventory=JSON.parse(await fs.readFile('assets/redesign/original-inventory.json','utf8'));
const originals=[1,18,25];
const dir=path.join(out,'verification');await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--allow-file-access-from-files']});
const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[],externalRequests=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',req=>{if(/^https?:/.test(req.url()))externalRequests.push(req.url());});
await page.goto(pathToFileURL(path.join(out,'samples.html')).href);
await page.evaluate(()=>document.fonts.ready);
const sampleCount=await page.locator('.slide').count();
const reports=[];
for(const viewport of [{width:1920,height:1080},{width:1280,height:720},{width:390,height:844}]) {
  await page.setViewportSize(viewport);await page.keyboard.press('Home');
  for(let i=0;i<3;i++) {
    if(i)await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(260);
    const result=await page.evaluate(()=>{
      const slide=document.querySelector('.slide.active');
      if(!slide)throw new Error('No active slide');
      const stage=document.querySelector('.deck-stage').getBoundingClientRect();
      const elements=[...slide.querySelectorAll('[data-source-text]')];
      const metrics=elements.map(el=>{
        const b=el.getBoundingClientRect();const s=getComputedStyle(el);
        const range=document.createRange();range.selectNodeContents(el);const rb=range.getBoundingClientRect();
        return {key:el.dataset.sourceKey,text:el.textContent,sourceText:el.dataset.sourceText,fontsize:s.fontSize,
          bounds:{x:b.x,y:b.y,width:b.width,height:b.height},
          overflow:el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2,
          outsideStage:b.left<stage.left-1||b.top<stage.top-1||b.right>stage.right+1||b.bottom>stage.bottom+1,
          clipped:rb.right>b.right+2||rb.bottom>b.bottom+2};
      });
      return {text:slide.innerText,notes:slide.querySelector('[data-speaker-notes]')?.content?.textContent??slide.querySelector('[data-speaker-notes]')?.textContent,
        fontStatus:document.fonts.status,fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),
        stage:{width:stage.width,height:stage.height,x:stage.x,y:stage.y},metrics,
        imageFailures:[...slide.querySelectorAll('img')].filter(el=>!el.complete||!el.naturalWidth).map(el=>el.src)};
    });
    const normalize=x=>x.replace(/\s+/g,'');
    result.missingOriginalParagraphs=inventory.slides[originals[i]-1].textParagraphs.filter(p=>!normalize(result.text).includes(normalize(p.text)));
    result.textChanged=result.metrics.filter(m=>normalize(m.text)!==normalize(m.sourceText));
    result.notesMatch=result.notes===inventory.slides[originals[i]-1].notes.bodyText;
    result.originalPage=originals[i];result.viewport=viewport;
    await page.screenshot({path:path.join(dir,`sample-${i+1}-${viewport.width}x${viewport.height}.png`)});
    reports.push(result);
  }
}
await page.setViewportSize({width:1920,height:1080});
await page.keyboard.press('Home');await page.keyboard.press('n');
const notesOpen=await page.locator('#sampleNotesPanel').isVisible();
await page.screenshot({path:path.join(dir,'notes-panel.png')});await page.keyboard.press('Escape');
await page.keyboard.press('ArrowRight');
const navigationAfterNotes=await page.locator('.slide.active').getAttribute('data-original-slide')==='18';
await page.keyboard.press('e');
const editingEnabled=await page.locator('.slide.active h2').getAttribute('contenteditable')==='plaintext-only';
await page.keyboard.press('Escape');
const downloadPromise=page.waitForEvent('download');
await page.keyboard.press('Control+s');
const download=await downloadPromise;
await download.saveAs(path.join(dir,'edited-export-check.html'));
await page.keyboard.press('Home');
await page.emulateMedia({media:'print'});
await page.pdf({path:path.join(out,'samples.pdf'),width:'1920px',height:'1080px',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0},displayHeaderFooter:false});
await page.emulateMedia({media:'screen'});
await page.goto(pathToFileURL(path.join(out,'analysis.html')).href);await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:path.join(dir,'analysis-top.png')});
const analysis=await page.evaluate(()=>({title:document.title,bodyText:document.body.innerText,images:[...document.images].length,overflow:document.documentElement.scrollWidth>innerWidth}));
const failures=reports.flatMap(r=>[
  ...r.missingOriginalParagraphs.map(p=>`${r.originalPage}:missing:${p.text}`),...r.textChanged.map(m=>`${r.originalPage}:changed:${m.key}`),
  ...r.metrics.filter(m=>m.overflow||m.outsideStage||m.clipped).map(m=>`${r.originalPage}:layout:${m.key}`),
  ...r.imageFailures.map(x=>`${r.originalPage}:image:${x}`),...(!r.notesMatch?[`${r.originalPage}:notes`]:[]),
  ...(Math.abs(r.stage.width/r.stage.height-16/9)>.001?[`${r.originalPage}:aspectRatio`]:[])]);
if(sampleCount!==3||!notesOpen||!navigationAfterNotes||!editingEnabled)failures.push('Interaction or slide count check failed');
for(const r of reports)if(r.fonts.some(f=>f.status!=='loaded'))failures.push(`Font loading failed on ${r.originalPage}`);
const report={checkedAt:new Date().toISOString(),sampleCount,originalPages:originals,interactions:{notesOpen,navigationAfterNotes,editingEnabled,exportFile:download.suggestedFilename()},errors,externalRequests,reports,analysis,failures};
await fs.writeFile(path.join(dir,'browser-report.json'),JSON.stringify(report,null,2));
await browser.close();
console.log(JSON.stringify({sampleCount:3,viewports:3,failures,errors,externalRequests,analysisOverflow:analysis.overflow},null,2));
if(failures.length||errors.length||externalRequests.length||analysis.overflow)process.exitCode=1;
