import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
const base=path.resolve('output/blue-professional-review');
const zip=new JSZip();
async function add(dir,relative='') {
  for(const item of await fs.readdir(dir,{withFileTypes:true})) {
    if(item.name==='verification')continue;
    const rel=path.posix.join(relative,item.name);
    if(item.isDirectory())await add(path.join(dir,item.name),rel);
    else zip.file('blue-professional-review/'+rel,await fs.readFile(path.join(dir,item.name)));
  }
}
await add(base);
const bytes=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:6}});
await fs.writeFile('output/blue-professional-review.zip',bytes);
console.log(`离线样稿包已生成：${(bytes.length/1048576).toFixed(1)} MB`);
