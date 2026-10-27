#!/usr/bin/env node
// Explicit, manual publishing utility. This does not run on a schedule.
// Usage: node scripts/archive-edition.mjs path/to/published-edition.json 2026-10-27
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const source=process.argv[2];
const date=process.argv[3];
if(!source||!/^\d{4}-\d{2}-\d{2}$/.test(date||'')){
  console.error('Usage: node scripts/archive-edition.mjs <published-edition.json> <YYYY-MM-DD>');
  process.exit(1);
}
const data=JSON.parse(await readFile(resolve(source),'utf8'));
if(data.type!=='published'||!Array.isArray(data.news)||data.news.length===0||
   !Array.isArray(data.reddit)||!data.displayDate||String(data.year)!==date.slice(0,4)||
   (data.publishedDate&&data.publishedDate!==date)){
  throw Error('This must be a complete, explicitly published edition—not a design preview.');
}
for(const item of data.news){
  if(typeof item.id!=='string'||typeof item.publisher!=='string'||typeof item.domain!=='string'||
     typeof item.category!=='string'||typeof item.headline!=='string'||
     !Array.isArray(item.summary)||!item.summary.every(t=>typeof t==='string')||
     !/^https?:\/\//.test(item.url||'')){
    throw Error('Invalid story in published edition: '+String(item.id));
  }
}
const id='issue-'+date;
const relative='archive/editions/'+id+'.json';
const filename=join(root,relative);
if(existsSync(filename))throw Error('Edition already archived: '+id+'. Archive snapshots must not be replaced.');
const indexFile=join(root,'archive/index.json');
const catalog=JSON.parse(await readFile(indexFile,'utf8'));
if(catalog.schemaVersion!==1||!Array.isArray(catalog.editions)||
   catalog.editions.some(e=>e.id===id||e.file===relative)){
  throw Error('Invalid catalog or duplicate edition ID: '+id);
}
const entry={
  id,date,displayDate:data.displayDate,year:String(data.year),type:'published',
  title:data.title||'The Brief',file:relative,
  storyCount:data.news.length,sourceCount:new Set(data.news.map(x=>x.publisher)).size
};
await mkdir(join(root,'archive/editions'),{recursive:true});
await writeFile(filename,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
catalog.editions.unshift(entry);
catalog.editions.sort((a,b)=>b.date.localeCompare(a.date));
await writeFile(indexFile,JSON.stringify(catalog,null,2)+'\n','utf8');
console.log('Archived '+id+' ('+entry.storyCount+' stories).');
console.log('Review both generated changes and commit them together to GitHub when ready.');
