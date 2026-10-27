(() => {
  'use strict';
  const state = {data:null,tab:'news',filter:'All',query:'',open:new Set()};
  const $ = id => document.getElementById(id);
  const categories=['All','Technology','Automotive','Science','Sports'];
  const chevron=() => {const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','story-chevron');svg.setAttribute('aria-hidden','true');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','m5 9 7 7 7-7');svg.append(path);return svg};
  const make=(tag,cls,text) => {const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
  function navigate(tab) {
    state.tab=tab;
    ['news','reddit','football','archive'].forEach(id=>{
      $(id+'-panel').hidden=id!==tab;
      const b=document.querySelector('[data-tab="'+id+'"]');
      b.classList.toggle('active',id===tab);
      if(id===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
    window.scrollTo({top:0,behavior:'instant'});
    try{history.replaceState(null,'','#'+tab)}catch(e){}
  }
  function showStory(item,kind) {
    const key=kind+'-'+item.id;
    const article=make('article','story');
    const toggle=make('button','story-toggle');
    toggle.type='button';toggle.setAttribute('aria-expanded',String(state.open.has(key)));
    if(kind==='reddit'){const wrap=make('span');wrap.style.flex='1';wrap.append(make('div','reddit-sub',item.subreddit),make('div','story-title',item.title));toggle.append(wrap)}
    else toggle.append(make('span','story-title',item.headline));
    toggle.append(chevron());
    const detail=make('div','story-detail');
    detail.hidden=!state.open.has(key);
    if(kind==='reddit')detail.append(make('p','',item.text));
    else item.summary.forEach(line=>detail.append(make('p','',line)));
    detail.append(make('div','story-meta',(kind==='reddit'?item.subreddit+' · ':item.publisher+' · ')+item.date+(item.qualification?' · '+item.qualification:'')));
    const actions=make('div','story-actions');
    const source=make('a','original','Original source ↗');source.href=item.url;source.target='_blank';source.rel='noopener noreferrer';
    const explore=make('button','explore','Explore ↗');explore.type='button';
    explore.addEventListener('click',() => {
      const prompt='Explore this '+(kind==='reddit'?'Reddit discussion':'news story')+' from The Brief: '+(item.headline||item.title)+'. Original source: '+item.url+'. Verify claims and explain the background, what is established, and what is uncertain.';
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
      const hay=[item.headline,item.publisher,item.category,...item.summary].join(' ').toLowerCase();
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
  async function start(){
    document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.tab)));
    $('view-preview').addEventListener('click',()=>navigate('news'));
    $('search').addEventListener('input',event=>{state.query=event.target.value.trim();news()});
    $('clear').addEventListener('click',()=>{state.query='';state.filter='All';$('search').value='';filters();news()});
    document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.metaKey&&!event.ctrlKey&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&state.tab==='news'){event.preventDefault();$('search').focus()}});
    try{
      const response=await fetch('./edition.json',{cache:'no-store'});
      if(!response.ok)throw Error('HTTP '+response.status);
      state.data=await response.json();
      if(!Array.isArray(state.data.news)||!Array.isArray(state.data.reddit))throw Error('Invalid edition');
      $('edition-number').textContent=state.data.edition;
      $('edition-title').textContent=state.data.displayDate;
      $('edition-year').textContent=state.data.year;
      filters();news();reddit();
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
    const hash=location.hash.replace('#','');
    navigate(['news','reddit','football','archive'].includes(hash)?hash:'news');
  }
  start();
})();