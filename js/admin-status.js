// admin-status.js — extracted from index.html, NES Locale Phase 0
// 6 functions, zero logic changes

async function showAdminStatus(){
  if(userRole!=='nesadmin'){return;}
  const mc=document.getElementById('mainContent');
  mc.style.overflow='auto';
  mc.style.display='flex';
  mc.style.flexDirection='column';
  mc.innerHTML=`
    <div style="padding:11px 62px 11px 60px;border-bottom:1px solid var(--border);flex-shrink:0;">
      <div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;">${t('sectionTitle.platformStatus')}</div>
      <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">${t('pageSubtitle.platformStatus')}</div>
    </div>
    <div style="flex:1;overflow-y:auto;padding:14px 18px;">
      <div style="max-width:1100px;padding-bottom:60px;" id="statusContent">
        <div style="color:var(--muted);font-family:var(--mono);font-size:.8rem;padding:20px 0;">Checking services...</div>
      </div>
    </div>`;
  await checkPlatformStatus();
  // Load backup status
  try {
    const br = await fetch(API_URL+'/api/admin/backup-status', {headers:{'Authorization':'Bearer '+session.access_token}});
    const bd = await br.json();
    const bel = document.getElementById('backupStatusCard');
    if(bel && bd) {
      const ok = bd.status === 'success';
      const color = ok ? '#3fb950' : '#f85149';
      bel.style.borderColor = ok ? '#3fb95040' : '#f8514940';
      bel.style.background = ok ? 'rgba(63,185,80,0.05)' : 'rgba(248,81,73,0.05)';
      const usedGB = bd.b2 ? parseFloat(bd.b2.totalSizeGB) : 0;
      const freeGB = Math.max(10 - usedGB, 0).toFixed(2);
      const usedPct = Math.min(usedGB/10*100, 100).toFixed(0);
      const freeColor = freeGB < 1 ? '#f0883e' : '#3fb950';
      const recentDates = bd.b2 ? (bd.b2.backupDates||[]).slice(0,5).join(' · ')||'—' : '—';
      const b2Html = bd.b2 ? (
        '<div style="display:flex;gap:8px;width:100%;margin-top:6px;">' +
        '<div style="flex:1;background:#0d1117;border:1px solid var(--border);border-radius:8px;padding:8px 12px;">' +
          '<div style="font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;">Storage Used</div>' +
          '<div style="font-size:1rem;font-weight:700;color:#409cff;font-family:var(--mono);">' + bd.b2.totalSizeGB + ' GB</div>' +
          '<div style="height:4px;background:var(--border);border-radius:2px;margin-top:5px;"><div style="height:4px;background:#409cff;border-radius:2px;width:' + usedPct + '%;"></div></div>' +
        '</div>' +
        '<div style="flex:1;background:#0d1117;border:1px solid var(--border);border-radius:8px;padding:8px 12px;">' +
          '<div style="font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;">Free Remaining</div>' +
          '<div style="font-size:1rem;font-weight:700;color:' + freeColor + ';font-family:var(--mono);">' + freeGB + ' GB</div>' +
          '<div style="font-size:.6rem;color:var(--muted);margin-top:2px;">of 10 GB free tier</div>' +
        '</div>' +
        '<div style="flex:1;background:#0d1117;border:1px solid var(--border);border-radius:8px;padding:8px 12px;">' +
          '<div style="font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;">Files Stored</div>' +
          '<div style="font-size:1rem;font-weight:700;color:#409cff;font-family:var(--mono);">' + bd.b2.fileCount + '</div>' +
        '</div>' +
        '<div style="flex:2;background:#0d1117;border:1px solid var(--border);border-radius:8px;padding:8px 12px;">' +
          '<div style="font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;">Recent Backups</div>' +
          '<div style="font-size:.7rem;color:#e6edf3;font-family:var(--mono);">' + recentDates + '</div>' +
        '</div>' +
        '</div>'
      ) : '';
      bel.innerHTML =
        '<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:200px;">' +
            '<div style="width:10px;height:10px;border-radius:50%;background:' + color + ';flex-shrink:0;' + (ok?'box-shadow:0 0 6px '+color+';':'') + '"></div>' +
            '<div style="flex:1;">' +
              '<div style="font-size:.78rem;font-weight:600;color:#e6edf3;">Backblaze B2 — nes-vps-backup</div>' +
              '<div style="font-size:.68rem;color:var(--muted);">Last backup: ' + (bd.last_date||'Unknown') + ' · ' + (bd.last_time||'') + '</div>' +
            '</div>' +
            '<div style="text-align:right;flex-shrink:0;">' +
              '<div style="font-size:.75rem;font-weight:700;color:' + color + ';">' + (ok?'✅ Success':'❌ Failed') + '</div>' +
              '<div style="font-size:.65rem;color:var(--muted);">Daily at 2:00 AM</div>' +
            '</div>' +
          '</div>' +
          b2Html +
        '</div>';
    }
  } catch(e) { console.log('Backup status error:', e); }
  // Load VPS stats
  try {
    const vr = await fetch(API_URL+'/api/admin/vps-stats', {headers:{'Authorization':'Bearer '+session.access_token}});
    const vd = await vr.json();
    const vel = document.getElementById('vpsStatsCard');
    if(vel && vd) {
      const cpuPct = vd.cpu?.percent ?? 0;
      const ramPct = vd.ram?.percent ?? 0;
      const diskPctNum = vd.disk?.percent ?? 0;
      const ramUsed = vd.ram?.used ?? 0;
      const ramTotal = vd.ram?.total ?? 0;
      const diskUsedGB = Math.round((vd.disk?.used ?? 0) / (1024*1024*1024));
      const diskTotalGB = Math.round((vd.disk?.total ?? 0) / (1024*1024*1024));
      const cpuColor = cpuPct >= 80 ? '#f85149' : cpuPct >= 60 ? '#f0883e' : '#3fb950';
      const ramColor = ramPct >= 85 ? '#f85149' : ramPct >= 70 ? '#f0883e' : '#3fb950';
      const diskColor = diskPctNum >= 85 ? '#f85149' : diskPctNum >= 70 ? '#f0883e' : '#3fb950';
      vel.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;">
          <div style="background:#0d1117;border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:.62rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;">CPU</div>
            <div style="font-size:1.3rem;font-weight:700;color:${cpuColor};font-family:var(--mono);">${cpuPct}%</div>
            <div style="height:4px;background:var(--border);border-radius:2px;margin-top:6px;"><div style="height:4px;background:${cpuColor};border-radius:2px;width:${Math.min(cpuPct,100)}%;"></div></div>
          </div>
          <div style="background:#0d1117;border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:.62rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;">RAM</div>
            <div style="font-size:1.3rem;font-weight:700;color:${ramColor};font-family:var(--mono);">${ramPct}%</div>
            <div style="font-size:.62rem;color:var(--muted);margin-top:2px;">${ramUsed} / ${ramTotal} MB</div>
          </div>
          <div style="background:#0d1117;border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:.62rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;">DISK</div>
            <div style="font-size:1.3rem;font-weight:700;color:${diskColor};font-family:var(--mono);">${diskPctNum}%</div>
            <div style="font-size:.62rem;color:var(--muted);margin-top:2px;">${diskUsedGB} / ${diskTotalGB} GB</div>
          </div>
        </div>
        <div style="font-family:var(--mono);font-size:.62rem;color:#7f77dd;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;">PM2 PROCESSES</div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          ${(vd.processes||[]).map(p=>`
            <div style="display:flex;align-items:center;justify-content:space-between;background:#0d1117;border:1px solid var(--border);border-radius:6px;padding:7px 12px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:7px;height:7px;border-radius:50%;background:${p.status==='online'?'#3fb950':'#f85149'};${p.status==='online'?'box-shadow:0 0 5px #3fb950;':''}"></div>
                <span style="font-size:.75rem;font-family:var(--mono);color:#e6edf3;">${p.name}</span>
              </div>
              <div style="display:flex;gap:12px;font-size:.65rem;font-family:var(--mono);color:var(--muted);">
                <span>CPU ${p.cpu}%</span>
                <span>MEM ${p.memory}MB</span>
                <span>↺ ${p.restarts}</span>
                <span style="color:${p.status==='online'?'#3fb950':'#f85149'};">${p.status}</span>
              </div>
            </div>`).join('')}
        </div>`;
    }
  } catch(e) { console.log('VPS stats error:', e); }
}

function showAddServiceModal(){
  const existing=document.getElementById('addServiceModal');
  if(existing){existing.remove();return;}
  const modal=document.createElement('div');
  modal.id='addServiceModal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML=`<div style="background:#161b22;border:1px solid var(--border);border-radius:12px;padding:24px;width:340px;font-family:var(--mono);">
    <div style="font-size:.75rem;font-weight:800;color:var(--nes-blue);margin-bottom:16px;">+ ADD SERVICE MONITOR</div>
    <div style="font-size:.68rem;color:var(--muted);margin-bottom:6px;">Service Label</div>
    <input id="svcLabel" placeholder="e.g. n8n Automation" style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:var(--text);font-family:var(--mono);font-size:.75rem;margin-bottom:10px;">
    <div style="font-size:.68rem;color:var(--muted);margin-bottom:6px;">Health Check URL</div>
    <input id="svcUrl" placeholder="https://n8n.essential-services.org/healthz" style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:var(--text);font-family:var(--mono);font-size:.75rem;margin-bottom:16px;">
    <div style="display:flex;gap:8px;">
      <button onclick="saveNewService()" style="flex:1;background:linear-gradient(135deg,#1a56db,#2563eb);border:none;border-radius:6px;padding:8px;color:#fff;font-family:var(--mono);font-size:.72rem;cursor:pointer;font-weight:700;">Add Service</button>
      <button onclick="document.getElementById('addServiceModal').remove()" style="flex:1;background:none;border:1px solid var(--border);border-radius:6px;padding:8px;color:var(--muted);font-family:var(--mono);font-size:.72rem;cursor:pointer;">${t('common.cancel')}</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}

async function saveNewService(){
  const label=document.getElementById('svcLabel').value.trim();
  const url=document.getElementById('svcUrl').value.trim();
  if(!label||!url){showToast(t('toast.fillBothFields'));return;}
  try{
    const existing=JSON.parse(localStorage.getItem('nes_custom_services')||'[]');
    existing.push({label,url,name:url});
    localStorage.setItem('nes_custom_services',JSON.stringify(existing));
    document.getElementById('addServiceModal').remove();
    showToast(t('toast.serviceAdded'));
    await checkPlatformStatus();
  }catch(e){showToast('Error: '+e.message);}
}

function showAddApiModalQuick(){
  const existing=document.getElementById('addApiModalQuick');
  if(existing){existing.remove();return;}
  const modal=document.createElement('div');
  modal.id='addApiModalQuick';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML=`<div style="background:#161b22;border:1px solid var(--border);border-radius:12px;padding:24px;width:340px;font-family:var(--mono);">
    <div style="font-size:.75rem;font-weight:800;color:#7f77dd;margin-bottom:16px;">+ ADD API SERVICE</div>
    <div style="font-size:.68rem;color:var(--muted);margin-bottom:6px;">API Name</div>
    <input id="qapiName" placeholder="e.g. Perplexity" style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:var(--text);font-family:var(--mono);font-size:.75rem;margin-bottom:10px;">
    <div style="font-size:.68rem;color:var(--muted);margin-bottom:6px;">Current Balance ($)</div>
    <input id="qapiBalance" type="number" placeholder="0.00" style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:var(--text);font-family:var(--mono);font-size:.75rem;margin-bottom:10px;">
    <div style="font-size:.68rem;color:var(--muted);margin-bottom:6px;">Alert Threshold ($)</div>
    <input id="qapiThreshold" type="number" placeholder="5" style="width:100%;box-sizing:border-box;background:#0d1117;border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:var(--text);font-family:var(--mono);font-size:.75rem;margin-bottom:16px;">
    <div style="display:flex;gap:8px;">
      <button onclick="saveApiQuick()" style="flex:1;background:linear-gradient(135deg,#1a56db,#2563eb);border:none;border-radius:6px;padding:8px;color:#fff;font-family:var(--mono);font-size:.72rem;cursor:pointer;font-weight:700;">${t('adminStatusUi.addApi')}</button>
      <button onclick="document.getElementById('addApiModalQuick').remove()" style="flex:1;background:none;border:1px solid var(--border);border-radius:6px;padding:8px;color:var(--muted);font-family:var(--mono);font-size:.72rem;cursor:pointer;">${t('common.cancel')}</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}

async function saveApiQuick(){
  const name=document.getElementById('qapiName').value.trim();
  const balance=parseFloat(document.getElementById('qapiBalance').value)||0;
  const threshold=parseFloat(document.getElementById('qapiThreshold').value)||5;
  if(!name){showToast(t('toast.enterApiName'));return;}
  try{
    await sb.from('api_credits').insert([{service_name:name,current_balance:balance,alert_threshold:threshold,status:balance<threshold?'low':'healthy'}]);
    document.getElementById('addApiModalQuick').remove();
    showToast(t('toast.apiAdded'));
    await checkPlatformStatus();
  }catch(e){showToast('Error: '+e.message);}
}

async function checkPlatformStatus(){
  const el=document.getElementById('statusContent');
  if(!el)return;
  const builtinServices=[
    {name:'Backend API',url:API_URL+'/health',label:'NES AI Backend'},
    {name:'Supabase',url:'https://sfpfjjdtczvuxyhjievt.supabase.co/rest/v1/',label:'Database'},
    {name:'Frontend',url:'https://app.nes-ai.com',label:'Vercel Frontend'},
    {name:'GitHub',url:API_URL+'/api/admin/ping/github-proxy',label:'GitHub'},
  ];
  const customServices=JSON.parse(localStorage.getItem('nes_custom_services')||'[]');
  const services=[...builtinServices,...customServices];

  const [results, extraPings, apiCredits, platformStats] = await Promise.all([
    Promise.all(services.map(async function(s){
      const start=Date.now();
      try{
        const opts={method:'GET',signal:AbortSignal.timeout(10000)};
        if(s.authHeader)opts.headers={'Authorization':s.authHeader,'User-Agent':'NES-AI'};
        const r=await fetch(s.url,opts);const ms=Date.now()-start;return{...s,ok:r.ok||r.status===401,ms,status:r.ok||r.status===401?'online':'error'};
      }
      catch(e){
        const ms=Date.now()-start;
        const isTimeout = e.name==='TimeoutError' || e.name==='AbortError';
        return{...s,ok:false,ms,status:isTimeout?'slow':'offline'};
      }
    })),
    (async()=>{
      const {data:freshSessionData}=await sb.auth.getSession();
      const freshToken=freshSessionData?.session?.access_token||session.access_token;
      return Promise.all([
        fetch(API_URL+'/api/admin/ping/pm2',{headers:{'Authorization':'Bearer '+freshToken}}).then(r=>r.json()).catch(()=>({online:false,ms:0})),
        fetch(API_URL+'/api/admin/ping/backblaze',{headers:{'Authorization':'Bearer '+freshToken}}).then(r=>r.json()).catch(()=>({online:false,ms:0})),
      ]);
    })(),
    sb.from('api_credits').select('*').order('service_name'),
    Promise.all([
      sb.from('clients').select('*',{count:'exact',head:true}),
      sb.from('leads').select('*',{count:'exact',head:true}),
      sb.from('profiles').select('*',{count:'exact',head:true}),
      sb.from('usage').select('chats_used,images_used,docs_used').eq('date',new Date().toISOString().split('T')[0]),
    ])
  ]);
  const allOk=results.every(function(r){return r.ok;});
  const now=new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const apis=apiCredits.data||[];
  const [clientRes,leadRes,userRes,usageRes]=platformStats;
  const todayUsage=usageRes.data||[];
  const totalChatsToday=todayUsage.reduce((s,u)=>s+(u.chats_used||0),0);
  const totalImgsToday=todayUsage.reduce((s,u)=>s+(u.images_used||0),0);
  const totalDocsToday=todayUsage.reduce((s,u)=>s+(u.docs_used||0),0);
  const lowApis=apis.filter(a=>a.status==='low'||a.status==='critical');

  let html='<div style="position:sticky;top:0;z-index:10;background:var(--bg);padding-bottom:10px;">';

  html+='<div style="display:flex;align-items:center;justify-content:space-between;padding-top:2px;margin-bottom:10px;">';
  html+=`<div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">${t('adminStatusUi.lastChecked')} ${now}</div>`;
  html+=`<button onclick="checkPlatformStatus()" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;color:var(--muted);cursor:pointer;font-size:.72rem;font-family:var(--mono);"><i class="ti ti-refresh"></i> ${t('adminStatusUi.refresh')}</button>`;
  html+='</div>';

  html+='<div style="background:'+(allOk?'#0d2818':'#2d0e0e')+';border:1px solid '+(allOk?'#3fb95040':'#f8514940')+';border-radius:10px;padding:10px 16px;margin-bottom:10px;display:flex;align-items:center;gap:10px;">';
  html+='<div style="width:10px;height:10px;border-radius:50%;background:'+(allOk?'#3fb950':'#f85149')+';'+(allOk?'box-shadow:0 0 6px #3fb950;':'')+'"></div>';
  html+='<div style="font-family:var(--mono);font-size:.8rem;font-weight:700;color:'+(allOk?'#3fb950':'#f85149')+'">'+(allOk?'All systems operational':'Some services need attention')+'</div>';
  if(lowApis.length>0){html+='<div style="margin-left:auto;font-size:.65rem;font-family:var(--mono);color:#f85149;"><i class="ti ti-alert-triangle"></i> '+lowApis.length+' API'+(lowApis.length>1?'s':'')+' low</div>';}
  html+='</div>';

  html+='<div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;">Platform Stats & Today&#39;s Usage</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:10px;">';
  html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;"><i class="ti ti-briefcase" style="font-size:16px;color:var(--nes-blue);display:block;margin-bottom:4px;"></i><div style="font-size:1.1rem;font-weight:700;color:var(--nes-blue);">'+(clientRes.count||0)+'</div><div style="font-size:.58rem;color:var(--muted);font-family:var(--mono);">Clients</div></div>';
  html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;"><i class="ti ti-users" style="font-size:16px;color:#3fb950;display:block;margin-bottom:4px;"></i><div style="font-size:1.1rem;font-weight:700;color:#3fb950;">'+(leadRes.count||0)+'</div><div style="font-size:.58rem;color:var(--muted);font-family:var(--mono);">Leads</div></div>';
  html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;"><i class="ti ti-user" style="font-size:16px;color:#7f77dd;display:block;margin-bottom:4px;"></i><div style="font-size:1.1rem;font-weight:700;color:#7f77dd;">'+(userRes.count||0)+'</div><div style="font-size:.58rem;color:var(--muted);font-family:var(--mono);">Users</div></div>';
  html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;"><i class="ti ti-message" style="font-size:16px;color:var(--nes-blue);display:block;margin-bottom:4px;"></i><div style="font-size:1.1rem;font-weight:700;color:var(--nes-blue);">'+totalChatsToday+'</div><div style="font-size:.58rem;color:var(--muted);font-family:var(--mono);">Chats today</div></div>';
  html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;"><i class="ti ti-photo" style="font-size:16px;color:#7f77dd;display:block;margin-bottom:4px;"></i><div style="font-size:1.1rem;font-weight:700;color:#7f77dd;">'+totalImgsToday+'</div><div style="font-size:.58rem;color:var(--muted);font-family:var(--mono);">Images today</div></div>';
  html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;"><i class="ti ti-file-text" style="font-size:16px;color:#3fb950;display:block;margin-bottom:4px;"></i><div style="font-size:1.1rem;font-weight:700;color:#3fb950;">'+totalDocsToday+'</div><div style="font-size:.58rem;color:var(--muted);font-family:var(--mono);">Docs today</div></div>';
  html+='</div>';

  html+='</div>';

  html+='<div class="status-panel-toggle" style="display:none;padding:6px 0;gap:6px;margin-bottom:10px;">';
  html+='<button onclick="toggleStatusPanel(&quot;services&quot;)" id="statusToggleServices" style="flex:1;padding:7px;border:none;border-radius:7px;background:var(--nes-blue);color:#fff;font-size:.75rem;font-weight:600;cursor:pointer;"><i class="ti ti-server"></i> Services</button>';
  html+='<button onclick="toggleStatusPanel(&quot;credits&quot;)" id="statusToggleCredits" style="flex:1;padding:7px;border:none;border-radius:7px;background:var(--surface);color:var(--muted);font-size:.75rem;font-weight:600;cursor:pointer;border:1px solid var(--border);"><i class="ti ti-credit-card"></i> API Credits</button>';
  html+='</div>';
  html+='<div id="statusPanelGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px;margin-bottom:16px;">';

  html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;">';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--border);">';
  html+='<div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;">Services</div>';
  html+='<button onclick="showAddServiceModal()" style="background:linear-gradient(135deg,#1a56db,#2563eb);border:none;border-radius:6px;padding:3px 10px;color:#fff;cursor:pointer;font-size:.65rem;font-family:var(--mono);font-weight:700;display:flex;align-items:center;gap:4px;"><i class="ti ti-plus"></i> Add</button>';
  html+='</div>';
  // ping dot helper with pulse effects
  function pingDot(status, slowPulse){
    const color=status==='online'?'#3fb950':(status==='error'||status==='slow')?'#d29922':'#f85149';
    const anim=status!=='online'?(slowPulse?'animation:pulse-slow 2s infinite;':'animation:pulse-fast .7s infinite;'):(status==='online'?'':'');
    return '<div style="width:8px;height:8px;border-radius:50%;background:'+color+';flex-shrink:0;'+anim+'"></div>';
  }
  results.forEach(function(r){
    const color=r.status==='online'?'#3fb950':(r.status==='error'||r.status==='slow')?'#d29922':'#f85149';
    const bg=r.status==='online'?'#0d2818':(r.status==='error'||r.status==='slow')?'#2d1f00':'#2d0e0e';
    html+='<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(26,35,50,.4);">';
    html+=pingDot(r.status, false);
    html+='<div style="flex:1;min-width:0;"><div style="font-size:.78rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+r.label+'</div><div style="font-size:.6rem;color:var(--muted);font-family:var(--mono);">'+r.ms+'ms</div></div>';
    html+='<span style="font-size:.58rem;font-family:var(--mono);padding:2px 7px;border-radius:8px;background:'+bg+';color:'+color+';font-weight:700;flex-shrink:0;">'+r.status.toUpperCase()+'</span>';
    html+='</div>';
  });
  // PM2 ping row
  const pm2ping=extraPings[0];
  const pm2color=pm2ping.online?'#3fb950':'#f85149';
  const pm2bg=pm2ping.online?'#0d2818':'#2d0e0e';
  html+='<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(26,35,50,.4);">';
  html+=pingDot(pm2ping.online?'online':'error',false);
  html+='<div style="flex:1;min-width:0;"><div style="font-size:.78rem;font-weight:600;color:var(--text);">PM2 Processes</div><div style="font-size:.6rem;color:var(--muted);font-family:var(--mono);">'+(pm2ping.count||0)+' processes</div></div>';
  html+='<span style="font-size:.58rem;font-family:var(--mono);padding:2px 7px;border-radius:8px;background:'+pm2bg+';color:'+pm2color+';font-weight:700;flex-shrink:0;">'+(pm2ping.online?'ONLINE':'ERROR')+'</span>';
  html+='</div>';
  // Backblaze ping row
  const b2ping=extraPings[1];
  const b2color=b2ping.online?'#3fb950':'#f85149';
  const b2bg=b2ping.online?'#0d2818':'#2d0e0e';
  html+='<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;">';
  html+=pingDot(b2ping.online?'online':'error',false);
  html+='<div style="flex:1;min-width:0;"><div style="font-size:.78rem;font-weight:600;color:var(--text);">Backblaze B2</div><div style="font-size:.6rem;color:var(--muted);font-family:var(--mono);">nes-vps-backup</div></div>';
  html+='<span style="font-size:.58rem;font-family:var(--mono);padding:2px 7px;border-radius:8px;background:'+b2bg+';color:'+b2color+';font-weight:700;flex-shrink:0;">'+(b2ping.online?'ONLINE':'DOWN')+'</span>';
  html+='</div>';
  html+='</div>';

  html+='<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;">';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--border);flex-shrink:0;">';
  html+='<div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;">API Credits</div>';
  html+='<div style="display:flex;gap:6px;">';
  html+='<button onclick="showAddApiModalQuick()" style="background:linear-gradient(135deg,#1a56db,#2563eb);border:none;border-radius:6px;padding:3px 10px;color:#fff;cursor:pointer;font-size:.65rem;font-family:var(--mono);font-weight:700;display:flex;align-items:center;gap:4px;"><i class="ti ti-plus"></i> Add</button>';
  html+='<button onclick="showView(\'apicredits\')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:3px 9px;color:var(--muted);cursor:pointer;font-size:.65rem;font-family:var(--mono);">Manage →</button>';
  html+='</div></div>';
  if(apis.length>0){
    html+='<div style="overflow-y:auto;flex:1;">';
    html+='<div style="display:grid;grid-template-columns:1fr 70px 70px 60px;gap:4px;padding:6px 14px;border-bottom:1px solid var(--border);font-family:var(--mono);font-size:.58rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;">';
    html+='<div>Service</div><div>Balance</div><div>Used/mo</div><div>Status</div></div>';
    apis.forEach(function(a){
      const color=a.status==='healthy'?'#3fb950':a.status==='low'?'#f85149':'#d29922';
      const bg=a.status==='healthy'?'#0d2818':a.status==='low'?'#2d0e0e':'#2d1f00';
      const bal=a.current_balance>0?'$'+parseFloat(a.current_balance).toFixed(2):'—';
      const usage=a.monthly_usage>0?'$'+parseFloat(a.monthly_usage).toFixed(2):'—';
      html+='<div style="display:grid;grid-template-columns:1fr 70px 70px 60px;gap:4px;padding:8px 14px;border-bottom:1px solid rgba(26,35,50,.4);align-items:center;">';
      html+='<div style="font-size:.72rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+a.service_name+'</div>';
      html+='<div style="font-size:.72rem;font-weight:700;color:'+color+';">'+bal+'</div>';
      html+='<div style="font-size:.68rem;color:var(--muted);font-family:var(--mono);">'+usage+'</div>';
      html+='<div><span style="font-size:.56rem;padding:2px 6px;border-radius:8px;font-family:var(--mono);font-weight:700;background:'+bg+';color:'+color+';">'+(a.status||'unknown').toUpperCase()+'</span></div>';
      html+='</div>';
    });
    html+='</div>';
  } else {
    html+='<div style="padding:20px;text-align:center;font-family:var(--mono);font-size:.72rem;color:var(--muted);">No APIs yet — <span onclick="showAddApiModalQuick()" style="color:var(--nes-blue);cursor:pointer;">add one</span></div>';
  }
  html+='</div>';
  html+='</div></div>';
  html+='<div style="border:1px solid #7f77dd40;border-radius:12px;padding:14px;margin-top:4px;">';
  html+=`<div style="font-family:var(--mono);font-size:.65rem;color:#7f77dd;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;">${t('adminStatusUi.backupStatus')}</div>`;
  html+='<div id="backupStatusCard" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;"><div style="font-size:.75rem;color:var(--muted);">Loading backup status...</div></div>';
  html+='<div style="font-family:var(--mono);font-size:.65rem;color:#7f77dd;letter-spacing:.1em;text-transform:uppercase;margin:12px 0 8px;">VPS HEALTH</div>';
  html+='<div id="vpsStatsCard" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;"><div style="font-size:.75rem;color:var(--muted);">Loading VPS stats...</div></div>';
  html+='</div>'; // close purple wrapper
  el.innerHTML=html;
  if(window.innerWidth<=700){
    const tog=document.querySelector('.status-panel-toggle');
    if(tog)tog.style.display='flex';
    const grid=document.getElementById('statusPanelGrid');
    if(grid)grid.style.gridTemplateColumns='1fr';
  }
}
