// chat-utils.js — extracted from index.html, NES Locale Phase 0
// 24 functions, zero logic changes

function showToast(msg){
  const t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);setTimeout(()=>t.remove(),2800);
}

function loadLocal(){
  try{
    const h=localStorage.getItem(STORAGE_KEYS.h);if(h)history=JSON.parse(h);
    allMsgsHTML=localStorage.getItem(STORAGE_KEYS.m)||''
    const u=localStorage.getItem(STORAGE_KEYS.u);
    if(u){const ud=JSON.parse(u);if(ud.date===new Date().toDateString()){chatUsed=ud.c||0;imagesUsed=ud.i||0;docsUsed=ud.d||0;}}
  }catch(e){}
}

function saveHistory(){
  try{
    localStorage.setItem(STORAGE_KEYS.h,JSON.stringify(history.slice(-30)));
    const msgs=document.getElementById('messages');
    if(msgs){allMsgsHTML=msgs.innerHTML;localStorage.setItem(STORAGE_KEYS.m,allMsgsHTML);}
  }catch(e){}
}

function saveUsage(){try{localStorage.setItem(STORAGE_KEYS.u,JSON.stringify({date:new Date().toDateString(),c:chatUsed,i:imagesUsed,d:docsUsed}));}catch(e){}}

async function loadUsageFromServer(){
  if(!session)return;
  try{const res=await fetch(API_URL+'/api/usage',{headers:{'Authorization':'Bearer '+session.access_token}});if(res.ok){const d=await res.json();chatUsed=d.chats||chatUsed;imagesUsed=d.images||imagesUsed;docsUsed=d.docs||docsUsed;if(d.imageCredits)imageCredits=d.imageCredits;updateStats();}}catch(e){}
}

function updateStats(){
  const limits=getCurrentLimits();
  const sm=document.getElementById('statMsgs');const sd=document.getElementById('statDocs');const sc=document.getElementById('statCredits');
  if(sm)sm.textContent=Math.max(0,limits.messages-chatUsed);
  if(sd)sd.textContent=Math.max(0,limits.docs-docsUsed);
  if(sc){
    sc.textContent=imageCredits.freeAllowanceActive===false?(imageCredits.balance>0?imageCredits.balance+' '+t('chatUtilsUi.credits'):t('chatUtilsUi.trialEnded')):imageCredits.dailyFreeRemaining+' '+t('chatUtilsUi.free')+(imageCredits.balance>0?' + '+imageCredits.balance+' '+t('chatUtilsUi.credits'):'');
  }
  document.getElementById('usageTxt').textContent=chatUsed+' / '+limits.messages;
  const fill=document.getElementById('usageFill');
  if(fill)fill.style.width=Math.min(100,(chatUsed/limits.messages)*100)+'%';
}

function showModal(title,bodyHtml){
  const existing=document.getElementById('genericModalOverlay');
  if(existing)existing.remove();
  const overlay=document.createElement('div');
  overlay.className='modal-overlay';
  overlay.id='genericModalOverlay';
  overlay.onclick=(e)=>{if(e.target===overlay)overlay.remove();};
  overlay.innerHTML=`<div class="modal-box">
    <div class="modal-title"><span>${esc(title)}</span><i class="ti ti-x" style="cursor:pointer;" onclick="document.getElementById('genericModalOverlay').remove()"></i></div>
    ${bodyHtml}
  </div>`;
  document.body.appendChild(overlay);
}

function toggleSidebar(){
  const sb=document.getElementById('sidebar');
  const overlay=document.getElementById('sidebarOverlay');
  if(window.innerWidth<=900){
    const isOpen = sb.classList.contains('open');
    if(isOpen){
      sb.classList.remove('open');
      if(overlay){overlay.style.display='none';overlay.style.pointerEvents='none';overlay.style.opacity='0';}
    } else {
      sb.classList.add('open');
      if(overlay){overlay.style.display='block';overlay.style.pointerEvents='all';overlay.style.opacity='1';}
    }
  } else {
    sb.classList.toggle('collapsed');
  }
}

