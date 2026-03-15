// ══════════════════════════════════════════════
// THEME
// ══════════════════════════════════════════════
(function initTheme(){
  const saved=localStorage.getItem('linksync-theme');
  if(saved){document.documentElement.setAttribute('data-theme',saved);return;}
  if(window.matchMedia&&window.matchMedia('(prefers-color-scheme:light)').matches){
    document.documentElement.setAttribute('data-theme','light');
  }
})();
function toggleTheme(){
  const current=document.documentElement.getAttribute('data-theme');
  const next=current==='light'?'dark':'light';
  document.documentElement.setAttribute('data-theme',next);
  localStorage.setItem('linksync-theme',next);
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
let currentSection = 'bookmarks';
let _healthTimer = null;
const RECENT_SEARCHES_KEY = 'linksync_recent_searches_v1';
const MAX_RECENT_SEARCHES = 6;
const TUTORIAL_DISMISSED_KEY = 'linksync_first_save_tutorial_dismissed_v1';
const LOCAL_FALLBACK_PREF_KEY = 'linksync_local_fallback_pref_v1';
const ONBOARD_TOUR_KEY = 'linksync_onboard_tour_done_v1';
try{localFallbackEnabled=localStorage.getItem(LOCAL_FALLBACK_PREF_KEY)==='true'}catch(e){localFallbackEnabled=false}
const SUGGEST_HIDDEN_KEY='linksync_suggest_hidden_v1';
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
  // settingsMenuBtn:document.getElementById('settingsMenuBtn'),
  // topSettingsMenu:document.getElementById('topSettingsMenu'),
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
    setBookmarkUiVisible(false);
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
  setBookmarkUiVisible(true);
  // when user logs in, hide welcome and restore bookmark UI
  if(typeof hideWelcomeExperience==='function')hideWelcomeExperience();
}

function setBookmarkUiVisible(show){
  const display=show?'':'none';
  document.querySelectorAll('.dash-header,.action-bar,.filter-bar,.advanced-filters').forEach((el)=>{el.style.display=display});
  const bc=document.getElementById('bookmarkContent');
  if(bc)bc.style.display=display;
  const onboard=document.getElementById('onboardBanner');
  if(onboard)onboard.style.display=display;
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

// function toggleSettingsMenu(force) { /* removed */ }

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
  return `<div class="empty empty-zero"><div class="empty-t">No bookmarks found</div><div class="empty-actions"><button class="btn-primary" onclick="openAddModal()">Add Bookmark</button></div></div>`;
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
  await renderWelcomeExperience();
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
    const isRecent=Number.isFinite(createdAt)&&(Date.now()-createdAt)<7*864e5;
    const isReadLater=tags.map(t=>String(t).toLowerCase().replace(/\s+/g,'')).some(t=>t==='readlater');
    const matchFilter=currentFilter==='all'
      ||(currentFilter==='starred'&&b.starred)
      ||(currentFilter==='recent'&&isRecent)
      ||(currentFilter==='unread'&&isReadLater)
      ||tags.map(t=>String(t).toLowerCase()).some(t=>t.includes(currentFilter));
    const matchQ=!q||String(b.title||'').toLowerCase().includes(q)||String(b.url||'').toLowerCase().includes(q)||tags.join(' ').toLowerCase().includes(q)||String(b.notes||'').toLowerCase().includes(q)||String(b.description||'').toLowerCase().includes(q);
    return matchFilter&&matchQ&&matchTime;
  });
  return sortBookmarks(filtered);
}

