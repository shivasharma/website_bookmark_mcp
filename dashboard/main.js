// ══════════════════════════════════════════════
// THEME
// ══════════════════════════════════════════════
(function initTheme(){
  const saved=localStorage.getItem('bmark-theme');
  if(saved){document.documentElement.setAttribute('data-theme',saved);return;}
  if(window.matchMedia&&window.matchMedia('(prefers-color-scheme:light)').matches){
    document.documentElement.setAttribute('data-theme','light');
  }
})();
function toggleTheme(){
  const current=document.documentElement.getAttribute('data-theme');
  const next=current==='light'?'dark':'light';
  document.documentElement.setAttribute('data-theme',next);
  localStorage.setItem('bmark-theme',next);
}

// ══════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════
const API = '/api';
let bookmarks = [];
let currentFilter = 'all';
let currentView = 'list';
let currentTimeFilter = 'all';
let currentSort = 'newest';
let groupByCategory = false;
let advancedFiltersOpen = false;
let recentSearches = [];
let importPreviewItems = [];
let selectedPreviewIds = new Set();
let totalImported = 0;
let editingBookmarkId = null;
let authBlocked = false;
let localFallbackEnabled = false;
let currentUser = null;
let notificationsUnread = 0;
const RECENT_SEARCHES_KEY = 'markd_recent_searches_v1';
const MAX_RECENT_SEARCHES = 6;
const TUTORIAL_DISMISSED_KEY = 'markd_first_save_tutorial_dismissed_v1';
const LOCAL_FALLBACK_PREF_KEY = 'markd_local_fallback_pref_v1';
const ONBOARD_TOUR_KEY = 'markd_onboard_tour_done_v1';
try{localFallbackEnabled=localStorage.getItem(LOCAL_FALLBACK_PREF_KEY)==='true'}catch(e){localFallbackEnabled=false}
const SUGGEST_HIDDEN_KEY='markd_suggest_hidden_v1';
const SUGGESTED_BOOKMARKS = [
  { title: 'GitHub Trending', url: 'https://github.com/trending', meta: 'Dev' },
  { title: 'MDN Web Docs', url: 'https://developer.mozilla.org/', meta: 'Dev' },
  { title: 'OpenAI', url: 'https://openai.com/', meta: 'AI' },
  { title: 'Hugging Face', url: 'https://huggingface.co/', meta: 'AI' },
  { title: 'Figma Community', url: 'https://www.figma.com/community', meta: 'Design' },
  { title: 'Awwwards', url: 'https://www.awwwards.com/', meta: 'Design' }
];
const INTEREST_CATALOG={
  dev:[
    {title:'GitHub Trending',url:'https://github.com/trending',meta:'Dev'},
    {title:'MDN Web Docs',url:'https://developer.mozilla.org/',meta:'Dev'},
    {title:'Stack Overflow',url:'https://stackoverflow.com/',meta:'Dev'},
    {title:'Dev.to',url:'https://dev.to/',meta:'Dev'},
  ],
  ai:[
    {title:'OpenAI',url:'https://openai.com/',meta:'AI'},
    {title:'Hugging Face',url:'https://huggingface.co/',meta:'AI'},
    {title:'Papers With Code',url:'https://paperswithcode.com/',meta:'AI'},
    {title:'Anthropic',url:'https://www.anthropic.com/',meta:'AI'},
  ],
  design:[
    {title:'Figma Community',url:'https://www.figma.com/community',meta:'Design'},
    {title:'Awwwards',url:'https://www.awwwards.com/',meta:'Design'},
    {title:'Dribbble',url:'https://dribbble.com/',meta:'Design'},
    {title:'Behance',url:'https://www.behance.net/',meta:'Design'},
  ],
  tools:[
    {title:'Product Hunt',url:'https://www.producthunt.com/',meta:'Tools'},
    {title:'Notion',url:'https://www.notion.so/',meta:'Tools'},
  ],
};

const authEls={
  signInBtn:document.getElementById('signInBtn'),
  topNotifyBtn:document.getElementById('topNotifyBtn'),
  topNotifyBadge:document.getElementById('topNotifyBadge'),
  menuLogoutBtn:document.getElementById('menuLogoutBtn'),
  menuLoginLink:document.getElementById('menuLoginLink'),
  settingsMenuBtn:document.getElementById('settingsMenuBtn'),
  topSettingsMenu:document.getElementById('topSettingsMenu'),
  userAvatarBtn:document.getElementById('userAvatarBtn')
};

// ══════════════════════════════════════════════
// BOOKMARK RENDER
// ══════════════════════════════════════════════
const TAG_COLORS = {ai:'mt1',dev:'mt2',design:'mt3','read later':'mt4',tools:'mt5',favourite:'mt6',rss:'mt1',feeds:'mt1'};
function tagClass(t){return TAG_COLORS[t.toLowerCase()]||'mt2'}
function tagDotClass(t){
  const map={mt1:'td1',mt2:'td2',mt3:'td3',mt4:'td4',mt5:'td5',mt6:'td6'};
  return map[tagClass(String(t||''))]||'td2';
}
function bookmarkExcerpt(b){
  const desc=String(b.description||'').trim();
  if(desc)return desc;
  const notes=String(b.notes||'').trim();
  if(notes)return notes;
  const tags=(Array.isArray(b.tags)?b.tags:[]).slice(0,3).join(', ');
  const domain=safeDomain(b.url||'')||String(b.domain||'link');
  return tags?`Saved from ${domain}. Topics: ${tags}.`:`Saved from ${domain}. Open to explore more details.`;
}


function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function safeDomain(url){try{return new URL(url).hostname.replace('www.','')}catch(e){return ''}}

function toggleLocalFallback(enabled){
  localFallbackEnabled=!!enabled;
  try{localStorage.setItem(LOCAL_FALLBACK_PREF_KEY,localFallbackEnabled?'true':'false')}catch(e){}
  render();
}
function fmt(d){return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}

async function api(path,options={}){
  const response=await fetch(API+path,{...options,credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})}});
  let payload=null;
  try{payload=await response.json()}catch(e){payload=null}
  return {response,payload};
}

function toUiBookmark(item){
  const domain=safeDomain(item.url||'');
  return {
    ...item,
    title:item.title||domain||item.url||'Untitled',
    tags:Array.isArray(item.tags)?item.tags:[],
    starred:!!item.is_favorite,
    domain,
    date:item.created_at?fmt(new Date(item.created_at)):fmt(new Date()),
    readTime:item.readTime||'--',
    ai:false,
    imported:!!item.imported
  };
}

async function loadBookmarks(){
  try{
    const {response,payload}=await api('/bookmarks',{method:'GET'});
    if(!response.ok||!payload?.success){
      authBlocked=response.status===401;
      bookmarks=[];
      return;
    }
    authBlocked=false;
    bookmarks=(Array.isArray(payload.data)?payload.data:[]).map(toUiBookmark);
    if(bookmarks.length>0){
      try{localStorage.setItem(TUTORIAL_DISMISSED_KEY,'true')}catch(e){}
    }
  }catch(e){bookmarks=[]}
}

function renderAuthUi(){
  if(!authEls.signInBtn||!authEls.menuLogoutBtn||!authEls.userAvatarBtn||!authEls.menuLoginLink||!authEls.topNotifyBtn||!authEls.topNotifyBadge)return;
  if(!currentUser){
    authEls.signInBtn.classList.remove('hidden');
    authEls.topNotifyBtn.classList.add('hidden');
    authEls.topNotifyBadge.classList.add('hidden');
    authEls.menuLoginLink.classList.remove('hidden');
    authEls.menuLogoutBtn.classList.add('hidden');
    authEls.userAvatarBtn.classList.add('hidden');
    authEls.userAvatarBtn.textContent='U';
    authEls.userAvatarBtn.title='Not signed in';
    return;
  }
  const label=currentUser.name||currentUser.email||'User';
  const initial=String(label).trim().charAt(0).toUpperCase()||'U';
  authEls.signInBtn.classList.add('hidden');
  authEls.topNotifyBtn.classList.remove('hidden');
  if(Number(notificationsUnread||0)>0){
    authEls.topNotifyBadge.textContent=notificationsUnread>99?'99+':String(notificationsUnread);
    authEls.topNotifyBadge.classList.remove('hidden');
  }else{
    authEls.topNotifyBadge.classList.add('hidden');
  }
  authEls.menuLoginLink.classList.add('hidden');
  authEls.menuLogoutBtn.classList.remove('hidden');
  authEls.userAvatarBtn.classList.remove('hidden');
  authEls.userAvatarBtn.textContent=initial;
  authEls.userAvatarBtn.title=`Logged in as ${label}`;
}

async function loadNotificationSummary(){
  if(!currentUser){
    notificationsUnread=0;
    renderAuthUi();
    return;
  }
  try{
    const {response,payload}=await api('/notifications?limit=1',{method:'GET'});
    if(!response.ok||!payload?.success){
      notificationsUnread=0;
      renderAuthUi();
      return;
    }
    notificationsUnread=Number(payload.unread||0);
    renderAuthUi();
  }catch(e){
    notificationsUnread=0;
    renderAuthUi();
  }
}

function toggleSettingsMenu(force){
  if(!authEls.topSettingsMenu)return;
  const shouldOpen=typeof force==='boolean'?force:!authEls.topSettingsMenu.classList.contains('show');
  authEls.topSettingsMenu.classList.toggle('show',shouldOpen);
}

function isSuggestionsHidden(){try{return localStorage.getItem(SUGGEST_HIDDEN_KEY)==='true'}catch{return false}}
function hideSuggestions(){try{localStorage.setItem(SUGGEST_HIDDEN_KEY,'true')}catch{}render();showToast('Suggestions hidden','info')}
function showSuggestions(){try{localStorage.removeItem(SUGGEST_HIDDEN_KEY)}catch{}render();showToast('Suggestions restored','info')}

function getUserTopInterests(){
  const freq={};
  for(const b of bookmarks){
    for(const t of(b.tags||[])){
      const key=String(t).toLowerCase();
      freq[key]=(freq[key]||0)+1;
    }
  }
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(e=>e[0]);
}

function getPersonalizedSuggestions(){
  const interests=getUserTopInterests();
  const existing=new Set(bookmarks.map(b=>{try{return new URL(b.url.startsWith('http')?b.url:'https://'+b.url).hostname}catch{return ''}}));
  const picks=[];
  const seen=new Set();
  for(const tag of interests){
    const cat=INTEREST_CATALOG[tag];
    if(!cat)continue;
    for(const item of cat){
      const host=new URL(item.url).hostname;
      if(!existing.has(host)&&!seen.has(host)){picks.push(item);seen.add(host);}
      if(picks.length>=6)break;
    }
    if(picks.length>=6)break;
  }
  if(picks.length<6){
    for(const item of SUGGESTED_BOOKMARKS){
      const host=new URL(item.url).hostname;
      if(!existing.has(host)&&!seen.has(host)){picks.push(item);seen.add(host);}
      if(picks.length>=6)break;
    }
  }
  return picks;
}

