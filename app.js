/* 俄罗斯史诗 — 应用逻辑 */
(function(){
'use strict';
const ALL = [].concat(window.VOL1, window.VOL2, window.VOL3, window.VOL4, window.VOL5);
const MODULES = window.MODULES, ERAS = window.ERAS;
const byId = id => MODULES.find(m=>m.id===Number(id));
const eraOf = m => { const meta=MODULES.find(x=>x.id===m.id); return ERAS.find(e=>e.id===(meta&&meta.era)); };
const chaptersMap={}; ALL.forEach(m=>chaptersMap[m.id]=m.chapters);
const chaptersOf = m => chaptersMap[m.id];
const allChapters = ALL.flatMap(m=>chaptersMap[m.id].map(c=>({...c,mod:m})));
const findChapter = id => allChapters.find(c=>c.id===id);
/* 合并深度扩展段落：插入在来源说明之前 */
(function(){
  const layers=[window.EXTRA1||{},window.EXTRA2||{},window.EXTRA3||{},window.EXTRA4||{},window.EXTRA5||{},window.EXTRA6||{},window.EXTRA7||{},window.EXTRA8||{},window.DEEP1||{},window.DEEP2||{},window.DEEP3||{}];
  allChapters.forEach(c=>{
    const x=layers.map(L=>L[c.id]||'').join(''); if(!x)return;
    if(c.body.includes('<p class="source">')) c.body=c.body.replace('<p class="source">',x+'<p class="source">');
    else c.body+=x;
  });
})();

/* ---------- 本地存储 ---------- */
const KEY='russian-epic-v1';
let store = {progress:{}, bookmarks:[], notes:{}, last:null};
try{ const raw=localStorage.getItem(KEY); if(raw) store=Object.assign(store, JSON.parse(raw)); }catch(e){}
const save=()=>{ try{ localStorage.setItem(KEY, JSON.stringify(store)); }catch(e){} };

/* ---------- DOM ---------- */
const $=id=>document.getElementById(id);
const view=$('view'), topTitle=$('topTitle');
let tab='home';

/* ---------- 工具 ---------- */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function strip(html){ const d=document.createElement('div'); d.innerHTML=html; return d.textContent||''; }
function setTitle(t){ topTitle.textContent=t; document.title=t+' · 俄罗斯史诗'; }
function toast(msg){
  let el=document.createElement('div');
  el.textContent=msg;
  el.style.cssText='position:fixed;left:50%;bottom:130px;transform:translateX(-50%);background:#3d1116;color:#f3e6c8;padding:10px 20px;border-radius:4px;font-size:12px;z-index:99;box-shadow:0 6px 20px rgba(0,0,0,.3)';
  document.body.appendChild(el); setTimeout(()=>el.remove(),1800);
}
function render(){
  if(tab==='home') renderHome();
  else if(tab==='contents') renderContents();
  else if(tab==='archives') renderArchives();
  else if(tab==='mine') renderMine();
  else if(tab==='read') renderReader();
}

/* ---------- 首页 ---------- */
function renderHome(){
  setTitle('俄罗斯史诗');
  const read=Object.keys(store.progress).length;
  const last=store.last&&findChapter(store.last);
  const totalChars=allChapters.reduce((a,c)=>a+strip(c.body).length,0);
  view.innerHTML=`
  <section class="hero">
    <div class="hero-mark">THE IMPERIAL LIBRARY · EST. 2026</div>
    <h1>俄罗斯史诗</h1>
    <h2>HISTORY OF RUSSIA</h2>
    <p>从东斯拉夫人的森林与河流，到基辅的黄金穹顶、金帐汗国的草原、莫斯科的崛起、彼得大帝的欧化、帝国的扩张、革命的烈焰、苏联的兴衰——一部可长期阅读的俄罗斯历史数字著作。</p>
    <div class="hero-stats">
      <div class="hero-stat"><b>${MODULES.length}</b><span>历史模块</span></div>
      <div class="hero-stat"><b>${allChapters.length}</b><span>深度章节</span></div>
      <div class="hero-stat"><b>${(totalChars/10000).toFixed(1)}万</b><span>正文字数</span></div>
      <div class="hero-stat"><b>${read}</b><span>已读章节</span></div>
    </div>
  </section>
  <section class="section">
    <div class="section-head"><h3>继续阅读</h3><small>CONTINUE</small></div>
    ${last?`<div class="continue-card" data-go="${last.id}">
      <div><div class="lbl">上次读到</div><h4>${esc(last.title)}</h4><p>${esc(last.mod.title)}</p></div>
      <div class="arrow">→</div>
    </div>`:`<div class="quote-box">从基辅罗斯的第一座教堂开始，还是直接从彼得大帝的改革读起？打开目录，选择你的起点。${''}
      <cite>— 阅读进度会自动保存在本机</cite></div>`}
  </section>
  <section class="section">
    <div class="section-head"><h3>历史时代</h3><small>ERAS · 01—05</small></div>
    <div class="era-grid">${ERAS.map((e,i)=>{
      const mods=MODULES.filter(m=>m.era===e.id);
      return `<article class="era-card" data-era="${e.id}">
        <div class="era-chip">ERA ${String(i+1).padStart(2,'0')} · ${e.range}</div>
        <h4>${e.name}</h4><p>${e.desc}</p>
        <div class="count">${mods.length} 个模块 · ${mods.reduce((a,m)=>a+chaptersMap[m.id].length,0)} 章</div>
      </article>`}).join('')}</div>
  </section>
  <section class="section">
    <div class="section-head"><h3>参考著作</h3><small>SOURCES</small></div>
    <div class="card-list">
      ${[
        ['01','A History of Russia (8th ed.)','尼古拉·梁赞诺夫斯基 / 马克·斯坦伯克 · 整体框架'],
        ['02','Курс русской истории','瓦西里·克柳切夫斯基 · 国家形成与社会经济'],
        ['03',"Natasha's Dance",'奥兰多·费吉斯 · 文化史与民族认同']
      ].map(x=>`<div class="mini-card"><span class="num">${x[0]}</span><div class="txt"><h5>${x[1]}</h5><p>${x[2]}</p></div></div>`).join('')}
    </div>
    <p style="font-size:11px;line-height:1.8;color:var(--muted);margin-top:12px">本站正文基于可靠公开史学成果独立撰写，以上著作用于结构、视角与专题参考，并非原文摘录。未使用原书页码或声称原书观点。</p>
  </section>
  <section class="section">
    <div class="section-head"><h3>文化专题</h3><small>CULTURE</small></div>
    <div class="card-list">${window.CULTURE.map(c=>`<div class="mini-card" data-culture="${c.n}"><div class="txt"><h5>${c.n}</h5><p>${esc(c.d)}</p></div><span class="go">→</span></div>`).join('')}</div>
  </section>`;

  view.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>openChapter(el.dataset.go));
  view.querySelectorAll('[data-era]').forEach(el=>el.onclick=()=>{tab='contents';render();setTimeout(()=>{const m=MODULES.find(x=>x.era===el.dataset.era);const node=document.getElementById('toc-era-'+el.dataset.era);if(node)node.scrollIntoView({behavior:'smooth'})},50)});
  view.querySelectorAll('[data-culture]').forEach(el=>el.onclick=()=>{tab='archives';window._archiveTab='文化';render()});
  window.scrollTo(0,0);
}

/* ---------- 目录 ---------- */
function renderContents(){
  setTitle('历史目录');
  view.innerHTML=`<div class="contents-hero"><h2>二十八章俄罗斯史</h2><p>按时代编排 · ${allChapters.length} 节连续叙述 · 点击进入阅读</p></div>
  ${ERAS.map(e=>{
    const mods=MODULES.filter(m=>m.era===e.id);
    return `<div class="toc-era" id="toc-era-${e.id}"><div class="toc-era-head"><h3>${e.name}</h3><span>${e.range} · ${mods.length} 模块</span></div>
      ${mods.map(m=>`<article class="toc-module" data-mod="${m.id}">
        <div class="toc-module-head"><span class="toc-index">${String(m.id).padStart(2,'0')}</span>
          <div class="t"><h4>${m.title}</h4><p>${m.years} · ${m.sub} · ${chaptersMap[m.id].length} 章</p></div>
          <span class="toc-chev">›</span></div>
        <div class="toc-chapters">${chaptersMap[m.id].map(c=>`<div class="toc-chapter ${store.progress[c.id]?'read':''}" data-go="${c.id}"><span class="dot"></span><span>${c.title}</span></div>`).join('')}</div>
      </article>`).join('')}</div>`}).join('')}`;
  view.querySelectorAll('.toc-module-head').forEach(el=>el.onclick=()=>el.parentElement.classList.toggle('open'));
  view.querySelectorAll('[data-go]').forEach(el=>el.onclick=e=>{e.stopPropagation();openChapter(el.dataset.go)});
  window.scrollTo(0,0);
}

/* ---------- 阅读器 ---------- */
let currentId=null;
function openChapter(id){
  const c=findChapter(id); if(!c)return;
  currentId=id; store.last=id; save(); tab='read';
  try{ history.replaceState(null,'','#c/'+id); }catch(e){}
  render(); window.scrollTo(0,0);
  const idx=allChapters.indexOf(c);
  $('readProgress').textContent=(idx+1)+' / '+allChapters.length;
  $('btnBookmark').classList.toggle('on',store.bookmarks.includes(id));
  $('btnNote').classList.toggle('on',!!store.notes[id]);
  $('readToolbar').classList.add('show');
}
function renderReader(){
  const c=findChapter(currentId)||allChapters[0];
  const idx=allChapters.indexOf(c), m=c.mod, e=eraOf(m);
  const chars=strip(c.body).length;
  const minutes=Math.max(3,Math.round(chars/300));
  setTitle(c.title);
  view.innerHTML=`<article class="reader">
    <div class="reader-head">
      <div class="reader-crumb">${e.name} / ${esc(m.title)} / 第 ${chaptersMap[m.id].findIndex(x=>x.id===c.id)+1} 章</div>
      <h1>${c.title}</h1>
      <div class="reader-sub">${c.sub}</div>
      <div class="reader-meta"><span>时间 <b>${m.years}</b></span><span>约 <b>${chars}</b> 字</span><span>阅读 <b>${minutes} 分钟</b></span></div>
    </div>
    <div class="reader-body">${c.body}</div>
    <div class="reader-end"><p style="font-size:12px;color:var(--muted)">读完了？记下你的想法，或继续下一章。</p>
      <button id="btnEndNext">${idx<allChapters.length-1?'继续阅读下一章 →':'返回目录'}</button></div>
  </article>`;
  $('btnEndNext').onclick=()=>{ if(idx<allChapters.length-1) openChapter(allChapters[idx+1].id); else {tab='contents';render()} };
  // 进度标记与滚动恢复
  setTimeout(()=>{
    if(store.progress[currentId]){
      const y=store.progress[currentId];
      if(y>200&&y<document.body.scrollHeight) window.scrollTo(0,y);
    }
    store.progress[currentId]=window.scrollY||0; save();
    let t; window.onscroll=()=>{clearTimeout(t);t=setTimeout(()=>{if(tab==='read'&&currentId){store.progress[currentId]=window.scrollY;save();}},350)};
  },80);
}

/* ---------- 档案 ---------- */
function renderArchives(){
  setTitle('历史档案');
  const active=window._archiveTab||'人物';
  const tabs=['人物','王朝','世系','地图','时间轴','文化'];
  view.innerHTML=`<div class="contents-hero"><h2>历史档案</h2><p>人物 · 王朝 · 世系 · 疆域 · 时间轴 · 文化</p></div>
  <div class="archive-tabs">${tabs.map(t=>`<button class="${t===active?'on':''}" data-at="${t}">${t}</button>`).join('')}</div>
  <div class="archive-content" id="archiveContent"></div>`;
  view.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{window._archiveTab=b.dataset.at;renderArchives()});
  const box=$('archiveContent');
  if(active==='人物'){
    box.innerHTML=`<p class="archive-intro">沙皇、领导人、作家与作曲家。人物与相关章节相互关联，点击标签可跳转阅读。</p>
    ${window.PEOPLE.map(p=>`<div class="person-card"><div class="portrait">${p.n.slice(0,1)}</div>
      <div><h4>${p.n}</h4><div class="life">${p.life}</div><p>${p.d}</p>
      <div class="person-tags">${p.tag.map(t=>`<span class="tag">${t}</span>`).join('')}</div></div></div>`).join('')}`;
  } else if(active==='王朝'){
    box.innerHTML=`<p class="archive-intro">俄罗斯主要统治王朝与政治体制的更替。</p>
    ${window.DYNASTIES.map(d=>`<div class="person-card"><div class="portrait">${d.n.slice(0,1)}</div><div><h4>${d.n}</h4><div class="life">${d.yr}</div><p>${d.d}</p></div></div>`).join('')}`;
  } else if(active==='世系'){
    box.innerHTML=`<p class="archive-intro">罗曼诺夫王朝主要世系（简化）。</p><div class="rel-map">${renderTree(window.ROMANOV_TREE[0])}</div>`;
  } else if(active==='地图'){
    box.innerHTML=`<p class="archive-intro">历史疆域示意，支持拖动与缩放。</p>
    ${Object.keys(window.MAPS).map(k=>mapHTML(window.MAPS[k])).join('')}`;
    initMaps();
  } else if(active==='时间轴'){
    box.innerHTML=`<p class="archive-intro">帝国与苏联的关键节点。</p>
    <h4 style="font-family:var(--serif);color:var(--wine);margin:18px 0 14px">俄罗斯帝国时间轴</h4>
    <div class="timeline">${window.TIMELINES.empire.map(x=>`<div class="tl-item"><div class="tl-year">${x.y}</div><p>${x.t}</p></div>`).join('')}</div>
    <h4 style="font-family:var(--serif);color:var(--wine);margin:18px 0 14px">革命与苏联时间轴</h4>
    <div class="timeline">${window.TIMELINES.soviet.map(x=>`<div class="tl-item"><div class="tl-year">${x.y}</div><p>${x.t}</p></div>`).join('')}</div>`;
  } else {
    box.innerHTML=`<p class="archive-intro">俄罗斯文化史专题：文学、艺术、音乐与宗教。</p>
    ${window.CULTURE.map(c=>`<div class="person-card"><div class="portrait">${c.n.slice(0,1)}</div><div><h4>${c.n}</h4><p>${c.d}</p>
      <div class="person-tags">${c.refs.map(r=>`<span class="tag" data-go="MOD${r}">模块 ${r}</span>`).join('')}</div></div></div>`).join('')}`;
    box.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>{const m=byId(el.dataset.go.slice(3));if(m)openChapter(chaptersMap[m.id][0].id)});
  }
  window.scrollTo(0,0);
}
function renderTree(node){
  let h=`<div class="node">${node.t}</div>`;
  if(node.ch&&node.ch.length) h+=`<div class="indent">${node.ch.map(renderTree).join('')}</div>`;
  return h;
}
function mapHTML(m){
  return `<h4 style="font-family:var(--serif);font-size:16px;color:var(--wine);margin:20px 0 8px">${m.name}</h4>
  <div class="map-wrap" data-map="1"><div class="map-inner">${m.svg}</div>
    <div class="map-controls"><button data-zoom="in">＋</button><button data-zoom="out">−</button><button data-zoom="reset">↺</button></div></div>
  <p class="map-hint">${m.hint}</p>`;
}
function initMaps(){
  document.querySelectorAll('[data-map]').forEach(wrap=>{
    const inner=wrap.querySelector('.map-inner');
    let scale=1,tx=0,ty=0,drag=false,sx=0,sy=0;
    const apply=()=>inner.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;
    wrap.addEventListener('wheel',e=>{e.preventDefault();scale=Math.min(4,Math.max(0.7,scale*(e.deltaY<0?1.15:0.87)));apply()},{passive:false});
    wrap.addEventListener('pointerdown',e=>{drag=true;sx=e.clientX-tx;sy=e.clientY-ty;wrap.setPointerCapture(e.pointerId)});
    wrap.addEventListener('pointermove',e=>{if(!drag)return;tx=e.clientX-sx;ty=e.clientY-sy;apply()});
    wrap.addEventListener('pointerup',()=>drag=false);
    wrap.addEventListener('pointercancel',()=>drag=false);
    wrap.querySelectorAll('[data-zoom]').forEach(b=>{
      b.addEventListener('pointerdown',e=>e.stopPropagation());
      b.onclick=e=>{
      e.stopPropagation();
      const a=b.dataset.zoom;
      if(a==='in')scale=Math.min(4,scale*1.3);
      else if(a==='out')scale=Math.max(0.7,scale/1.3);
      else {scale=1;tx=0;ty=0}
      apply();
      };
    });
  });
}

