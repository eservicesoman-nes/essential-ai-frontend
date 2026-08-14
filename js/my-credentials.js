// my-credentials.js — extracted from index.html, NES Locale Phase 0
// 7 functions, zero logic changes

async function showMyCredentials(){
  if(!userClientId){addAiMsg('No client account linked.');return;}
  const mc=document.getElementById('mainContent');
  mc.style.overflow='auto';
  mc.innerHTML=`
    <div style="padding:11px 18px 11px 60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
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
    {title:'Social media',items:[
      {label:'Facebook',desc:'Page token + Page ID',keys:['facebook_token','facebook_page_id'],icon:'ti-brand-facebook'},
      {label:'Instagram',desc:'Business Account ID',keys:['instagram_business_id'],icon:'ti-brand-instagram'},
      {label:'LinkedIn',desc:'Access token',keys:['linkedin_token'],icon:'ti-brand-linkedin'},
    ]},
    {title:'Messaging & leads',items:[
      {label:'WhatsApp',desc:'Phone ID + API token',keys:['whatsapp_phone_id','whatsapp_token'],icon:'ti-brand-whatsapp'},
      {label:'Lead alerts email',desc:'Where new leads are sent',keys:['lead_email'],icon:'ti-mail'},
      {label:'Website',desc:'Your website URL',keys:['website'],icon:'ti-world'},
    ]},
    {title:'Inbox & Email',items:[
      {label:'Email Account',desc:'Connect your inbox (IMAP/SMTP)',keys:['imap_email','imap_password','imap_host','smtp_host','smtp_port'],icon:'ti-inbox'},
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
    html+='<div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;margin-top:16px;">'+sec.title+'</div>';
    sec.items.forEach(function(item){
      const isConnected=item.keys.some(k=>creds[k]&&creds[k].trim());
      html+='<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface);border:1px solid var(--border);border-radius:10px;margin-bottom:6px;">';
      html+='<div style="width:34px;height:34px;border-radius:8px;background:var(--bg);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="ti '+item.icon+'" style="font-size:16px;color:var(--nes-blue);"></i></div>';
      html+='<div style="flex:1;"><div style="font-size:.82rem;color:var(--text);font-weight:500;">'+item.label+'</div>';
      html+='<div style="font-size:.72rem;color:var(--muted);">'+item.desc+'</div></div>';
      html+='<div style="display:flex;align-items:center;gap:8px;">';
      html+='<span style="font-size:.68rem;font-family:var(--mono);padding:3px 10px;border-radius:12px;background:'+(isConnected?'#0d2818':'#2d1f00')+';color:'+(isConnected?'#3fb950':'#d29922')+';">'+(isConnected?'Connected':'Missing')+'</span>';
      html+='<button onclick="editItCred(\''+item.keys.join(',')+'\',\''+item.label+'\')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;color:var(--muted);cursor:pointer;font-size:.72rem;">'+(isConnected?'Edit':'Connect')+'</button>';
      html+='</div></div>';
    });
  });
  const isPro=(client.plan==='operations'||client.plan==='workforce'||client.plan==='infrastructure');
  const isEnterprise=client.plan==='infrastructure';
  const maxSources=isEnterprise?10:isPro?10:5;
  const savedSources=client.feed_urls&&client.feed_urls.length?client.feed_urls:[];
  const defaultSources=['https://timesofoman.com/rss','https://omanobserver.om/feed','https://www.arabianbusiness.com/rss','https://www.zawya.com/rss/technology','https://gulfnews.com/rss/technology'];
  const sources=savedSources.length?savedSources:defaultSources;
  html+='<div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;margin-top:20px;">NES Pulse — Feed Sources</div>';
  html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:16px;">';
  html+='<div style="font-size:.75rem;color:var(--muted);margin-bottom:10px;">Your NES Pulse intelligence feed pulls from these sources daily.</div>';
  for(var si=0;si<5;si++){
    var sv=sources[si]||'';
    html+='<div style="display:flex;gap:8px;margin-bottom:6px;">';
    html+='<input id="feed_src_'+si+'" type="url" class="form-input" value="'+sv.replace(/"/g,'&quot;')+'" placeholder="https://news-source.com/rss" style="font-size:.72rem;">';
    html+='</div>';
  }
  if(!isPro){
    html+='<div style="margin-top:10px;padding:10px 12px;background:#0c1f35;border:1px solid #1a3a6e;border-radius:8px;display:flex;align-items:center;justify-content:space-between;">';
    html+='<div><div style="font-family:var(--mono);font-size:.68rem;color:var(--nes-blue);font-weight:700;">+ 5 more sources</div>';
    html+='<div style="font-size:.68rem;color:var(--muted);">Add custom industry sources</div></div>';
    html+='<button onclick="showPricing()" style="background:var(--nes-btn-grad);border:none;border-radius:6px;padding:5px 12px;color:#fff;font-size:.68rem;font-weight:700;cursor:pointer;">Upgrade Plan</button>';
    html+='</div>';
  } else {
    for(var si2=5;si2<10;si2++){
      var sv2=sources[si2]||'';
      html+='<div style="display:flex;gap:8px;margin-bottom:6px;">';
      html+='<input id="feed_src_'+si2+'" type="url" class="form-input" value="'+sv2.replace(/"/g,'&quot;')+'" placeholder="https://custom-source.com/rss" style="font-size:.72rem;">';
      html+='</div>';
    }
  }
  html+='<button onclick="saveFeedSources()" style="background:var(--nes-btn-grad);border:none;border-radius:7px;padding:7px 16px;color:#fff;font-size:.75rem;font-weight:700;cursor:pointer;margin-top:8px;width:100%;"><i class="ti ti-device-floppy"></i> Save Feed Sources</button>';
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
  html+='<button onclick="copyWidgetSnippet(this, \''+client.id+'\')" style="background:var(--nes-btn-grad);border:none;border-radius:6px;padding:4px 12px;color:#fff;font-size:.68rem;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;">Copy</button>';
  html+='</div>';
  html+='<div style="font-size:.68rem;color:var(--muted);margin-top:8px;"><i class="ti ti-info-circle"></i> Works on WordPress, Wix, Squarespace, or any HTML site.</div>';
  html+='</div>';
  el.innerHTML=html;
  window._itCredsCache=creds;
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

async function saveFeedSources(){
  var sources=[];
  for(var i=0;i<10;i++){
    var el=document.getElementById('feed_src_'+i);
    if(el&&el.value.trim())sources.push(el.value.trim());
  }
  try{
    const r=await fetch(API_URL+'/api/admin/client/'+userClientId+'/feed-urls',{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({feed_urls:sources})});const{error}=r.ok?{}:{message:(await r.json()).error};
    if(error)throw error;
    showToast(t('toast.feedSourcesSaved'));
  }catch(e){showToast('Error: '+e.message);}
}
