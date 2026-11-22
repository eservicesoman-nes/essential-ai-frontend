// Navigate: free Google Maps directions link (no API key, no billing). Opens Google Maps with From/To/mode.
function buildNavigateUrl(from,to,mode){
  const d=String(to||'').trim().slice(0,200);
  if(!d)return null;
  const o=String(from||'').trim().slice(0,200);
  const m=['driving','walking','transit'].includes(mode)?mode:'driving';
  const p=new URLSearchParams({api:'1',destination:d,travelmode:m});
  if(o)p.set('origin',o);
  return 'https://www.google.com/maps/dir/?'+p.toString();
}
function closeNavigate(){
  document.getElementById('navigateOverlay')?.remove();
  document.removeEventListener('keydown',_navEsc);
}
function _navEsc(e){if(e.key==='Escape')closeNavigate();}
function openNavigate(){
  if(document.getElementById('navigateOverlay')){closeNavigate();return;}
  const ov=document.createElement('div');
  ov.id='navigateOverlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:flex;align-items:flex-start;justify-content:center;padding:64px 14px 14px;';
  const inp='width:100%;box-sizing:border-box;padding:11px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg,var(--surface));color:var(--text);font-size:.9rem;';
  const modeBtn=(v,ic,k,on)=>`<button type="button" class="navMode" data-mode="${v}" onclick="setNavMode('${v}')" style="flex:1;padding:9px 6px;border-radius:8px;border:1px solid var(--border);cursor:pointer;font-size:.78rem;display:flex;align-items:center;justify-content:center;gap:5px;${on?'background:var(--nes-blue);color:#fff;border-color:var(--nes-blue);':'background:var(--surface);color:var(--text);'}"><i class="ti ${ic}"></i>${t(k)}</button>`;
  ov.innerHTML=`<div role="dialog" aria-modal="true" style="width:100%;max-width:420px;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px;box-shadow:0 8px 32px rgba(0,0,0,.35);color:var(--text);">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <div style="font-weight:700;font-size:1rem;display:flex;align-items:center;gap:8px;"><i class="ti ti-route" style="color:var(--nes-blue);"></i>${t('navigate.title')}</div>
      <button type="button" onclick="closeNavigate()" aria-label="${t('navigate.close')}" style="background:none;border:none;color:var(--text);font-size:1.2rem;cursor:pointer;"><i class="ti ti-x"></i></button>
    </div>
    <label style="font-size:.72rem;opacity:.7;">${t('navigate.from')}</label>
    <input id="navFrom" type="text" maxlength="200" autocomplete="off" placeholder="${t('navigate.myLocation')}" style="${inp}margin:4px 0 8px;">
    <div style="text-align:center;margin:-2px 0 4px;"><button type="button" onclick="swapNavigate()" aria-label="${t('navigate.swap')}" title="${t('navigate.swap')}" style="background:var(--surface);border:1px solid var(--border);border-radius:50%;width:32px;height:32px;color:var(--nes-blue);cursor:pointer;"><i class="ti ti-arrows-up-down"></i></button></div>
    <label style="font-size:.72rem;opacity:.7;">${t('navigate.to')}</label>
    <input id="navTo" type="text" maxlength="200" autocomplete="off" placeholder="${t('navigate.toPlaceholder')}" style="${inp}margin:4px 0 12px;">
    <div style="display:flex;gap:6px;margin-bottom:14px;">${modeBtn('driving','ti-car','navigate.drive',true)}${modeBtn('walking','ti-walk','navigate.walk',false)}${modeBtn('transit','ti-bus','navigate.transit',false)}</div>
    <button type="button" id="navGo" onclick="goNavigate()" style="width:100%;padding:12px;border:none;border-radius:8px;background:var(--nes-blue);color:#fff;font-weight:600;font-size:.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><i class="ti ti-navigation"></i>${t('navigate.open')}</button>
    <div id="navErr" style="color:#f85149;font-size:.75rem;margin-top:8px;display:none;">${t('navigate.needTo')}</div>
    <div style="font-size:.68rem;opacity:.55;margin-top:10px;">${t('navigate.note')}</div>
  </div>`;
  ov.addEventListener('click',e=>{if(e.target===ov)closeNavigate();});
  ov.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT')goNavigate();});
  document.body.appendChild(ov);
  document.addEventListener('keydown',_navEsc);
  window._navMode='driving';
  setTimeout(()=>document.getElementById('navTo')?.focus(),30);
}
function setNavMode(m){
  window._navMode=m;
  document.querySelectorAll('#navigateOverlay .navMode').forEach(b=>{
    const on=b.dataset.mode===m;
    b.style.background=on?'var(--nes-blue)':'var(--surface)';
    b.style.color=on?'#fff':'var(--text)';
    b.style.borderColor=on?'var(--nes-blue)':'var(--border)';
  });
}
function swapNavigate(){
  const f=document.getElementById('navFrom'),to=document.getElementById('navTo');
  if(!f||!to)return;
  const v=f.value;f.value=to.value;to.value=v;
}
function goNavigate(){
  const url=buildNavigateUrl(document.getElementById('navFrom')?.value,document.getElementById('navTo')?.value,window._navMode);
  const err=document.getElementById('navErr');
  if(!url){if(err)err.style.display='block';document.getElementById('navTo')?.focus();return;}
  window.open(url,'_blank','noopener,noreferrer');
  closeNavigate();
}