/* ---------- 我的 ---------- */
function renderMine(){
  setTitle('我的书架');
  const read=Object.keys(store.progress).length;
  const marks=store.bookmarks.map(id=>findChapter(id)).filter(Boolean);
  const notes=Object.keys(store.notes).filter(k=>store.notes[k]&&store.notes[k].trim());
  const pct=Math.round(read/allChapters.length*100);
  view.innerHTML=`<div class="mine-hero"><h2>我的书架</h2><p>阅读进度保存在本机浏览器中</p>
    <div class="mine-stats">
      <div class="mine-stat"><b>${read}</b><span>已读章节</span></div>
      <div class="mine-stat"><b>${pct}%</b><span>阅读进度</span></div>
      <div class="mine-stat"><b>${marks.length}</b><span>书签</span></div>
      <div class="mine-stat"><b>${notes.length}</b><span>笔记</span></div>
    </div></div>
    <section class="section"><div class="section-head"><h3>我的书签</h3><small>BOOKMARKS</small></div>
      ${marks.length?`<div class="card-list">${marks.map(c=>`<div class="mini-card" data-go="${c.id}"><span class="num">◆</span><div class="txt"><h5>${c.title}</h5><p>${c.mod.title}</p></div><span class="go">→</span></div>`).join('')}</div>`:'<div class="empty-state">还没有书签。阅读时点击工具栏的书签图标即可收藏。</div>'}
    </section>
    <section class="section"><div class="section-head"><h3>我的笔记</h3><small>NOTES</small></div>
      ${notes.length?`<div class="card-list">${notes.map(id=>{const c=findChapter(id);return `<div class="mini-card" data-go="${id}"><span class="num">✎</span><div class="txt"><h5>${c?c.title:id}</h5><p>${esc(store.notes[id].slice(0,60))}</p></div><span class="go">→</span></div>`}).join('')}</div>`:'<div class="empty-state">还没有笔记。阅读时点击工具栏的笔记图标写下你的想法。</div>'}
    </section>
    <section class="section"><div class="section-head"><h3>数据管理</h3><small>DATA</small></div>
      <button id="btnExport" class="btn-primary" style="width:100%">导出阅读数据（JSON）</button>
      <button id="btnImport" class="btn-ghost" style="width:100%;margin-top:8px">导入阅读数据</button>
      <input type="file" id="fileImport" accept="application/json" style="display:none">
    </section>`;
  view.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>openChapter(el.dataset.go));
  $('btnExport').onclick=()=>{
    const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='russian-epic-reading-data.json';a.click();
  };
  $('btnImport').onclick=()=>$('fileImport').click();
  $('fileImport').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{store=Object.assign(store,JSON.parse(r.result));save();renderMine();toast('导入成功')}catch(err){toast('文件格式错误')}};r.readAsText(f)};
  window.scrollTo(0,0);
}