function updateDashboardHeading(){
  const titleEl=document.querySelector('.dash-title');
  const subEl=document.querySelector('.dash-sub');
  if(!titleEl||!subEl)return;

  if(currentFilter==='all'){
    titleEl.innerHTML='All <span>Bookmarks</span>';
    subEl.textContent='Your saved links and resources';
    return;
  }
  if(currentFilter==='starred'){
    titleEl.innerHTML='Starred <span>Bookmarks</span>';
    subEl.textContent='Only your favorite saved links';
    return;
  }
  if(currentFilter==='recent'){
    titleEl.innerHTML='Recent <span>Bookmarks</span>';
    subEl.textContent='Bookmarks saved in the last 7 days';
    return;
  }
  if(currentFilter==='unread'){
    titleEl.innerHTML='Remind Me Later <span>Bookmarks</span>';
    subEl.textContent='Bookmarks saved for follow-up and reminder';
    return;
  }

  const label=String(currentFilter||'').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  titleEl.innerHTML=`${esc(label)} <span>Bookmarks</span>`;
  subEl.textContent=`Bookmarks filtered by ${label}`;
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

// Sidebar categories removed

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
  updateDashboardHeading();
  document.getElementById('listCount').textContent=list.length;
  document.getElementById('totalCount').textContent=bookmarks.length;
  document.getElementById('starCount').textContent=bookmarks.filter(b=>b.starred).length;
  document.getElementById('importCount').textContent=totalImported;
  document.getElementById('snAll').textContent=bookmarks.length;
  document.getElementById('snStar').textContent=bookmarks.filter(b=>b.starred).length;
  const recentCount=bookmarks.filter(b=>{const d=new Date(b.created_at||0);return(Date.now()-d.getTime())<7*864e5}).length;
  document.getElementById('snRecent').textContent=recentCount;
  document.getElementById('snReadLater').textContent=bookmarks.filter(b=>(b.tags||[]).some(t=>String(t).toLowerCase()==='read later')).length;
  container.className=currentView==='grid'?'bk-grid':currentView==='table'?'bk-table-wrap':'bk-list';
  renderDynamicTagPills();
  // renderSidebarCategories(); // sidebar categories removed
  if(!list.length){
    if(authBlocked){
        container.innerHTML=`<div class="empty"><div class="empty-icon">🔒</div><div class="empty-t">Login to explore more features and also suggest best ideas</div><a class="btn-outline" href="/register" style="margin-top:10px;display:inline-flex">Login</a></div>`;
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
  if(currentView==='table'){
    if(groupByCategory){
      const groups=groupByCategories(list);
      container.innerHTML=groups.map(g=>`<div class="cat-section"><div class="cat-header"><span class="cat-dot ${tagDotClass(g.category)}"></span><span class="cat-label">${esc(g.category)}</span><span class="cat-count">${g.items.length}</span></div>${renderTableView(g.items)}</div>`).join('')+renderAssistContent(list);
    } else {
      container.innerHTML=renderTableView(list)+renderAssistContent(list);
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
  return `<div class="bk-card" onclick="openBookmarkById(${b.id})"><div style="display:flex;align-items:center;gap:10px"><div class="fav-wrap"><img src="https://www.google.com/s2/favicons?domain=${esc(b.domain)}&sz=32" onerror="this.onerror=null;this.src='/icons/icon-192.svg';this.style.display='inline-block'"/></div><div style="flex:1;min-width:0"><div class="bk-title ellipsis">${esc(b.title)}</div><div class="bk-url">${esc(b.domain||b.url)}</div></div>${b.starred?'<span style="color:var(--warn)">⭐</span>':''}</div><div class="bk-foot">${(b.tags||[]).map(t=>`<span class="mtag ${tagClass(String(t))}">${esc(t)}</span>`).join('')}${b.imported?'<span class="ai-badge">📥 Imported</span>':b.ai?'<span class="ai-badge">✦ AI</span>':''}</div><div style="display:flex;justify-content:space-between"><span style="font-size:10px;color:var(--text3)">${esc(b.date)}</span><span style="font-size:10px;color:var(--text3)">${esc(b.readTime||'')}</span></div></div>`;
}

function renderListCard(b){
  return `<div class="bk-preview-card" data-id="${b.id}" onclick="openBookmarkById(${b.id})"><div class="bk-preview-main"><div class="bk-preview-fav"><img src="https://www.google.com/s2/favicons?domain=${esc(b.domain)}&sz=32" onerror="this.onerror=null;this.src='/icons/icon-192.svg';this.style.display='inline-block'"/></div><div class="bk-preview-body"><div class="bk-preview-top"><div class="bk-preview-title">${esc(b.title)}</div>${b.starred?'<span title="Starred" style="color:var(--warn);font-size:12px">★</span>':''}</div><div class="bk-preview-url">${esc(b.domain||b.url)}</div><div class="bk-preview-excerpt">${esc(bookmarkExcerpt(b))}</div><div class="bk-preview-meta"><div class="tag-dots">${(b.tags||[]).slice(0,5).map(t=>`<span class="tag-dot ${tagDotClass(t)}" title="${esc(String(t))}" aria-label="${esc(String(t))}"></span>`).join('')}</div>${b.imported?'<span class="ai-badge">📥 Imported</span>':b.ai?'<span class="ai-badge">✦ AI</span>':''}<span class="bk-preview-date">${esc(b.date)}</span></div></div></div><div class="bk-preview-actions"><button class="ib star" title="Star" onclick="toggleStar(event,${b.id})">${b.starred?'⭐':'☆'}</button><button class="ib" title="Edit" onclick="editBk(event,${b.id})"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="ib del" title="Delete" onclick="deleteBk(event,${b.id})"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button></div></div>`;
}

function renderTableView(items){
  const titleSort=currentSort==='az'?'asc':currentSort==='za'?'desc':'none';
  const dateSort=currentSort==='newest'?'desc':currentSort==='oldest'?'asc':'none';
  const titleIcon=titleSort==='asc'?'↑':titleSort==='desc'?'↓':'↕';
  const dateIcon=dateSort==='asc'?'↑':dateSort==='desc'?'↓':'↕';
  return `<table class="bk-table"><thead><tr><th><button class="bk-th-btn ${titleSort!=='none'?'on':''}" type="button" onclick="setTableSort('title')">Title <span class="bk-th-icon">${titleIcon}</span></button></th><th>Domain</th><th>Tags</th><th><button class="bk-th-btn ${dateSort!=='none'?'on':''}" type="button" onclick="setTableSort('date')">Date <span class="bk-th-icon">${dateIcon}</span></button></th><th class="ta-right">Actions</th></tr></thead><tbody>${items.map(b=>renderTableRow(b)).join('')}</tbody></table>`;
}

function setTableSort(kind){
  if(kind==='title')currentSort=currentSort==='az'?'za':'az';
  if(kind==='date')currentSort=currentSort==='newest'?'oldest':'newest';
  const sortSelect=document.getElementById('sortSelect');
  if(sortSelect)sortSelect.value=currentSort;
  render();
}

function renderTableRow(b){
  const tags=(b.tags||[]).slice(0,3).map(t=>`<span class="mtag ${tagClass(String(t))}">${esc(t)}</span>`).join('');
  return `<tr onclick="openBookmarkById(${b.id})"><td><div class="bk-table-title">${esc(b.title)}</div>${b.starred?'<span class="bk-table-star" title="Starred">★</span>':''}</td><td class="bk-table-domain">${esc(b.domain||b.url)}</td><td><div class="bk-table-tags">${tags||'<span class="bk-table-empty">-</span>'}</div></td><td class="bk-table-date">${esc(b.date)}</td><td class="ta-right"><div class="bk-table-actions"><button class="ib star" title="Star" onclick="toggleStar(event,${b.id})">${b.starred?'⭐':'☆'}</button><button class="ib" title="Edit" onclick="editBk(event,${b.id})"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="ib del" title="Delete" onclick="deleteBk(event,${b.id})"><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button></div></td></tr>`;
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
function setView(v){
  currentView=v;
  document.getElementById('vList')?.classList.toggle('on',v==='list');
  document.getElementById('vGrid')?.classList.toggle('on',v==='grid');
  document.getElementById('vTable')?.classList.toggle('on',v==='table');
  render();
}

document.querySelectorAll('.fpill').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.fpill').forEach(b=>b.classList.remove('on'));btn.classList.add('on');currentFilter=btn.dataset.filter;document.querySelectorAll('.nav-link[data-view]').forEach(l=>l.classList.remove('active'));if(currentFilter==='all')document.querySelector('.nav-link[data-view=\"all\"]')?.classList.add('active');render()})});
document.querySelectorAll('.nav-link[data-view]').forEach(link=>{link.addEventListener('click',e=>{e.preventDefault();if(currentSection!=='bookmarks')switchSection('bookmarks');document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));link.classList.add('active');currentFilter=link.dataset.view;document.querySelectorAll('.fpill').forEach(b=>b.classList.toggle('on',b.dataset.filter===currentFilter));closeMobileSidebar();render()})});
document.querySelectorAll('.smart-chip').forEach(chip=>{chip.addEventListener('click',()=>setTimeFilter(chip.dataset.time||'all'))});
document.getElementById('searchInput').addEventListener('input',function(){updateSearchClearBtn();render()});
function updateSearchClearBtn(){const btn=document.getElementById('searchClearBtn');const inp=document.getElementById('searchInput');if(btn&&inp){btn.style.display=inp.value.trim()?'flex':'none'}}
function clearSearchInput(){const inp=document.getElementById('searchInput');if(inp){inp.value='';inp.focus()}updateSearchClearBtn();render()}
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
  modalSelectedTags=(bookmark?.tags||[]).map(t=>String(t).trim()).filter(Boolean);
  syncPresetHighlights();
  renderModalTagChips();
  renderModalPopularTags();
  var tagInput=document.getElementById('mTagInput');
  if(tagInput)tagInput.value='';
  closeModalTagDropdown();
  document.getElementById('addModal').classList.add('open');
  setTimeout(()=>document.getElementById('mUrl').focus(),100);
}

function closeModal(id){
  const modal=document.getElementById(id);
  if(!modal)return;
  modal.classList.remove('open');
  if(id==='addModal'){
    editingBookmarkId=null;
  }
}

function openFeedbackModal(){
  const input=document.getElementById('feedbackTextModal');
  const submitBtn=document.getElementById('feedbackSubmitBtn');
  if(input)input.value='';
  if(submitBtn)submitBtn.disabled=false;
  const modal=document.getElementById('feedbackModal');
  if(!modal)return;
  modal.classList.add('open');
  setTimeout(()=>{ if(input) input.focus(); },100);
}

function openShareModal(){
  const modal=document.getElementById('shareModal');
  if(!modal)return;
  modal.classList.add('open');
}

function submitFeedbackModal(){
  const input=document.getElementById('feedbackTextModal');
  const submitBtn=document.getElementById('feedbackSubmitBtn');
  const text=String(input?.value||'').trim();
  if(!text){
    showToast('Please add your feedback first','warn');
    if(input)input.focus();
    return;
  }
  if(submitBtn)submitBtn.disabled=true;
  const subject=encodeURIComponent('LinkSync AI Feedback');
  const body=encodeURIComponent(text);
  window.location.href='mailto:shivathebravo@gmail.com?subject='+subject+'&body='+body;
  closeModal('feedbackModal');
  setTimeout(()=>{ if(submitBtn)submitBtn.disabled=false; },400);
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
  const tags=[...modalSelectedTags];

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
    modalSelectedTags=[];
    syncPresetHighlights();
    renderModalTagChips();
    renderModalPopularTags();
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

// ══════════════════════════════════════════════
// MODAL TAG SYSTEM
// ══════════════════════════════════════════════
let modalSelectedTags=[];
let modalDdActiveIdx=-1;

function getAllUsedTags(){
  const freq={};
  for(const b of bookmarks){
    for(const t of(b.tags||[])){
      const key=String(t).trim();
      if(!key)continue;
      const low=key.toLowerCase();
      if(!freq[low])freq[low]={name:key,count:0};
      freq[low].count++;
    }
  }
  return Object.values(freq).sort((a,b)=>b.count-a.count);
}

function getPopularTags(limit){
  limit=limit||8;
  const presets=new Set(['ai','dev','design','read later','tools','favourite']);
  return getAllUsedTags().filter(function(t){return !presets.has(t.name.toLowerCase())}).slice(0,limit);
}

function addModalTag(name){
  var clean=String(name).trim();
  if(!clean)return;
  var low=clean.toLowerCase();
  if(modalSelectedTags.some(function(t){return t.toLowerCase()===low})){
    showToast('"'+clean+'" is already added','info');
    return;
  }
  modalSelectedTags.push(clean);
  syncPresetHighlights();
  renderModalTagChips();
  renderModalPopularTags();
  var inp=document.getElementById('mTagInput');
  if(inp){inp.value='';closeModalTagDropdown();}
}

function removeModalTag(name){
  var low=String(name).toLowerCase();
  modalSelectedTags=modalSelectedTags.filter(function(t){return t.toLowerCase()!==low});
  syncPresetHighlights();
  renderModalTagChips();
  renderModalPopularTags();
}

function syncPresetHighlights(){
  var selected=new Set(modalSelectedTags.map(function(t){return t.toLowerCase()}));
  document.querySelectorAll('#modalTags .modal-tag').forEach(function(btn){
    var tag=btn.textContent.replace(/^.+\s/,'').trim().toLowerCase();
    btn.classList.toggle('sel',selected.has(tag));
  });
}

function toggleModalPresetTag(el){
  var tag=el.textContent.replace(/^.+\s/,'').trim();
  var low=tag.toLowerCase();
  if(modalSelectedTags.some(function(t){return t.toLowerCase()===low})){
    removeModalTag(tag);
  }else{
    addModalTag(tag);
  }
}

function renderModalTagChips(){
  var container=document.getElementById('modalTagChips');
  if(!container)return;
  if(!modalSelectedTags.length){container.innerHTML='';return;}
  container.innerHTML=modalSelectedTags.map(function(t){
    return '<span class="modal-tag-chip">'+esc(t)+'<span class="chip-x" onclick="removeModalTag(\''+t.replace(/'/g,"\\'")+'\')\" title="Remove">&times;</span></span>';
  }).join('');
}

function renderModalPopularTags(){
  var container=document.getElementById('modalPopularTags');
  if(!container)return;
  var popular=getPopularTags();
  if(!popular.length){container.innerHTML='';return;}
  var selected=new Set(modalSelectedTags.map(function(t){return t.toLowerCase()}));
  var available=popular.filter(function(t){return !selected.has(t.name.toLowerCase())});
  if(!available.length){container.innerHTML='';return;}
  container.innerHTML='<span class="popular-label">Popular:</span>'+available.map(function(t){
    return '<button class="popular-tag-btn" type="button" onclick="addModalTag(\''+t.name.replace(/'/g,"\\'")+'\')\" title="Used '+t.count+' time'+(t.count>1?'s':'')+'">'+esc(t.name)+' <span style="opacity:.5;font-size:9px">('+t.count+')</span></button>';
  }).join('');
}

function addCustomModalTag(){
  var inp=document.getElementById('mTagInput');
  if(!inp)return;
  var val=inp.value.trim();
  if(!val)return;
  addModalTag(val);
}

function closeModalTagDropdown(){
  var dd=document.getElementById('mTagDropdown');
  if(dd){dd.classList.remove('open');dd.innerHTML='';}
  modalDdActiveIdx=-1;
}

function initModalTagInput(){
  var inp=document.getElementById('mTagInput');
  if(!inp)return;
  inp.addEventListener('input',function(){
    var q=inp.value.trim().toLowerCase();
    var dd=document.getElementById('mTagDropdown');
    if(!dd)return;
    modalDdActiveIdx=-1;
    if(!q){closeModalTagDropdown();return;}
    var all=getAllUsedTags();
    var selectedSet=new Set(modalSelectedTags.map(function(t){return t.toLowerCase()}));
    var exact=all.find(function(t){return t.name.toLowerCase()===q});
    var matches=all.filter(function(t){return t.name.toLowerCase().includes(q)}).slice(0,8);
    var html='';
    if(exact&&selectedSet.has(exact.name.toLowerCase())){
      html+='<div class="modal-tag-dd-item" style="pointer-events:none;opacity:.6"><span>'+esc(exact.name)+'</span><span class="dd-exists">already added</span></div>';
    }
    matches.forEach(function(t){
      var isSelected=selectedSet.has(t.name.toLowerCase());
      if(isSelected&&t.name.toLowerCase()===q)return;
      if(isSelected){
        html+='<div class="modal-tag-dd-item" style="pointer-events:none;opacity:.5"><span>'+esc(t.name)+' <em class="dd-exists">(added)</em></span><span class="dd-count">'+t.count+'</span></div>';
      }else{
        html+='<div class="modal-tag-dd-item" onclick="addModalTag(\''+t.name.replace(/'/g,"\\'")+'\')"><span>'+esc(t.name)+'</span><span class="dd-count">'+t.count+'</span></div>';
      }
    });
    if(!exact||exact.name.toLowerCase()!==q){
      if(!selectedSet.has(q)){
        html+='<div class="modal-tag-dd-item" onclick="addModalTag(\''+q.replace(/'/g,"\\'")+'\')\" style="border-top:1px solid var(--border)"><span>+ Create "<strong>'+esc(q)+'</strong>"</span></div>';
      }
    }
    if(html){dd.innerHTML=html;dd.classList.add('open');}
    else{closeModalTagDropdown();}
  });
  inp.addEventListener('keydown',function(e){
    var dd=document.getElementById('mTagDropdown');
    var items=dd?dd.querySelectorAll('.modal-tag-dd-item:not([style*="pointer-events"])'):[];
    if(e.key==='ArrowDown'){e.preventDefault();modalDdActiveIdx=Math.min(modalDdActiveIdx+1,items.length-1);items.forEach(function(el,i){el.classList.toggle('active',i===modalDdActiveIdx)});}
    else if(e.key==='ArrowUp'){e.preventDefault();modalDdActiveIdx=Math.max(modalDdActiveIdx-1,0);items.forEach(function(el,i){el.classList.toggle('active',i===modalDdActiveIdx)});}
    else if(e.key==='Enter'){
      e.preventDefault();
      if(modalDdActiveIdx>=0&&items[modalDdActiveIdx]){items[modalDdActiveIdx].click();}
      else{addCustomModalTag();}
    }else if(e.key==='Escape'){closeModalTagDropdown();}
  });
  inp.addEventListener('blur',function(){setTimeout(closeModalTagDropdown,200)});
}

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
  // Ensure all main dashboard sections are visible on load
  [
    'dash-header',
    'action-bar',
    'filter-bar',
    'bookmarkContent'
  ].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.style.display='';
  });
  // Show advanced filters if previously open
  const adv=document.getElementById('advancedFilters');
  if(adv && window.innerWidth > 900) adv.style.display='';
  // Set up bookmarklet code
  const el=document.getElementById('bookmarkletCode');
  if(el)el.textContent=BOOKMARKLET_CODE;
  const link=document.getElementById('bookmarkletLink');
  if(link)link.href=BOOKMARKLET_CODE;
  // Responsive fix: ensure sidebar overlay is hidden on desktop
  if(window.innerWidth > 900){
    const overlay=document.getElementById('sidebarOverlay');
    if(overlay) overlay.classList.remove('open');
  }
});
window.addEventListener('load',()=>{
  // Same as DOMContentLoaded for redundancy
  [
    'dash-header',
    'action-bar',
    'filter-bar',
    'bookmarkContent'
  ].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.style.display='';
  });
  const el=document.getElementById('bookmarkletCode');
  if(el)el.textContent=BOOKMARKLET_CODE;
  const link=document.getElementById('bookmarkletLink');
  if(link)link.href=BOOKMARKLET_CODE;
  if(window.innerWidth > 900){
    const overlay=document.getElementById('sidebarOverlay');
    if(overlay) overlay.classList.remove('open');
  }
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
function copyAPIExample(){copyText(`curl -X POST https://api.linksync-ai.app/v1/bookmarks \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"url":"https://example.com","title":"Example","tags":["dev"]}'`)}
function copyCSVTemplate(){copyText('url,title,tags,notes\nhttps://example.com,Example Site,"dev,tools",My notes here')}
function copyJSONTemplate(){copyText('[{"url":"https://example.com","title":"Example Site","tags":["dev","tools"],"notes":"Optional notes"}]')}
function copyPWAManifest(){copyText(`{\n  "name": "LinkSync AI",\n  "short_name": "LinkSync",\n  "display": "standalone",\n  "share_target": {\n    "action": "/save",\n    "method": "POST",\n    "enctype": "multipart/form-data",\n    "params": {"title":"title","text":"text","url":"url"}\n  }\n}`)}

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
  {name:'Switch to table view',sub:'',ico:'☷',act:()=>setView('table')},
  {name:'Export bookmarks',sub:'',ico:'📤',act:()=>{const all=JSON.stringify(bookmarks,null,2);downloadFile('linksync-export.json',all,'application/json');showToast('Exported all bookmarks','info')}},
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
  if(e.key==='Escape'){['addModal','importModal','previewModal','feedbackModal','shareModal'].forEach(id=>closeModal(id));closeCmd();closeMobileSidebar()}
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
// ══════════════════════════════════════════════
// SECTION SWITCHING (Bookmarks / System Health / MCP Setup)
// ══════════════════════════════════════════════
async function switchSection(section){
  currentSection=section;
  const bookmarkEls=['onboardBanner','dash-header','action-bar','filter-bar','advancedFilters','bookmarkContent'].map(id=>document.getElementById(id)).filter(Boolean);
  // also grab elements by class that don't have ids
  document.querySelectorAll('.dash-header,.action-bar,.filter-bar,.advanced-filters').forEach(el=>{if(!bookmarkEls.includes(el))bookmarkEls.push(el)});
  const toolPanel=document.getElementById('toolPanel');
  const onboard=document.getElementById('onboardBanner');
  // hide welcome panel when switching sections
  const wp=document.getElementById('welcomePanel');if(wp)wp.style.display='none';

  // update sidebar active states
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  if(section==='bookmarks'){
    document.querySelector('.nav-link[data-view="all"]')?.classList.add('active');
  }else{
    document.querySelector(`.nav-link[data-section="${section}"]`)?.classList.add('active');
  }

  if(section==='bookmarks'){
    // show bookmark UI, hide tool panel
    document.querySelectorAll('.dash-header,.action-bar,.filter-bar,.advanced-filters').forEach(el=>el.style.display='');
    const bc=document.getElementById('bookmarkContent');if(bc)bc.style.display='';
    if(onboard)onboard.style.display='';
    if(toolPanel){if(toolPanel._cleanup)toolPanel._cleanup();toolPanel.style.display='none';toolPanel.innerHTML='';}
    if(_healthTimer){clearInterval(_healthTimer);_healthTimer=null}
    if(_notifTimer){clearInterval(_notifTimer);_notifTimer=null}
    // if not logged in, show welcome instead of bookmark UI
    if(!currentUser){await renderWelcomeExperience();}
    history.pushState(null,'','/');
    closeMobileSidebar();
    return;
  }

  // hide bookmark UI
  document.querySelectorAll('.dash-header,.action-bar,.filter-bar,.advanced-filters').forEach(el=>el.style.display='none');
  const bc=document.getElementById('bookmarkContent');if(bc)bc.style.display='none';
  if(onboard)onboard.style.display='none';

  // cleanup previous tool panel content
  if(toolPanel&&toolPanel._cleanup){toolPanel._cleanup();toolPanel._cleanup=null}

  // show tool panel
  if(toolPanel){
    toolPanel.style.display='';
    if(section==='syshealth'){
      history.pushState(null,'','/syshealth');
      await renderSystemHealthPanel(toolPanel);
    }else if(section==='mcp'){
      history.pushState(null,'','/mcp');
      await renderMcpSetupPanel(toolPanel);
    }else if(section==='chat'){
      history.pushState(null,'','/chat');
      await renderChatPanel(toolPanel);
    }else if(section==='notifications'){
      history.pushState(null,'','/notifications');
      renderNotificationsPanel(toolPanel);
    }
  }
  closeMobileSidebar();
}

// ── System Health Panel (vanilla JS) ──
function _fmtBytes(v){const b=Number(v||0);if(!isFinite(b)||b<=0)return'0 B';const u=['B','KB','MB','GB','TB'];const i=Math.min(Math.floor(Math.log(b)/Math.log(1024)),u.length-1);return `${(b/1024**i).toFixed(i===0?0:1)} ${u[i]}`}
function _fmtUptime(s){const t=Math.max(0,Number(s||0));const h=Math.floor(t/3600),m=Math.floor((t%3600)/60),sec=Math.floor(t%60);if(h>0)return`${h}h ${m}m`;if(m>0)return`${m}m ${sec}s`;return`${sec}s`}

async function loadToolPanelTemplate(container,path,fallbackHtml){
  try{
    const res=await fetch(path,{cache:'no-store'});
    if(res.ok){
      container.innerHTML=await res.text();
      return true;
    }
  }catch(e){}
  container.innerHTML=fallbackHtml;
  return false;
}



  const ctrl=new AbortController();
  async function fetchHealth(){
    try{
      const r=await fetch('/api/system-health',{credentials:'include',cache:'no-store',signal:ctrl.signal});
      const p=await r.json().catch(()=>null);
      if(!r.ok||!p?.success||!p.data)throw new Error('Unable to fetch');
      _renderHealthData(p.data);
    }catch(e){if(e?.name==='AbortError')return;_renderHealthError()}
  }

  function _renderHealthData(d){
    const apiOk=d.api?.status==='ok',dbOk=d.database?.status==='ok';
    const overallOk=apiOk&&dbOk;
    _setCommandState('shApiState','shApiValue',apiOk?'state-green':'state-red',apiOk?'Healthy':'Critical');
    _setCommandState('shDbState','shDbValue',dbOk?'state-green':'state-red',dbOk?'Healthy':'Critical');
    _setCommandState('shRuntimeState','shRuntimeValue','state-blue','Monitoring');
    _setCommandState('shOverallState','shOverallValue',overallOk?'state-green':'state-red',overallOk?'Healthy':'Critical');

    const kpis=document.getElementById('shKpis');
    if(kpis)kpis.innerHTML=[
      ['API',apiOk?'OK':'Down'],['Database',dbOk?'OK':'Down'],
      ['Uptime',_fmtUptime(d.api?.uptimeSec)],['Memory',_fmtBytes(d.system?.memory?.rss)]
    ].map(([l,v])=>`<div class="tp-kpi"><div class="tp-kpi-label">${l}</div><div class="tp-kpi-value">${v}</div></div>`).join('');
    const totalUsers=Number(d.users?.totalUsers||0);
    const liveSessions=Number(d.users?.liveSessions||0);
    const authSessions=Number(d.users?.authenticatedSessions||0);
    const loadAvg=Number(d.system?.loadAvg1||0).toFixed(2);
    const userTotalEl=document.getElementById('shUserTotal');
    if(userTotalEl)userTotalEl.textContent=String(totalUsers);
    const liveSessionsEl=document.getElementById('shLiveSessions');
    if(liveSessionsEl)liveSessionsEl.textContent=String(liveSessions);
    const authSessionsEl=document.getElementById('shAuthSessions');
    if(authSessionsEl)authSessionsEl.textContent=String(authSessions);
    const loadAvgEl=document.getElementById('shLoadAvg');
    if(loadAvgEl)loadAvgEl.textContent=loadAvg;
    const ts=d.timestamp?new Date(d.timestamp).toLocaleTimeString():'--';
    const upd=document.getElementById('shLastUpdate');if(upd)upd.textContent=`Polling every 1 hour. Last update: ${ts}`;
    const svc=document.getElementById('shServices');
    if(svc)svc.innerHTML=[
      {name:'Application API',status:apiOk?'ok':'down',detail:d.api?`PID ${d.api.pid} • Node ${d.api.nodeVersion} • Uptime ${_fmtUptime(d.api.uptimeSec)}`:'Collecting...'},
      {name:'PostgreSQL',status:dbOk?'ok':'down',detail:d.database?`Latency ${d.database.latencyMs??'--'} ms${d.database.serverTime?' • DB time '+new Date(d.database.serverTime).toLocaleTimeString():''}`:'Collecting...'},
      {name:'Host Runtime',status:'ok',detail:d.system?`${d.system.platform}/${d.system.arch} • CPU ${d.system.cpuCount} • Load ${Number(d.system.loadAvg1||0).toFixed(2)}`:'Collecting...'}
    ].map(s=>`<div class="tp-service"><div class="tp-service-head"><h4 class="tp-service-name">${s.name}</h4><span class="tp-pill ${s.status}">${s.status}</span></div><div class="tp-service-meta">${s.detail}</div></div>`).join('');
  }

  function _setCommandState(boxId,valId,stateClass,value){
    const box=document.getElementById(boxId);
    const val=document.getElementById(valId);
    if(box){
      box.classList.remove('state-green','state-red','state-blue');
      box.classList.add(stateClass);
    }
    if(val)val.textContent=value;
  }

  function _renderHealthError(){
    _setCommandState('shApiState','shApiValue','state-red','Critical');
    _setCommandState('shDbState','shDbValue','state-red','Critical');
    _setCommandState('shRuntimeState','shRuntimeValue','state-blue','Monitoring');
    _setCommandState('shOverallState','shOverallValue','state-red','Critical');
    const userTotalEl=document.getElementById('shUserTotal');
    if(userTotalEl)userTotalEl.textContent='--';
    const liveSessionsEl=document.getElementById('shLiveSessions');
    if(liveSessionsEl)liveSessionsEl.textContent='--';
    const authSessionsEl=document.getElementById('shAuthSessions');
    if(authSessionsEl)authSessionsEl.textContent='--';
    const loadAvgEl=document.getElementById('shLoadAvg');
    if(loadAvgEl)loadAvgEl.textContent='--';
    const svc=document.getElementById('shServices');
    if(svc)svc.innerHTML='<p class="tp-sub">Unable to reach health endpoint. Retrying...</p>';
  }

  document.getElementById('shRefreshBtn')?.addEventListener('click',()=>fetchHealth());
  fetchHealth();
  _healthTimer=setInterval(fetchHealth,HEALTH_POLL_MS);
  // cleanup when section changes
  container._cleanup=()=>{ctrl.abort();if(_healthTimer){clearInterval(_healthTimer);_healthTimer=null}};
}

// ── MCP Setup Panel (vanilla JS) ──
async function renderMcpSetupPanel(container){
  if(_healthTimer){clearInterval(_healthTimer);_healthTimer=null}
  const userName=currentUser?(currentUser.name||currentUser.email||'User'):'';
  const callbackUrl=`${window.location.origin}/auth/github/callback`;
  const tokenPlaceholder='paste-token-here';
  function buildConfig(tok){return JSON.stringify({mcpServers:{bookmark:{command:'npx',args:['-y','github:shivasharma/website_bookmark_mcp'],env:{BOOKMARK_API_BASE_URL:window.location.origin,BOOKMARK_API_TOKEN:tok||tokenPlaceholder}}}},null,2)}

  const fallbackHtml=`
    <div class="tp-header"><h2 class="tp-title">MCP Setup</h2><p class="tp-sub">Configure Model Context Protocol for AI assistants</p></div>
    <div class="tp-card">
      <div class="tp-card-head"><h3>Session</h3></div>
      ${!currentUser
        ?'<p class="tp-sub">You are not logged in. Login first to generate MCP token.</p><a class="btn-outline" href="/register" style="margin-top:8px;display:inline-flex">Login / Register</a>'
        :'<p class="tp-sub">Logged in as <strong>'+esc(userName)+'</strong>.</p>'}
    </div>
    <div class="tp-card">
      <div class="tp-card-head"><h3>Token</h3></div>
      <p class="tp-sub">Generate a token and use it in your MCP client configuration.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button class="btn-outline" type="button" id="mcpGenBtn" style="background:var(--accent);color:#000;border-color:var(--accent);font-weight:700">Generate Token</button>
        <button class="btn-outline" type="button" id="mcpCopyTokBtn" style="display:none">Copy Token</button>
      </div>
      <div class="tp-status" id="mcpStatus">Token not generated yet.</div>
      <pre id="mcpTokenPre">Click "Generate Token" to create an API token</pre>
    </div>
    <div class="tp-card">
      <div class="tp-card-head"><h3>Config Template</h3><button class="btn-outline" type="button" id="mcpCopyCfgBtn">Copy Config</button></div>
      <p class="tp-sub">Paste this JSON into your MCP client settings (Claude Desktop, Cursor, VS Code, etc.).</p>
      <pre id="mcpConfigPre">${buildConfig('')}</pre>
    </div>
    <div class="tp-card">
      <div class="tp-card-head"><h3>OAuth Callback</h3></div>
      <p class="tp-sub">If you are self-hosting, set the GitHub OAuth callback URL to:</p>
      <pre>${esc(callbackUrl)}</pre>
    </div>`;
  await loadToolPanelTemplate(container,'/mcpsetup.html',fallbackHtml);

  const sessionState=document.getElementById('mcpSessionState');
  if(sessionState){
    sessionState.innerHTML=!currentUser
      ?'<p class="tp-sub">You are not logged in. Login first to generate MCP token.</p><a class="btn-outline" href="/register" style="margin-top:8px;display:inline-flex">Login / Register</a>'
      :'<p class="tp-sub">Logged in as <strong>'+esc(userName)+'</strong>.</p>';
  }
  const callbackPre=document.getElementById('mcpCallbackPre');
  if(callbackPre)callbackPre.textContent=callbackUrl;
  const configPre=document.getElementById('mcpConfigPre');
  if(configPre)configPre.textContent=buildConfig('');

  let token='';
  document.getElementById('mcpGenBtn')?.addEventListener('click',async()=>{
    if(!currentUser){_mcpStatus('Login required before generating token.','warn');return}
    _mcpStatus('Generating token...','');
    try{
      const r=await fetch('/api/mcp-token?expires_in_days=30',{credentials:'include'});
      const p=await r.json().catch(()=>null);
      if(!r.ok||!p?.success||!p.data?.token)throw new Error(p?.error||'Could not generate token.');
      token=p.data.token;
      document.getElementById('mcpTokenPre').textContent=token;
      document.getElementById('mcpConfigPre').textContent=buildConfig(token);
      document.getElementById('mcpCopyTokBtn').style.display='';
      _mcpStatus('Token generated.','ok');
    }catch(e){_mcpStatus(e.message||'Could not generate token.','danger')}
  });
  document.getElementById('mcpCopyTokBtn')?.addEventListener('click',()=>{
    navigator.clipboard.writeText(token).then(()=>_mcpStatus('Token copied.','ok')).catch(()=>_mcpStatus('Unable to copy.','danger'));
  });
  document.getElementById('mcpCopyCfgBtn')?.addEventListener('click',()=>{
    const cfg=document.getElementById('mcpConfigPre')?.textContent||'';
    navigator.clipboard.writeText(cfg).then(()=>_mcpStatus('Config copied.','ok')).catch(()=>_mcpStatus('Unable to copy.','danger'));
  });

  function _mcpStatus(msg,cls){
    const el=document.getElementById('mcpStatus');
    if(!el)return;
    el.textContent=msg;
    el.className='tp-status'+(cls?' '+cls:'');
  }
}

// ── Notifications Panel (vanilla JS) ──
var _notifTimer=null;
var _notifPage=1;
const _NOTIF_PAGE_SIZE=25;

function renderNotificationsPanel(container){
  if(_healthTimer){clearInterval(_healthTimer);_healthTimer=null}
  if(_notifTimer){clearInterval(_notifTimer);_notifTimer=null}
  _notifPage=1;

  container.innerHTML=`
    <div class="tp-header"><h2 class="tp-title">Notifications</h2><p class="tp-sub">Activity log for bookmark changes</p></div>
    <div class="tp-card">
      <div class="tp-card-head">
        <h3>Activity Feed</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-outline" type="button" id="notifMarkAllBtn">Mark All Read</button>
          <button class="btn-outline" type="button" id="notifRefreshBtn">Refresh</button>
        </div>
      </div>
      <div id="notifList"><p class="tp-sub">Loading notifications...</p></div>
      <div id="notifPager" style="display:flex;justify-content:center;gap:10px;margin-top:14px"></div>
    </div>`;

  const ctrl=new AbortController();

  async function fetchNotifications(page){
    _notifPage=Math.max(1,page||1);
    try{
      const r=await fetch('/api/notifications?page='+_notifPage+'&pageSize='+_NOTIF_PAGE_SIZE,{credentials:'include',signal:ctrl.signal});
      const p=await r.json().catch(()=>null);
      if(!r.ok||!p?.success||!Array.isArray(p.data)){throw new Error('Unable to fetch')}
      _renderNotifList(p.data,Number(p.total||0),Number(p.page||_notifPage),Number(p.unread||0));
    }catch(e){
      if(e?.name==='AbortError')return;
      const el=document.getElementById('notifList');
      if(el)el.innerHTML='<p class="tp-sub">Unable to load notifications.</p>';
    }
  }

  function _fmtAction(a){const v=String(a||'updated').toLowerCase();return v==='created'?'created':v==='deleted'?'deleted':'updated'}
  function _fmtSource(s){const v=String(s||'portal').toLowerCase();return v==='mcp'?'MCP':v==='server'?'Server':'Portal'}

  function _renderNotifList(items,total,page,unread){
    const el=document.getElementById('notifList');
    if(!el)return;
    if(!items.length){
      el.innerHTML='<p class="tp-sub">No notifications yet. Activity will appear here when bookmarks are created, updated, or deleted.</p>';
      document.getElementById('notifPager').innerHTML='';
      return;
    }
    el.innerHTML=items.map(n=>{
      const action=_fmtAction(n.action);
      const source=_fmtSource(n.source);
      const text=String(n.text||'').trim()||'Bookmark '+action;
      const time=n.created_at?new Date(n.created_at).toLocaleString():'';
      const read=n.is_read;
      return `<div class="notif-item${read?' notif-read':''}">
        <div class="notif-item-head">
          <span class="notif-source notif-source-${source.toLowerCase()}">${esc(source)}</span>
          <span class="notif-action notif-action-${action}">${action}</span>
          <span class="notif-time">${esc(time)}</span>
        </div>
        <div class="notif-text">${esc(text)}</div>
      </div>`;
    }).join('');

    // pager
    const totalPages=Math.max(1,Math.ceil(total/_NOTIF_PAGE_SIZE));
    const pager=document.getElementById('notifPager');
    if(pager&&totalPages>1){
      pager.innerHTML=`<button class="btn-outline" ${page<=1?'disabled':''} onclick="event.preventDefault();window._notifGoPage(${page-1})">← Prev</button><span class="tp-sub" style="display:flex;align-items:center">Page ${page} of ${totalPages}</span><button class="btn-outline" ${page>=totalPages?'disabled':''} onclick="event.preventDefault();window._notifGoPage(${page+1})">Next →</button>`;
    }else if(pager){pager.innerHTML=''}
  }

  window._notifGoPage=function(p){fetchNotifications(p)};

  document.getElementById('notifMarkAllBtn')?.addEventListener('click',async()=>{
    try{
      await fetch('/api/notifications/read-all',{method:'POST',credentials:'include'});
      fetchNotifications(_notifPage);
      await loadNotificationSummary();
    }catch{}
  });

  document.getElementById('notifRefreshBtn')?.addEventListener('click',()=>fetchNotifications(_notifPage));

  // mark all as read on first visit
  fetch('/api/notifications/read-all',{method:'POST',credentials:'include'}).catch(()=>{});
  fetchNotifications(1);
  _notifTimer=setInterval(()=>fetchNotifications(_notifPage),15000);
  container._cleanup=()=>{ctrl.abort();if(_notifTimer){clearInterval(_notifTimer);_notifTimer=null}};
}

// ── Bookmark Chat Panel (vanilla JS) ──
async function renderChatPanel(container){
  if(_healthTimer){clearInterval(_healthTimer);_healthTimer=null}
  if(_notifTimer){clearInterval(_notifTimer);_notifTimer=null}

  const fallbackHtml=`
    <div class="tp-header tp-header-modern">
      <div class="tp-title-row"><span class="tp-title-icon">💬</span><h2 class="tp-title">Bookmark Chat</h2></div>
      <p class="tp-sub">Ask friendly questions about your bookmarks.</p>
    </div>
    <div class="tp-card">
      <div class="tp-card-head"><h3>Ask About Your Bookmarks</h3></div>
      <div class="chat-shell" id="chatShell">
        <div class="chat-log" id="chatLog"></div>
        <div class="chat-input-row"><input class="fi" id="chatInput" type="text" placeholder="Ask about your bookmarks..." /><button class="btn-primary" id="chatSendBtn" type="button">Ask</button></div>
        <p class="tp-sub" id="chatStatus">Powered by your bookmark API and MCP-ready data.</p>
      </div>
    </div>`;
  await loadToolPanelTemplate(container,'/chat.html',fallbackHtml);

  const logEl=document.getElementById('chatLog');
  const inputEl=document.getElementById('chatInput');
  const sendBtn=document.getElementById('chatSendBtn');
  const statusEl=document.getElementById('chatStatus');

  function setStatus(msg){if(statusEl)statusEl.textContent=msg}
  function addMessage(role,text,links){
    if(!logEl)return;
    const wrap=document.createElement('div');
    wrap.className='chat-msg '+(role==='user'?'user':'bot');
    const body=document.createElement('div');
    body.textContent=text;
    wrap.appendChild(body);
    if(Array.isArray(links)&&links.length){
      const list=document.createElement('div');
      list.className='chat-result-list';
      links.slice(0,5).forEach((b)=>{
        const item=document.createElement('a');
        item.className='chat-result-link';
        item.href=b.url;
        item.target='_blank';
        item.rel='noopener noreferrer';
        item.textContent=b.title||b.url;
        list.appendChild(item);
      });
      wrap.appendChild(list);
    }
    logEl.appendChild(wrap);
    logEl.scrollTop=logEl.scrollHeight;
  }

  function normalizeTags(tags){
    if(Array.isArray(tags))return tags.map(t=>String(t||'').toLowerCase());
    if(typeof tags==='string')return tags.split(',').map(t=>t.trim().toLowerCase()).filter(Boolean);
    return [];
  }

  function toDateMs(value){
    const n=Date.parse(String(value||''));
    return Number.isFinite(n)?n:0;
  }

  async function getBookmarks(params){
    const qs=new URLSearchParams(params||{}).toString();
    const url='/api/bookmarks?page=1&pageSize=100'+(qs?'&'+qs:'');
    const r=await fetch(url,{credentials:'include',cache:'no-store'});
    const p=await r.json().catch(()=>null);
    if(!r.ok||!p?.success||!Array.isArray(p.data))throw new Error(p?.error||'Unable to load bookmarks.');
    return p.data;
  }

  function getSearchTerm(question){
    const q=question.toLowerCase().trim();
    const m=q.match(/(?:about|for|on|related to|find)\s+(.+)/i);
    if(m&&m[1])return m[1].replace(/[?.!]+$/g,'').trim();
    return '';
  }

  async function ask(question){
    const q=String(question||'').trim();
    if(!q)return;
    addMessage('user',q);
    if(inputEl)inputEl.value='';
    setStatus('Thinking...');
    if(sendBtn)sendBtn.disabled=true;

    try{
      const lower=q.toLowerCase();
      const weekAgo=Date.now()-7*24*60*60*1000;

      if(/(how many|count|total).*(bookmark)/.test(lower)){
        const all=await getBookmarks();
        addMessage('bot',`You have ${all.length} bookmarks in total.`);
      }else if(/(starred|favorite|favourite)/.test(lower)){
        const fav=await getBookmarks({favorite:'true'});
        addMessage('bot',fav.length?`You have ${fav.length} starred bookmarks.`:'You do not have any starred bookmarks yet.',fav);
      }else if(/(recent|latest|newest)/.test(lower)){
        const all=await getBookmarks();
        const recent=all.filter(b=>toDateMs(b.created_at||b.createdAt||b.updated_at||b.updatedAt)>=weekAgo)
          .sort((a,b)=>toDateMs(b.created_at||b.createdAt||b.updated_at||b.updatedAt)-toDateMs(a.created_at||a.createdAt||a.updated_at||a.updatedAt));
        addMessage('bot',recent.length?`I found ${recent.length} recent bookmarks from the last 7 days.`:'No bookmarks were added in the last 7 days.',recent);
      }else if(/(read later|remind me later|unread)/.test(lower)){
        const all=await getBookmarks();
        const rl=all.filter((b)=>normalizeTags(b.tags).some(t=>t==='read-later'||t==='read later'||t==='remind-later'||t==='remind me later'));
        addMessage('bot',rl.length?`You have ${rl.length} bookmarks in Remind Me Later.`:'No Remind Me Later bookmarks found.',rl);
      }else{
        const term=getSearchTerm(q) || q.replace(/[?.!]+$/g,'').trim();
        const matches=await getBookmarks({search:term});
        addMessage('bot',matches.length?`I found ${matches.length} bookmarks related to "${term}".`:`I could not find bookmarks related to "${term}". Try another keyword.`,matches);
      }
      setStatus('Powered by your bookmark API and MCP-ready data.');
    }catch(e){
      addMessage('bot','I could not answer right now. Please make sure you are logged in and try again.');
      setStatus(e?.message||'Unable to process request.');
    }finally{
      if(sendBtn)sendBtn.disabled=false;
    }
  }

  window.askBookmarkChat=(question)=>ask(question);
  sendBtn?.addEventListener('click',()=>ask(inputEl?.value||''));
  inputEl?.addEventListener('keydown',(e)=>{if(e.key==='Enter'){e.preventDefault();ask(inputEl?.value||'')}});

  container._cleanup=()=>{delete window.askBookmarkChat};
}

const _bmChatStopWords=new Set(['the','a','an','to','for','of','in','on','about','show','find','list','my','me','please','are','is','do','does','have','has','what','which','where','when','how','many','all','any','with','and','or','from','that','this','those','these','related']);

function _bmNormalizeTags(tags){
  if(Array.isArray(tags))return tags.map((t)=>String(t||'').toLowerCase().trim()).filter(Boolean);
  if(typeof tags==='string')return tags.split(',').map((t)=>t.toLowerCase().trim()).filter(Boolean);
  return [];
}

function _bmDateMs(value){
  const n=Date.parse(String(value||''));
  return Number.isFinite(n)?n:0;
}

function _bmDomain(url){
  try{return new URL(String(url||'')).hostname.replace(/^www\./,'').toLowerCase()}catch{return ''}
}

function _bmText(blob){
  return String(blob||'').toLowerCase();
}

function _bmTokens(question){
  return _bmText(question)
    .replace(/[^a-z0-9\s-]/g,' ')
    .split(/\s+/)
    .map((w)=>w.trim())
    .filter((w)=>w.length>1&&!_bmChatStopWords.has(w));
}

async function _fetchAllBookmarksForChat(){
  const all=[];
  let page=1;
  const pageSize=100;
  while(page<=20){
    const r=await fetch(`/api/bookmarks?page=${page}&pageSize=${pageSize}`,{credentials:'include',cache:'no-store'});
    const p=await r.json().catch(()=>null);
    if(!r.ok||!p?.success||!Array.isArray(p.data))throw new Error(p?.error||'Unable to load bookmarks.');
    all.push(...p.data);
    if(!p.hasMore||p.data.length<pageSize)break;
    page+=1;
  }
  return all;
}

function _rankBookmarksForQuestion(bookmarks,question){
  const tokens=_bmTokens(question);
  if(!tokens.length)return [];
  return bookmarks
    .map((b)=>{
      const tags=_bmNormalizeTags(b.tags);
      const hay=[b.title,b.description,b.notes,b.url,tags.join(' ')].map(_bmText).join(' ');
      let score=0;
      for(const t of tokens){
        if(hay.includes(t))score+=1;
        if(_bmDomain(b.url).includes(t))score+=2;
        if(tags.some((tag)=>tag===t||tag.includes(t)))score+=2;
      }
      return {bookmark:b,score};
    })
    .filter((x)=>x.score>0)
    .sort((a,b)=>b.score-a.score||_bmDateMs(b.bookmark.created_at||b.bookmark.updated_at)-_bmDateMs(a.bookmark.created_at||a.bookmark.updated_at))
    .map((x)=>x.bookmark);
}

function _countBy(items,selector){
  const m=new Map();
  for(const item of items){
    const key=selector(item);
    if(!key)continue;
    m.set(key,(m.get(key)||0)+1);
  }
  return [...m.entries()].sort((a,b)=>b[1]-a[1]);
}

async function answerBookmarkQuestion(question){
  const q=String(question||'').trim();
  const lower=q.toLowerCase();
  const all=await _fetchAllBookmarksForChat();
  const weekAgo=Date.now()-7*24*60*60*1000;
  const monthAgo=Date.now()-30*24*60*60*1000;

  if(/(total|count|how many).*(bookmark)/.test(lower)){
    return {text:`You currently have ${all.length} bookmarks.`,links:[]};
  }

  if(/(starred|favorite|favourite)/.test(lower)){
    const starred=all.filter((b)=>Boolean(b.is_favorite||b.isFavorite));
    return {
      text:starred.length?`You have ${starred.length} starred bookmarks.`:'You do not have any starred bookmarks yet.',
      links:starred,
    };
  }

  if(/(read later|remind me later|unread)/.test(lower)){
    const later=all.filter((b)=>_bmNormalizeTags(b.tags).some((t)=>t==='read-later'||t==='read later'||t==='remind-later'||t==='remind me later'));
    return {
      text:later.length?`I found ${later.length} Remind Me Later bookmarks.`:'No Remind Me Later bookmarks found.',
      links:later,
    };
  }

  if(/(recent|latest|newest|this week|today|this month)/.test(lower)){
    const since=/today/.test(lower)?Date.now()-24*60*60*1000:/this month/.test(lower)?monthAgo:weekAgo;
    const recent=all
      .filter((b)=>_bmDateMs(b.created_at||b.createdAt||b.updated_at||b.updatedAt)>=since)
      .sort((a,b)=>_bmDateMs(b.created_at||b.createdAt||b.updated_at||b.updatedAt)-_bmDateMs(a.created_at||a.createdAt||a.updated_at||a.updatedAt));
    return {
      text:recent.length?`I found ${recent.length} recent bookmarks in that time window.`:'No bookmarks found for that recent time window.',
      links:recent,
    };
  }

  if(/(top tags|popular tags|most used tags|tags summary)/.test(lower)){
    const tags=[];
    all.forEach((b)=>tags.push(..._bmNormalizeTags(b.tags)));
    const top=_countBy(tags,(t)=>t).slice(0,6);
    const summary=top.length?top.map(([tag,count])=>`${tag} (${count})`).join(', '):'No tags found yet.';
    return {text:`Top tags: ${summary}`,links:[]};
  }

  if(/(top domains|popular sites|most saved sites|domains)/.test(lower)){
    const top=_countBy(all,(b)=>_bmDomain(b.url)).slice(0,6);
    const summary=top.length?top.map(([domain,count])=>`${domain} (${count})`).join(', '):'No domains found yet.';
    return {text:`Top domains: ${summary}`,links:[]};
  }

  const fromMatch=lower.match(/from\s+([a-z0-9.-]+\.[a-z]{2,})/i);
  if(fromMatch&&fromMatch[1]){
    const target=fromMatch[1].toLowerCase().replace(/^www\./,'');
    const matches=all.filter((b)=>_bmDomain(b.url).includes(target));
    return {
      text:matches.length?`I found ${matches.length} bookmarks from ${target}.`:`I could not find bookmarks from ${target}.`,
      links:matches,
    };
  }

  const scored=_rankBookmarksForQuestion(all,q);
  if(scored.length){
    const shown=scored.slice(0,8);
    return {
      text:`I found ${scored.length} bookmark${scored.length===1?'':'s'} related to your question. Here are the most relevant ones:`,
      links:shown,
    };
  }

  return {
    text:'I could not find a strong match for that question yet. Try asking by keyword, tag, domain, or timeframe.',
    links:[],
  };
}

function initFloatingChatbot(){
  const fab=document.getElementById('aiChatFab');
  const drawer=document.getElementById('aiChatDrawer');
  const closeBtn=document.getElementById('aiChatClose');
  const logEl=document.getElementById('aiChatLog');
  const inputEl=document.getElementById('aiChatInput');
  const sendBtn=document.getElementById('aiChatSend');
  const statusEl=document.getElementById('aiChatStatus');
  const quickWrap=document.getElementById('aiChatQuick');
  if(!fab||!drawer||!logEl||!inputEl||!sendBtn||!statusEl)return;

  function setStatus(msg){statusEl.textContent=msg}
  function setOpen(open){
    drawer.classList.toggle('open',open);
    drawer.setAttribute('aria-hidden',open?'false':'true');
    if(open){setTimeout(()=>inputEl.focus(),60)}
  }
  function addMessage(role,text,links){
    const wrap=document.createElement('div');
    wrap.className='ai-chat-msg '+(role==='user'?'user':'bot');
    const body=document.createElement('div');
    body.textContent=text;
    wrap.appendChild(body);
    if(Array.isArray(links)&&links.length){
      const list=document.createElement('div');
      list.className='ai-chat-links';
      links.slice(0,6).forEach((b)=>{
        const a=document.createElement('a');
        a.className='ai-chat-link';
        a.href=b.url;
        a.target='_blank';
        a.rel='noopener noreferrer';
        a.textContent=b.title||b.url;
        list.appendChild(a);
      });
      wrap.appendChild(list);
    }
    logEl.appendChild(wrap);
    logEl.scrollTop=logEl.scrollHeight;
  }

  async function ask(question){
    const q=String(question||'').trim();
    if(!q)return;
    addMessage('user',q);
    inputEl.value='';
    sendBtn.disabled=true;
    setStatus('Thinking...');
    try{
      const result=await answerBookmarkQuestion(q);
      addMessage('bot',result.text,result.links||[]);
      setStatus('Using your bookmark data from this account.');
    }catch(e){
      addMessage('bot','I could not answer right now. Please make sure you are logged in and try again.');
      setStatus(e?.message||'Unable to process request.');
    }finally{sendBtn.disabled=false}
  }

  fab.addEventListener('click',()=>setOpen(!drawer.classList.contains('open')));
  closeBtn?.addEventListener('click',()=>setOpen(false));
  sendBtn.addEventListener('click',()=>ask(inputEl.value));
  inputEl.addEventListener('keydown',(e)=>{if(e.key==='Enter'){e.preventDefault();ask(inputEl.value)}});
  quickWrap?.addEventListener('click',(e)=>{
    const t=e.target;
    if(!(t instanceof HTMLElement))return;
    const q=t.getAttribute('data-q');
    if(q){ask(q)}
  });
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&drawer.classList.contains('open'))setOpen(false)});
}

