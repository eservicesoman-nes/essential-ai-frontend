// my-credentials.js — extracted from index.html, NES Locale Phase 0
// 7 functions, zero logic changes

async function showMyCredentials(){
  if(!userClientId){addAiMsg('No client account linked.');return;}
  const mc=document.getElementById('mainContent');
  mc.style.overflow='auto';
  mc.innerHTML=`
    <div style="padding-block:11px;padding-inline-end:var(--header-clearance);padding-inline-start:60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;">${t('sectionTitle.itSetup')}</div>
        <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">${t('pageSubtitle.itSetup')}</div>
      </div>
      <button onclick="showView('chat')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:5px 12px;color:var(--muted);cursor:pointer;font-size:.72rem;font-family:var(--mono);margin-right:12px;"><i class="ti ti-arrow-left"></i> Back</button>
    </div>
    <div class="page" style="overflow-y:auto;flex:1;"><div style="max-width:640px;padding-bottom:40px;" id="myCredsContent">
      <div style="color:var(--muted);font-family:var(--mono);font-size:.8rem;padding:20px 0;">${t('common.loading')}</div>
    </div></div>`;
  try{
    const [credsRes, clientRes] = await Promise.all([
      fetch(API_URL+'/api/client/'+userClientId+'/credentials', {headers:{'Authorization':'Bearer '+session.access_token}}),
      fetch(API_URL+'/api/client/'+userClientId, {headers:{'Authorization':'Bearer '+session.access_token}})
    ]);
    const credsJson=await credsRes.json();
    const clientJson=await clientRes.json();
    window._itClientCache=clientJson.client||{};
    renderMyCredsForm(credsJson.credentials||{}, window._itClientCache);
  }catch(e){
    const el=document.getElementById('myCredsContent');
    if(el)el.innerHTML='<div style="color:var(--red);font-family:var(--mono);font-size:.8rem;">Error: '+e.message+'</div>';
  }
}