function getSuggestTitle(){
  const interests=getUserTopInterests();
  const matched=interests.filter(t=>INTEREST_CATALOG[t]);
  if(matched.length)return '✦ Based on Your Interests';
  return '✦ Trending for You';
}

function renderSuggestCard(item){
  return `<div class="suggest-card"><a class="suggest-card-link" href="${item.url}" target="_blank" rel="noopener noreferrer"><div class="suggest-name">${esc(item.title)}</div><div class="suggest-meta">${esc(item.meta)}</div></a><button class="suggest-save-btn" onclick="event.stopPropagation();quickSaveSuggestion('${item.url.replace(/'/g,"\\'")}')"
  title="Save to bookmarks" aria-label="Save ${esc(item.title)} to bookmarks">★ Save</button></div>`;
}

async function quickSaveSuggestion(url){
  const btn=event?.target;
  if(btn){btn.disabled=true;btn.textContent='Saving…';}
  try{
    const {response:metaRes,payload:metaPl}=await api(`/url-metadata?url=${encodeURIComponent(url)}`,{method:'GET'});
    let title='',description='',tags=[];
    if(metaRes.ok&&metaPl?.success&&metaPl.data){
      title=String(metaPl.data.title||'').trim();
      description=String(metaPl.data.description||'').trim();
      tags=suggestQuickTags(url,title,description);
    }
    const {response,payload}=await api('/bookmarks',{method:'POST',body:JSON.stringify({url,title:title||undefined,description:description||undefined,tags:tags.length?tags:undefined})});
    if(!response.ok||!payload?.success){showToast(payload?.error||'Save failed','warn');return;}
    await refreshBookmarks();
    highlightSavedCard(url);
    showToast('Bookmark saved','success');
  }catch{showToast('Network error while saving','warn');}
  finally{if(btn){btn.disabled=false;btn.textContent='★ Save';}}
}

function renderAssistContent(list){
  const showSuggestions=list.length<=2;
  const tutorialDismissed=String(localStorage.getItem(TUTORIAL_DISMISSED_KEY)||'')==='true';
  if(!showSuggestions)return '';
  if(isSuggestionsHidden())return `<div class="assist-panel assist-collapsed"><button class="suggest-show-btn" onclick="showSuggestions()">Show suggestions</button></div>`;
  const items=getPersonalizedSuggestions();
  if(!items.length)return '';
  const title=getSuggestTitle();
  const suggestions=`<div class="assist-panel"><div class="assist-header"><div class="assist-title">${title}</div><button class="suggest-hide-btn" onclick="hideSuggestions()" title="Hide suggestions" aria-label="Hide suggestions">✕ Hide</button></div><div class="suggest-grid">${items.map(item=>renderSuggestCard(item)).join('')}</div>${!tutorialDismissed?`<div class="mini-tutorial"><strong>How to save quickly:</strong> paste any URL in Quick Add and it auto-saves. This tip hides after your first saved bookmark.</div>`:''}</div>`;
  return suggestions;
}

function renderZeroBookmarksState(){
  const tourDone=String(localStorage.getItem(ONBOARD_TOUR_KEY)||'')==='true';
  return `<div class="empty empty-zero">
  <div class="empty-illustration">
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="70" cy="70" r="68" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="6 4" opacity=".5"/>
      <rect x="42" y="30" width="56" height="72" rx="8" fill="var(--s3)" stroke="var(--border2)" stroke-width="1.5"/>
      <rect x="50" y="44" width="32" height="3" rx="1.5" fill="var(--accent)" opacity=".6"/>
      <rect x="50" y="52" width="40" height="2" rx="1" fill="var(--text3)" opacity=".3"/>
      <rect x="50" y="58" width="36" height="2" rx="1" fill="var(--text3)" opacity=".2"/>
      <rect x="50" y="68" width="28" height="3" rx="1.5" fill="var(--accent2)" opacity=".5"/>
      <rect x="50" y="76" width="40" height="2" rx="1" fill="var(--text3)" opacity=".3"/>
      <rect x="50" y="82" width="34" height="2" rx="1" fill="var(--text3)" opacity=".2"/>
      <circle cx="104" cy="36" r="16" fill="var(--s2)" stroke="var(--accent)" stroke-width="1.5"/>
      <line x1="100" y1="36" x2="108" y2="36" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
      <line x1="104" y1="32" x2="104" y2="40" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
      <path d="M28 105 L70 60" stroke="var(--accent3)" stroke-width="1" stroke-dasharray="4 3" opacity=".4"/>
      <circle cx="24" cy="108" r="8" fill="var(--a3g)" stroke="var(--accent3)" stroke-width="1"/>
      <text x="24" y="112" text-anchor="middle" fill="var(--accent3)" font-size="10" font-weight="bold">✦</text>
    </svg>
  </div>
  <div class="empty-t">Your bookmark collection starts here</div>
  <div class="empty-s">Save links, articles, and resources — organized with tags and powered by auto-detection.</div>
  <div class="empty-tips">
    <div class="empty-tip"><span class="empty-tip-ico">🔗</span><span>Paste any URL in <strong>Quick Add</strong> to auto-detect title, favicon &amp; tags</span></div>
    <div class="empty-tip"><span class="empty-tip-ico">📥</span><span>Import bookmarks from <strong>Chrome, Firefox, Pocket</strong> or Raindrop</span></div>
    <div class="empty-tip"><span class="empty-tip-ico">⌨️</span><span>Press <kbd class="kbd">Ctrl+K</kbd> to open the <strong>Command Palette</strong></span></div>
  </div>
  <div class="empty-actions">
    <button class="btn-primary" onclick="openAddModal()"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Your First Bookmark</button>
    <button class="btn-outline" onclick="openImport()">📥 Import Bookmarks</button>
  </div>
  ${!tourDone?`<button class="empty-tour-btn" onclick="startOnboardTour()"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Take a quick tour</button>`:''}
  ${isSuggestionsHidden()?`<div class="assist-panel assist-collapsed"><button class="suggest-show-btn" onclick="showSuggestions()">Show suggestions</button></div>`:`<div class="assist-panel"><div class="assist-header"><div class="assist-title">✦ Suggested resources to get started</div><button class="suggest-hide-btn" onclick="hideSuggestions()" title="Hide suggestions" aria-label="Hide suggestions">✕ Hide</button></div><div class="suggest-grid">${SUGGESTED_BOOKMARKS.map(item=>renderSuggestCard(item)).join('')}</div></div>`}
</div>`;
}