// Handle direct URL navigation for tool sections
function _initSectionFromUrl(){
  const p=window.location.pathname;
  if(p==='/syshealth')switchSection('syshealth');
  else if(p==='/mcp')switchSection('mcp');
  else if(p==='/chat')switchSection('chat');
  else if(p==='/notifications')switchSection('notifications');
}
window.addEventListener('popstate',()=>{
  const p=window.location.pathname;
  if(p==='/syshealth')switchSection('syshealth');
  else if(p==='/mcp')switchSection('mcp');
  else if(p==='/chat')switchSection('chat');
  else if(p==='/notifications')switchSection('notifications');
  else if(currentSection!=='bookmarks')switchSection('bookmarks');
});

// ══════════════════════════════════════════════
// WELCOME PANEL (logged-out experience) — loads intro.html
// ══════════════════════════════════════════════
async function renderWelcomeExperience(){
  if(currentUser)return;

  // hide bookmark UI
  document.querySelectorAll('.dash-header,.action-bar,.filter-bar,.advanced-filters').forEach(el=>el.style.display='none');
  const bc=document.getElementById('bookmarkContent');
  if(bc)bc.style.display='none';
  const onboard=document.getElementById('onboardBanner');
  if(onboard)onboard.style.display='none';

  // create / reuse welcome container
  let wp=document.getElementById('welcomePanel');
  if(!wp){
    wp=document.createElement('div');
    wp.id='welcomePanel';
    wp.className='welcome-shell';
    document.getElementById('mainArea').appendChild(wp);
  }
  wp.style.display='';

  // fetch intro.html (cached by SW) and inject
  try{
    const res=await fetch('/intro.html');
    if(res.ok) wp.innerHTML=await res.text();
  }catch(e){ console.warn('Failed to load intro.html',e); }
}

function hideWelcomeExperience(){
  const wp=document.getElementById('welcomePanel');
  if(wp)wp.style.display='none';
  document.querySelectorAll('.dash-header,.action-bar,.filter-bar,.advanced-filters').forEach(el=>el.style.display='');
  const bc=document.getElementById('bookmarkContent');if(bc)bc.style.display='';
}

async function initDashboard(){
  if(authEls.menuLogoutBtn){
    authEls.menuLogoutBtn.addEventListener('click',async()=>{toggleSettingsMenu(false);await performLogout()});
  }
  // Settings menu logic removed
  loadRecentSearches();
  renderRecentSearchChips();
  setupQuickSmartInput();
  renderQuickMeta(null);
  initModalTagInput();
  await loadCurrentUser();
  await loadNotificationSummary();
  await loadBookmarks();
  render();
  initFloatingChatbot();
  if(!currentUser){await renderWelcomeExperience();}
  setupTagManager();
  _initSectionFromUrl();
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