function renderMyCredsForm(creds, client){
  const el=document.getElementById('myCredsContent');
  let trialHtml='';
  if(client.trial_start){
    const trialEnd=new Date(new Date(client.trial_start).getTime()+((client.trial_duration_days||7)*86400000));
    const daysLeft=Math.ceil((trialEnd-new Date())/86400000);
    const expired=daysLeft<=0;
    const urgent=daysLeft<=2&&!expired;
    const color=expired?'#f85149':urgent?'#d29922':'#3fb950';
    const bg=expired?'#2d0e0e':urgent?'#2d1f00':'#0d2818';
    const border=expired?'#f8514940':urgent?'#d2992240':'#3fb95040';
    trialHtml='<div style="padding:12px 16px;border-radius:10px;margin-bottom:16px;background:'+bg+';border:1px solid '+border+';">'+
      '<div style="font-family:var(--mono);font-size:.7rem;font-weight:800;color:'+color+';margin-bottom:4px;">'+(expired?'TRIAL EXPIRED':'TRIAL ACTIVE')+'</div>'+
      '<div style="font-size:.8rem;color:var(--muted);">'+(expired?'Your trial ended on '+trialEnd.toLocaleDateString()+'. Contact support to continue.':daysLeft+' day'+(daysLeft===1?'':'s')+' remaining — trial ends '+trialEnd.toLocaleDateString())+'</div>'+
      (urgent&&!expired?'<div style="font-size:.75rem;color:'+color+';margin-top:4px;font-weight:600;">Connect your credentials now to avoid interruption.</div>':'')+'</div>';
  }
  const sections=[
    {title:'Social media',titleKey:'itSetupItem.socialMedia',items:[
      {label:'Facebook',labelKey:'itSetupItem.facebook',desc:'Page token + Page ID',descKey:'itSetupItem.facebookDesc',keys:['facebook_token','facebook_page_id'],icon:'ti-brand-facebook'},
      {label:'Instagram',labelKey:'itSetupItem.instagram',desc:'Business Account ID',descKey:'itSetupItem.instagramDesc',keys:['instagram_business_id'],icon:'ti-brand-instagram'},
      {label:'LinkedIn',labelKey:'itSetupItem.linkedin',desc:'Access token',descKey:'itSetupItem.linkedinDesc',keys:['linkedin_token'],icon:'ti-brand-linkedin'},
    ]},
    {title:'Messaging & leads',titleKey:'itSetupItem.messagingLeads',items:[
      {label:'WhatsApp',labelKey:'itSetupItem.whatsapp',desc:'Phone ID + API token',descKey:'itSetupItem.whatsappDesc',keys:['whatsapp_phone_id','whatsapp_token'],icon:'ti-brand-whatsapp'},
      {label:'Lead alerts email',labelKey:'itSetupItem.leadAlertsEmail',desc:'Where new leads are sent',descKey:'itSetupItem.leadAlertsEmailDesc',keys:['lead_email'],icon:'ti-mail'},
      {label:'Website',labelKey:'itSetupItem.website',desc:'Your website URL',descKey:'itSetupItem.websiteDesc',keys:['website'],icon:'ti-world'},
    ]},
    {title:'Inbox & Email',titleKey:'itSetupItem.inboxEmail',items:[
      {label:'Email Account',labelKey:'itSetupItem.emailAccount',desc:'Connect your inbox (IMAP/SMTP)',descKey:'itSetupItem.emailAccountDesc',keys:['imap_email','imap_password','imap_host','smtp_host','smtp_port'],icon:'ti-inbox'},
    ]},
  ];
  let connected=0,total=0;
  sections.forEach(s=>s.items.forEach(item=>{
    total++;
    if(item.keys.some(k=>creds[k]&&creds[k].trim()))connected++;
  }));
  const pct=total?Math.round((connected/total)*100):0;
  let html=trialHtml;
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">';
  html+='<div style="font-size:.8rem;color:var(--muted);">'+connected+' / '+total+' connected</div>';
  html+='<div style="font-size:.8rem;color:var(--nes-blue);font-family:var(--mono);font-weight:700;">'+pct+'%</div></div>';
  html+='<div style="background:var(--surface);border-radius:6px;height:6px;margin-bottom:20px;overflow:hidden;">';
  html+='<div style="height:100%;width:'+pct+'%;background:'+(pct===100?'#3fb950':'#409cff')+';border-radius:6px;transition:width .4s;"></div></div>';
  sections.forEach(function(sec){
    html+='<div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;margin-top:16px;">'+(sec.titleKey?t(sec.titleKey,sec.title):sec.title)+'</div>';
    sec.items.forEach(function(item){
      const isConnected=item.keys.some(k=>creds[k]&&creds[k].trim());
      html+='<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface);border:1px solid var(--border);border-radius:10px;margin-bottom:6px;">';
      html+='<div style="width:34px;height:34px;border-radius:8px;background:var(--bg);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="ti '+item.icon+'" style="font-size:16px;color:var(--nes-blue);"></i></div>';
      html+='<div style="flex:1;"><div style="font-size:.82rem;color:var(--text);font-weight:500;">'+(item.labelKey?t(item.labelKey,item.label):item.label)+'</div>';
      html+='<div style="font-size:.72rem;color:var(--muted);">'+(item.descKey?t(item.descKey,item.desc):item.desc)+'</div></div>';
      html+='<div style="display:flex;align-items:center;gap:8px;">';
      html+='<span style="font-size:.68rem;font-family:var(--mono);padding:3px 10px;border-radius:12px;background:'+(isConnected?'#0d2818':'#2d1f00')+';color:'+(isConnected?'#3fb950':'#d29922')+';">'+(isConnected?'Connected':'Missing')+'</span>';
      html+='<button onclick="editItCred(\''+item.keys.join(',')+'\',\''+item.label+'\')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;color:var(--muted);cursor:pointer;font-size:.72rem;">'+(isConnected?'Edit':'Connect')+'</button>';
      html+='</div></div>';
    });
  });
  const isPro=(client.plan==='operations'||client.plan==='workforce'||client.plan==='infrastructure');
  const maxSources=isPro?10:5;
  html+='<div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;margin-top:20px;">NES Pulse — Feed Sources</div>';
  html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:16px;">';
  html+='<div style="font-size:.75rem;color:var(--muted);margin-bottom:10px;">Your NES Pulse intelligence feed pulls from these sources daily. Add a topic to search (e.g. "Pakistan logistics reform") or a specific website\'s RSS feed URL.</div>';
  html+='<div id="feedSourcesList" style="margin-bottom:10px;"><div style="color:var(--muted);font-size:.72rem;">Loading…</div></div>';
  html+='<div style="display:flex;gap:6px;margin-bottom:6px;">';
  html+='<select id="newFeedSourceType" class="form-input" style="flex:0 0 90px;font-size:.72rem;"><option value="topic">Topic</option><option value="url">RSS URL</option></select>';
  html+='<input id="newFeedSourceLabel" type="text" class="form-input" placeholder="Label (e.g. Pakistan Logistics)" style="font-size:.72rem;flex:1;">';
  html+='</div>';
  html+='<div style="display:flex;gap:6px;">';
  html+='<input id="newFeedSourceValue" type="text" class="form-input" placeholder="Search topic or RSS URL" style="font-size:.72rem;flex:1;">';
  html+=`<button id="feedSourceSubmitBtn" onclick="addFeedSource('${client.id}')" style="background:var(--nes-btn-grad);border:none;border-radius:7px;padding:7px 16px;color:#fff;font-size:.72rem;font-weight:700;cursor:pointer;white-space:nowrap;"><i class="ti ti-plus"></i> Add</button> <button onclick="cancelEditFeedSource()" id="feedSourceCancelBtn" style="display:none;background:none;border:1px solid var(--border);border-radius:7px;padding:7px 12px;color:var(--muted);font-size:.72rem;cursor:pointer;white-space:nowrap;">Cancel</button>`;
  html+='</div>';
  html+='</div>';
  html+='<div id="it-cred-form" style="display:none;margin-top:16px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;">';
  html+='<div id="it-cred-title" style="font-family:var(--mono);font-size:.75rem;font-weight:700;color:var(--nes-blue);margin-bottom:12px;"></div>';
  html+='<div id="it-cred-fields"></div>';
  html+='<div style="display:flex;gap:8px;margin-top:12px;">';
  html+='<button onclick="saveItCred()" class="form-submit" style="flex:1;"><i class="ti ti-device-floppy"></i> Save</button>';
  html+=`<button onclick="document.getElementById('it-cred-form').style.display='none'" style="background:none;border:1px solid var(--border);border-radius:8px;padding:8px 14px;color:var(--muted);cursor:pointer;font-size:.8rem;">${t('common.cancel')}</button>`;
  html+='</div></div>';

  html+='<div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;margin-top:20px;">Website Chat Widget</div>';
  html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:16px;">';
  html+='<div style="font-size:.75rem;color:var(--muted);margin-bottom:10px;">Add an AI chat widget to your website by pasting this one line before </head> on your site.</div>';
  html+='<div style="display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-family:var(--mono);font-size:.68rem;color:#409cff;word-break:break-all;">';
  html+='<span id="widget-snippet">&lt;script src=\"https://api.essential-services.org/widget.js?client_id='+client.id+'\"&gt;&lt;/script&gt;</span>';
  html+=`<button onclick="copyWidgetSnippet(this, '${client.id}')" style="background:var(--nes-btn-grad);border:none;border-radius:6px;padding:4px 12px;color:#fff;font-size:.68rem;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;">${t('chatUi.copy')}</button>`;
  html+='</div>';
  html+='<div style="font-size:.68rem;color:var(--muted);margin-top:8px;"><i class="ti ti-info-circle"></i> Works on WordPress, Wix, Squarespace, or any HTML site.</div>';
  html+='</div>';
  el.innerHTML=html;
  window._itCredsCache=creds;
  loadFeedSources(client.id);
}