function renderFilterEmptyState(query){
  const hasQuery=query.length>0;
  const isTagFilter=currentFilter!=='all'&&currentFilter!=='starred'&&currentFilter!=='recent'&&currentFilter!=='unread';
  let title='No matching bookmarks';
  let desc='Try adjusting your filters or search query.';
  let icon=`<svg width="48" height="48" fill="none" stroke="var(--text3)" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;
  if(hasQuery){
    title=`No results for "${esc(query)}"`;
    desc='Check spelling or try different keywords.';
  }else if(currentFilter==='starred'){
    icon='<span style="font-size:36px">⭐</span>';
    title='No starred bookmarks yet';
    desc='Star your favorite links to find them here.';
  }else if(isTagFilter){
    icon=`<span style="font-size:36px">🏷️</span>`;
    title=`No bookmarks tagged "${esc(currentFilter)}"`;
    desc='This tag has no bookmarks matching your current filters.';
  }else if(currentTimeFilter!=='all'){
    icon=`<span style="font-size:36px">📅</span>`;
    title=currentTimeFilter==='today'?'Nothing saved today':'Nothing saved this week';
    desc='Try expanding the time range or add a new bookmark.';
  }
  return `<div class="empty empty-filter">
  <div class="empty-icon-filter">${icon}</div>
  <div class="empty-t">${title}</div>
  <div class="empty-s">${desc}</div>
  <div class="empty-actions">
    ${hasQuery?`<button class="btn-outline" onclick="document.getElementById('searchInput').value='';render()">Clear search</button>`:''}
    ${isTagFilter||currentFilter==='starred'?`<button class="btn-outline" onclick="setCategoryFilter('all')">Show all bookmarks</button>`:''}
    <button class="btn-primary" onclick="openAddModal()"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Bookmark</button>
  </div>
</div>`;
}

// ══════════════════════════════════════════════
// ONBOARDING TOUR
// ══════════════════════════════════════════════
const TOUR_STEPS=[
  {target:'.action-bar .primary-search',title:'Search everything',body:'Quickly find any bookmark by title, URL, tag, or notes.',pos:'below'},
  {target:'.btn-add-compact',title:'Add bookmarks',body:'Click here or use the Quick Add panel to save new links instantly.',pos:'below'},
  {target:'.more-filters-btn',title:'Advanced filters',body:'Expand to filter by time, recent searches, or specific tags.',pos:'below'},
  {target:'.sort-select',title:'Sort your way',body:'Organize by newest, oldest, or alphabetically.',pos:'below'},
];
let tourStep=-1;

function startOnboardTour(){
  tourStep=0;
  showTourStep();
}

function showTourStep(){
  dismissTourPopover();
  if(tourStep<0||tourStep>=TOUR_STEPS.length){endOnboardTour();return;}
  const step=TOUR_STEPS[tourStep];
  const el=document.querySelector(step.target);
  if(!el){tourStep++;showTourStep();return;}
  el.scrollIntoView({behavior:'smooth',block:'center'});
  setTimeout(()=>{
    const rect=el.getBoundingClientRect();
    const pop=document.createElement('div');
    pop.className='tour-popover';
    pop.id='tourPopover';
    pop.innerHTML=`<div class="tour-pop-head"><span class="tour-pop-step">${tourStep+1}/${TOUR_STEPS.length}</span><span class="tour-pop-title">${step.title}</span></div><div class="tour-pop-body">${step.body}</div><div class="tour-pop-actions">${tourStep>0?'<button class="btn-outline tour-pop-btn" onclick="prevTourStep()">Back</button>':''}<button class="btn-outline tour-pop-btn" onclick="endOnboardTour()">Skip</button><button class="btn-primary tour-pop-btn" onclick="nextTourStep()">${tourStep<TOUR_STEPS.length-1?'Next':'Done'}</button></div>`;
    const left=Math.max(12,Math.min(rect.left+rect.width/2-150,window.innerWidth-312));
    const top=rect.bottom+10;
    pop.style.left=left+'px';
    pop.style.top=top+'px';
    el.classList.add('tour-highlight');
    document.body.appendChild(pop);
    requestAnimationFrame(()=>pop.classList.add('in'));
  },120);
}

function nextTourStep(){tourStep++;showTourStep()}
function prevTourStep(){tourStep--;showTourStep()}

function dismissTourPopover(){
  const old=document.getElementById('tourPopover');
  if(old)old.remove();
  document.querySelectorAll('.tour-highlight').forEach(el=>el.classList.remove('tour-highlight'));
}

function endOnboardTour(){
  dismissTourPopover();
  tourStep=-1;
  try{localStorage.setItem(ONBOARD_TOUR_KEY,'true')}catch(e){}
  showToast('Tour complete — you\'re all set!','success');
}

async function loadCurrentUser(){
  try{
    const {response,payload}=await api('/me',{method:'GET'});
    if(!response.ok||!payload?.success){
      currentUser=null;
      renderAuthUi();
      return;
    }
    currentUser=payload.data;
    renderAuthUi();
  }catch(e){
    currentUser=null;
    renderAuthUi();
  }
}

async function performLogout(){
  try{await api('/logout',{method:'POST'})}catch(e){}
  currentUser=null;
  notificationsUnread=0;
  renderAuthUi();
  await refreshBookmarks();
  showToast('Logged out','info');
}

async function refreshBookmarks(){
  await loadBookmarks();
  render();
}

function getFiltered(){
  const q=(document.getElementById('searchInput')?.value||'').toLowerCase();
  const filtered=bookmarks.filter(b=>{
    const tags=Array.isArray(b.tags)?b.tags:[];
    const createdAt=new Date(b.created_at||0).getTime();
    const now=new Date();
    const startOfToday=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
    const startOfWeek=new Date(now.getFullYear(),now.getMonth(),now.getDate()-6).getTime();
    const matchTime=currentTimeFilter==='all'||(Number.isFinite(createdAt)&&(currentTimeFilter==='today'?createdAt>=startOfToday:createdAt>=startOfWeek));
    const matchFilter=currentFilter==='all'||(currentFilter==='starred'&&b.starred)||(currentFilter==='recent')||(currentFilter==='unread')||tags.map(t=>String(t).toLowerCase()).some(t=>t.includes(currentFilter));
    const matchQ=!q||String(b.title||'').toLowerCase().includes(q)||String(b.url||'').toLowerCase().includes(q)||tags.join(' ').toLowerCase().includes(q)||String(b.notes||'').toLowerCase().includes(q)||String(b.description||'').toLowerCase().includes(q);
    return matchFilter&&matchQ&&matchTime;
  });
  return sortBookmarks(filtered);
}

function sortBookmarks(list){
  return [...list].sort((a,b)=>{
    if(currentSort==='newest') return new Date(b.created_at||0)-new Date(a.created_at||0);
    if(currentSort==='oldest') return new Date(a.created_at||0)-new Date(b.created_at||0);
    if(currentSort==='az') return String(a.title||'').localeCompare(String(b.title||''));
    if(currentSort==='za') return String(b.title||'').localeCompare(String(a.title||''));
    return 0;
  });
}

function setSort(val){
  currentSort=val;
  render();
}

function toggleGroupByCategory(){
  groupByCategory=!groupByCategory;
  const btn=document.getElementById('vGroupCat');
  if(btn)btn.classList.toggle('on',groupByCategory);
  render();
}

function toggleAdvancedFilters(){
  advancedFiltersOpen=!advancedFiltersOpen;
  const panel=document.getElementById('advancedFilters');
  const btn=document.getElementById('moreFiltersBtn');
  if(panel)panel.classList.toggle('open',advancedFiltersOpen);
  if(btn)btn.classList.toggle('active',advancedFiltersOpen);
}

function toggleSidebarSection(id){
  const section=document.getElementById(id);
  if(!section)return;
  const toggle=section.previousElementSibling;
  const isCollapsed=section.classList.toggle('collapsed');
  if(toggle)toggle.classList.toggle('collapsed',isCollapsed);
}

function getBookmarkCategory(b){
  const tags=Array.isArray(b.tags)?b.tags:[];
  return tags.length?String(tags[0]).charAt(0).toUpperCase()+String(tags[0]).slice(1):'Uncategorized';
}

function groupByCategories(list){
  const groups={};
  const order=[];
  for(const b of list){
    const cat=getBookmarkCategory(b);
    if(!groups[cat]){groups[cat]=[];order.push(cat);}
    groups[cat].push(b);
  }
  return order.map(cat=>({category:cat,items:groups[cat]}));
}

function renderDynamicTagPills(){
  const container=document.getElementById('dynamicTagPills');
  if(!container)return;
  const freq=computeTagFrequency();
  const topTags=getTopTags(freq,8);
  if(!topTags.length){container.innerHTML='';return;}
  container.innerHTML=topTags.map(tag=>{
    const isActive=currentFilter===tag;
    return `<button class="fpill${isActive?' on':''}" data-filter="${esc(tag)}" onclick="setCategoryFilter('${esc(tag)}')">${esc(tag.charAt(0).toUpperCase()+tag.slice(1))}<span class="fpill-count">${freq[tag]}</span></button>`;
  }).join('');
}

function setCategoryFilter(tag){
  currentFilter=tag;
  document.querySelectorAll('.fpill').forEach(b=>b.classList.toggle('on',b.dataset.filter===tag));
  document.querySelectorAll('.nav-link[data-view]').forEach(l=>l.classList.remove('active'));
  render();
}

function renderSidebarCategories(){
  const container=document.getElementById('sidebarCategories');
  if(!container)return;
  const freq=computeTagFrequency();
  const topTags=getTopTags(freq,10);
  if(!topTags.length){container.innerHTML='<div style="padding:4px 12px;font-size:11px;color:var(--text3)">No categories yet</div>';return;}
  const colorCycle=['c1','c2','c3','c4','c5'];
  container.innerHTML=topTags.map((tag,i)=>{
    const isActive=currentFilter===tag;
    return `<a class="nav-link${isActive?' active':''}" href="#" data-cat="${esc(tag)}" onclick="event.preventDefault();setCategoryFilter('${esc(tag)}')"><span class="stag ${colorCycle[i%5]}" style="width:8px;height:8px;min-width:8px;padding:0;border-radius:50%"></span>${esc(tag.charAt(0).toUpperCase()+tag.slice(1))}<span class="nav-count">${freq[tag]}</span></a>`;
  }).join('');
}

function loadRecentSearches(){
  try{
    const raw=localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed=raw?JSON.parse(raw):[];
    recentSearches=Array.isArray(parsed)?parsed.filter(s=>typeof s==='string'&&s.trim()).slice(0,MAX_RECENT_SEARCHES):[];
  }catch(e){recentSearches=[]}
}

function saveRecentSearches(){
  try{localStorage.setItem(RECENT_SEARCHES_KEY,JSON.stringify(recentSearches.slice(0,MAX_RECENT_SEARCHES)))}catch(e){}
}

function addRecentSearch(term){
  const q=String(term||'').trim();
  if(q.length<2)return;
  recentSearches=[q,...recentSearches.filter(item=>item.toLowerCase()!==q.toLowerCase())].slice(0,MAX_RECENT_SEARCHES);
  saveRecentSearches();
  renderRecentSearchChips();
}

function applyRecentSearch(index){
  const q=recentSearches[index];
  if(!q)return;
  const input=document.getElementById('searchInput');
  if(!input)return;
  input.value=q;
  render();
}

function renderRecentSearchChips(){
  const wrap=document.getElementById('recentSearchWrap');
  const target=document.getElementById('recentSearchChips');
  if(!wrap||!target)return;
  if(!recentSearches.length){
    wrap.classList.remove('show');
    target.innerHTML='';
    return;
  }
  wrap.classList.add('show');
  target.innerHTML=recentSearches.map((term,index)=>`<button type="button" class="search-chip" onclick="applyRecentSearch(${index})">${esc(term)}</button>`).join('');
}

function setTimeFilter(next){
  currentTimeFilter=next;
  document.querySelectorAll('.smart-chip').forEach(chip=>chip.classList.toggle('active',chip.dataset.time===next));
  render();
}

function render(){
  const container=document.getElementById('bookmarkContainer');
  const list=getFiltered();
  document.getElementById('listCount').textContent=list.length;
  document.getElementById('totalCount').textContent=bookmarks.length;
  document.getElementById('starCount').textContent=bookmarks.filter(b=>b.starred).length;
  document.getElementById('importCount').textContent=totalImported;
  document.getElementById('snAll').textContent=bookmarks.length;
  document.getElementById('snStar').textContent=bookmarks.filter(b=>b.starred).length;
  const recentCount=bookmarks.filter(b=>{const d=new Date(b.created_at||0);return(Date.now()-d.getTime())<7*864e5}).length;
  document.getElementById('snRecent').textContent=recentCount;
  document.getElementById('snReadLater').textContent=bookmarks.filter(b=>(b.tags||[]).some(t=>String(t).toLowerCase()==='read later')).length;
  container.className=currentView==='grid'?'bk-grid':'bk-list';
  renderDynamicTagPills();
  renderSidebarCategories();
  if(!list.length){
    if(authBlocked){
      container.innerHTML=`<div class="empty"><div class="empty-icon">🔒</div><div class="empty-t">Login Is Blocking Local Data</div><div class="empty-s">Use local bookmarks when <span class="tech-term">API</span> authentication is unavailable.</div><label class="fallback-toggle-wrap" for="localFallbackToggle"><span class="fallback-toggle-label">Enable Local Bookmarks Fallback</span><input id="localFallbackToggle" class="fallback-toggle" type="checkbox" role="switch" aria-label="Enable Local Bookmarks Fallback" ${localFallbackEnabled?'checked':''} onchange="toggleLocalFallback(this.checked)"/></label><div class="empty-s">This preference is saved in your browser. Ask your admin to enable <span class="tech-term">local fallback</span> support on the server for signed-out access.</div></div>`;
      return;
    }
    const hasBookmarks=bookmarks.length>0;
    const q=(document.getElementById('searchInput')?.value||'').trim();
    if(hasBookmarks){
      container.innerHTML=renderFilterEmptyState(q);
    }else{
      container.innerHTML=renderZeroBookmarksState();
    }
    return;
  }
  if(currentView==='grid'){
    if(groupByCategory){
      const groups=groupByCategories(list);
      container.innerHTML=groups.map(g=>`<div class="cat-section"><div class="cat-header"><span class="cat-dot ${tagDotClass(g.category)}"></span><span class="cat-label">${esc(g.category)}</span><span class="cat-count">${g.items.length}</span></div>${g.items.map(b=>renderGridCard(b)).join('')}</div>`).join('')+renderAssistContent(list);
    } else {
      container.innerHTML=list.map(b=>renderGridCard(b)).join('')+renderAssistContent(list);
    }
    return;
  }
  if(groupByCategory){
    const groups=groupByCategories(list);
    container.innerHTML=groups.map(g=>`<div class="cat-section"><div class="cat-header"><span class="cat-dot ${tagDotClass(g.category)}"></span><span class="cat-label">${esc(g.category)}</span><span class="cat-count">${g.items.length}</span></div>${g.items.map(b=>renderListCard(b)).join('')}</div>`).join('')+renderAssistContent(list);
  } else {
    container.innerHTML=list.map(b=>renderListCard(b)).join('')+renderAssistContent(list);
  }
}

function renderGridCard(b){
  return `<div class="bk-card" onclick="openBookmarkById(${b.id})"><div style="display:flex;align-items:center;gap:10px"><div class="fav-wrap"><img src="https://www.google.com/s2/favicons?domain=${esc(b.domain)}&sz=32" onerror="this.style.display='none'"/></div><div style="flex:1;min-width:0"><div class="bk-title ellipsis">${esc(b.title)}</div><div class="bk-url">${esc(b.domain||b.url)}</div></div>${b.starred?'<span style="color:var(--warn)">⭐</span>':''}</div><div class="bk-foot">${(b.tags||[]).map(t=>`<span class="mtag ${tagClass(String(t))}">${esc(t)}</span>`).join('')}${b.imported?'<span class="ai-badge">📥 Imported</span>':b.ai?'<span class="ai-badge">✦ AI</span>':''}</div><div style="display:flex;justify-content:space-between"><span style="font-size:10px;color:var(--text3)">${esc(b.date)}</span><span style="font-size:10px;color:var(--text3)">${esc(b.readTime||'')}</span></div></div>`;
}

function renderListCard(b){
  return `<div class="bk-preview-card" data-id="${b.id}" onclick="openBookmarkById(${b.id})"><div class="bk-preview-main"><div class="bk-preview-fav"><img src="https://www.google.com/s2/favicons?domain=${esc(b.domain)}&sz=32" onerror="this.style.display='none'"/></div><div class="bk-preview-body"><div class="bk-preview-top"><div class="bk-preview-title">${esc(b.title)}</div>${b.starred?'<span title="Starred" style="color:var(--warn);font-size:12px">★</span>':''}</div><div class="bk-preview-url">${esc(b.domain||b.url)}</div><div class="bk-preview-excerpt">${esc(bookmarkExcerpt(b))}</div><div class="bk-preview-meta"><div class="tag-dots">${(b.tags||[]).slice(0,5).map(t=>`<span class="tag-dot ${tagDotClass(t)}" title="${esc(String(t))}" aria-label="${esc(String(t))}"></span>`).join('')}</div>${b.imported?'<span class="ai-badge">📥 Imported</span>':b.ai?'<span class="ai-badge">✦ AI</span>':''}<span class="bk-preview-date">${esc(b.date)}</span></div></div></div><div class="bk-preview-actions"><button class="ib star" title="Star" onclick="toggleStar(event,${b.id})">${b.starred?'⭐':'☆'}</button><button class="ib" title="Edit" onclick="editBk(event,${b.id})"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="ib del" title="Delete" onclick="deleteBk(event,${b.id})"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button></div></div>`;
}

async function toggleStar(e,id){
  e.stopPropagation();
  const b=bookmarks.find(x=>x.id===id);if(!b)return;
  try{
    const {response,payload}=await api(`/bookmarks/${id}`,{method:'PATCH',body:JSON.stringify({is_favorite:!b.starred})});
    if(!response.ok||!payload?.success){showToast(payload?.error||'Failed to update','warn');return}
    await refreshBookmarks();
    showToast(!b.starred?'⭐ Starred!':'Removed from Starred','info');
  }catch(err){showToast('Network error while updating','warn')}
}

async function deleteBk(e,id){
  e.stopPropagation();
  try{
    const {response,payload}=await api(`/bookmarks/${id}`,{method:'DELETE'});
    if(!response.ok||!payload?.success){showToast(payload?.error||'Delete failed','warn');return}
    await refreshBookmarks();
    showToast('Bookmark deleted','warn');
  }catch(err){showToast('Network error while deleting','warn')}
}

function openUrl(u){window.open(u,'_blank','noopener,noreferrer')}
function openBookmarkById(id){const b=bookmarks.find(x=>x.id===id);if(b)openUrl(b.url)}

function editBk(e,id){
  e.stopPropagation();
  const b=bookmarks.find(x=>x.id===id);
  if(!b)return;
  openAddModal(b);
}

function filterByTag(t){currentFilter=t;document.querySelectorAll('.fpill').forEach(b=>b.classList.remove('on'));render();showToast(`Filtered by "${t}"`, 'info')}
function setView(v){currentView=v;document.getElementById('vList').classList.toggle('on',v==='list');document.getElementById('vGrid').classList.toggle('on',v==='grid');render()}

document.querySelectorAll('.fpill').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.fpill').forEach(b=>b.classList.remove('on'));btn.classList.add('on');currentFilter=btn.dataset.filter;document.querySelectorAll('.nav-link[data-view]').forEach(l=>l.classList.remove('active'));if(currentFilter==='all')document.querySelector('.nav-link[data-view=\"all\"]')?.classList.add('active');render()})});
document.querySelectorAll('.nav-link[data-view]').forEach(link=>{link.addEventListener('click',e=>{e.preventDefault();document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));link.classList.add('active');currentFilter=link.dataset.view;document.querySelectorAll('.fpill').forEach(b=>b.classList.toggle('on',b.dataset.filter===currentFilter||(!['all','starred'].includes(currentFilter)&&b.dataset.filter==='all')));closeMobileSidebar();render()})});
document.querySelectorAll('.smart-chip').forEach(chip=>{chip.addEventListener('click',()=>setTimeFilter(chip.dataset.time||'all'))});
document.getElementById('searchInput').addEventListener('input',render);
document.getElementById('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addRecentSearch(e.target.value)}});
document.getElementById('searchInput').addEventListener('blur',e=>addRecentSearch(e.target.value));

// ══════════════════════════════════════════════
// MODAL SYSTEM
// ══════════════════════════════════════════════
function openAddModal(bookmark){
  editingBookmarkId=bookmark?.id??null;
  const isEdit=Boolean(editingBookmarkId);
  document.getElementById('addModalTitle').textContent=isEdit?'Edit Bookmark':'Add Bookmark';
  document.getElementById('addModalSub').textContent=isEdit?'Update bookmark details':'Save and organize a new link';
  document.getElementById('saveBookmarkBtnText').textContent=isEdit?'Update Bookmark':'Save Bookmark';
  document.getElementById('mUrl').value=bookmark?.url||'';
  document.getElementById('mTitle').value=bookmark?.title||'';
  document.getElementById('mDescription').value=bookmark?.description||'';
  document.getElementById('mNotes').value=bookmark?.notes||'';
  document.getElementById('mDomain').value=bookmark?.domain||safeDomain(bookmark?.url||'');
  const selectedTags=(bookmark?.tags||[]).map(t=>String(t).toLowerCase());
  document.querySelectorAll('#modalTags .modal-tag').forEach(t=>{
    const clean=t.textContent.replace(/^.+\s/,'').trim().toLowerCase();
    t.classList.toggle('sel',selectedTags.includes(clean));
  });
  document.getElementById('addModal').classList.add('open');
  setTimeout(()=>document.getElementById('mUrl').focus(),100);
}

function closeModal(id){
  document.getElementById(id).classList.remove('open');
  if(id==='addModal'){
    editingBookmarkId=null;
  }
}

function openImport(tab){
  document.getElementById('importModal').classList.add('open');
  if(tab)switchImportTab(tab);
}
function normalizeModalUrl(input){
  const raw=String(input||'').trim();
  if(!raw)return'';
  if(/^https?:\/\//i.test(raw))return raw;
  return `https://${raw}`;
}

