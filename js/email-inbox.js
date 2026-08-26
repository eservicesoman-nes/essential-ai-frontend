// email-inbox.js — extracted from index.html, NES Locale Phase 0
// 22 functions, zero logic changes

function autoFillImapSettings(provider){
  const settings={
    gmail:{imap:'imap.gmail.com',imap_port:'993',smtp:'smtp.gmail.com',smtp_port:'587'},
    outlook:{imap:'outlook.office365.com',imap_port:'993',smtp:'smtp.office365.com',smtp_port:'587'},
    yahoo:{imap:'imap.mail.yahoo.com',imap_port:'993',smtp:'smtp.mail.yahoo.com',smtp_port:'587'},
    cpanel:{imap:'',imap_port:'993',smtp:'',smtp_port:'587'},
    other:{imap:'',imap_port:'993',smtp:'',smtp_port:'587'}
  };
  const s=settings[provider]||settings.other;
  const i=document.getElementById('em_imap');const ip=document.getElementById('em_imap_port');
  const sm=document.getElementById('em_smtp');const sp=document.getElementById('em_smtp_port');
  if(i)i.value=s.imap;if(ip)ip.value=s.imap_port;if(sm)sm.value=s.smtp;if(sp)sp.value=s.smtp_port;
}

async function connectEmailAccount(){
  const clientId=window._activeClientId;
  if(!clientId){showToast(t('toast.selectClientFirst'));return;}
  const address=document.getElementById('em_address')?.value.trim();
  const password=document.getElementById('em_password')?.value.trim();
  const provider=document.getElementById('em_provider')?.value;
  const label=document.getElementById('em_label')?.value.trim();
  const imap_server=document.getElementById('em_imap')?.value.trim();
  const imap_port=parseInt(document.getElementById('em_imap_port')?.value)||993;
  const smtp_server=document.getElementById('em_smtp')?.value.trim();
  const smtp_port=parseInt(document.getElementById('em_smtp_port')?.value)||587;
  if(!address||!password){showToast(t('toast.emailPasswordRequired'));return;}
  const status=document.getElementById('em_status');
  if(status){status.style.color='#d29922';status.textContent='Testing connection...';}
  try{
    const res=await fetch(API_URL+'/api/email/connect',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({client_id:clientId,email_address:address,app_password:password,provider,label:label||address,imap_server,imap_port,smtp_server,smtp_port})
    });
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'Connection failed');
    if(status){status.style.color='#3fb950';status.textContent='Connected successfully ✓';}
    showToast(t('toast.emailAccountConnected'));
    loadEmailAccounts(clientId);
    document.getElementById('em_address').value='';
    document.getElementById('em_password').value='';
    document.getElementById('em_label').value='';
  }catch(e){
    if(status){status.style.color='#f85149';status.textContent='Error: '+e.message;}
  }
}

async function loadEmailAccounts(clientId){
  const el=document.getElementById('cm-email-accounts');
  if(!el)return;
  try{
    const res=await fetch(API_URL+'/api/email/accounts/'+clientId,{headers:{'Authorization':'Bearer '+session.access_token}});
    const data=await res.json();
    const accounts=data.accounts||[];
    const colors=['#409cff','#3fb950','#7f77dd','#d29922','#f85149'];
    if(accounts.length===0){
      el.innerHTML=`<div style="color:var(--muted);font-family:var(--mono);font-size:.75rem;">${t('empty.noEmailAccounts')}</div>`;
      return;
    }
    el.innerHTML=accounts.map((a,i)=>`
      <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">
        <div style="width:8px;height:8px;border-radius:50%;background:${colors[i%5]};flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:.78rem;font-weight:600;color:var(--text);">${a.label||a.email_address}</div>
          <div style="font-size:.65rem;color:var(--muted);font-family:var(--mono);">${a.email_address} · ${a.provider} · ${a.is_active?'Active':'Inactive'}</div>
        </div>
        <button onclick="resaveEmailPassword('${a.id}','${a.email_address}','${clientId}')" style="background:none;border:1px solid #1a3a2a;border-radius:6px;padding:3px 8px;color:#3fb950;cursor:pointer;font-size:.65rem;margin-right:4px;"><i class="ti ti-key"></i> Re-auth</button>
        <button onclick="deleteEmailAccount('${a.id}','${clientId}')" style="background:none;border:1px solid #2d0e0e;border-radius:6px;padding:3px 8px;color:#f85149;cursor:pointer;font-size:.65rem;"><i class="ti ti-trash"></i></button>
      </div>`).join('');
  }catch(e){if(el)el.innerHTML='<div style="color:#f85149;font-size:.72rem;">Error loading accounts</div>';}
}