function copyWidgetSnippet(btn, clientId){
  const snippet='<script src="https://api.essential-services.org/widget.js?client_id='+clientId+'"><\/script>';
  navigator.clipboard.writeText(snippet).then(function(){
    btn.textContent='Copied!';
    setTimeout(function(){btn.textContent='Copy'},2000);
  });
}

function editItCred(keysStr, label){
  const keys=keysStr.split(',');
  const creds=window._itCredsCache||{};
  document.getElementById('it-cred-title').textContent=label;
  const fieldLabels={
    facebook_token:'Page token',facebook_page_id:'Page ID',
    instagram_business_id:'Business Account ID',
    whatsapp_phone_id:'Phone ID',whatsapp_token:'API token',
    linkedin_token:'Access token',
    lead_email:'Email address',website:'Website URL',
    imap_email:'Email address',imap_password:'Email password',
    imap_host:'Incoming server (IMAP)',smtp_host:'Outgoing server (SMTP)',smtp_port:'SMTP port'
  };
  let html='';
  keys.forEach(function(k){
    const val=(creds[k]||'').replace(/"/g,'&quot;');
    const isPwd=k.includes('token')||k.includes('password');
    html+='<div style="margin-bottom:8px;"><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:4px;">'+(fieldLabels[k]||k)+'</div>';
    html+='<input id="itf_'+k+'" type="'+(isPwd?'password':'text')+'" class="form-input" value="'+val+'" placeholder="Enter value"'+(isPwd?' autocomplete="new-password"':'')+' style="font-family:var(--mono);font-size:.75rem;"></div>';
  });
  document.getElementById('it-cred-fields').innerHTML=html;
  document.getElementById('it-cred-form').style.display='block';
  window._itActiveKeys=keys;
  document.querySelector('#it-cred-fields input')?.focus();
}

async function saveItCred(){
  const keys=window._itActiveKeys||[];
  const creds=window._itCredsCache||{};
  keys.forEach(function(k){
    const el=document.getElementById('itf_'+k);
    if(el&&el.value.trim())creds[k]=el.value.trim();
  });
  window._itCredsCache=creds;
  try{
    const res=await fetch(API_URL+'/api/client/'+userClientId+'/credentials',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({credentials:creds})
    });
    if(!res.ok)throw new Error(await res.text());
    showToast(t('toast.saved'));
    document.getElementById('it-cred-form').style.display='none';
    renderMyCredsForm(creds, window._itClientCache||{});
  }catch(e){alert('Error: '+e.message);}
}