function inferDomainLoose(input){
  const raw=String(input||'').trim();
  if(!raw)return'';
  const normalized=normalizeModalUrl(raw);
  try{return new URL(normalized).hostname.replace('www.','')}catch(e){return raw.replace(/^https?:\/\//i,'').split('/')[0]}
}

function fallbackMetadataFromUrl(url){
  const domain=inferDomainLoose(url);
  const base=(domain.split('.')[0]||domain||'website').replace(/[-_]/g,' ');
  const title=base?`${base.charAt(0).toUpperCase()}${base.slice(1)} - Website`:'Website';
  return { title, description: domain?`Saved from ${domain}`:'Saved link' };
}

async function modalFetch(){
  const rawUrl=document.getElementById('mUrl').value.trim();
  if(!rawUrl){showToast('Enter a URL first','warn');return;}

  const fetchBtn=document.querySelector('.fetch-btn');
  if(fetchBtn){fetchBtn.classList.add('is-loading');fetchBtn.innerHTML='<span class="spinner-inline"></span> Detecting…';fetchBtn.disabled=true;}
  try{
    const encoded=encodeURIComponent(rawUrl);
    const {response,payload}=await api(`/url-metadata?url=${encoded}`,{method:'GET'});
    if(response.ok&&payload?.success&&payload.data){
      const meta=payload.data;
      const normalized=String(meta.url||normalizeModalUrl(rawUrl));
      document.getElementById('mUrl').value=normalized;
      document.getElementById('mDomain').value=inferDomainLoose(normalized);
      document.getElementById('mTitle').value=String(meta.title||fallbackMetadataFromUrl(normalized).title).trim();
      document.getElementById('mDescription').value=String(meta.description||fallbackMetadataFromUrl(normalized).description).trim();
      showToast(`Auto-filled (${String(meta.protocol||'auto').toUpperCase()})`,'success');
      return;
    }

    const normalized=normalizeModalUrl(rawUrl);
    const fallback=fallbackMetadataFromUrl(normalized);
    document.getElementById('mUrl').value=normalized;
    document.getElementById('mDomain').value=inferDomainLoose(normalized);
    if(!document.getElementById('mTitle').value.trim())document.getElementById('mTitle').value=fallback.title;
    if(!document.getElementById('mDescription').value.trim())document.getElementById('mDescription').value=fallback.description;
    showToast(payload?.error||'Basic details filled','warn');
  }catch(e){
    const normalized=normalizeModalUrl(rawUrl);
    const fallback=fallbackMetadataFromUrl(normalized);
    document.getElementById('mUrl').value=normalized;
    document.getElementById('mDomain').value=inferDomainLoose(normalized);
    if(!document.getElementById('mTitle').value.trim())document.getElementById('mTitle').value=fallback.title;
    if(!document.getElementById('mDescription').value.trim())document.getElementById('mDescription').value=fallback.description;
    showToast('Could not fetch full metadata, filled basic details','warn');
  }finally{
    if(fetchBtn){fetchBtn.classList.remove('is-loading');fetchBtn.innerHTML='Auto-fill';fetchBtn.disabled=false;}
  }
}
document.getElementById('mUrl').addEventListener('input',function(){document.getElementById('mDomain').value=inferDomainLoose(this.value)});
async function saveBookmark(){
  const isEdit=Boolean(editingBookmarkId);
  const url=document.getElementById('mUrl').value.trim();
  if(!url){showToast('Enter a URL','warn');return;}
  const title=document.getElementById('mTitle').value.trim();
  const description=document.getElementById('mDescription').value.trim();
  const notes=document.getElementById('mNotes').value.trim();
  const tags=[...document.querySelectorAll('#modalTags .modal-tag.sel')].map(t=>t.textContent.replace(/^.+\s/,'').trim());

  const payload={
    url,
    title:title||undefined,
    description:description||undefined,
    notes:notes||undefined,
    tags:tags.length?tags:undefined
  };

  const endpoint=editingBookmarkId?`/bookmarks/${editingBookmarkId}`:'/bookmarks';
  const method=editingBookmarkId?'PATCH':'POST';

  try{
    const {response,payload:result}=await api(endpoint,{method,body:JSON.stringify(payload)});
    if(!response.ok||!result?.success){showToast(result?.error||'Save failed','warn');return}
    closeModal('addModal');
    const savedUrl=url;
    document.querySelectorAll('#modalTags .modal-tag').forEach(t=>t.classList.remove('sel'));
    ['mUrl','mTitle','mDescription','mNotes','mDomain'].forEach(id=>document.getElementById(id).value='');
    await refreshBookmarks();
    highlightSavedCard(savedUrl);
    showToast(isEdit?'Bookmark updated':'Bookmark saved','success');
  }catch(err){showToast('Network error while saving','warn')}
}

let quickSaving=false;
let quickDraft=null;
let quickLastSavedUrl='';

function normalizeQuickUrl(input){
  const raw=String(input||'').trim();
  if(!raw)return'';
  const withProtocol=/^https?:\/\//i.test(raw)?raw:`https://${raw}`;
  try{
    const parsed=new URL(withProtocol);
    if(!/^https?:$/.test(parsed.protocol))return'';
    return parsed.toString();
  }catch(e){return''}
}

function suggestQuickTags(url,title,description=''){
  const value=`${url} ${title} ${description}`.toLowerCase();
  const tags=[];
  if(/github|gitlab|bitbucket|docs|developer|api/.test(value))tags.push('dev');
  if(/figma|dribbble|behance|design|ui|ux/.test(value))tags.push('design');
  if(/openai|ai|llm|ml|huggingface/.test(value))tags.push('ai');
  if(/documentation|guide|reference/.test(value))tags.push('docs');
  if(/youtube|video|podcast/.test(value))tags.push('video');
  if(/tools?|app|productivity|extension/.test(value))tags.push('tools');
  if(tags.length===0)tags.push('read-later');
  return [...new Set(tags)].slice(0,4);
}

function buildQuickDraft(url){
  const domain=safeDomain(url);
  const hostLabel=domain.split('.')[0]||'link';
  const pathLabel=url.split('/').filter(Boolean).slice(1,2).join(' ').replace(/[-_]/g,' ').trim();
  const titleBase=(hostLabel.charAt(0).toUpperCase()+hostLabel.slice(1))+(pathLabel?` - ${pathLabel}`:'');
  const title=titleBase.length>70?`${titleBase.slice(0,67)}...`:titleBase;
  const tags=suggestQuickTags(url,title,`Saved from ${domain}`);
  return {
    url,
    title,
    description:`Saved from ${domain}`,
    notes:'',
    tags,
    favicon:`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
  };
}

async function enrichQuickDraft(rawUrl){
  const normalized=normalizeQuickUrl(rawUrl);
  if(!normalized)return null;
  const fallback=buildQuickDraft(normalized);
  try{
    const {response,payload}=await api(`/url-metadata?url=${encodeURIComponent(normalized)}`,{method:'GET'});
    if(!response.ok||!payload?.success||!payload?.data){
      return fallback;
    }
    const resolvedUrl=String(payload.data.url||normalized);
    const resolvedTitle=String(payload.data.title||'').trim()||fallback.title;
    const resolvedDescription=String(payload.data.description||'').trim()||fallback.description;
    return {
      ...fallback,
      url:resolvedUrl,
      title:resolvedTitle,
      description:resolvedDescription,
      tags:suggestQuickTags(resolvedUrl,resolvedTitle,resolvedDescription),
      favicon:`https://www.google.com/s2/favicons?domain=${encodeURIComponent(safeDomain(resolvedUrl))}&sz=32`
    };
  }catch(e){
    return fallback;
  }
}

function renderQuickMeta(draft,message){
  const textEl=document.getElementById('quickMetaText');
  const tagsEl=document.getElementById('quickTagList');
  const favEl=document.getElementById('quickFavicon');
  if(!textEl||!tagsEl||!favEl)return;
  if(!draft){
    textEl.textContent=message||'Paste a link to auto-detect title, favicon, and tags.';
    tagsEl.innerHTML='';
    favEl.removeAttribute('src');
    return;
  }
  textEl.textContent=message||`${draft.title} • ${safeDomain(draft.url)}`;
  favEl.src=draft.favicon;
  tagsEl.innerHTML=(draft.tags||[]).map(tag=>`<span class="quick-tag">${esc(tag)}</span>`).join('');
  if(draft.tags&&draft.tags.length){
    quickSuggestedTags=[...new Set([...quickSuggestedTags,...draft.tags])];
    for(const t of draft.tags){if(!quickSelectedTags.includes(t))quickSelectedTags.push(t);}
    renderTagManager();
  }
}

let quickSaveSnapshot=null;
let quickSavedTimerId=null;

function getExistingUrlSet(){
  const s=new Set();
  for(const bm of bookmarks){
    if(bm.url){try{s.add(new URL(bm.url.startsWith('http')?bm.url:'https://'+bm.url).href.replace(/\/+$/,'').toLowerCase());}catch{}}
  }
  return s;
}

function checkQuickDuplicate(raw){
  const warn=document.getElementById('quickDupWarning');
  if(!warn)return;
  const url=normalizeQuickUrl(raw);
  if(!url){warn.style.display='none';warn.textContent='';return;}
  const set=getExistingUrlSet();
  let norm='';
  try{norm=new URL(url).href.replace(/\/+$/,'').toLowerCase();}catch{}
  if(norm&&set.has(norm)){
    warn.textContent='\u26A0 This URL is already in your bookmarks.';
    warn.style.display='block';
  }else{
    warn.style.display='none';
    warn.textContent='';
  }
}

async function smartQuickSave(rawInput,keepForm){
  const url=normalizeQuickUrl(rawInput);
  if(!url){
    showToast('Paste a valid URL to save','warn');
    return;
  }
  if(quickSaving||url===quickLastSavedUrl){
    return;
  }
  quickSaving=true;
  const metaEl=document.getElementById('quickMeta');
  if(metaEl)metaEl.classList.add('is-loading');
  renderQuickMeta(null,'Detecting title, tags…');
  quickDraft=await enrichQuickDraft(url);
  if(metaEl)metaEl.classList.remove('is-loading');
  if(!quickDraft){
    quickSaving=false;
    showToast('Paste a valid URL to save','warn');
    return;
  }
  renderQuickMeta(quickDraft,`Ready: ${quickDraft.title}`);
  showToast('Saving...','info');
  try{
    const {response,payload}=await api('/bookmarks',{method:'POST',body:JSON.stringify({url:quickDraft.url,title:quickDraft.title,description:quickDraft.description,tags:[...new Set([...(quickDraft.tags||[]),...quickSelectedTags])],favicon:quickDraft.favicon})});
    if(!response.ok||!payload?.success){
      showToast(payload?.error||'Auto-save failed','warn');
      return;
    }
    // snapshot for undo
    quickSaveSnapshot={url:quickDraft.url,title:quickDraft.title,description:quickDraft.description,tags:[...new Set([...(quickDraft.tags||[]),...quickSelectedTags])],favicon:quickDraft.favicon};
    quickLastSavedUrl=url;
    if(keepForm){
      document.getElementById('quickUrl').value='';
      const dupW=document.getElementById('quickDupWarning');if(dupW){dupW.style.display='none';dupW.textContent='';}
      renderQuickMeta(quickDraft,'Saved! Enter another URL.');
    }else{
      clearQuickForm();
      renderQuickMeta(quickDraft,'Saved. Paste another URL to continue.');
    }
    await refreshBookmarks();
    highlightSavedCard(quickDraft.url);
    renderTagManager();
    showQuickSavedBanner();
    showToast('Bookmark saved','success');
  }catch(err){
    showToast('Network error while saving','warn');
  }finally{
    quickSaving=false;
  }
}

function showQuickSavedBanner(){
  const banner=document.getElementById('quickSavedBanner');
  if(!banner)return;
  banner.style.display='flex';
  if(quickSavedTimerId)clearTimeout(quickSavedTimerId);
  quickSavedTimerId=setTimeout(()=>{banner.style.display='none';quickSaveSnapshot=null;quickSavedTimerId=null;},5000);
}

function clearQuickForm(){
  const input=document.getElementById('quickUrl');
  if(input)input.value='';
  quickSelectedTags=[];quickSuggestedTags=[];quickTagSearchQuery='';quickDraft=null;quickLastSavedUrl='';
  const dupW=document.getElementById('quickDupWarning');if(dupW){dupW.style.display='none';dupW.textContent='';}
  const errEl=document.getElementById('quickUrlError');if(errEl)errEl.style.display='none';
  const wrap=document.getElementById('quickSmartInput');if(wrap)wrap.classList.remove('is-valid','is-invalid');
  const check=document.getElementById('quickUrlCheck');if(check)check.innerHTML='';
  renderTagManager();
  renderQuickMeta(null);
}

function quickSaveAndAnother(){
  const input=document.getElementById('quickUrl');
  if(input)smartQuickSave(input.value,true);
}

function quickSaveAndClose(){
  const input=document.getElementById('quickUrl');
  if(input)smartQuickSave(input.value,false);
}

async function undoQuickSave(){
  if(!quickSaveSnapshot)return;
  const banner=document.getElementById('quickSavedBanner');
  if(banner)banner.style.display='none';
  if(quickSavedTimerId){clearTimeout(quickSavedTimerId);quickSavedTimerId=null;}
  // find and delete the saved bookmark
  const snap=quickSaveSnapshot;
  quickSaveSnapshot=null;
  try{
    const match=bookmarks.find(bm=>bm.url===snap.url);
    if(match){
      await api('/bookmarks/'+encodeURIComponent(match.id),{method:'DELETE'});
      await refreshBookmarks();
      // restore form
      const input=document.getElementById('quickUrl');
      if(input)input.value=snap.url;
      quickSelectedTags=[...(snap.tags||[])];
      renderTagManager();
      showToast('Bookmark undone','info');
    }
  }catch{showToast('Undo failed','warn');}
}

function openQuickDetails(){
  const typedUrl=normalizeQuickUrl(document.getElementById('quickUrl')?.value||'');
  const draft=typedUrl?buildQuickDraft(typedUrl):quickDraft;
  if(draft){
    openAddModal({
      url:draft.url,
      title:draft.title,
      description:draft.description,
      notes:draft.notes,
      tags:draft.tags
    });
    return;
  }
  openAddModal();
}

function setupQuickSmartInput(){
  const input=document.getElementById('quickUrl');
  if(!input)return;
  // Update keyboard shortcut hint for Mac
  const kbdHint=document.querySelector('.qa-kbd-hint');
  if(kbdHint&&/Mac|iPhone|iPad/.test(navigator.platform))kbdHint.textContent='\u2318V';
  input.addEventListener('paste',()=>{setTimeout(()=>{validateQuickUrl(input.value);smartQuickSave(input.value)},20)});
  input.addEventListener('input',()=>validateQuickUrl(input.value));
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      e.preventDefault();
      smartQuickSave(input.value);
    }
  });
}