/* ---------- 抽屉 ---------- */
function buildDrawer(){
  $('drawerList').innerHTML=ERAS.map(e=>`<div class="drawer-group">${e.name} · ${e.range}</div>`+
    MODULES.filter(m=>m.era===e.id).map(m=>`<div class="drawer-item" data-go="${chaptersMap[m.id][0].id}"><span class="n">${String(m.id).padStart(2,'0')}</span><span class="t">${m.title}<small>${m.years} · ${chaptersMap[m.id].length} 章</small></span></div>`).join('')).join('');
  $('drawerList').querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>{closeDrawer();openChapter(el.dataset.go)});
}
function openDrawer(){$('drawer').classList.add('show');$('drawerBackdrop').classList.add('show')}
function closeDrawer(){$('drawer').classList.remove('show');$('drawerBackdrop').classList.remove('show')}

/* ---------- 搜索 ---------- */
const INDEX=allChapters.map(c=>({id:c.id,title:c.title,sub:c.sub,path:c.mod.title,modId:c.mod.id,text:strip(c.body)}));
function openSearch(){$('searchSheet').classList.add('show');$('searchBackdrop').classList.add('show');setTimeout(()=>$('searchInput').focus(),150)}
function closeSearch(){$('searchSheet').classList.remove('show');$('searchBackdrop').classList.remove('show')}
function doSearch(q){
  q=q.trim().toLowerCase();
  const out=$('searchResults');
  if(!q){$('searchMeta').textContent='输入关键词搜索 '+INDEX.length+' 个章节的正文';out.innerHTML='<div class="search-empty">可搜索：彼得大帝、农奴制、基辅罗斯、斯大林、东正教、莫斯科…</div>';return}
  const t0=Date.now();
  let hits=INDEX.filter(x=>(x.title+x.sub+x.path).toLowerCase().includes(q)||x.text.toLowerCase().includes(q));
  hits.sort((a,b)=>{
    const sa=(a.title+a.sub).toLowerCase().includes(q)?1:0, sb=(b.title+b.sub).toLowerCase().includes(q)?1:0;
    return sb-sa;
  });
  $('searchMeta').textContent=`找到 ${hits.length} 个相关章节 · ${Date.now()-t0}ms`;
  out.innerHTML=hits.length?hits.map(x=>{
    const i=x.text.toLowerCase().indexOf(q);
    let snip=x.text.slice(Math.max(0,i-45),i+110);
    if(i<0)snip=x.text.slice(0,140);
    const re=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');
    return `<div class="search-result" data-go="${x.id}"><div class="path">模块 ${x.modId} · ${x.path}</div><h4>${x.title}</h4><p>${snip.replace(re,'<mark>$1</mark>')}</p></div>`;
  }).join(''):'<div class="search-empty">没有找到相关章节。试试更宽泛的关键词。</div>';
  out.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>{closeSearch();openChapter(el.dataset.go)});
}