async function saveMyCredentials(){
  const fields=['facebook_token','facebook_page_id','instagram_business_id','whatsapp_phone_id','whatsapp_token','linkedin_token','calcom_link','lead_email','website','vapi_assistant_id'];
  const creds={};
  fields.forEach(function(k){
    const el=document.getElementById('mycred_'+k);
    if(el&&el.value.trim())creds[k]=el.value.trim();
  });
  try{
    const res=await fetch(API_URL+'/api/client/'+userClientId+'/credentials',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({credentials:creds})
    });
    if(!res.ok)throw new Error(await res.text());
    showToast(t('toast.credentialsSavedSecurely'));
  }catch(e){
    alert('Error saving credentials: '+e.message);
  }
}

async function loadFeedSources(clientId){
  const listEl=document.getElementById('feedSourcesList');
  if(!listEl)return;
  try{
    const r=await fetch(API_URL+'/api/client/'+clientId+'/feed-sources',{headers:{'Authorization':'Bearer '+session.access_token}});
    const data=await r.json();
    const sources=data.sources||[];
    if(sources.length===0){
      listEl.innerHTML='<div style="color:var(--muted);font-size:.72rem;padding:6px 0;">No feed sources yet — add one below.</div>';
      return;
    }
    listEl.innerHTML=sources.map(function(s){
      const typeLabel=s.source_type==='url'?'RSS URL':'Topic';
      return '<div style="display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:6px;">'
        +'<span style="font-size:.6rem;font-family:var(--mono);padding:2px 8px;border-radius:10px;background:#0d2818;color:#3fb950;flex-shrink:0;">'+typeLabel+'</span>'
        +'<div style="flex:1;min-width:0;"><div style="font-size:.75rem;font-weight:600;">'+s.label+'</div><div style="font-size:.68rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+s.search_query+'</div></div>'
        +'<button onclick="editFeedSource(\''+clientId+'\',\''+s.id+'\',\''+s.label.replace(/'/g,"\\'")+'\',\''+s.search_query.replace(/'/g,"\\'")+'\',\''+s.source_type+'\')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.9rem;flex-shrink:0;"><i class="ti ti-pencil"></i></button>'
        +'<button onclick="deleteFeedSource(\''+clientId+'\',\''+s.id+'\')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.9rem;flex-shrink:0;"><i class="ti ti-trash"></i></button>'
        +'</div>';
    }).join('');
  }catch(e){
    listEl.innerHTML='<div style="color:var(--muted);font-size:.72rem;">Could not load feed sources.</div>';
  }
}
async function addFeedSource(clientId){
  const type=document.getElementById('newFeedSourceType').value;
  const label=document.getElementById('newFeedSourceLabel').value.trim();
  const value=document.getElementById('newFeedSourceValue').value.trim();
  if(!label||!value){showToast('Enter both a label and a value');return;}
  try{
    const r=await fetch(API_URL+'/api/client/'+clientId+'/feed-sources',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({label,search_query:value,source_type:type})});
    const data=await r.json();
    if(!r.ok)throw new Error(data.error||'Failed to add source');
    document.getElementById('newFeedSourceLabel').value='';
    document.getElementById('newFeedSourceValue').value='';
    showToast(t('toast.feedSourcesSaved'));
    loadFeedSources(clientId);
  }catch(e){showToast('Error: '+e.message);}
}
let _editingSourceId=null;
function editFeedSource(clientId,sourceId,label,searchQuery,sourceType){
  _editingSourceId=sourceId;
  document.getElementById('newFeedSourceType').value=sourceType;
  document.getElementById('newFeedSourceLabel').value=label;
  document.getElementById('newFeedSourceValue').value=searchQuery;
  const btn=document.getElementById('feedSourceSubmitBtn');
  if(btn){btn.textContent='Save Changes';btn.setAttribute('onclick',"saveEditedFeedSource('"+clientId+"')");}
  const cancelBtn=document.getElementById('feedSourceCancelBtn');
  if(cancelBtn)cancelBtn.style.display='inline-block';
}
async function saveEditedFeedSource(clientId){
  const type=document.getElementById('newFeedSourceType').value;
  const label=document.getElementById('newFeedSourceLabel').value.trim();
  const value=document.getElementById('newFeedSourceValue').value.trim();
  if(!label||!value){showToast('Enter both a label and a value');return;}
  try{
    const r=await fetch(API_URL+'/api/client/'+clientId+'/feed-sources/'+_editingSourceId,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({label,search_query:value,source_type:type})});
    const data=await r.json();
    if(!r.ok)throw new Error(data.error||'Failed to save changes');
    cancelEditFeedSource();
    showToast('Source updated');
    loadFeedSources(clientId);
  }catch(e){showToast('Error: '+e.message);}
}
function cancelEditFeedSource(){
  _editingSourceId=null;
  document.getElementById('newFeedSourceLabel').value='';
  document.getElementById('newFeedSourceValue').value='';
  const btn=document.getElementById('feedSourceSubmitBtn');
  if(btn){btn.innerHTML='<i class="ti ti-plus"></i> Add';btn.setAttribute('onclick',"addFeedSource('"+(window._itCredsCache&&window._itCredsCache.clientId||'')+"')");}
  const cancelBtn=document.getElementById('feedSourceCancelBtn');
  if(cancelBtn)cancelBtn.style.display='none';
}
async function deleteFeedSource(clientId,sourceId){
  try{
    const r=await fetch(API_URL+'/api/client/'+clientId+'/feed-sources/'+sourceId,{method:'DELETE',headers:{'Authorization':'Bearer '+session.access_token}});
    if(!r.ok)throw new Error('Failed to delete source');
    loadFeedSources(clientId);
  }catch(e){showToast('Error: '+e.message);}
}
