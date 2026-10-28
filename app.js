(() => {
  'use strict';
  const state = {data:null,latestData:null,archiveEntries:[],archivedId:null,tab:'news',filter:'All',query:'',open:new Set()};
  const $ = id => document.getElementById(id);
  const categories=['All','Technology','Automotive','Science','Sports','World','Local'];
  const chevron=() => {const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','story-chevron');svg.setAttribute('aria-hidden','true');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','m5 9 7 7 7-7');svg.append(path);return svg};
  const make=(tag,cls,text) => {const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
  function navigate(tab, updateHistory=true) {
    state.tab=tab;
    const selected=tab==='edition'?'archive':tab;
    ['news','reddit','x','football','archive'].forEach(id=>{
      $(id+'-panel').hidden=(tab==='edition'?id!=='news':id!==tab);
      const b=document.querySelector('[data-tab="'+id+'"]');
      b.classList.toggle('active',id===selected);
      if(id===selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
    window.scrollTo({top:0,behavior:'instant'});
    if(updateHistory){
      const hash=tab==='edition'?'#archive/'+encodeURIComponent(state.archivedId):'#'+tab;
      try{history.pushState(null,'',hash)}catch(e){location.hash=hash}
    }
  }
  function showStory(item,kind) {
    const key=kind+'-'+item.id;
    const article=make('article','story');
    const toggle=make('button','story-toggle');
    toggle.type='button';toggle.setAttribute('aria-expanded',String(state.open.has(key)));
    if(kind==='reddit'||kind==='x'){const wrap=make('span');wrap.style.flex='1';const byline=kind==='x'?(item.author+(item.handle?' · '+item.handle:'')):item.subreddit;wrap.append(make('div','reddit-sub',byline),make('div','story-title',item.title));toggle.append(wrap)}
    else toggle.append(make('span','story-title',item.headline));
    toggle.append(chevron());
    const detail=make('div','story-detail');
    detail.hidden=!state.open.has(key);
    if(kind==='reddit'||kind==='x'){
      if(typeof item.text==='string'&&item.text.trim())detail.append(make('p','',item.text));
    }else {
      // Prefer a source-provided opening/excerpt. Keep older archived summaries unchanged.
      const lead=typeof item.openingParagraph==='string'?item.openingParagraph.trim():'';
      const paragraphs=lead?[lead]:(Array.isArray(item.summary)?item.summary:[]);
      paragraphs.forEach(line=>detail.append(make('p','',line)));
    }
    const sourceLabel=kind==='reddit'?item.subreddit:kind==='x'?(item.author+(item.handle?' · '+item.handle:'')):item.publisher;
    detail.append(make('div','story-meta',sourceLabel+' · '+item.date+(item.qualification?' · '+item.qualification:'')));
    const actions=make('div','story-actions');
    const source=make('a','original',kind==='x'?'Original post ↗':'Original source ↗');source.href=item.url;source.target='_blank';source.rel='noopener noreferrer';
    const explore=make('button','explore','Explore ↗');explore.type='button';
    explore.addEventListener('click',() => {
      const prompt='Explore this '+(kind==='reddit'?'Reddit discussion':kind==='x'?'X post':'news story')+' from The Brief: '+(item.headline||item.title)+'. Original source: '+item.url+'. Verify claims and explain the background, what is established, and what is uncertain.';
      window.open('https://chatgpt.com/?q='+encodeURIComponent(prompt),'_blank','noopener,noreferrer');
    });
    actions.append(source,explore);detail.append(actions);
    toggle.addEventListener('click',()=>{
      if(state.open.has(key))state.open.delete(key);else state.open.add(key);
      const open=state.open.has(key);toggle.setAttribute('aria-expanded',String(open));detail.hidden=!open;
    });
    article.append(toggle,detail);return article;
  }
  function news(){
    const host=$('news-list');host.replaceChildren();
    const groups=new Map();let count=0;
    state.data.news.forEach(item=>{
      const hay=[item.headline,item.publisher,item.category,item.openingParagraph||'',...(Array.isArray(item.summary)?item.summary:[])].join(' ').toLowerCase();
      if(state.filter!=='All'&&item.category!==state.filter)return;
      if(state.query&&!hay.includes(state.query.toLowerCase()))return;
      if(!groups.has(item.publisher))groups.set(item.publisher,[]);
      groups.get(item.publisher).push(item);count++;
    });
    groups.forEach((stories,publisher)=>{
      const sec=make('section','publisher');const head=make('div','publisher-head');
      const img=make('img');img.src='https://www.google.com/s2/favicons?domain='+encodeURIComponent(stories[0].domain)+'&sz=64';img.alt='';img.loading='lazy';
      const fallback=make('span','publisher-fallback',publisher[0]);img.onerror=()=>{img.hidden=true;fallback.style.display='grid'};
      head.append(img,fallback,make('span','publisher-name',publisher.toUpperCase()),make('span','publisher-count',stories.length+(stories.length===1?' STORY':' STORIES')));
      sec.append(head);stories.forEach(story=>sec.append(showStory(story,'news')));host.append(sec);
    });
    $('news-count').textContent=count+' STORIES · '+groups.size+' SOURCES';
    $('empty-news').hidden=count!==0;
    $('clear').hidden=state.filter==='All'&&!state.query;
  }
  function filters(){
    const container=$('filters');container.replaceChildren();
    categories.forEach(cat=>{
      const button=make('button','filter',cat);button.type='button';button.setAttribute('aria-pressed',String(state.filter===cat));
      button.addEventListener('click',()=>{state.filter=cat;filters();news()});
      container.append(button);
    });
  }
  function reddit() {
    const host=$('reddit-list');host.replaceChildren();host.classList.add('reddit-list');
    state.data.reddit.forEach(item=>host.append(showStory(item,'reddit')));
  }
  function xDesk() {
    const host=$('x-list');host.replaceChildren();
    const posts=state.latestData&&Array.isArray(state.latestData.xPosts)?state.latestData.xPosts:[];
    posts.forEach(item=>host.append(showStory(item,'x')));
    $('x-count').textContent=posts.length+' SELECTED POSTS';
    $('x-empty').hidden=posts.length!==0;
  }
  function teamLogo(team, cssClass) {
    const holder=make('span','logo-container');
    const image=make('img',cssClass);
    image.src='https://a.espncdn.com/i/teamlogos/ncaa/500/'+team.logoId+'.png';
    image.alt=team.name+' logo';image.loading='lazy';
    const fallback=make('span','logo-fallback',team.name.split(' ').map(word=>word[0]).join('').slice(0,3));
    fallback.hidden=true;
    image.addEventListener('error',()=>{image.hidden=true;fallback.hidden=false});
    holder.append(image,fallback);
    return holder;
  }
  function footballTeam(team) {
    const holder=make('div','football-team');
    holder.append(teamLogo(team,'football-logo'),make('div','football-team-name',team.name));
    const secondary=team.record?'Record: '+team.record:team.label;
    if(secondary)holder.append(make('div','football-team-record',secondary));
    return holder;
  }
  function footballScoreTeam(team){
    const row=make('div','score-row');
    const name=make('span','score-team-name');
    if(team.rank)name.append(make('span','score-rank','#'+team.rank));
    name.append(document.createTextNode(team.name));
    row.append(teamLogo(team,'score-logo'),name);
    return row;
  }
  function loadFootball(data){
    if(!data||!data.feature||!Array.isArray(data.games))throw Error('Invalid football file');
    $('football-week').textContent=data.displayWeek;
    const feature=$('football-feature');feature.replaceChildren();
    const eyebrow=make('div','football-feature-eyebrow');
    eyebrow.append(make('span','','SEMINOLES SPOTLIGHT'),make('span','kick-status','NEXT UP'));
    const body=make('div','football-feature-body');
    body.append(footballTeam(data.feature.away),make('span','football-vs','at'),footballTeam(data.feature.home));
    const meta=make('div','football-event-note');
    meta.append(make('span','',data.feature.kickoff),make('span','broadcast',data.feature.tv));
    const link=make('a','football-match-link','Official game center ↗');
    link.href=data.feature.source;link.target='_blank';link.rel='noopener noreferrer';
    meta.append(link);
    feature.append(eyebrow,body,meta);
    const grid=$('football-games');grid.replaceChildren();
    $('football-matchup-count').textContent=data.games.length+' FEATURED MATCHUPS';
    data.games.forEach(game=>{
      const card=make('article','score-card');
      const top=make('div','score-card-top');
      top.append(make('span','',game.kickoff+' ET'),make('span','card-state','SCHEDULED'));
      card.append(top,footballScoreTeam(game.away),footballScoreTeam(game.home));
      const foot=make('div','score-card-foot');
      foot.append(make('span','',game.tv));
      const source=make('a','','Schedule source ↗');
      source.href=game.source;source.target='_blank';source.rel='noopener noreferrer';
      foot.append(source);
      card.append(foot);grid.append(card);
    });
    const tv=$('football-tv-list');tv.replaceChildren();
    (data.tvHighlights||[]).forEach(item=>{
      const row=make('div','football-tv-row');
      row.append(make('span','',item.time+' · '+item.match),make('strong','',item.network));
      tv.append(row);
    });
  }
  const archivePath=id => 'archive/editions/'+id+'.json';
  function archiveStatus(item){
    return item.type==='preview'?'Archived design preview · Not a published edition.':(item.title||'Archived edition')+' · '+item.displayDate+', '+item.year;
  }
  function renderEdition(data, entry=null){
    state.data=data;
    state.archivedId=entry?entry.id:null;
    state.filter='All';state.query='';state.open.clear();$('search').value='';
    $('edition-title').textContent=data.displayDate+(data.year?', '+data.year:'');
    const editionLabel=$('edition-version');
    editionLabel.textContent=data.type==='published'&&/^v\d+$/.test(data.edition||'')?data.edition:'';
    editionLabel.hidden=!editionLabel.textContent;
    $('archive-reader-bar').hidden=!entry;
    filters();news();
  }
  function latestEdition(){
    if(state.latestData)renderEdition(state.latestData);
    navigate('news');
  }
  function renderArchiveIndex(){
    const host=$('archive-list');host.replaceChildren();
    const entries=state.archiveEntries;
    const published=entries.filter(e=>e.type==='published').length;
    const previews=entries.filter(e=>e.type==='preview').length;
    $('archive-count').textContent=published+' PUBLISHED EDITIONS'+(previews?' · '+previews+' DESIGN PREVIEW'+(previews>1?'S':''):'');
    $('archive-empty').hidden=published>0;
    if(published===0)$('archive-empty').textContent='No published editions yet.';
    entries.forEach(entry=>{
      const row=make('article','archive-entry');
      const info=make('div','archive-entry-info');
      const label=(entry.type==='preview'?'DESIGN PREVIEW':'PUBLISHED')+' · '+entry.displayDate.toUpperCase()+', '+entry.year;
      info.append(make('div','kicker',label),make('h3','',entry.title||entry.displayDate),
        make('p','',entry.storyCount+' STORIES · '+entry.sourceCount+' SOURCES'));
      const button=make('button','archive-open','Open edition ↗');
      button.type='button';
      button.setAttribute('aria-label','Open '+entry.displayDate+', '+entry.year+(entry.type==='preview'?' design preview':' edition'));
      button.addEventListener('click',()=>{void openArchivedEdition(entry.id)});
      row.append(info,button);host.append(row);
    });
  }
  async function loadArchiveIndex(){
    try{
      const response=await fetch('./archive/index.json',{cache:'no-store'});
      if(!response.ok)throw Error('HTTP '+response.status);
      const data=await response.json();
      if(data.schemaVersion!==1||!Array.isArray(data.editions))throw Error('Invalid archive index');
      const seen=new Set();
      state.archiveEntries=data.editions.filter(e=>{
        if(!e||typeof e.id!=='string'||!/^[a-z0-9][a-z0-9-]*$/.test(e.id)||
           seen.has(e.id)||e.file!==archivePath(e.id)||
           !['published','preview'].includes(e.type)||
           typeof e.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||
           !Number.isInteger(e.storyCount)||!Number.isInteger(e.sourceCount)||
           typeof e.displayDate!=='string'||typeof e.year!=='string')return false;
        seen.add(e.id);return true;
      }).sort((a,b)=>b.date.localeCompare(a.date));
      $('archive-error').hidden=true;
    }catch(error){
      state.archiveEntries=[];
      $('archive-error').textContent='Archive index could not be loaded. Please refresh this page.';
      $('archive-error').hidden=false;
      console.error(error);
    }
    renderArchiveIndex();
  }
  async function openArchivedEdition(id,updateHistory=true){
    const entry=state.archiveEntries.find(item=>item.id===id);
    if(!entry){
      navigate('archive',updateHistory);
      $('archive-error').textContent='This archived edition is not available.';
      $('archive-error').hidden=false;
      return;
    }
    try{
      const response=await fetch('./'+entry.file,{cache:'no-store'});
      if(!response.ok)throw Error('HTTP '+response.status);
      const data=await response.json();
      if(!Array.isArray(data.news)||!Array.isArray(data.reddit)||
         data.displayDate!==entry.displayDate||String(data.year)!==entry.year||
         (entry.type==='preview'&&data.type!=='design-preview')||
         (entry.type==='published'&&data.type!=='published')||
         data.news.length!==entry.storyCount)throw Error('Invalid archive edition');
      $('archive-error').hidden=true;
      renderEdition(data,entry);navigate('edition',updateHistory);
    }catch(error){
      $('archive-error').textContent='This archived edition could not be opened. Please try again later.';
      $('archive-error').hidden=false;
      navigate('archive',updateHistory);
      console.error(error);
    }
  }
  async function routeFromHash(){
    const hash=location.hash.slice(1);
    if(hash.startsWith('archive/')){
      let id='';
      try{id=decodeURIComponent(hash.slice('archive/'.length))}catch(e){/* invalid hash */}
      await openArchivedEdition(id,false);
    }else if(hash==='news'||!hash){
      if(state.latestData)renderEdition(state.latestData);
      navigate('news',false);
    }else{
      navigate(['reddit','x','football','archive'].includes(hash)?hash:'news',false);
    }
  }
  async function start(){
    document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{
      if(button.dataset.tab==='news')latestEdition();
      else navigate(button.dataset.tab);
    }));
    $('archive-back').addEventListener('click',()=>navigate('archive'));
    $('archive-latest').addEventListener('click',latestEdition);
    $('search').addEventListener('input',event=>{state.query=event.target.value.trim();news()});
    $('clear').addEventListener('click',()=>{state.query='';state.filter='All';$('search').value='';filters();news()});
    document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.metaKey&&!event.ctrlKey&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&state.tab==='news'){event.preventDefault();$('search').focus()}});
    window.addEventListener('popstate',()=>{void routeFromHash()});
    window.addEventListener('hashchange',()=>{void routeFromHash()});
    try{
      const response=await fetch('./edition.json',{cache:'no-store'});
      if(!response.ok)throw Error('HTTP '+response.status);
      const data=await response.json();
      if(!Array.isArray(data.news)||!Array.isArray(data.reddit))throw Error('Invalid edition');
      state.latestData=data;
      renderEdition(data);reddit();xDesk();
      try{
        const footballResponse=await fetch('./football.json',{cache:'no-store'});
        if(!footballResponse.ok)throw Error('HTTP '+footballResponse.status);
        loadFootball(await footballResponse.json());
      }catch(footballError){
        $('football-feature').append(make('p','empty','Football preview could not be loaded. Please refresh this page.'));
        console.error(footballError);
      }
    }catch(error){
      $('news-list').append(make('p','empty','The demo edition could not be loaded. Please refresh the page.'));
      console.error(error);
    }
    await loadArchiveIndex();
    await routeFromHash();
  }
  start();
})();