function validateQuickUrl(value){
  const raw=String(value||'').trim();
  const wrap=document.getElementById('quickSmartInput');
  const check=document.getElementById('quickUrlCheck');
  const errorEl=document.getElementById('quickUrlError');
  if(!wrap||!check)return;
  wrap.classList.remove('is-valid','is-invalid');
  if(!raw){check.innerHTML='';if(errorEl)errorEl.style.display='none';checkQuickDuplicate('');return;}
  const valid=!!normalizeQuickUrl(raw);
  wrap.classList.add(valid?'is-valid':'is-invalid');
  check.className='quick-url-check '+(valid?'is-valid':'is-invalid');
  check.innerHTML=valid
    ?'<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>'
    :'<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  if(errorEl)errorEl.style.display=valid?'none':'';
  if(valid)checkQuickDuplicate(raw);
  else checkQuickDuplicate('');
}

async function pasteQuickUrl(){
  try{
    const text=await navigator.clipboard.readText();
    if(!text)return;
    const input=document.getElementById('quickUrl');
    if(input){input.value=text.trim();validateQuickUrl(text.trim());smartQuickSave(text.trim());}
  }catch(e){/* clipboard API not available */}
}

// ── Tag Manager ──
let quickSelectedTags=[];
let quickSuggestedTags=[];
let quickTagSearchQuery='';

