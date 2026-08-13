// misc-panels.js — extracted from index.html, NES Locale Phase 0
// 1 functions, zero logic changes

function addCustomCredField(clientId){
  const grid=document.querySelector('#cm-creds .creds-grid');
  if(!grid)return;
  const label=prompt('Field name (e.g. stripe_key):');
  if(!label||!label.trim())return;
  const key=label.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
  const div=document.createElement('div');
  div.className='cred-field';
  div.innerHTML=`<div class="cf-lbl">${label.trim()}</div><input class="cf-input" type="text" placeholder="Value" data-field="${key}">`;
  grid.appendChild(div);
  showToast('Field added — save to store it');
}