/* ---------- 笔记 ---------- */
let noteId=null;
function openNote(id){
  noteId=id;const c=findChapter(id);
  $('noteChapterTitle').textContent=c?c.title:'阅读笔记';
  $('noteText').value=store.notes[id]||'';
  $('noteModal').classList.add('show');$('modalBackdrop').classList.add('show');
}
function closeNote(){$('noteModal').classList.remove('show');$('modalBackdrop').classList.remove('show')}

/* ---------- 事件绑定 ---------- */
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); tab=b.dataset.tab;
  $('readToolbar').classList.toggle('show',tab==='read');
  if(tab!=='read')window.onscroll=null;
  render();
});
$('btnMenu').onclick=openDrawer;
$('btnCloseDrawer').onclick=closeDrawer;
$('drawerBackdrop').onclick=closeDrawer;
$('drawerFilter').oninput=e=>{
  const q=e.target.value.trim();
  $('drawerList').querySelectorAll('.drawer-item,.drawer-group').forEach(el=>{
    el.style.display=(!q||el.textContent.toLowerCase().includes(q.toLowerCase()))?'':'none';
  });
};
$('btnSearch').onclick=openSearch;
$('btnCloseSearch').onclick=closeSearch;
$('searchBackdrop').onclick=closeSearch;
$('searchInput').oninput=e=>doSearch(e.target.value);
$('btnBookmark').onclick=()=>{
  const i=store.bookmarks.indexOf(currentId);
  if(i>=0){store.bookmarks.splice(i,1);toast('已取消书签')}else{store.bookmarks.push(currentId);toast('已添加书签')}
  $('btnBookmark').classList.toggle('on',i<0);save();
};
$('btnNote').onclick=()=>openNote(currentId);
$('btnCloseNote').onclick=closeNote;
$('modalBackdrop').onclick=closeNote;
$('btnSaveNote').onclick=()=>{
  const v=$('noteText').value.trim();
  if(v)store.notes[noteId]=v;else delete store.notes[noteId];
  save();closeNote();$('btnNote').classList.toggle('on',!!store.notes[currentId]);toast('笔记已保存');
};
$('btnDeleteNote').onclick=()=>{delete store.notes[noteId];save();$('noteText').value='';closeNote();toast('笔记已删除')};
$('btnPrev').onclick=()=>{const i=allChapters.findIndex(c=>c.id===currentId);if(i>0)openChapter(allChapters[i-1].id)};
$('btnNext').onclick=()=>{const i=allChapters.findIndex(c=>c.id===currentId);if(i<allChapters.length-1)openChapter(allChapters[i+1].id)};
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeDrawer();closeSearch();closeNote()}
  if(tab==='read'){
    if(e.key==='ArrowLeft')$('btnPrev').click();
    if(e.key==='ArrowRight')$('btnNext').click();
  }
});

/* ---------- 启动 ---------- */
buildDrawer();
(function(){
  const h=(location.hash||'').match(/^#c\/([\d-]+)$/);
  if(h&&findChapter(h[1])){ openChapter(h[1]); return; }
  render();
})();
doSearch('');
})();