function computeTagFrequency(){
  const freq={};
  for(const bm of bookmarks){
    for(const t of (Array.isArray(bm.tags)?bm.tags:[])){
      const key=String(t).toLowerCase().trim();
      if(key)freq[key]=(freq[key]||0)+1;
    }
  }
  return freq;
}

function getTopTags(freq,limit=20){
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([t])=>t);
}

function renderTagManager(){
  const scroll=document.getElementById('tagScroll');
  const searchInput=document.getElementById('tagSearchInput');
  if(!scroll)return;
  const freq=computeTagFrequency();
  const topTags=getTopTags(freq);
  const merged=[...new Set([...quickSuggestedTags,...topTags])];
  if(searchInput)searchInput.style.display=merged.length>6?'':'none';
  const q=quickTagSearchQuery.toLowerCase();
  const visible=q?merged.filter(t=>t.includes(q)):merged;
  if(!visible.length){scroll.innerHTML='<span style=\"font-size:12px;color:var(--text3)\">No matching tags.</span>';return;}
  scroll.innerHTML=visible.map(tag=>{
    const active=quickSelectedTags.includes(tag);
    const suggested=quickSuggestedTags.includes(tag);
    const count=freq[tag];
    return `<button class="tag-chip${active?' is-active':''}${suggested?' is-suggested':''}" type="button" onclick="toggleQuickTag('${esc(tag)}')" aria-label="${active?'Remove':'Add'} tag ${esc(tag)}" aria-pressed="${active}">${esc(tag)}${count?`<span class="tag-freq">${count}</span>`:''}</button>`;
  }).join('');
}

function toggleQuickTag(tag){
  if(quickSelectedTags.includes(tag)){
    quickSelectedTags=quickSelectedTags.filter(t=>t!==tag);
  }else{
    quickSelectedTags.push(tag);
  }
  renderTagManager();
}

function addCustomQuickTag(){
  const input=document.getElementById('customTagInput');
  if(!input)return;
  const raw=input.value.trim().toLowerCase().replace(/[^a-z0-9\\s-]/g,'').replace(/\\s+/g,'-').slice(0,50);
  if(!raw)return;
  if(!quickSuggestedTags.includes(raw))quickSuggestedTags.push(raw);
  if(!quickSelectedTags.includes(raw))quickSelectedTags.push(raw);
  input.value='';
  renderTagManager();
}

function setupTagManager(){
  const searchInput=document.getElementById('tagSearchInput');
  if(searchInput){
    searchInput.addEventListener('input',()=>{quickTagSearchQuery=searchInput.value;renderTagManager()});
  }
  const customInput=document.getElementById('customTagInput');
  if(customInput){
    customInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addCustomQuickTag()}});
  }
  renderTagManager();
}

function toggleQuickDetails(){
  const container=document.getElementById('quickDetailsExpand');
  const btn=document.getElementById('quickExpandBtn');
  if(!container)return;
  if(btn&&btn.getAttribute('aria-expanded')==='false'){
    container.innerHTML='<div class="qa-details-fields"><input class="fi" id="quickDescInput" placeholder="e.g., A handy resource for..." aria-label="Description"/><textarea class="fi" id="quickNotesInput" rows="3" placeholder="e.g., Check out the API docs section..." aria-label="Notes"></textarea></div>';
    btn.remove();
  }
}

function toggleTag(el){el.classList.toggle('sel')}
function closeBanner(){const b=document.getElementById('onboardBanner');if(!b)return;b.style.transition='all .3s ease';b.style.opacity='0';b.style.transform='translateY(-8px)';setTimeout(()=>b.remove(),300)}

// ══════════════════════════════════════════════
// IMPORT TABS
// ══════════════════════════════════════════════
document.querySelectorAll('.im-tab').forEach(tab=>{
  tab.addEventListener('click',()=>switchImportTab(tab.dataset.tab));
});
function switchImportTab(tabId){
  document.querySelectorAll('.im-tab').forEach(t=>{t.classList.toggle('active',t.dataset.tab===tabId)});
  document.querySelectorAll('.im-section').forEach(s=>{s.classList.toggle('active',s.id==='tab-'+tabId)});
}

// ══════════════════════════════════════════════
// DRAG & DROP ZONES
// ══════════════════════════════════════════════
function setupDropZone(zoneId,fileInputId,handler){
  const zone=document.getElementById(zoneId);if(!zone)return;
  zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-over')});
  zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
  zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag-over');const f=e.dataTransfer.files[0];if(f)handleFile(f,handler)});
}
setupDropZone('browserDrop','browserFile',parseBrowserHTML);
setupDropZone('appsDrop','appsFile',parseAppsFile);
setupDropZone('csvDrop','csvFile',parseCSVJSON);
setupDropZone('opmlDrop','opmlFile',parseOPML);

function handleFile(file,handler){
  const reader=new FileReader();
  reader.onload=e=>handler(e.target.result,file.name);
  reader.readAsText(file);
}
function handleBrowserFile(e){const f=e.target.files[0];if(f)handleFile(f,parseBrowserHTML)}
function handleAppsFile(e){const f=e.target.files[0];if(f)handleFile(f,parseAppsFile)}
function handleCSVFile(e){const f=e.target.files[0];if(f)handleFile(f,parseCSVJSON)}
function handleOPMLFile(e){const f=e.target.files[0];if(f)handleFile(f,parseOPML)}

// ══════════════════════════════════════════════
// PARSERS
// ══════════════════════════════════════════════

// Browser HTML (Netscape Bookmark Format)
function parseBrowserHTML(content,fname){
  const doc=new DOMParser().parseFromString(content,'text/html');
  const links=[...doc.querySelectorAll('a')];
  const items=links.map(a=>{
    const url=a.href;if(!url||!url.startsWith('http'))return null;
    const folder=a.closest('dl')?.previousElementSibling?.textContent?.trim()||'Imported';
    return{url,title:a.textContent.trim()||url,tags:[folder.substring(0,20)],notes:'',domain:safeDomain(url),folder};
  }).filter(Boolean);
  openPreview(items,`Chrome/Firefox Export`,fname);
}

// Apps file (Pocket HTML, Raindrop JSON, etc.)
function parseAppsFile(content,fname){
  const sel=document.querySelector('#sourceGrid .source-card.sel');
  const source=sel?.querySelector('.source-name')?.textContent||'App';
  let items=[];
  if(fname.endsWith('.json')){
    try{
      const data=JSON.parse(content);
      const arr=Array.isArray(data)?data:(data.items||data.bookmarks||data.data||[]);
      items=arr.map(d=>({
        url:d.url||d.href||d.link||'',
        title:d.title||d.name||d.label||d.url,
        tags:[...(Array.isArray(d.tags)?d.tags:[(d.tags||d.collection||'Imported')].filter(Boolean))],
        notes:d.excerpt||d.description||d.note||'',
        domain:safeDomain(d.url||d.href||d.link||''),
        folder:d.collection||d.folder||source
      })).filter(d=>d.url.startsWith('http'));
    }catch(e){showToast('Invalid JSON file','warn');return}
  } else {
    // HTML (Pocket / Instapaper format)
    const doc=new DOMParser().parseFromString(content,'text/html');
    const links=[...doc.querySelectorAll('a')];
    items=links.map(a=>{
      const url=a.href||a.getAttribute('href');if(!url||!url.startsWith('http'))return null;
      const tags=(a.getAttribute('tags')||'').split(',').filter(Boolean);
      return{url,title:a.textContent.trim()||url,tags:tags.length?tags:[source],notes:'',domain:safeDomain(url),folder:source};
    }).filter(Boolean);
  }
  openPreview(items,`${source} Import`,fname);
}