async function deleteEmailAccount(id, clientId){
  if(!confirm(t('confirm.removeEmailAccount')))return;
  try{
    const r=await fetch(API_URL+'/api/email/account/'+id,{method:'DELETE',headers:{'Authorization':'Bearer '+session.access_token}});
    if(!r.ok) throw new Error('Delete failed');
    showToast(t('toast.accountRemoved'));
    const cid = clientId || window._activeClientId || window._inboxClientId;
    if(cid) loadEmailAccounts(cid);
  }catch(e){showToast('Error: '+e.message);}
}

async function resaveEmailPassword(id, email, clientId){
  const pwd = prompt('Re-enter password for '+email+':');
  if(!pwd) return;
  try{
    const r=await fetch(API_URL+'/api/email/account/'+id+'/reauth',{method:'POST',headers:{'Authorization':'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({password:pwd})});
    if(!r.ok) throw new Error('Failed to update password');
    showToast(t('toast.passwordUpdatedReconnecting'));
    const cid = clientId || window._activeClientId || window._inboxClientId;
    if(cid) loadEmailAccounts(cid);
  }catch(e){showToast('Error: '+e.message);}
}

async function showInbox(){
  const mc=document.getElementById('mainContent');
  mc.style.overflow='hidden';
  let clientId = userClientId;
  if(!clientId){
    try{
      const {data} = await sb.from('clients').select('id,name').order('name');
      window._clients = data || [];
    }catch(e){}
    if(window._clients && window._clients.length){
      try{
        const {data:accs} = await sb.from('email_accounts').select('client_id').eq('is_active',true).limit(1);
        if(accs && accs.length){
          clientId = accs[0].client_id;
        } else {
          const nesClient = window._clients.find(c => c.name && (c.name.toLowerCase().includes('essential')||c.name.toLowerCase().includes('nes')));
          clientId = nesClient?.id || window._clients[0]?.id;
        }
      }catch(e){
        const nesClient = window._clients.find(c => c.name && (c.name.toLowerCase().includes('essential')||c.name.toLowerCase().includes('nes')));
        clientId = nesClient?.id || window._clients[0]?.id;
      }
    }
  }
  window._inboxClientId = clientId;
  // Store account count for after mc.innerHTML is set
  let _inboxAccountText = 'Loading...';
  try {
    const {data:existingAccs} = await sb.from('email_accounts').select('id').eq('client_id', clientId).eq('is_active',true);
    const used = existingAccs?.length || 0;
    _inboxAccountText = used + ' account' + (used !== 1 ? 's' : '') + ' connected';
  } catch(e) {}
  mc.innerHTML=`
    <div style="padding-block:11px;padding-inline-end:var(--header-clearance);padding-inline-start:60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;display:flex;align-items:center;gap:6px;"><i class="ti ti-mail"></i>${t('inbox.title')}</div>
        <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">${t('inbox.unifiedEmailPrefix')}<span id="emailAccountLimit" style="color:#409cff;">${_inboxAccountText}</span></div>
      </div>

    </div>

    <div style="padding:8px 12px;border-bottom:1px solid var(--border);display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;" id="acctFilters">
      <button onclick="filterInbox('all',this)" style="font-size:.65rem;padding:3px 10px;border-radius:20px;border:none;background:var(--nes-blue);color:#fff;cursor:pointer;white-space:nowrap;">All</button>
    </div>
    <div style="display:grid;grid-template-columns:280px 1fr;flex:1;overflow:hidden;height:calc(100% - 48px);" id="inboxGrid" class="inbox-grid-wrap">
      <div style="border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;background:var(--surface);">
        <div style="overflow-y:auto;flex:1;" id="emailList">
          <div style="padding:20px;text-align:center;color:var(--muted);font-family:var(--mono);font-size:.75rem;">${t('loading.emails')}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;overflow:hidden;" id="emailPanel">
        <div style="display:flex;align-items:center;justify-content:center;flex:1;flex-direction:column;gap:8px;color:var(--muted);">
          <i class="ti ti-mail" style="font-size:2rem;opacity:.3;"></i>
          <div style="font-family:var(--mono);font-size:.75rem;">${t('welcomeUi.selectEmailToRead')}</div>
        </div>
      </div>
    </div>`;
  if(clientId) await loadInboxEmails(clientId);
}

async function loadInboxEmails(clientId){
  try{
    const res=await fetch(API_URL+'/api/email/inbox/'+clientId,{headers:{'Authorization':'Bearer '+session.access_token}});
    const data=await res.json();
    const emails=data.emails||[];
    const el=document.getElementById('emailList');
    if(!el)return;
    const colors=['#409cff','#3fb950','#7f77dd','#d29922','#f85149'];
    const accounts=[...new Set(emails.map(e=>e.account_email))];
    let accountLabels = {};
    try{
      const {data:accsData} = await sb.from('email_accounts').select('email_address,label').eq('client_id', window._inboxClientId||clientId);
      (accsData||[]).forEach(a => accountLabels[a.email_address] = a.label||a.email_address);
    }catch(e){}
    window._accountLabels = accountLabels;

    window._inboxEmails=emails;
    window._inboxAccounts=accounts;
    window._inboxColors=colors;

    // Fetch read status from Supabase and apply BEFORE rendering
    try {
      const rsRes = await fetch(API_URL + '/api/email/read-status/' + clientId + '?t=' + Date.now(), {
        headers: { 'Authorization': 'Bearer ' + session.access_token }
      });
      const rsData = await rsRes.json();
      if (rsData.read && rsData.read.length > 0) {
        rsData.read.forEach(function(r) {
          const match = emails.find(function(e) {
            return e.account_email === r.account_email && String(e.uid) === String(r.email_uid);
          });
          if (match) match.is_read = true;
        });
      }
    } catch(e) { /* non-critical */ }

    // Render AFTER read status applied
    renderEmailList(emails);
    // Also rebuild badges with correct read counts
    const filters2 = document.getElementById('acctFilters');
    if(filters2) {
      const updatedAccounts = [...new Set(emails.map(function(e){return e.account_email;}))];
      filters2.innerHTML = `<button onclick="showComposeModal()" style="display:flex;align-items:center;gap:5px;font-size:.65rem;padding:4px 10px;border-radius:6px;border:none;background:linear-gradient(135deg,#1a56db,#2563eb);color:#fff;cursor:pointer;white-space:nowrap;flex-shrink:0;"><i class="ti ti-pencil" style="font-size:11px;"></i> ${t('inbox.compose')}</button>`
        + '<button onclick="filterInbox(\'all\',this)" style="display:flex;align-items:center;gap:5px;font-size:.65rem;padding:4px 10px;border-radius:6px;border:none;background:var(--nes-blue);color:#fff;cursor:pointer;white-space:nowrap;flex-shrink:0;"><i class="ti ti-inbox" style="font-size:11px;"></i> All</button>'
        + updatedAccounts.map(function(a,i){
            const label = (window._accountLabels&&window._accountLabels[a])||a.split('@')[0];
            const clr = (window._inboxColors||['#409cff'])[i%5]||'#409cff';
            const unread = emails.filter(function(e){return e.account_email===a&&!e.is_read;}).length;
            const badge = unread>0 ? '<span style="background:'+clr+';color:#fff;border-radius:10px;padding:1px 5px;font-size:.55rem;font-weight:700;margin-left:3px;">'+unread+'</span>' : '';
            return '<button onclick="filterInbox(' + "'" + a + "'" + ',this)" style="display:flex;align-items:center;gap:5px;font-size:.65rem;padding:4px 10px;border-radius:6px;border:0.5px solid var(--border);background:var(--surface);color:var(--muted);cursor:pointer;white-space:nowrap;flex-shrink:0;"><span style="display:inline-block;width:8px;height:14px;border-radius:8px 0 0 8px;border:2px solid '+clr+';border-right:none;margin-right:4px;flex-shrink:0;"></span>'+label+badge+'</button>';
          }).join('');
    }
  }catch(e){
    const el=document.getElementById('emailList');
    if(el)el.innerHTML='<div style="padding:20px;text-align:center;color:#f85149;font-family:var(--mono);font-size:.75rem;">Error loading emails</div>';
  }
}

function renderEmailList(emails){
  const el=document.getElementById('emailList');
  if(!el)return;
  window._renderedEmails=emails;
  const colors=window._inboxColors||['#409cff','#3fb950','#7f77dd','#d29922','#f85149'];
  const accounts=window._inboxAccounts||[];
  if(emails.length===0){el.innerHTML='<div style="padding:20px;text-align:center;color:var(--muted);font-family:var(--mono);font-size:.75rem;">No emails found</div>';return;}
  el.innerHTML=emails.map((e,i)=>{
    const acctIdx=accounts.indexOf(e.account_email);
    const color=colors[acctIdx%5]||'#409cff';
    const date=e.received_at?new Date(e.received_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'';
    return`<div onclick="showEmail(${i})" style="padding:12px;border-bottom:1px solid rgba(26,35,50,.5);cursor:pointer;border-left:3px solid ${color};-webkit-tap-highlight-color:transparent;${!e.is_read?'background:rgba(64,156,255,0.05);':''}" class="email-row-${i}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
        <div style="font-size:.75rem;font-weight:${e.is_read?'400':'600'};color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">${e.from_name||e.from_address||'Unknown'}</div>
        <div style="font-size:.6rem;color:var(--muted);margin-left:8px;flex-shrink:0;">${date}</div>
        ${!e.is_read?'<div style="width:6px;height:6px;border-radius:50%;background:'+color+';margin-left:6px;flex-shrink:0;"></div>':''}
      </div>
      <div style="font-size:.72rem;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:2px;">${e.subject||'(no subject)'}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:.65rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${(window._accountLabels&&window._accountLabels[e.account_email])||e.account_label||e.account_email.split("@")[0]}</div>
        <button onclick="event.stopPropagation();deleteEmail(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:2px 4px;font-size:.65rem;flex-shrink:0;" title="Delete"><i class="ti ti-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

async function deleteEmail(idx) {
  const emails = window._renderedEmails || window._inboxEmails || [];
  const e = emails[idx];
  if (!e) return;
  if (!confirm(t('confirm.deleteEmailFromInbox'))) return;
  window._inboxEmails = (window._inboxEmails||[]).filter(function(_,i){return i!==idx;});
  window._renderedEmails = (window._renderedEmails||[]).filter(function(_,i){return i!==idx;});
  renderEmailList(window._renderedEmails);
  showToast(t('toast.emailRemovedFromView'));
}

function showComposeModal() {
  const accounts = window._inboxAccounts || [];
  const labels = window._accountLabels || {};
  const existing = document.getElementById('compose-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'compose-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:flex-end;justify-content:center;padding:20px;';
  let optionsHtml = '';
  accounts.forEach(function(a){ optionsHtml += '<option value="'+a+'">'+(labels[a]||a)+'</option>'; });
  modal.innerHTML = '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px 12px 0 0;padding:20px;width:100%;max-width:640px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
    + '<div style="font-size:.85rem;font-weight:700;color:var(--nes-blue);"><i class="ti ti-pencil"></i> New Email</div>'
    + '<button onclick="document.getElementById(\'compose-modal\').remove()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.1rem;">&#x2715;</button>'
    + '</div>'
    + '<select id="composeFrom" style="width:100%;padding:6px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:.75rem;margin-bottom:6px;">' + optionsHtml + '</select>'
    + '<input id="composeTo" placeholder="To: recipient@email.com" style="width:100%;padding:6px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:.75rem;margin-bottom:6px;outline:none;">'
    + '<input id="composeSubject" placeholder="Subject" style="width:100%;padding:6px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:.75rem;margin-bottom:6px;outline:none;">'
    + '<textarea id="composeBody" placeholder="Write your message..." style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:.75rem;resize:none;height:120px;outline:none;font-family:var(--ui);"></textarea>'
    + '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">'
    + `<button onclick="document.getElementById('compose-modal').remove()" style="padding:6px 16px;border-radius:6px;border:1px solid var(--border);background:none;color:var(--muted);cursor:pointer;font-size:.75rem;">${t('common.cancel')}</button>`
    + '<button onclick="sendComposedEmail()" style="padding:6px 16px;border-radius:6px;border:none;background:linear-gradient(135deg,#1a56db,#2563eb);color:#fff;cursor:pointer;font-size:.75rem;font-weight:600;"><i class="ti ti-send"></i> Send</button>'
    + '</div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e){ if(e.target===modal) modal.remove(); });
  setTimeout(function(){ const t=document.getElementById('composeTo'); if(t)t.focus(); }, 100);
}

async function sendComposedEmail() {
  const fromEmail = document.getElementById('composeFrom') ? document.getElementById('composeFrom').value : '';
  const to = document.getElementById('composeTo') ? document.getElementById('composeTo').value.trim() : '';
  const subject = document.getElementById('composeSubject') ? document.getElementById('composeSubject').value.trim() : '';
  const body = document.getElementById('composeBody') ? document.getElementById('composeBody').value.trim() : '';
  if (!to || !subject || !body) { showToast(t('toast.fillAllFields')); return; }
  const accountObjs = window._inboxAccountObjects || [];
  const account = accountObjs.find(function(a){ return a.email_address===fromEmail; });
  if (!account) { showToast(t('toast.accountNotFound')); return; }
  try {
    const r = await fetch(API_URL + '/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
      body: JSON.stringify({ account_id: account.id, to: to, subject: subject, body: body })
    });
    if (!r.ok) throw new Error('Send failed');
    const m = document.getElementById('compose-modal');
    if(m) m.remove();
    showToast(t('toast.emailSentSuccessfully'));
  } catch(e) {
    showToast('Failed to send: ' + e.message);
  }
}

function filterInbox(acct,btn){
  document.querySelectorAll('#acctFilters button').forEach(b=>{
    b.style.background='var(--surface)';b.style.color='var(--muted)';b.style.border='0.5px solid var(--border)';
  });
  btn.style.background='var(--nes-blue)';btn.style.color='#fff';btn.style.border='none';
  const emails=window._inboxEmails||[];
  const filtered=acct==='all'?emails:emails.filter(e=>e.account_email===acct);
  renderEmailList(filtered);
  const el=document.getElementById('emailList');
  if(el) el.scrollTop=0;
  if(window.innerWidth <= 700) {
    const grid = document.getElementById('inboxGrid');
    if(grid) {
      const listCol = grid.querySelector('div:first-child');
      const readCol = document.getElementById('emailPanel');
      if(listCol) listCol.style.display = 'flex';
      if(readCol) readCol.style.display = 'none';
    }
  }
}

async function fetchEmailBody(accountId, uid){
  try{
    const res = await fetch(API_URL+'/api/email/body/'+accountId+'/'+uid, {headers:{'Authorization':'Bearer '+session.access_token}});
    const data = await res.json();
    return { body: data.body || '', isHtml: !!data.isHtml };
  }catch(e){ return { body: '', isHtml: false }; }
}

function showEmail(idx){
  const emails=window._renderedEmails||window._inboxEmails||[];
  const e=emails[idx];if(!e)return;
  const accounts=window._inboxAccounts||[];
  const colors=window._inboxColors||['#409cff'];
  const acctIdx=accounts.indexOf(e.account_email);
  const color=colors[acctIdx%5]||'#409cff';
  const panel=document.getElementById('emailPanel');
  if(!panel)return;
  window._currentEmail = e;
  if (!e.is_read) {
    e.is_read = true;
    // Update in master array
    if(window._inboxEmails) {
      const orig = window._inboxEmails.find(function(m){return m.uid===e.uid&&m.account_email===e.account_email;});
      if(orig) orig.is_read=true;
    }
    // Update in rendered array
    if(window._renderedEmails) {
      const orig2 = window._renderedEmails.find(function(m){return m.uid===e.uid&&m.account_email===e.account_email;});
      if(orig2) orig2.is_read=true;
    }
    // Save read status to backend
    fetch(API_URL + '/api/email/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
      body: JSON.stringify({ account_email: e.account_email, email_uid: String(e.uid) })
    }).catch(function(){});
    // Re-render list and rebuild badges
    renderEmailList(window._renderedEmails||window._inboxEmails||[]);
    // Rebuild account tab badges
    const accounts = window._inboxAccounts||[];
    const colors = window._inboxColors||['#409cff'];
    const labels = window._accountLabels||{};
    const allEmails = window._inboxEmails||[];
    const filters = document.getElementById('acctFilters');
    if(filters) {
      const activeBtn = filters.querySelector('button[style*="var(--nes-blue)"]');
      const activeAcct = activeBtn ? activeBtn.getAttribute('data-acct') : 'all';
      filters.innerHTML = `<button onclick="showComposeModal()" style="display:flex;align-items:center;gap:5px;font-size:.65rem;padding:4px 10px;border-radius:6px;border:none;background:linear-gradient(135deg,#1a56db,#2563eb);color:#fff;cursor:pointer;white-space:nowrap;flex-shrink:0;"><i class="ti ti-pencil" style="font-size:11px;"></i> ${t('inbox.compose')}</button>`
        + '<button onclick="filterInbox(\'all\',this)" data-acct="all" style="display:flex;align-items:center;gap:5px;font-size:.65rem;padding:4px 10px;border-radius:6px;border:none;background:var(--nes-blue);color:#fff;cursor:pointer;white-space:nowrap;flex-shrink:0;"><i class=\"ti ti-inbox\" style=\"font-size:11px;\"></i> All</button>'
        + accounts.map(function(a,i){
            const label = labels[a]||a.split('@')[0];
            const unread = allEmails.filter(function(m){return m.account_email===a&&!m.is_read;}).length;
            const badge = unread>0 ? '<span style=\"background:'+colors[i%5]+';color:#fff;border-radius:10px;padding:1px 5px;font-size:.55rem;font-weight:700;margin-left:3px;\">'+unread+'</span>' : '';
            return '<button onclick="filterInbox(' + "'" + a + "'" + ',this)" data-acct="'+a+'" style="display:flex;align-items:center;gap:5px;font-size:.65rem;padding:4px 10px;border-radius:6px;border:0.5px solid var(--border);background:var(--surface);color:var(--muted);cursor:pointer;white-space:nowrap;flex-shrink:0;"><span style="display:inline-block;width:8px;height:14px;border-radius:8px 0 0 8px;border:2px solid '+colors[i%5]+';border-right:none;margin-right:4px;flex-shrink:0;"></span>'+label+badge+'</button>';
          }).join('');
    }
  }
  if(window.innerWidth <= 700) {
    const grid = document.getElementById('inboxGrid');
    if(grid) {
      const listCol = grid.querySelector('div:first-child');
      const readCol = document.getElementById('emailPanel');
      if(listCol) listCol.style.display = 'none';
      if(readCol) { readCol.style.display = 'flex'; readCol.style.flexDirection = 'column'; }
    }
  }
  panel.innerHTML=`
    <div style="padding:14px 18px;border-bottom:1px solid var(--border);">
      <div style="font-size:.9rem;font-weight:600;color:var(--text);margin-bottom:6px;">${e.subject||'(no subject)'}</div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:.65rem;padding:2px 8px;border-radius:12px;color:#fff;background:${color};">${e.account_email}</span>
        <span style="font-size:.72rem;color:var(--muted);">From: ${e.from_name?e.from_name+' &lt;'+e.from_address+'&gt;':e.from_address}</span>
        <span style="font-size:.65rem;color:var(--muted);margin-left:auto;">${e.received_at?new Date(e.received_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</span>
      </div>
    </div>
    <div style="flex:1;padding:18px;overflow-y:auto;font-size:.82rem;color:var(--text);line-height:1.7;" id="emailBodyPanel">
      <div style="color:var(--muted);font-family:var(--mono);font-size:.72rem;text-align:center;padding:20px;"><i class="ti ti-loader-2 ti-spin"></i> Loading...</div>
    </div>
    <div style="border-top:1px solid var(--border);padding:12px 18px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:.65rem;color:var(--muted);">Reply from:</span>
        <select id="replyFrom" style="font-size:.65rem;padding:3px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;">
          ${accounts.map(a=>`<option value="${a}" ${a===e.account_email?'selected':''}>${(window._accountLabels&&window._accountLabels[a])||a.split('@')[0]}${a===e.account_email?' · default':''}</option>`).join('')}
        </select>
        <span style="font-size:.6rem;padding:2px 6px;border-radius:6px;background:#0d2818;color:#3fb950;">Default</span>
      </div>
      <textarea id="replyBody" placeholder="Write your reply..." style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px 12px;font-size:.75rem;color:var(--text);resize:none;height:64px;outline:none;font-family:var(--ui);"></textarea>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
        <div style="display:flex;gap:6px;">
          <button onclick="sendReply('${e.from_address}','${(e.subject||'').replace(/'/g,'')}')" style="background:var(--nes-btn-grad);border:none;color:#fff;font-size:.72rem;padding:6px 16px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:5px;"><i class="ti ti-send"></i> Send</button>
          <button style="background:none;border:1px solid var(--border);color:var(--muted);font-size:.72rem;padding:6px 12px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:5px;"><i class="ti ti-paperclip"></i> ${t('chatUi.attach')}</button>
        </div>
        <span style="font-size:.65rem;color:var(--muted);">Encrypted · SMTP</span>
      </div>
    </div>`;
}

async function sendReply(to, originalSubject){
  const fromAccount=document.getElementById('replyFrom')?.value;
  const body=document.getElementById('replyBody')?.value.trim();
  if(!body){showToast(t('toast.writeReplyFirst'));return;}
  let clientId = userClientId;
  if(!clientId && window._clients && window._clients.length){
    const nesClient = window._clients.find(c => c.name && c.name.toLowerCase().includes('essential'));
    clientId = nesClient?.id || window._clients[0]?.id;
  }
  if(!clientId||!fromAccount)return;
  try{
    const {data:accounts}=await sb.from('email_accounts').select('id').eq('client_id',clientId).eq('email_address',fromAccount).single();
    if(!accounts)throw new Error('Account not found');
    const res=await fetch(API_URL+'/api/email/send',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({account_id:accounts.id,to,subject:'Re: '+originalSubject,body})
    });
    if(!res.ok){const e=await res.json();throw new Error(e.error||'Send failed');}
    showToast(t('toast.replySent'));
    document.getElementById('replyBody').value='';
  }catch(e){showToast('Error: '+e.message);}
}

function addEmailForm(){
  const clientId = window._activeClientId;
  const planLimits = {presence:2, operations:5, workforce:10, infrastructure:99};
  const client = (window._clients||[]).find(c=>c.id===clientId);
  const plan = (client?.plan||'presence').toLowerCase();
  const limit = planLimits[plan]||2;
  const existing = document.querySelectorAll('.em-extra-form').length + 1;
  if(existing >= limit){
    const btn = document.getElementById('em_add_btn');
    if(btn) btn.style.display='none';
    const lim = document.getElementById('em_plan_limit');
    if(lim) lim.textContent='Plan limit reached — '+limit+'/'+limit+' accounts ('+plan+' plan)';
    return;
  }
  const container = document.getElementById('em_extra_forms');
  if(!container) return;
  const idx = Date.now();
  const div = document.createElement('div');
  div.className='em-extra-form';
  div.style.cssText='background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:12px;margin-top:8px;';
  div.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <div style="font-family:var(--mono);font-size:.68rem;color:var(--nes-blue);font-weight:700;">Account ${existing+1}</div>
      <button onclick="this.closest('.em-extra-form').remove();updateAddBtn();" style="background:none;border:none;color:#f85149;cursor:pointer;font-size:.72rem;"><i class="ti ti-x"></i> Remove</button>
    </div>
    <div class="creds-grid">
      <div class="cred-field"><div class="cf-lbl">Email Address</div><input class="cf-input" type="email" id="em_address_${idx}" placeholder="email@company.com"></div>
      <div class="cred-field"><div class="cf-lbl">App Password</div><input class="cf-input" type="password" id="em_password_${idx}" placeholder="App password"></div>
      <div class="cred-field"><div class="cf-lbl">Provider</div>
        <select class="cf-input" id="em_provider_${idx}" onchange="autoFillImapSettings2(this.value,'${idx}')">
          <option value="gmail">Gmail</option>
          <option value="outlook">Outlook</option>
          <option value="yahoo">Yahoo</option>
          <option value="cpanel">cPanel</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="cred-field"><div class="cf-lbl">Label</div><input class="cf-input" type="text" id="em_label_${idx}" placeholder="e.g. Sales inbox"></div>
      <div class="cred-field"><div class="cf-lbl">IMAP Server</div><input class="cf-input" type="text" id="em_imap_${idx}" value="imap.gmail.com"></div>
      <div class="cred-field"><div class="cf-lbl">IMAP Port</div><input class="cf-input" type="number" id="em_imap_port_${idx}" value="993"></div>
      <div class="cred-field"><div class="cf-lbl">SMTP Server</div><input class="cf-input" type="text" id="em_smtp_${idx}" value="smtp.gmail.com"></div>
      <div class="cred-field"><div class="cf-lbl">SMTP Port</div><input class="cf-input" type="number" id="em_smtp_port_${idx}" value="587"></div>
    </div>
    <button onclick="connectEmailAccountExtra('${idx}')" style="background:var(--nes-btn-grad);border:none;border-radius:7px;padding:7px 16px;color:#fff;font-size:.72rem;font-weight:700;cursor:pointer;margin-top:8px;width:100%;"><i class="ti ti-plug"></i> Test & Connect</button>
    <div id="em_status_${idx}" style="font-family:var(--mono);font-size:.7rem;margin-top:6px;min-height:16px;"></div>
  `;
  container.appendChild(div);
  updateAddBtn();
}

function updateAddBtn(){
  const clientId = window._activeClientId;
  const planLimits = {presence:2, operations:5, workforce:10, infrastructure:99};
  const client = (window._clients||[]).find(c=>c.id===clientId);
  const plan = (client?.plan||'presence').toLowerCase();
  const limit = planLimits[plan]||2;
  const existing = document.querySelectorAll('.em-extra-form').length + 1;
  const btn = document.getElementById('em_add_btn');
  const lim = document.getElementById('em_plan_limit');
  if(existing >= limit){
    if(btn) btn.style.display='none';
    if(lim) lim.textContent='Plan limit reached — '+limit+'/'+limit+' accounts ('+plan+' plan)';
  } else {
    if(btn) btn.style.display='flex';
    if(lim) lim.textContent='';
  }
}

function autoFillImapSettings2(provider, idx){
  const s={gmail:{imap:'imap.gmail.com',smtp:'smtp.gmail.com'},outlook:{imap:'outlook.office365.com',smtp:'smtp.office365.com'},yahoo:{imap:'imap.mail.yahoo.com',smtp:'smtp.mail.yahoo.com'},cpanel:{imap:'',smtp:''},other:{imap:'',smtp:''}};
  const p=s[provider]||s.other;
  const i=document.getElementById('em_imap_'+idx);const sm=document.getElementById('em_smtp_'+idx);
  if(i)i.value=p.imap;if(sm)sm.value=p.smtp;
}

async function connectEmailAccountExtra(idx){
  const clientId=window._activeClientId;
  if(!clientId){showToast(t('toast.selectClientFirst'));return;}
  const address=document.getElementById('em_address_'+idx)?.value.trim();
  const password=document.getElementById('em_password_'+idx)?.value.trim();
  const provider=document.getElementById('em_provider_'+idx)?.value;
  const label=document.getElementById('em_label_'+idx)?.value.trim();
  const imap_server=document.getElementById('em_imap_'+idx)?.value.trim();
  const imap_port=parseInt(document.getElementById('em_imap_port_'+idx)?.value)||993;
  const smtp_server=document.getElementById('em_smtp_'+idx)?.value.trim();
  const smtp_port=parseInt(document.getElementById('em_smtp_port_'+idx)?.value)||587;
  if(!address||!password){showToast(t('toast.emailPasswordRequired'));return;}
  const status=document.getElementById('em_status_'+idx);
  if(status){status.style.color='#d29922';status.textContent='Testing connection...';}
  try{
    const res=await fetch(API_URL+'/api/email/connect',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({client_id:clientId,email_address:address,app_password:password,provider,label:label||address,imap_server,imap_port,smtp_server,smtp_port})});
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'Connection failed');
    if(status){status.style.color='#3fb950';status.textContent='Connected successfully ✓';}
    showToast(t('toast.emailAccountConnected'));
    loadEmailAccounts(clientId);
  }catch(e){if(status){status.style.color='#f85149';status.textContent='Error: '+e.message;}}
}

function toggleInboxPanel(panel){
  const grid = document.getElementById('inboxGrid');
  if(!grid) return;
  const listBtn = document.getElementById('inboxToggleList');
  const readBtn = document.getElementById('inboxToggleRead');
  const cols = grid.querySelectorAll(':scope > div');
  if(panel === 'list'){
    if(cols[0]) cols[0].style.display='flex';
    if(cols[1]) cols[1].style.display='none';
    if(listBtn){listBtn.style.background='var(--nes-blue)';listBtn.style.color='#fff';listBtn.style.border='none';}
    if(readBtn){readBtn.style.background='var(--surface)';readBtn.style.color='var(--muted)';readBtn.style.border='1px solid var(--border)';}
  } else {
    if(cols[0]) cols[0].style.display='none';
    if(cols[1]) cols[1].style.display='flex';
    if(readBtn){readBtn.style.background='var(--nes-blue)';readBtn.style.color='#fff';readBtn.style.border='none';}
    if(listBtn){listBtn.style.background='var(--surface)';listBtn.style.color='var(--muted)';listBtn.style.border='1px solid var(--border)';}
  }
}

function toggleCeoPanel(panel){
  const grid = document.getElementById('ceoDashGrid');
  if(!grid) return;
  const cols = grid.querySelectorAll(':scope > div');
  const statsBtn = document.getElementById('ceoToggleStats');
  const feedBtn = document.getElementById('ceoToggleFeed');
  if(panel==='stats'){
    if(cols[0]) cols[0].style.display='block';
    if(cols[1]) cols[1].style.display='none';
    if(cols[2]) cols[2].style.display='none';
    if(statsBtn){statsBtn.style.background='var(--nes-blue)';statsBtn.style.color='#fff';statsBtn.style.border='none';}
    if(feedBtn){feedBtn.style.background='var(--surface)';feedBtn.style.color='var(--muted)';feedBtn.style.border='1px solid var(--border)';}
  } else {
    if(cols[0]) cols[0].style.display='none';
    if(cols[1]) cols[1].style.display='none';
    if(cols[2]) cols[2].style.display='flex';
    if(feedBtn){feedBtn.style.background='var(--nes-blue)';feedBtn.style.color='#fff';feedBtn.style.border='none';}
    if(statsBtn){statsBtn.style.background='var(--surface)';statsBtn.style.color='var(--muted)';statsBtn.style.border='1px solid var(--border)';}
  }
}

function toggleStatusPanel(panel){
  const grid = document.getElementById('statusPanelGrid');
  if(!grid) return;
  const cols = grid.querySelectorAll(':scope > div');
  const sBtn = document.getElementById('statusToggleServices');
  const cBtn = document.getElementById('statusToggleCredits');
  if(panel==='services'){
    if(cols[0]) cols[0].style.display='block';
    if(cols[1]) cols[1].style.display='none';
    if(sBtn){sBtn.style.background='var(--nes-blue)';sBtn.style.color='#fff';sBtn.style.border='none';}
    if(cBtn){cBtn.style.background='var(--surface)';cBtn.style.color='var(--muted)';cBtn.style.border='1px solid var(--border)';}
  } else {
    if(cols[0]) cols[0].style.display='none';
    if(cols[1]) cols[1].style.display='block';
    if(cBtn){cBtn.style.background='var(--nes-blue)';cBtn.style.color='#fff';cBtn.style.border='none';}
    if(sBtn){sBtn.style.background='var(--surface)';sBtn.style.color='var(--muted)';sBtn.style.border='1px solid var(--border)';}
  }
}