async function clearChat(){
  if(!confirm(t('confirm.clearAllMessages')))return;
  history=[];allMsgsHTML='';
  localStorage.removeItem(STORAGE_KEYS.h);localStorage.removeItem(STORAGE_KEYS.m);
  const msgs=document.getElementById('messages');if(msgs)msgs.innerHTML='';
  if(session){
    try{await fetch(API_URL+'/api/chat/history',{method:'DELETE',headers:{'Authorization':'Bearer '+session.access_token}});}catch(e){}
  }
  addAiMsg(t('chatUtilsUi.clearedHowCanIHelp'));
  localStorage.removeItem(STORAGE_KEYS.h);localStorage.removeItem(STORAGE_KEYS.m);
}

function toggleTheme(){
  const html=document.documentElement;
  const isDark=html.getAttribute('data-theme')==='dark';
  html.setAttribute('data-theme',isDark?'light':'dark');
  const btn=document.querySelector('.top-btn[onclick="toggleTheme()"]');
  if(btn)btn.innerHTML=isDark?'<i class="ti ti-moon"></i>':' <i class="ti ti-sun"></i>';
}

function cleanDisplay(text){
  if(!text)return text;
  const bad=['weather.com','accuweather','timeanddate','meteorology department','historical records','need to check','such as weather','check a weather','check a service','maintains historical','maintains records'];
  return text.split('\n').filter(function(line){
    const l=line.toLowerCase();
    return !bad.some(function(b){return l.includes(b);});
  }).join('\n').trim();
}

function userBubble(text){return`<div class="msg user"><div class="user-av-msg">${session?.user?.email?.[0]?.toUpperCase()||'U'}</div><div class="msg-body"><div class="msg-role">You</div><div class="msg-bubble">${esc(text)}</div></div></div>`;}

function aiBubble(text,sources=[]){
  const src=sources.length?'<div class="sources-block">Sources: '+sources.map(s=>'<a href="'+esc(s.url)+'" target="_blank">'+esc(s.title||s.url)+'</a>').join(' · ')+'</div>':''
  return`<div class="msg ai"><div class="chat-av-wrap"><div class="chat-av-ring"><div class="chat-av-mid"><div class="chat-av-dot"></div></div></div><div class="chat-av-online"></div></div><div class="msg-body"><div class="msg-role">NES AI</div><div class="msg-bubble">${md(text)}${src}</div><button class="copy-btn" onclick="copyMsg(this)">${t('chatUi.copy')}</button></div></div>`;
}

function imgBubble(url){return`<div class="msg ai"><div class="chat-av-wrap"><div class="chat-av-ring"><div class="chat-av-mid"><div class="chat-av-dot"></div></div></div><div class="chat-av-online"></div></div><div class="msg-body"><div class="msg-role">NES AI · Image Gen</div><div class="msg-bubble"><img src="${esc(url)}" style="max-width:100%;border-radius:10px;margin-top:4px;"></div></div></div>`;}

function addAiMsg(text,sources=[]){appendMsg(aiBubble(text,sources));saveHistory();}

function addTyping(){
  const el=document.createElement('div');el.className='msg ai';el.id='typing';
  el.innerHTML=`<div class="chat-av-wrap"><div class="chat-av-ring"><div class="chat-av-mid"><div class="chat-av-dot"></div></div></div><div class="chat-av-online"></div></div><div class="msg-body"><div class="msg-role">NES AI</div><div class="msg-bubble" id="typingBubble"><div style="display:flex;gap:5px;">${[0,.2,.4].map(d=>`<div style="width:7px;height:7px;background:var(--nes-blue);border-radius:50%;animation:bounce 1.4s ${d}s infinite;"></div>`).join('')}</div></div></div>`;
  setTimeout(()=>{const b=document.getElementById('typingBubble');if(b)b.innerHTML='<span style="font-size:.78rem;color:var(--muted);font-style:italic;">Thinking...</span>';},2500);
  document.getElementById('messages')?.appendChild(el);scroll();
}

function removeTyping(){document.getElementById('typing')?.remove();}

function appendMsg(html){document.getElementById('messages')?.insertAdjacentHTML('beforeend',html);scroll();saveHistory();}

function scroll(){const c=document.getElementById('messages');if(c)c.scrollTop=c.scrollHeight;}

function copyMsg(btn){const bubble=btn.closest('.msg-body').querySelector('.msg-bubble');navigator.clipboard.writeText(bubble.innerText||'').then(()=>{btn.textContent=t('chatUtilsUi.copied');setTimeout(()=>btn.textContent=t('chatUi.copy'),2000);}).catch(()=>{});}