// CSV / JSON
function parseCSVJSON(content,fname){
  let items=[];
  if(fname.endsWith('.json')){
    try{
      const data=JSON.parse(content);
      const arr=Array.isArray(data)?data:[];
      items=arr.map(d=>({url:d.url||'',title:d.title||d.url,tags:Array.isArray(d.tags)?d.tags:(d.tags||'').split(',').filter(Boolean),notes:d.notes||d.description||'',domain:safeDomain(d.url||'')})).filter(d=>d.url.startsWith('http'));
    }catch(e){showToast('Invalid JSON','warn');return}
  } else {
    const lines=content.split('\n').filter(l=>l.trim());
    const headers=lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/"/g,''));
    const uIdx=headers.findIndex(h=>h==='url'||h==='link'||h==='href');
    const tIdx=headers.findIndex(h=>h==='title'||h==='name');
    const taIdx=headers.findIndex(h=>h==='tags'||h==='tag');
    const nIdx=headers.findIndex(h=>h==='notes'||h==='description'||h==='note');
    if(uIdx<0){showToast('CSV must have a "url" column','warn');return}
    items=lines.slice(1).map(line=>{
      const cols=parseCSVLine(line);
      const url=(cols[uIdx]||'').replace(/"/g,'').trim();
      if(!url.startsWith('http'))return null;
      const title=(cols[tIdx]||url).replace(/"/g,'').trim();
      const tags=(taIdx>=0?(cols[taIdx]||'').replace(/"/g,''):'').split(',').filter(Boolean);
      return{url,title,tags:tags.length?tags:['CSV Import'],notes:nIdx>=0?(cols[nIdx]||'').replace(/"/g,''):'',domain:safeDomain(url)};
    }).filter(Boolean);
  }
  openPreview(items,'CSV/JSON Import',fname);
}

// OPML
function parseOPML(content,fname){
  const doc=new DOMParser().parseFromString(content,'application/xml');
  const outlines=[...doc.querySelectorAll('outline[xmlUrl],outline[htmlUrl]')];
  const items=outlines.map(o=>{
    const url=o.getAttribute('htmlUrl')||o.getAttribute('xmlUrl')||'';
    if(!url.startsWith('http'))return null;
    const title=o.getAttribute('title')||o.getAttribute('text')||url;
    const folder=o.parentElement?.getAttribute('title')||'RSS/Feeds';
    return{url,title,tags:['RSS','Feeds',folder.substring(0,15)],notes:o.getAttribute('description')||'',domain:safeDomain(url),folder};
  }).filter(Boolean);
  openPreview(items,'OPML / RSS Import',fname);
}

// Helpers
function parseCSVLine(line){const result=[];let cur='',inQ=false;for(let c of line){if(c==='"'){inQ=!inQ}else if(c===','&&!inQ){result.push(cur);cur=''}else cur+=c}result.push(cur);return result}

// ══════════════════════════════════════════════
// PREVIEW MODAL
// ══════════════════════════════════════════════
function openPreview(items,source,fname){
  importPreviewItems=items;
  selectedPreviewIds=new Set(items.map((_,i)=>i));
  document.getElementById('pmTitle').textContent=`Preview — ${source}`;
  document.getElementById('pmMeta').textContent=`${fname} · ${items.length} links found`;
  document.getElementById('totalParsed').textContent=items.length;
  closeModal('importModal');
  renderPreview('');
  document.getElementById('previewModal').classList.add('open');
  showToast(`Parsed ${items.length} bookmarks — review before importing`,'info');
}

function renderPreview(q){
  const list=document.getElementById('previewList');
  const filtered=importPreviewItems.filter((it,i)=>!q||it.title.toLowerCase().includes(q.toLowerCase())||it.url.toLowerCase().includes(q.toLowerCase()));
  updatePreviewCount();
  list.innerHTML=filtered.map((it,idx)=>{
    const realIdx=importPreviewItems.indexOf(it);
    const checked=selectedPreviewIds.has(realIdx);
    const existing=bookmarks.find(b=>b.url===it.url);
    return`<div class="preview-item${checked?' checked':''}" onclick="togglePreview(${realIdx})">
      <div class="pi-check">${checked?'✓':''}</div>
      <div class="pi-fav"><img src="https://www.google.com/s2/favicons?domain=${it.domain}&sz=16" style="width:16px;height:16px" onerror="this.style.display='none'"/></div>
      <div class="pi-body">
        <div class="pi-title">${it.title}${existing?'<span style="font-size:9px;color:var(--warn);margin-left:6px">⚠ exists</span>':''}</div>
        <div class="pi-url">${it.url}</div>
      </div>
      ${it.folder?`<span class="pi-folder">${it.folder}</span>`:''}
      <div style="display:flex;gap:4px;flex-wrap:wrap;flex-shrink:0;max-width:120px">${it.tags.slice(0,2).map(t=>`<span class="mtag ${tagClass(t)}">${t}</span>`).join('')}</div>
    </div>`;
  }).join('');
}

function togglePreview(idx){
  selectedPreviewIds.has(idx)?selectedPreviewIds.delete(idx):selectedPreviewIds.add(idx);
  renderPreview(document.getElementById('previewSearch').value);
}
function selectAllPreview(){selectedPreviewIds=new Set(importPreviewItems.map((_,i)=>i));renderPreview(document.getElementById('previewSearch').value)}
function deselectAllPreview(){selectedPreviewIds.clear();renderPreview(document.getElementById('previewSearch').value)}
function filterPreview(q){renderPreview(q)}
function updatePreviewCount(){
  const n=selectedPreviewIds.size;
  document.getElementById('selCount').textContent=`${n} selected`;
  document.getElementById('selectedFinal').textContent=n;
  document.getElementById('pmImportBtn').textContent=`Import ${n} Selected`;
}

async function commitImport(){
  const skipDupes=document.getElementById('skipDupes').checked;
  const existingUrls=new Set(bookmarks.map(b=>b.url));
  let added=0;
  let failed=0;
  for(const idx of selectedPreviewIds){
    const it=importPreviewItems[idx];
    if(!it) continue;
    if(skipDupes&&existingUrls.has(it.url)) continue;

    const payload={
      url:it.url,
      title:it.title||it.domain||undefined,
      tags:Array.isArray(it.tags)&&it.tags.length?it.tags:['Imported'],
      notes:it.notes||undefined
    };

    try{
      const {response,payload:result}=await api('/bookmarks',{method:'POST',body:JSON.stringify(payload)});
      if(!response.ok||!result?.success){failed++;continue;}
    }catch(e){failed++;continue;}

    existingUrls.add(it.url);
    added++;
  }

  totalImported+=added;
  await refreshBookmarks();
  closeModal('previewModal');
  if(failed>0){
    showToast(`Imported ${added}, failed ${failed}`,'warn');
  }else{
    showToast(`✓ Imported ${added} bookmarks successfully!`,'success');
  }
  importPreviewItems=[];selectedPreviewIds.clear();
}

// ══════════════════════════════════════════════
// BOOKMARKLET
// ══════════════════════════════════════════════
const BOOKMARKLET_CODE=`javascript:(function(){var url=encodeURIComponent(location.href);var title=encodeURIComponent(document.title);window.open('https://ai.shivaprogramming.com/bookmarks?import=1&url='+url+'&title='+title,'_blank','width=480,height=600')})();`;
document.addEventListener('DOMContentLoaded',()=>{
  const el=document.getElementById('bookmarkletCode');
  if(el)el.textContent=BOOKMARKLET_CODE;
  const link=document.getElementById('bookmarkletLink');
  if(link)link.href=BOOKMARKLET_CODE;
});
window.addEventListener('load',()=>{
  const el=document.getElementById('bookmarkletCode');
  if(el)el.textContent=BOOKMARKLET_CODE;
  const link=document.getElementById('bookmarkletLink');
  if(link)link.href=BOOKMARKLET_CODE;
});
function copyBookmarklet(){copyText(BOOKMARKLET_CODE);showToast('Bookmarklet code copied!','success')}

// Handle bookmarklet URL params on page load
const sp=new URLSearchParams(location.search);
if(sp.get('import')==='1'&&sp.get('url')){
  window.addEventListener('load',()=>{
    document.getElementById('mUrl').value=decodeURIComponent(sp.get('url')||'');
    document.getElementById('mTitle').value=decodeURIComponent(sp.get('title')||'');
    openAddModal();
    showToast('Page captured via Bookmarklet! Review and save.','info');
  });
}

// ══════════════════════════════════════════════
// COPY HELPERS
// ══════════════════════════════════════════════
function copyText(t){
  if(navigator.clipboard){navigator.clipboard.writeText(t).then(()=>showToast('Copied to clipboard!','success')).catch(()=>fallbackCopy(t))}
  else fallbackCopy(t);
}
function fallbackCopy(t){const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand('copy');showToast('Copied!','success')}catch(e){}document.body.removeChild(ta)}
function copyEmail(){copyText(document.getElementById('emailAddr').textContent)}
function copyAPIExample(){copyText(`curl -X POST https://api.markd.app/v1/bookmarks \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"url":"https://example.com","title":"Example","tags":["dev"]}'`)}
function copyCSVTemplate(){copyText('url,title,tags,notes\nhttps://example.com,Example Site,"dev,tools",My notes here')}
function copyJSONTemplate(){copyText('[{"url":"https://example.com","title":"Example Site","tags":["dev","tools"],"notes":"Optional notes"}]')}
function copyPWAManifest(){copyText(`{\n  "name": "Markd",\n  "short_name": "Markd",\n  "display": "standalone",\n  "share_target": {\n    "action": "/save",\n    "method": "POST",\n    "enctype": "multipart/form-data",\n    "params": {"title":"title","text":"text","url":"url"}\n  }\n}`)}

// Source card selection
function selectSource(el,src){
  document.querySelectorAll('.source-card').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
  const sub={'pocket':'Pocket HTML export file','raindrop':'Raindrop JSON export file','pinboard':'Pinboard JSON export','instapaper':'Instapaper HTML export','notion':'Notion CSV export','generic':'Any HTML, JSON, or CSV file'};
  document.getElementById('appsDzSub').textContent=sub[src]||'Upload your export file';
}

// ══════════════════════════════════════════════
// FILE DOWNLOAD
// ══════════════════════════════════════════════
function downloadFile(name,content,type='text/plain'){
  const blob=new Blob([content],{type});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);
}

// ══════════════════════════════════════════════
// COMMAND PALETTE
// ══════════════════════════════════════════════
const CMDS=[
  {name:'Add new bookmark',sub:'⌘N',ico:'🔖',act:openAddModal},
  {name:'Import from Browser (HTML)',sub:'',ico:'🌐',act:()=>openImport('browser')},
  {name:'Import from Pocket/Raindrop',sub:'',ico:'📦',act:()=>openImport('apps')},
  {name:'Import CSV / JSON',sub:'',ico:'📊',act:()=>openImport('csv')},
  {name:'Import OPML / RSS feeds',sub:'',ico:'📡',act:()=>openImport('opml')},
  {name:'Get Bookmarklet',sub:'',ico:'🔗',act:()=>openImport('bookmarklet')},
  {name:'Setup Email to Save',sub:'',ico:'✉️',act:()=>openImport('email')},
  {name:'View API docs',sub:'',ico:'⚡',act:()=>openImport('api')},
  {name:'Zapier / Automation',sub:'',ico:'🔌',act:()=>openImport('zapier')},
  {name:'Mobile / PWA setup',sub:'',ico:'📱',act:()=>openImport('pwa')},
  {name:'Switch to grid view',sub:'',ico:'▦',act:()=>setView('grid')},
  {name:'Switch to list view',sub:'',ico:'≡',act:()=>setView('list')},
  {name:'Export bookmarks',sub:'',ico:'📤',act:()=>{const all=JSON.stringify(bookmarks,null,2);downloadFile('markd-export.json',all,'application/json');showToast('Exported all bookmarks','info')}},
  {name:'Show starred',sub:'',ico:'⭐',act:()=>{currentFilter='starred';document.querySelectorAll('.fpill').forEach(b=>b.classList.remove('on'));render()}},
  {name:'Sort A → Z',sub:'',ico:'🔤',act:()=>{currentSort='az';document.getElementById('sortSelect').value='az';render()}},
  {name:'Sort newest first',sub:'',ico:'🕐',act:()=>{currentSort='newest';document.getElementById('sortSelect').value='newest';render()}},
  {name:'Group by category',sub:'',ico:'📁',act:()=>toggleGroupByCategory()},
  {name:'Toggle light / dark mode',sub:'',ico:'🌓',act:toggleTheme},
];
function openCmd(){document.getElementById('cmdPalette').classList.add('open');document.getElementById('cmdInput').value='';renderCmd('');setTimeout(()=>document.getElementById('cmdInput').focus(),50)}
function closeCmd(){document.getElementById('cmdPalette').classList.remove('open')}
function renderCmd(q){
  const res=document.getElementById('cmdResults');let html='';
  if(!q){
    html+=`<div class="cmd-section-label">Commands</div>`;
    html+=CMDS.slice(0,6).map((c,i)=>`<div class="cmd-item" onclick="CMDS[${CMDS.indexOf(c)}].act();closeCmd()"><div class="cmd-item-ico">${c.ico}</div><div class="cmd-item-text"><div class="cmd-item-name">${c.name}</div></div>${c.sub?`<span class="cmd-item-kbd">${c.sub}</span>`:''}</div>`).join('');
    html+=`<div class="cmd-section-label">Import</div>`;
    html+=CMDS.slice(1,10).map(c=>`<div class="cmd-item" onclick="CMDS[${CMDS.indexOf(c)}].act();closeCmd()"><div class="cmd-item-ico">${c.ico}</div><div class="cmd-item-text"><div class="cmd-item-name">${c.name}</div></div></div>`).join('');
  } else {
    const filtBks=bookmarks.filter(b=>b.title.toLowerCase().includes(q.toLowerCase())||b.url.toLowerCase().includes(q.toLowerCase()));
    const filtCmds=CMDS.filter(c=>c.name.toLowerCase().includes(q.toLowerCase()));
    if(filtBks.length){html+=`<div class="cmd-section-label">Bookmarks</div>`;html+=filtBks.slice(0,5).map(b=>`<div class="cmd-item" onclick="openUrl('${b.url}');closeCmd()"><div class="cmd-item-ico"><img src="https://www.google.com/s2/favicons?domain=${b.domain}&sz=16" style="width:16px;height:16px" onerror="this.style.display='none'"/></div><div class="cmd-item-text"><div class="cmd-item-name">${b.title}</div><div class="cmd-item-sub">${b.domain}</div></div></div>`).join('')}
    if(filtCmds.length){html+=`<div class="cmd-section-label">Actions</div>`;html+=filtCmds.map((c,i)=>`<div class="cmd-item" onclick="CMDS[${CMDS.indexOf(c)}].act();closeCmd()"><div class="cmd-item-ico">${c.ico}</div><div class="cmd-item-text"><div class="cmd-item-name">${c.name}</div></div></div>`).join('')}
    if(!filtBks.length&&!filtCmds.length)html=`<div style="padding:24px;text-align:center;color:var(--text3);font-size:13px">No results for "${q}"</div>`;
  }
  res.innerHTML=html;
}
function cmdFilter(v){renderCmd(v)}

// MOBILE
function toggleMobileSidebar(){
  const sidebar=document.getElementById('sidebarNav');
  const overlay=document.getElementById('sidebarOverlay');
  if(!sidebar)return;
  const isOpen=sidebar.classList.toggle('open');
  if(overlay)overlay.classList.toggle('open',isOpen);
  document.body.style.overflow=isOpen?'hidden':'';
}
function closeMobileSidebar(){
  const sidebar=document.getElementById('sidebarNav');
  const overlay=document.getElementById('sidebarOverlay');
  if(sidebar)sidebar.classList.remove('open');
  if(overlay)overlay.classList.remove('open');
  document.body.style.overflow='';
}
function setMobNav(btn,view){
  document.querySelectorAll('.mob-nav-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  if(view==='profile'){
    if(!currentUser){
      window.location.href='/register';
      return;
    }
    showToast('Signed in profile','info');
    return;
  }
  if(view==='import'){openImport();return}
  currentFilter=view;
  render()
}

// KEYBOARD
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();openCmd()}
  if(e.key==='Escape'){['addModal','importModal','previewModal'].forEach(id=>closeModal(id));closeCmd();closeMobileSidebar()}
  if((e.metaKey||e.ctrlKey)&&e.key==='n'){e.preventDefault();openAddModal()}
  if(e.key==='?'&&!e.target.matches('input,textarea')){showToast('Shortcuts: ⌘K search  ⌘N add  Esc close','info')}
});

// TOAST
function showToast(msg,type='success'){
  const stack=document.getElementById('toastStack');
  const t=document.createElement('div');
  const icons={success:'✓',info:'ℹ',warn:'⚠'};
  t.className=`toast ${type}`;
  t.innerHTML=`<span class="toast-ico">${icons[type]||'✓'}</span><span class="toast-msg">${msg}</span>`;
  stack.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('in')));
  setTimeout(()=>{t.classList.remove('in');setTimeout(()=>t.remove(),350)},3200);
}