function setBusy(b){
  busy=b;
  const sb=document.getElementById('sendBtn');if(sb)sb.disabled=b;
  setStatus(b?'busy':'ok',b?t('chatUtilsUi.thinking'):t('chatUi.ready'));
  const dot=document.getElementById('promptPingDot');
  const ring=document.getElementById('promptPingRing');
  const avatar=document.getElementById('promptPingAvatar');
  if(dot)dot.style.background=b?'#d29922':'#409cff';
  if(ring)ring.style.borderColor=b?'#d29922':'#409cff';
  if(avatar)avatar.style.borderColor=b?'#d29922':'#1a56db';
}

function setStatus(cls,txt){const el=document.getElementById('statusEl');if(el){el.className='status-dot'+(cls==='busy'?' busy':'');el.textContent=txt;}}

function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":' &#39;'}) [m]);}

function md(s){
  let src=esc(s);
  const codeBlocks=[];
  src=src.replace(/```(\w*)\n?([\s\S]*?)```/g,(m,lang,code)=>{codeBlocks.push('<pre style="background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:10px 14px;overflow-x:auto;font-family:var(--mono);font-size:.8rem;margin:8px 0"><code>'+code+'</code></pre>');return '\u0000CB'+(codeBlocks.length-1)+'\u0000';});
  src=src.replace(/\s+([•▪])\s+/g,'\n$1 ');
  src=src.replace(/^([•▪])\s+/,'$1 ');
  const lines=src.split('\n');
  const out=[];
  let i=0;
  const isTableRow=l=>/^\s*\|.*\|\s*$/.test(l);
  const isTableSep=l=>/^\s*\|?[\s:|-]+\|?\s*$/.test(l)&&l.includes('-');
  const isBullet=l=>/^\s*[-*•▪]\s+/.test(l);
  const isNumbered=l=>/^\s*\d+[\.\)]\s+/.test(l);
  const splitRow=l=>l.split('|').map(c=>c.trim()).filter((c,idx,arr)=>!(idx===0&&c==='')&&!(idx===arr.length-1&&c===''));
  while(i<lines.length){
    const line=lines[i];
    if(isTableRow(line)&&i+1<lines.length&&isTableSep(lines[i+1])){
      const headerCells=splitRow(line);
      const rows=[];
      let j=i+2;
      while(j<lines.length&&isTableRow(lines[j])){rows.push(splitRow(lines[j]));j++;}
      let tbl='<div style="overflow-x:auto;margin:8px 0;"><table style="width:100%;border-collapse:collapse;font-size:.78rem;"><thead><tr>'+headerCells.map(h=>'<th style="text-align:start;padding:6px 10px;border-bottom:2px solid var(--border);color:var(--nes-blue);white-space:nowrap;">'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td style="padding:6px 10px;border-bottom:1px solid var(--border);">'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
      out.push(tbl);
      i=j;
      continue;
    }
    if(isBullet(line)){
      const items=[];
      let j=i;
      while(j<lines.length&&isBullet(lines[j])){items.push(lines[j].replace(/^\s*[-*•▪]\s+/,''));j++;}
      out.push('<ul style="margin:6px 0;padding-inline-start:20px;">'+items.map(it=>'<li style="margin-bottom:3px;">'+it+'</li>').join('')+'</ul>');
      i=j;
      continue;
    }
    if(isNumbered(line)){
      const items=[];
      let j=i;
      while(j<lines.length&&isNumbered(lines[j])){items.push(lines[j].replace(/^\s*\d+[\.\)]\s+/,''));j++;}
      out.push('<ol style="margin:6px 0;padding-inline-start:20px;">'+items.map(it=>'<li style="margin-bottom:3px;">'+it+'</li>').join('')+'</ol>');
      i=j;
      continue;
    }
    if(line.trim()===''){i++;continue;}
    const paraLines=[];
    let j=i;
    while(j<lines.length&&lines[j].trim()!==''&&!isTableRow(lines[j])&&!isBullet(lines[j])&&!isNumbered(lines[j])){paraLines.push(lines[j]);j++;}
    out.push('<p>'+paraLines.join('<br>')+'</p>');
    i=j;
  }
  let result=out.join('');
  result=result.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  result=result.replace(/`([^`\n]+)`/g,'<code style="background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:1px 5px;font-family:var(--mono);font-size:.85em">$1</code>');
  result=result.replace(/\u0000CB(\d+)\u0000/g,(m,idx)=>codeBlocks[parseInt(idx)]);
  return result;
}