function highlightSavedCard(savedUrl){
  if(!savedUrl)return;
  const container=document.getElementById('bookmarkContainer');
  if(!container)return;
  const cards=container.querySelectorAll('.bk-preview-card,.bk-card');
  for(const card of cards){
    const urlEl=card.querySelector('.bk-preview-url,.bk-url');
    if(urlEl&&savedUrl.includes(urlEl.textContent.trim())){
      card.classList.add('bk-just-saved');
      card.scrollIntoView({behavior:'smooth',block:'nearest'});
      card.addEventListener('animationend',()=>card.classList.remove('bk-just-saved'),{once:true});
      break;
    }
  }
}

// INIT
async function initDashboard(){
  if(authEls.menuLogoutBtn){
    authEls.menuLogoutBtn.addEventListener('click',async()=>{toggleSettingsMenu(false);await performLogout()});
  }
  if(authEls.settingsMenuBtn){
    authEls.settingsMenuBtn.addEventListener('click',(event)=>{event.stopPropagation();toggleSettingsMenu()});
  }
  if(authEls.userAvatarBtn){
    authEls.userAvatarBtn.addEventListener('click',(event)=>{event.stopPropagation();toggleSettingsMenu()});
  }
  document.addEventListener('click',(event)=>{
    if(!authEls.topSettingsMenu||!authEls.settingsMenuBtn)return;
    const inMenu=authEls.topSettingsMenu.contains(event.target);
    const onBtn=authEls.settingsMenuBtn.contains(event.target);
    if(!inMenu&&!onBtn){toggleSettingsMenu(false)}
  });
  loadRecentSearches();
  renderRecentSearchChips();
  setupQuickSmartInput();
  renderQuickMeta(null);
  await loadCurrentUser();
  await loadNotificationSummary();
  await loadBookmarks();
  render();
  setupTagManager();
}

initDashboard();
// Setup bookmarklet code on load
setTimeout(()=>{
  const el=document.getElementById('bookmarkletCode');
  if(el)el.textContent=BOOKMARKLET_CODE;
  const link=document.getElementById('bookmarkletLink');
  if(link){link.href=BOOKMARKLET_CODE;link.setAttribute('draggable','true')}
},100);
// Demo data for preview test
window._testImport=function(){
  const demo=[
    {url:'https://css-tricks.com',title:'CSS-Tricks',tags:['Dev','Design'],notes:'',domain:'css-tricks.com',folder:'Design'},
    {url:'https://tailwindcss.com',title:'Tailwind CSS',tags:['Dev'],notes:'',domain:'tailwindcss.com',folder:'Tools'},
    {url:'https://openai.com',title:'OpenAI',tags:['AI'],notes:'',domain:'openai.com',folder:'AI'},
    {url:'https://vercel.com',title:'Vercel',tags:['Dev','Tools'],notes:'',domain:'vercel.com',folder:'Hosting'},
    {url:'https://github.com',title:'GitHub',tags:['Dev'],notes:'Already exists check',domain:'github.com',folder:'Dev'},
    {url:'https://stackoverflow.com',title:'Stack Overflow',tags:['Dev'],notes:'',domain:'stackoverflow.com',folder:'Dev'},
    {url:'https://medium.com',title:'Medium',tags:['Read Later'],notes:'',domain:'medium.com',folder:'Reading'},
  ];
  openPreview(demo,'Demo Import','demo.html');
};
