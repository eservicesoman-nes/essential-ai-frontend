// dashboard.js — extracted from index.html, NES Locale Phase 0
// 18 functions, zero logic changes

async function showIncidents(){
  const mc = document.getElementById('mainContent');
  mc.innerHTML = `
    <div class="page scrollable" id="incidentsContent" style="padding:14px 18px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <div>
          <div style="font-family:var(--mono);font-size:.8rem;color:#3fb950;letter-spacing:1px;text-transform:uppercase;">Incidents</div>
          <div style="font-size:.7rem;color:var(--muted);margin-top:2px;">${t('pageSubtitle.incidents')}</div>
        </div>
        <button onclick="showIncidents()" style="background:var(--card);border:1px solid var(--border);border-radius:6px;padding:5px 12px;color:var(--text);font-size:.72rem;cursor:pointer;display:flex;align-items:center;gap:5px;">
          <i class="ti ti-refresh"></i> Refresh
        </button>
      </div>
      <div id="incidentsSummary" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px;">
        <div style="text-align:center;padding:40px;color:var(--muted);font-family:var(--mono);font-size:.8rem;grid-column:1/-1;">${t('common.loading')}</div>
      </div>
      <div style="font-family:var(--mono);font-size:.72rem;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">${t('incidentsStat.recentIncidents')}</div>
      <div id="incidentsTimeline" style="background:var(--card);border:1px solid var(--border);border-radius:10px;overflow:hidden;">
        <div style="padding:20px;text-align:center;color:var(--muted);font-family:var(--mono);font-size:.8rem;">${t('common.loading')}</div>
      </div>
    </div>`;
  await loadIncidents();
}

async function loadIncidents(){
  try{
    const res = await fetch(`${API_URL}/api/admin/incidents`, { headers: { 'Authorization': 'Bearer ' + session.access_token } });
    const data = await res.json();
    if(!data.success){ document.getElementById('incidentsTimeline').innerHTML = `<div style="padding:20px;color:#f85149;font-family:var(--mono);">Error: ${data.error||'unknown'}</div>`; return; }

    const s = data.summary;
    const cards = [
      { label: 'Uptime (7 days)', labelKey: 'incidentsStat.uptime7Days', value: s.uptimePercentLast7Days + '%', color: '#3fb950' },
      { label: 'Incidents (7 days)', labelKey: 'incidentsStat.incidents7Days', value: s.incidentsLast7Days, color: '#409cff' },
      { label: 'Total Incidents', labelKey: 'incidentsStat.totalIncidents', value: s.totalIncidents, color: 'var(--text)' },
      { label: 'Auto-Resolved', labelKey: 'incidentsStat.autoResolved', value: s.autoResolved, color: '#3fb950' },
      { label: 'Escalated', labelKey: 'incidentsStat.escalated', value: s.escalated, color: s.escalated > 0 ? '#f85149' : 'var(--muted)' },
      { label: 'Avg Duration', labelKey: 'incidentsStat.avgDuration', value: s.avgDurationSeconds + 's', color: 'var(--text)' }
    ];
    document.getElementById('incidentsSummary').innerHTML = cards.map(c => `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:1.5rem;font-weight:700;color:${c.color};font-family:var(--mono);">${c.value}</div>
        <div style="font-size:.68rem;color:var(--muted);margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">${c.labelKey?t(c.labelKey,c.label):c.label}</div>
      </div>`).join('');

    const rows = data.incidents || [];
    if(!rows.length){
      document.getElementById('incidentsTimeline').innerHTML = `<div style="padding:30px;text-align:center;color:var(--muted);font-family:var(--mono);font-size:.8rem;">No incidents logged - system healthy</div>`;
      return;
    }
    document.getElementById('incidentsTimeline').innerHTML = rows.map(i => {
      const isAuto = i.resolution === 'auto-recovered';
      const dot = isAuto ? '#3fb950' : '#f85149';
      const started = new Date(i.started_at).toLocaleString();
      return `<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);">
        <div style="width:8px;height:8px;border-radius:50%;background:${dot};flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.78rem;color:var(--text);">${i.service} - ${i.resolution}</div>
          <div style="font-size:.68rem;color:var(--muted);font-family:var(--mono);">${started} - duration ${i.duration_seconds||0}s</div>
        </div>
      </div>`;
    }).join('');
  }catch(e){
    document.getElementById('incidentsTimeline').innerHTML = `<div style="padding:20px;color:#f85149;font-family:var(--mono);">Error: ${e.message}</div>`;
  }
}

async function showSysLogs(){
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="page scrollable" id="sysLogsContent" style="padding:14px 18px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <div>
          <div style="font-family:var(--mono);font-size:.8rem;color:#f85149;letter-spacing:1px;text-transform:uppercase;">System Logs</div>
          <div style="font-size:.7rem;color:var(--muted);margin-top:2px;">${t('systemLogsUi.subtitle')}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <select id="logLinesSelect" onchange="refreshSysLogs()" style="background:var(--card);border:1px solid var(--border);border-radius:6px;padding:5px 8px;color:var(--text);font-size:.72rem;cursor:pointer;">
            <option value="30">Last 30 lines</option>
            <option value="50" selected>${t('systemLogsUi.last50Lines')}</option>
            <option value="100">Last 100 lines</option>
            <option value="200">Last 200 lines</option>
          </select>
          <button onclick="refreshSysLogs()" style="background:var(--card);border:1px solid var(--border);border-radius:6px;padding:5px 12px;color:var(--text);font-size:.72rem;cursor:pointer;display:flex;align-items:center;gap:5px;">
            <i class="ti ti-refresh"></i> Refresh
          </button>
          <div id="logsLastUpdated" style="font-size:.65rem;color:var(--muted);font-family:var(--mono);"></div>
        </div>
      </div>
      <div id="logTabsRow" style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;">
        <button class="log-tab-btn active" onclick="switchLogTab('nes_ai_errors',this)" style="padding:5px 12px;border-radius:6px;font-size:.72rem;font-weight:600;cursor:pointer;border:1px solid rgba(248,81,73,.3);background:rgba(248,81,73,.1);color:#f85149;">${t('systemLogsUi.nesAiErrors')}</button>
        <button class="log-tab-btn" onclick="switchLogTab('nes_backend_errors',this)" style="padding:5px 12px;border-radius:6px;font-size:.72rem;font-weight:600;cursor:pointer;border:1px solid var(--border);background:var(--card);color:var(--muted);">${t('systemLogsUi.backendErrors')}</button>
        <button class="log-tab-btn" onclick="switchLogTab('nes_ai_out',this)" style="padding:5px 12px;border-radius:6px;font-size:.72rem;font-weight:600;cursor:pointer;border:1px solid var(--border);background:var(--card);color:var(--muted);">${t('systemLogsUi.nesAiOutput')}</button>
        <button class="log-tab-btn" onclick="switchLogTab('nes_backend_out',this)" style="padding:5px 12px;border-radius:6px;font-size:.72rem;font-weight:600;cursor:pointer;border:1px solid var(--border);background:var(--card);color:var(--muted);">${t('systemLogsUi.backendOutput')}</button>
      </div>
      <div id="logDisplay" style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;font-family:var(--mono);font-size:.7rem;line-height:1.7;overflow-x:auto;min-height:400px;">
        <div style="color:var(--muted);">${t('loading.logs')}</div>
      </div>
    </div>`;

  await refreshSysLogs();
  // Auto-refresh every 60 seconds
  window._sysLogsInterval = setInterval(refreshSysLogs, 60000);
}

function switchLogTab(tab, btn){
  _currentLogTab = tab;
  document.querySelectorAll('.log-tab-btn').forEach(b=>{
    b.style.background='var(--card)';
    b.style.color='var(--muted)';
    b.style.borderColor='var(--border)';
  });
  btn.style.background='rgba(248,81,73,.1)';
  btn.style.color='#f85149';
  btn.style.borderColor='rgba(248,81,73,.3)';
  renderLogLines(_allLogs[tab] || []);
}

function renderLogLines(lines){
  const el = document.getElementById('logDisplay');
  if(!el) return;
  if(!lines || lines.length===0){
    el.innerHTML='<div style="color:var(--muted);">No log entries found.</div>';
    return;
  }
  el.innerHTML = lines.map(line=>{
    let color = 'var(--text)';
    if(/error|Error|ERROR|fatal|Fatal|FATAL|exception|Exception/i.test(line)) color='#f85149';
    else if(/warn|Warn|WARN/i.test(line)) color='#d29922';
    else if(/✅|success|Success|online|ready|started/i.test(line)) color='#3fb950';
    else if(/Gemini|Claude|DeepSeek|Anthropic/i.test(line)) color='#409cff';
    return '<div style="color:'+color+';padding:1px 0;border-bottom:1px solid rgba(255,255,255,0.03);">'+
      line.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>';
  }).join('');
  // Scroll to bottom
  el.scrollTop = el.scrollHeight;
}

async function refreshSysLogs(){
  const lines = document.getElementById('logLinesSelect')?.value || 50;
  try {
    const res = await fetch(API_URL+'/api/admin/logs?lines='+lines, {
      headers:{ 'Authorization': 'Bearer '+localStorage.getItem('nesai_token') }
    });
    const data = await res.json();
    if(data.success){
      _allLogs = data.logs;
      renderLogLines(_allLogs[_currentLogTab] || []);
      const ts = document.getElementById('logsLastUpdated');
      if(ts) ts.textContent = 'Updated: '+new Date(data.timestamp).toLocaleTimeString();
    } else {
      document.getElementById('logDisplay').innerHTML='<div style="color:#f85149;">'+( data.error||'Failed to load logs')+'</div>';
    }
  } catch(e){
    const el=document.getElementById('logDisplay');
    if(el) el.innerHTML='<div style="color:#f85149;">Connection error: '+e.message+'</div>';
  }
}

async function showPartnerDashboard(){
  const mc=document.getElementById('mainContent');
  mc.style.overflow='hidden';
  const now=new Date();
  const dayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const monNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr=dayNames[now.getDay()]+', '+now.getDate()+' '+monNames[now.getMonth()]+' '+now.getFullYear();

  mc.innerHTML=`
  <div style="display:flex;height:100%;overflow:hidden;">
    <div style="flex:1;overflow-y:auto;padding:14px 18px;" id="partnerMainPanel">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div>
          <div style="font-family:var(--mono);font-size:.8rem;color:#7f77dd;font-weight:800;">PARTNER DASHBOARD</div>
          <div style="font-size:.7rem;color:var(--muted);">Live · ${dateStr}</div>
        </div>
      </div>
      <div id="partnerStatusBar" style="background:rgba(63,185,80,.08);border:1px solid rgba(63,185,80,.2);border-radius:8px;padding:8px 14px;margin-bottom:12px;font-size:.72rem;color:#3fb950;display:flex;align-items:center;gap:6px;">
        <i class="ti ti-circle-check"></i> Platform running smoothly — all systems normal
      </div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <i class="ti ti-sun" style="font-size:1.6rem;color:var(--amber);"></i>
          <div>
            <div style="font-family:var(--mono);font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;"><i class="ti ti-map-pin" style="font-size:10px"></i> WEATHER — MUSCAT</div>
            <div id="partnerWeatherDesc" style="font-size:.78rem;color:var(--text);">${t('common.loading')}</div>
          </div>
        </div>
        <div style="text-align:end;">
          <div id="partnerWeatherTemp" style="font-size:1.4rem;font-weight:700;color:var(--nes-blue);">—</div>
          <div id="partnerWeatherFeel" style="font-size:.65rem;color:var(--muted);"></div>
        </div>
      </div>
      <div style="font-family:var(--mono);font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;display:flex;align-items:center;gap:4px;"><i class="ti ti-chart-bar"></i> ${t('ceoDashboardSection.performance')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:10px 14px;">
          <div style="font-size:.62rem;color:var(--muted);margin-bottom:3px;display:flex;align-items:center;gap:4px;"><i class="ti ti-building"></i> Clients installed</div>
          <div id="pClientsCount" style="font-size:1.05rem;font-weight:700;color:var(--nes-blue);">0</div>
          <div style="display:flex;justify-content:space-between;font-size:.6rem;color:var(--muted);margin-top:3px;"><span id="pClientsTotal">Total: 0</span><span id="pClientsNew">+0 this month</span></div>
          <div style="height:3px;background:var(--border);border-radius:2px;margin-top:6px;"><div id="pClientsBar" style="height:100%;width:0%;background:var(--nes-blue);border-radius:2px;"></div></div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:10px 14px;">
          <div style="font-size:.62rem;color:var(--muted);margin-bottom:3px;display:flex;align-items:center;gap:4px;"><i class="ti ti-coin"></i> Installation earned</div>
          <div id="pInstallEarned" style="font-size:1.05rem;font-weight:700;color:#3fb950;">OMR 0.000</div>
          <div style="display:flex;justify-content:space-between;font-size:.6rem;color:var(--muted);margin-top:3px;"><span>OMR 49.500 each</span><span id="pInstallCount">0 installs</span></div>
          <div style="height:3px;background:var(--border);border-radius:2px;margin-top:6px;"><div style="height:100%;width:0%;background:#3fb950;border-radius:2px;"></div></div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:10px 14px;">
          <div style="font-size:.62rem;color:var(--muted);margin-bottom:3px;display:flex;align-items:center;gap:4px;"><i class="ti ti-repeat"></i> Recurring this month</div>
          <div id="pRecurring" style="font-size:1.05rem;font-weight:700;color:#3fb950;">OMR 0.000</div>
          <div style="display:flex;justify-content:space-between;font-size:.6rem;color:var(--muted);margin-top:3px;"><span>25% of client MRR</span><span id="pActiveClients">0 active</span></div>
          <div style="height:3px;background:var(--border);border-radius:2px;margin-top:6px;"><div id="pRecurringBar" style="height:100%;width:0%;background:#3fb950;border-radius:2px;"></div></div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:10px 14px;">
          <div style="font-size:.62rem;color:var(--muted);margin-bottom:3px;display:flex;align-items:center;gap:4px;"><i class="ti ti-wallet"></i> Total earned</div>
          <div id="pTotalEarned" style="font-size:1.05rem;font-weight:700;color:var(--text);">OMR 0.000</div>
          <div style="display:flex;justify-content:space-between;font-size:.6rem;color:var(--muted);margin-top:3px;"><span>Cumulative</span><span>Paid 10th monthly</span></div>
          <div style="height:3px;background:var(--border);border-radius:2px;margin-top:6px;"></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 16px;">
          <div style="font-family:var(--mono);font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;display:flex;align-items:center;gap:4px;"><i class="ti ti-heartbeat"></i> ${t('ceoDashboardSection.platformHealth')}</div>
          <div style="display:flex;flex-direction:column;gap:8px;" id="partnerHealthItems">
            <div style="display:flex;justify-content:space-between;font-size:.72rem;"><span style="color:var(--muted);">Backend</span><span style="color:#3fb950;">● Online</span></div>
            <div style="display:flex;justify-content:space-between;font-size:.72rem;"><span style="color:var(--muted);">Database</span><span style="color:#3fb950;">● Online</span></div>
            <div style="display:flex;justify-content:space-between;font-size:.72rem;"><span style="color:var(--muted);">Automations</span><span style="color:#3fb950;">● Online</span></div>
            <div style="display:flex;justify-content:space-between;font-size:.72rem;"><span style="color:var(--muted);">Platform uptime</span><span style="color:var(--text);font-weight:600;">99.9%</span></div>
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 16px;">
          <div style="font-family:var(--mono);font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;display:flex;align-items:center;gap:4px;"><i class="ti ti-bolt"></i> QUICK ACTIONS</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <button onclick="window.open('https://nes-ai.com/nes-assessment.html','_blank')" style="text-align:start;font-size:.7rem;padding:6px 10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:6px;background:none;border:1px solid var(--border);color:var(--text);"><i class="ti ti-clipboard-plus"></i> New assessment</button>
            <button onclick="showView('clientmanager')" style="text-align:start;font-size:.7rem;padding:6px 10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:6px;background:none;border:1px solid var(--border);color:var(--text);"><i class="ti ti-key"></i> Client credentials</button>
            <button onclick="showView('inbox')" style="text-align:start;font-size:.7rem;padding:6px 10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:6px;background:none;border:1px solid var(--border);color:var(--text);"><i class="ti ti-mail"></i> Inbox</button>
            <button onclick="showView('command')" style="text-align:start;font-size:.7rem;padding:6px 10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:6px;background:none;border:1px solid var(--border);color:var(--text);"><i class="ti ti-message-circle"></i> Command centre</button>
          </div>
        </div>
      </div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 16px;">
        <div style="font-family:var(--mono);font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;display:flex;align-items:center;gap:4px;"><i class="ti ti-building"></i> MY CLIENTS</div>
        <div id="partnerClientList" style="font-size:.72rem;color:var(--muted);text-align:center;padding:12px 0;">${t('common.loading')}</div>
      </div>
    </div>
    <div style="width:320px;border-inline-start:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;" id="partnerFeedPanel">
      <div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
        <div style="font-family:var(--mono);font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;display:flex;align-items:center;gap:4px;"><i class="ti ti-news"></i> ${t('ceoDashboardSection.marketIntelligence')}</div>
        <span id="partnerFeedBadge" style="font-size:.6rem;padding:1px 6px;border-radius:10px;background:rgba(64,156,255,.1);color:var(--nes-blue);display:none;">0 NEW</span>
      </div>
      <div style="flex:1;overflow-y:auto;padding:10px 14px;" id="partnerFeedItems">
        <div style="text-align:center;color:var(--muted);font-size:.72rem;padding:20px;">${t('loading.feed')}</div>
      </div>
    </div>
  </div>`;

  // Load weather
  try{
    const wr=await fetch('https://api.open-meteo.com/v1/forecast?latitude=23.6&longitude=58.59&current=temperature_2m,apparent_temperature,weathercode,relativehumidity_2m&timezone=Asia/Muscat');
    const wd=await wr.json();
    const c=wd.current;
    const wDesc=c.weathercode<=1?'Sunny':c.weathercode<=3?'Partly cloudy':c.weathercode<=48?'Foggy':c.weathercode<=67?'Rainy':'Cloudy';
    document.getElementById('partnerWeatherDesc').textContent=wDesc+' · Humidity '+c.relativehumidity_2m+'%';
    document.getElementById('partnerWeatherTemp').textContent=Math.round(c.temperature_2m)+'°C';
    document.getElementById('partnerWeatherFeel').textContent='Feels like '+Math.round(c.apparent_temperature)+'°C';
  }catch(e){}

  // Load partner metrics from Supabase
  try{
    const planPrice={presence:59,operations:109,workforce:169};
    const {data:allClients} = await sb.from('clients').select('id,name,plan,status,created_at,installed_by').eq('installed_by',session.user.email);
    const clients=allClients||[];
    const activeClients=clients.filter(c=>c.status==='active');
    const now2=new Date();
    const thisMonth=now2.getMonth();
    const thisYear=now2.getFullYear();
    const newThisMonth=clients.filter(c=>{const d=new Date(c.created_at);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear;}).length;
    const installEarned=(clients.length*49.5);
    const recurring=activeClients.reduce((s,c)=>s+((planPrice[c.plan]||59)*0.25),0);
    const total=installEarned+recurring;
    document.getElementById('pClientsCount').textContent=activeClients.length;
    document.getElementById('pClientsTotal').textContent='Total: '+clients.length;
    document.getElementById('pClientsNew').textContent='+'+newThisMonth+' this month';
    document.getElementById('pInstallEarned').textContent='OMR '+installEarned.toFixed(3);
    document.getElementById('pInstallCount').textContent=clients.length+' installs';
    document.getElementById('pRecurring').textContent='OMR '+recurring.toFixed(3);
    document.getElementById('pActiveClients').textContent=activeClients.length+' active';
    document.getElementById('pTotalEarned').textContent='OMR '+total.toFixed(3);
    if(clients.length>0)document.getElementById('pClientsBar').style.width=Math.min(100,activeClients.length*10)+'%';

    // Client list
    const listEl=document.getElementById('partnerClientList');
    if(clients.length===0){listEl.innerHTML='<i class="ti ti-inbox" style="font-size:1.4rem;display:block;margin-bottom:6px;opacity:.3;"></i>No clients installed yet';
    }else{
      listEl.innerHTML=clients.map(c=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);"><div><div style="font-size:.75rem;color:var(--text);font-weight:600;">${c.name||'—'}</div><div style="font-size:.65rem;color:var(--muted);text-transform:capitalize;">${c.plan||'—'}</div></div><span style="font-size:.6rem;padding:2px 8px;border-radius:10px;background:${c.status==='active'?'rgba(63,185,80,.1)':'rgba(248,81,73,.1)'};color:${c.status==='active'?'#3fb950':'#f85149'};">${c.status}</span></div>`).join('');
    }
  }catch(e){console.error('Partner metrics error:',e);}

  // Load intel feed (same as CEO)
  try{
    loadPartnerFeed();
  }catch(e){}
}

async function loadPartnerFeed(){
  try{
    const {data:feed}=await sb.from('ceo_feed').select('title,summary,source,tag,created_at').eq('archived',false).order('created_at',{ascending:false}).limit(20);
    const feedEl=document.getElementById('partnerFeedItems');
    if(!feedEl)return;
    const badge=document.getElementById('partnerFeedBadge');
    const today=new Date().toDateString();
    const todayItems=(feed||[]).filter(f=>new Date(f.created_at).toDateString()===today);
    if(badge&&todayItems.length>0){badge.textContent=todayItems.length+' NEW';badge.style.display='inline';}
    if(!feed||feed.length===0){feedEl.innerHTML=`<div style="text-align:center;color:var(--muted);font-size:.72rem;padding:20px;">${t('empty.noFeedItems')}</div>`;return;}
    let html='<div style="font-size:.65rem;color:var(--muted);margin-bottom:8px;">Today</div>';
    html+=feed.map(f=>{
      const isAlert=f.tag==='ALERT';
      return`<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="font-size:.58rem;padding:1px 6px;border-radius:10px;background:${isAlert?'rgba(210,153,34,.15)':'rgba(64,156,255,.1)'};color:${isAlert?'#d29922':'var(--nes-blue)'};">${isAlert?'⚡ ALERT':'INTEL'}</span>
          <span style="font-size:.6rem;color:var(--muted);">${new Date(f.created_at).toLocaleDateString(getDateLocale('en-GB'),{day:'numeric',month:'short'})}</span>
        </div>
        <div style="font-size:.72rem;color:var(--text);font-weight:600;margin-bottom:3px;">${f.title||''}</div>
        <div style="font-size:.65rem;color:var(--muted);">${(f.summary||'').substring(0,80)}${(f.summary||'').length>80?'...':''}</div>
      </div>`;
    }).join('');
    feedEl.innerHTML=html;
  }catch(e){}
}

async function showCEODashboard(){
  const mc=document.getElementById('mainContent');
  mc.style.overflow='hidden';
  if(window._ceoRendered&&document.getElementById('ceoDashContent')&&document.getElementById('ceoFeedItems')){
    loadCeoFeed();
    return;
  }
  window._ceoRendered=false;
  mc.innerHTML=`
    <div style="padding-block:11px;padding-inline-end:var(--header-clearance);padding-inline-start:60px;border-bottom:1px solid var(--border);flex-shrink:0;">
      <div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;">${t('sectionTitle.ceoDashboard')}</div>
      <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">Live · ${new Date().toLocaleDateString(getDateLocale('en-GB'),{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
    </div>
    <div class="page" id="ceoDashContent" style="opacity:0;transition:opacity .3s;display:grid;grid-template-columns:1fr 6px 380px;min-height:0;">
      <div style="text-align:center;padding:40px;color:var(--muted);font-family:var(--mono);font-size:.8rem;">${t('loading.dashboard')}</div>
    </div>`;
  let leads=[],leadsToday=0,totalLeads=0;
  try{
    const today=new Date().toISOString().split('T')[0];
    let leadsQ2=sb.from('leads').select('*').order('created_at',{ascending:false}).limit(100);
    if(userClientId && userRole !== 'nesadmin')leadsQ2=leadsQ2.eq('client_id',userClientId);
    const{data:allLeads}=await leadsQ2;
    leads=allLeads||[];totalLeads=leads.length;
    leadsToday=leads.filter(l=>l.created_at?.startsWith(today)).length;
  }catch(e){}
  const countries={};
  leads.forEach(l=>{
    const c=l.country||detectCountry(l.email||'Other');
    countries[c]=(countries[c]||0)+1;
  });
  const hotLeads=leads.filter(l=>['Government','Ports & Customs','Aviation & Airports'].includes(l.industry)).length;
  const fortyEightHrsAgo=new Date(Date.now()-48*60*60*1000).toISOString();
  const uncontacted=leads.filter(l=>l.created_at<fortyEightHrsAgo&&l.status!=='contacted').length;
  const colors=['var(--nes-blue)','#7f77dd','#3fb950','#d29922','#484f58'];
  const geoRows=Object.entries(countries).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([c,n],i)=>`
    <div class="geo-row"><div class="geo-name">${c}</div><div class="geo-track"><div class="geo-fill" style="width:${Math.round(n/totalLeads*100)||0}%;background:${colors[i%5]};box-shadow:0 0 4px ${colors[i%5]}"></div></div><div class="geo-n">${n}</div></div>`).join('');
  const stageCounts={new:0,contacted:0,qualified:0,closed:0};
  leads.forEach(l=>{
    const s=(l.status||'new').toLowerCase();
    if(stageCounts[s]!==undefined)stageCounts[s]++;
    else if(s==='won'||s==='lost')stageCounts.closed++;
    else stageCounts.new++;
  });
  const stagePcts={
    new:Math.round(stageCounts.new/totalLeads*100)||0,
    contacted:Math.round(stageCounts.contacted/totalLeads*100)||0,
    qualified:Math.round(stageCounts.qualified/totalLeads*100)||0,
    closed:Math.round(stageCounts.closed/totalLeads*100)||0
  };
  if(window._weatherCache){setTimeout(()=>{const w=window._weatherCache;const wi=document.getElementById('weatherIcon');const wd=document.getElementById('weatherDesc');const wt=document.getElementById('weatherTemp');const wf=document.getElementById('weatherFeels');if(wi){wi.className='ti '+w.icon;wi.style.cssText='font-size:22px;color:var(--nes-blue);filter:drop-shadow(0 0 4px var(--nes-blue))';}if(wd)wd.textContent=w.desc;if(wt)wt.textContent=w.temp;if(wf)wf.textContent=w.feels;const wl=document.getElementById('weatherLocLabel');if(wl)wl.textContent=(window.userRegion||'Muscat').toUpperCase();},50);}else{setTimeout(()=>{fetch('https://wttr.in/'+encodeURIComponent(window.userRegion||'Muscat')+'?format=j1').then(r=>r.json()).then(w=>{const c=w.current_condition[0];const desc=c.weatherDesc[0].value;const temp=c.temp_C;const feels=c.FeelsLikeC;const humidity=c.humidity;const icons={'Sunny':'ti-sun','Clear':'ti-moon-stars','Partly cloudy':'ti-cloud-sun','Cloudy':'ti-cloud','Overcast':'ti-cloud','Mist':'ti-mist','Fog':'ti-mist','Rain':'ti-cloud-rain','Drizzle':'ti-cloud-drizzle','Thunderstorm':'ti-storm','Snow':'ti-snowflake','Blizzard':'ti-snowflake'};const iconKey=Object.keys(icons).find(k=>desc.includes(k))||'Sunny';const icon=icons[iconKey]||'ti-sun';const descTxt=desc+' · Humidity '+humidity+'%';const tempTxt=temp+'°C';const feelsTxt='Feels like '+feels+'°C';window._weatherCache={icon,desc:descTxt,temp:tempTxt,feels:feelsTxt};const wi=document.getElementById('weatherIcon');const wd=document.getElementById('weatherDesc');const wt=document.getElementById('weatherTemp');const wf=document.getElementById('weatherFeels');if(wi){wi.className='ti '+icon;wi.style.cssText='font-size:22px;color:var(--nes-blue);filter:drop-shadow(0 0 4px var(--nes-blue))';}if(wd)wd.textContent=descTxt;if(wt)wt.textContent=tempTxt;if(wf)wf.textContent=feelsTxt;const wl=document.getElementById('weatherLocLabel');if(wl)wl.textContent=(window.userRegion||'Muscat').toUpperCase();}).catch(()=>{const wd=document.getElementById('weatherDesc');if(wd)wd.textContent='Weather unavailable';});},100);}

  document.getElementById('ceoDashContent').innerHTML=`
    <div class="ceo-panel-toggle" style="display:none!important;padding:6px 12px;border-bottom:1px solid var(--border);gap:6px;flex-shrink:0;">
      <button onclick="toggleCeoPanel('stats')" id="ceoToggleStats" style="flex:1;padding:7px;border:none;border-radius:7px;background:var(--nes-blue);color:#fff;font-size:.75rem;font-weight:600;cursor:pointer;"><i class="ti ti-chart-bar"></i> Stats</button>
      <button onclick="toggleCeoPanel('feed')" id="ceoToggleFeed" style="flex:1;padding:7px;border:none;border-radius:7px;background:var(--surface);color:var(--muted);font-size:.75rem;font-weight:600;cursor:pointer;border:1px solid var(--border);"><i class="ti ti-radar"></i> Feed</button>
    </div>
      <div style="overflow-y:auto;padding:14px 16px;border-inline-end:1px solid var(--border);">
        ${uncontacted>0
          ?`<div class="alert-bar alert-warn"><i class="ti ti-alert-triangle"></i> ${uncontacted} lead${uncontacted>1?'s':''} uncontacted 48h+ — follow up today</div>`
          :`<div class="alert-bar alert-good"><i class="ti ti-circle-check"></i> ${t('ceoDashboardSection.allSystemsOperational')}</div>`}
        <div id="weatherCard" style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:10px 13px;margin-bottom:10px;display:flex;align-items:center;gap:12px;">
          <i class="ti ti-cloud" style="font-size:22px;color:var(--nes-blue);filter:drop-shadow(0 0 4px var(--nes-blue))" id="weatherIcon"></i>
          <div style="flex:1">
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;display:flex;align-items:center;gap:4px;"><i class="ti ti-map-pin" style="font-size:10px"></i>WEATHER — <span id="weatherLocLabel">MUSCAT</span></div>
            <div id="weatherDesc" style="font-size:.85rem;font-weight:600;color:var(--text)">${t('common.loading')}</div>
          </div>
          <div style="text-align:end">
            <div id="weatherTemp" style="font-size:1.4rem;font-weight:700;color:var(--nes-blue)">—</div>
            <div id="weatherFeels" style="font-size:.65rem;color:var(--muted);font-family:var(--mono)">Feels like —</div>
          </div>
        </div>
        <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px;display:flex;align-items:center;gap:5px;"><i class="ti ti-chart-bar" style="font-size:12px;color:var(--nes-blue);filter:drop-shadow(0 0 3px var(--nes-blue))"></i>Performance</div>
        <div style="display:grid;grid-template-columns:1fr${userRole==='nesadmin'?' 1fr':''};gap:8px;margin-bottom:12px;">
          <div class="dash-card">
            <div class="dc-title" style="display:flex;align-items:center;gap:5px;"><i class="ti ti-chart-bar" style="font-size:10px;color:var(--nes-blue)"></i>Lead performance</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:28px;height:28px;border-radius:7px;background:#0c1f35;display:flex;align-items:center;justify-content:center;"><i class="ti ti-trending-up" style="font-size:13px;color:var(--nes-blue);"></i></div>
                <div><div style="font-size:.62rem;color:var(--muted);">${userRole==='nesadmin'?'High value leads':'Total leads'}</div><div style="font-size:1.05rem;font-weight:700;color:var(--nes-blue);">${userRole==='nesadmin'?hotLeads+' leads':totalLeads}</div><div style="height:3px;background:var(--border);border-radius:2px;margin-top:3px;width:110px;"><div style="height:100%;width:72%;background:var(--nes-blue);border-radius:2px;"></div></div></div>
              </div>
              <div style="font-size:.6rem;color:var(--muted);text-align:end;">${totalLeads} total<br>Gov · Ports · Aviation</div>
            </div>
            <div style="height:1px;background:var(--border);margin:6px 0;"></div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:28px;height:28px;border-radius:7px;background:#0d2818;display:flex;align-items:center;justify-content:center;"><i class="ti ti-users" style="font-size:13px;color:#3fb950;"></i></div>
                <div><div style="font-size:.62rem;color:var(--muted);">New today</div><div style="font-size:1.05rem;font-weight:700;color:#3fb950;">${leadsToday}</div><div style="height:3px;background:var(--border);border-radius:2px;margin-top:3px;width:110px;"><div style="height:100%;width:${Math.min(100,leadsToday*10)}%;background:#3fb950;border-radius:2px;"></div></div></div>
              </div>
              <div style="font-size:.6rem;color:var(--muted);text-align:end;">Total: ${totalLeads}<br>+${leadsToday} today</div>
            </div>
            <div style="height:1px;background:var(--border);margin:6px 0;"></div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:28px;height:28px;border-radius:7px;background:${uncontacted>0?'#2d1800':'#0d2818'};display:flex;align-items:center;justify-content:center;"><i class="ti ti-bell" style="font-size:13px;color:${uncontacted>0?'#f85149':'#3fb950'};"></i></div>
                <div><div style="font-size:.62rem;color:var(--muted);">Needs follow-up</div><div style="font-size:1.05rem;font-weight:700;color:${uncontacted>0?'#f85149':'#3fb950'};">${uncontacted}</div><div style="height:3px;background:var(--border);border-radius:2px;margin-top:3px;width:110px;"><div style="height:100%;width:${Math.min(100,uncontacted*2)}%;background:${uncontacted>0?'#f85149':'#3fb950'};border-radius:2px;"></div></div></div>
              </div>
              <div style="font-size:.6rem;color:${uncontacted>0?'#f85149':'var(--muted)'};text-align:end;">${uncontacted>0?'Action<br>required':'All<br>followed up'}</div>
            </div>
          </div>
          ${userRole==='nesadmin'?`
          <div class="dash-card">
            <div class="dc-title" style="display:flex;align-items:center;gap:5px;"><i class="ti ti-activity" style="font-size:10px;color:#3fb950"></i>Platform health</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:28px;height:28px;border-radius:7px;background:#0d2818;display:flex;align-items:center;justify-content:center;"><i class="ti ti-shield-check" style="font-size:13px;color:#3fb950;"></i></div>
                <div><div style="font-size:.62rem;color:var(--muted);">API health</div><div style="font-size:1.05rem;font-weight:700;color:#3fb950;" id="apiHealthVal">—</div><div style="height:3px;background:var(--border);border-radius:2px;margin-top:3px;width:110px;"><div id="apiHealthBar" style="height:100%;width:0%;background:#3fb950;border-radius:2px;"></div></div></div>
              </div>
              <div style="font-size:.6rem;color:var(--muted);text-align:end;" id="apiHealthDelta">${t('common.loading')}</div>
            </div>
            <div style="height:1px;background:var(--border);margin:6px 0;"></div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:28px;height:28px;border-radius:7px;background:#1a1040;display:flex;align-items:center;justify-content:center;"><i class="ti ti-credit-card" style="font-size:13px;color:#7f77dd;"></i></div>
                <div><div style="font-size:.62rem;color:var(--muted);">API credits</div><div style="font-size:1.05rem;font-weight:700;color:#7f77dd;" id="creditVal">—</div><div style="height:3px;background:var(--border);border-radius:2px;margin-top:3px;width:110px;"><div id="creditBar" style="height:100%;width:0%;background:#7f77dd;border-radius:2px;"></div></div></div>
              </div>
              <div style="font-size:.6rem;color:var(--muted);text-align:end;" id="creditDelta">${t('common.loading')}</div>
            </div>
            <div style="height:1px;background:var(--border);margin:6px 0;"></div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:28px;height:28px;border-radius:7px;background:#0c1827;display:flex;align-items:center;justify-content:center;"><i class="ti ti-clock" style="font-size:13px;color:#409cff;"></i></div>
                <div><div style="font-size:.62rem;color:var(--muted);">Platform uptime</div><div style="font-size:1.05rem;font-weight:700;color:#409cff;">99.9%</div><div style="height:3px;background:var(--border);border-radius:2px;margin-top:3px;width:110px;"><div style="height:100%;width:99%;background:#409cff;border-radius:2px;"></div></div></div>
              </div>
              <div style="font-size:.6rem;color:var(--muted);text-align:end;">30 days<br>running</div>
            </div>
          </div>
        </div>`:''}
        ${(userRole==='ceo'||userRole==='nesadmin'||userRole==='nes_partner')?`
        <div class="row2">
          <div class="dash-card">
            <div class="dc-title">Lead pipeline</div>
            <div class="pipe-track">
              <div class="pipe-seg" style="width:${stagePcts.new}%;background:var(--nes-blue);border-radius:3px 0 0 3px;box-shadow:0 0 4px var(--nes-blue)"></div>
              <div class="pipe-seg" style="width:${stagePcts.contacted}%;background:#7f77dd;box-shadow:0 0 4px #7f77dd"></div>
              <div class="pipe-seg" style="width:${stagePcts.qualified}%;background:#3fb950;box-shadow:0 0 4px #3fb950"></div>
              <div class="pipe-seg" style="width:${stagePcts.closed}%;background:#484f58;border-radius:0 3px 3px 0"></div>
            </div>
            <div class="pipe-legend">
              <div class="pipe-item"><div class="pipe-dot" style="background:var(--nes-blue);box-shadow:0 0 3px var(--nes-blue)"></div>New <span class="pipe-num">${stageCounts.new}</span></div>
              <div class="pipe-item"><div class="pipe-dot" style="background:#7f77dd;box-shadow:0 0 3px #7f77dd"></div>Contacted <span class="pipe-num">${stageCounts.contacted}</span></div>
              <div class="pipe-item"><div class="pipe-dot" style="background:#3fb950;box-shadow:0 0 3px #3fb950"></div>Qualified <span class="pipe-num">${stageCounts.qualified}</span></div>
              <div class="pipe-item"><div class="pipe-dot" style="background:#484f58"></div>Closed <span class="pipe-num">${stageCounts.closed}</span></div>
            </div>
          </div>
          <div class="dash-card">
            <div class="dc-title">Lead geography</div>
            ${geoRows||`<div style="color:var(--muted);font-family:var(--mono);font-size:.75rem;">${t('empty.noLeadsDashboard')}</div>`}
          </div>
        </div>`:''}
        <div class="dash-card" style="margin-bottom:12px;">
          <div class="dc-title">Usage this month</div>
          <div id="usageSummaryContent" style="display:flex;flex-direction:column;gap:8px;">
            <div style="color:var(--muted);font-family:var(--mono);font-size:.7rem;">${t('loading.usage')}</div>
          </div>
        </div>
        <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px;margin-top:4px;display:flex;align-items:center;gap:5px;"><i class="ti ti-shield-check" style="font-size:12px;color:#f85149;"></i>Risk & action</div>
        <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:8px;padding:8px 11px;background:var(--card);border:1px solid var(--border);border-radius:7px;">
            <div style="width:7px;height:7px;border-radius:50%;background:${uncontacted>0?'#d29922':'#3fb950'};flex-shrink:0;"></div>
            <div style="font-size:.75rem;flex:1;">${uncontacted>0?uncontacted+' leads uncontacted — follow up today':'All leads contacted'}</div>
            <div style="font-size:.58rem;font-family:var(--mono);padding:2px 7px;border-radius:7px;background:${uncontacted>0?'#2d1f00':'#0d2818'};color:${uncontacted>0?'#d29922':'#3fb950'};">${uncontacted>0?'ACTION':'OK'}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;padding:8px 11px;background:var(--card);border:1px solid var(--border);border-radius:7px;">
            <div style="width:7px;height:7px;border-radius:50%;background:#3fb950;flex-shrink:0;"></div>
            <div style="font-size:.75rem;flex:1;">Platform running 24/7 — all systems normal</div>
            <div style="font-size:.58rem;font-family:var(--mono);padding:2px 7px;border-radius:7px;background:#0d2818;color:#3fb950;">OK</div>
          </div>
          ${(function(){
            const paidMap = window.clientApexPaidUntil || {};
            const mods = window.clientModules || {};
            const labels = {apex_connect:'Apex Connect',apex_outreach:'Apex Outreach',apex_advisory:'Apex Advisory'};
            const today = new Date(); today.setHours(0,0,0,0);
            let rows = '';
            Object.keys(labels).forEach(k=>{
              if(!mods[k]) return;
              const dateStr = paidMap[k];
              let status='ok', label='', badge='';
              if(!dateStr){ status='warn'; label=labels[k]+' — renewal date not set'; badge='SET DATE'; }
              else{
                const paidUntil = new Date(dateStr); paidUntil.setHours(0,0,0,0);
                const diffDays = Math.round((paidUntil - today) / (1000*60*60*24));
                if(diffDays < 0){ status='overdue'; label=labels[k]+' — renewal overdue'; badge='OVERDUE'; }
                else if(diffDays <= 7){ status='warn'; label=labels[k]+' — renews in '+diffDays+'d'; badge='DUE SOON'; }
                else { return; }
              }
              const color = status==='overdue' ? '#f85149' : '#d29922';
              const bg = status==='overdue' ? '#2d1300' : '#2d1f00';
              rows += `<div style="display:flex;align-items:center;gap:8px;padding:8px 11px;background:var(--card);border:1px solid var(--border);border-radius:7px;">
            <div style="width:7px;height:7px;border-radius:50%;background:${color};flex-shrink:0;"></div>
            <div style="font-size:.75rem;flex:1;">${label}</div>
            <div style="font-size:.58rem;font-family:var(--mono);padding:2px 7px;border-radius:7px;background:${bg};color:${color};">${badge}</div>
          </div>`;
            });
            return rows;
          })()}
        </div>
        ${userRole==='nesadmin'?`
        <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px;margin-top:14px;">PARTNER OVERVIEW</div>
        <div id="partnerMrrStrip" style="background:var(--card);border:1px solid #7f77dd33;border-radius:8px;padding:10px 12px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-size:.7rem;margin-bottom:4px;"><span style="color:var(--muted);">Direct MRR</span><span id="ph_direct" style="color:#409cff;font-weight:600;">—</span></div>
          <div style="display:flex;justify-content:space-between;font-size:.7rem;margin-bottom:4px;"><span style="color:var(--muted);">Partner MRR</span><span id="ph_partner" style="color:#3fb950;font-weight:600;">—</span></div>
          <div style="display:flex;justify-content:space-between;font-size:.7rem;margin-bottom:4px;"><span style="color:var(--muted);">Commission pending</span><span id="ph_commission" style="color:#d29922;font-weight:600;">—</span></div>
          <div style="height:1px;background:var(--border);margin:6px 0;"></div>
          <div style="display:flex;justify-content:space-between;font-size:.78rem;"><span style="color:var(--muted);">${t('plan.totalMrr')}</span><span id="ph_total" style="color:#e6edf3;font-weight:700;">—</span></div>
        </div>
        <div id="partnerRows" style="margin-bottom:10px;"></div>
        <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px;margin-top:14px;">FOUNDER EXPIRY ALERTS</div>
        <div id="founderAlerts" style="margin-bottom:10px;"><div style="font-size:.7rem;color:var(--muted);">${t('common.loading')}</div></div>
        `:''}\n      </div>
      </div>
    </div>
      <div id="ceoResizer" title="Drag to resize"></div>
      <div style="display:flex;flex-direction:column;overflow:hidden;">
        <div style="padding:9px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
          <div style="font-family:var(--mono);font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;display:flex;align-items:center;gap:5px;"><i class="ti ti-radar" style="font-size:11px;color:var(--nes-blue);"></i>Market Intelligence</div>
          <div id="feedUnreadBadge" style="font-size:.58rem;font-family:var(--mono);padding:2px 7px;border-radius:8px;background:#1a3a6e;color:#409cff;font-weight:700;display:none;">0 NEW</div>
        </div>
        <div id="ceoFeedItems" style="overflow-y:auto;flex:1;padding:10px 14px;">
          <div style="color:var(--muted);font-family:var(--mono);font-size:.7rem;padding:10px 0;">Loading intelligence feed...</div>
        </div>
      </div>
    `;
  const dashEl=document.getElementById('ceoDashContent');
  if(dashEl)requestAnimationFrame(()=>{dashEl.style.opacity='1';});
  loadCeoFeed();
  loadApiSummary();
  loadUsageSummary();
  setTimeout(function(){
    if(window.innerWidth <= 700){
      const tog = document.querySelector('.ceo-panel-toggle');
      if(tog) tog.style.display='flex';
      toggleCeoPanel('stats');
    }
  }, 100);
}

async function loadPartnerMrr(){
  try{
    const getPV=c=>{const f=parseFloat(c.monthly_fee);if(f>0)return f;const p=(c.plan||'').toLowerCase();if(p.includes('workforce'))return 149;if(p.includes('operations'))return 79;return 29;};
    const[{data:clients},{data:partners},{data:commissions}]=await Promise.all([
      sb.from('clients').select('id,name,plan,status,monthly_fee,partner_ref,founder_discount_expires_at'),
      sb.from('partners').select('id,name,tier,ref_code,status'),
      sb.from('partner_commissions').select('partner_id,amount_omr,status').eq('status','pending')
    ]);
    const cl=clients||[],pt=partners||[],cm=commissions||[];
    const active=cl.filter(c=>c.status==='active');
    const direct=active.filter(c=>!c.partner_ref).reduce((s,c)=>s+getPV(c),0);
    const partnerMRR=active.filter(c=>c.partner_ref).reduce((s,c)=>s+getPV(c),0);
    const total=direct+partnerMRR;
    const pendingComm=cm.reduce((s,c)=>s+parseFloat(c.amount_omr||0),0);
    const d=document.getElementById('ph_direct');if(d)d.textContent='OMR '+direct.toFixed(0);
    const p=document.getElementById('ph_partner');if(p)p.textContent='OMR '+partnerMRR.toFixed(0);
    const t=document.getElementById('ph_total');if(t)t.textContent='OMR '+total.toFixed(0);
    const pc=document.getElementById('ph_commission');if(pc)pc.textContent='OMR '+pendingComm.toFixed(2);
    // Per-partner rows
    const tierColors={apex:'#409cff',alliance:'#3fb950',elite:'#d29922',custom:'#7f77dd'};
    const rowsEl=document.getElementById('partnerRows');
    if(rowsEl&&pt.length>0){
      rowsEl.innerHTML=pt.filter(p=>p.status==='active').map(p=>{
        const pClients=active.filter(c=>c.partner_ref===p.ref_code);
        const pMRR=pClients.reduce((s,c)=>s+getPV(c),0);
        const pComm=cm.filter(c=>c.partner_id===p.id).reduce((s,c)=>s+parseFloat(c.amount_omr||0),0);
        const color=tierColors[p.tier]||'#409cff';
        const nextTier=p.tier==='apex'?8:p.tier==='alliance'?20:null;
        const prog=nextTier?Math.min(100,Math.round((pClients.length/nextTier)*100)):100;
        return `<div style="background:var(--card);border:1px solid var(--border);border-radius:7px;padding:8px 10px;margin-bottom:6px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
            <div style="width:24px;height:24px;border-radius:6px;background:rgba(64,156,255,0.08);display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;color:${color};">${(p.name||'?')[0].toUpperCase()}</div>
            <div style="flex:1;font-size:.75rem;font-weight:600;color:#e6edf3;">${p.name}</div>
            <span style="font-size:.6rem;padding:1px 6px;border-radius:4px;background:rgba(64,156,255,0.08);color:${color};">${p.tier}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:.65rem;">
            <div style="color:var(--muted);">Clients: <span style="color:#e6edf3;">${pClients.length}</span></div>
            <div style="color:var(--muted);">MRR: <span style="color:#3fb950;">OMR ${pMRR.toFixed(0)}</span></div>
            <div style="color:var(--muted);">Due: <span style="color:#d29922;">OMR ${pComm.toFixed(2)}</span></div>
          </div>
          ${nextTier?`<div style="margin-top:5px;height:3px;background:var(--border);border-radius:2px;overflow:hidden;"><div style="height:100%;width:${prog}%;background:${color};border-radius:2px;"></div></div>
          <div style="font-size:.6rem;color:var(--muted);margin-top:2px;">${pClients.length}/${nextTier} to ${p.tier==='apex'?'Alliance':'Elite'}${prog>=100?' — eligible for upgrade!':''}</div>`:''}
        </div>`;
      }).join('')||`<div style="font-size:.7rem;color:var(--muted);">${t('empty.noActivePartnersDashboard')}</div>`;
    }
    // Founder expiry alerts
    const alertsEl=document.getElementById('founderAlerts');
    if(alertsEl){
      const now=new Date();
      const expiring=cl.filter(c=>{
        if(!c.founder_discount_expires_at)return false;
        const exp=new Date(c.founder_discount_expires_at);
        const days=Math.ceil((exp-now)/(1000*60*60*24));
        return days<=60&&days>0;
      }).map(c=>{
        const exp=new Date(c.founder_discount_expires_at);
        const days=Math.ceil((exp-now)/(1000*60*60*24));
        const color=days<=7?'#f85149':days<=30?'#d29922':'#3fb950';
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:var(--card);border:1px solid ${color}33;border-radius:6px;margin-bottom:4px;font-size:.7rem;">
          <span style="color:#e6edf3;">${c.name||c.id}</span>
          <span style="color:${color};font-family:monospace;">${days}d left</span>
        </div>`;
      });
      alertsEl.innerHTML=expiring.length?expiring.join(''):'<div style="font-size:.7rem;color:var(--muted);">No expiries within 60 days</div>';
    }
  }catch(e){console.error('loadPartnerMrr',e);}
}

async function loadLeadTrends(){
  try{
    const now=new Date();
    const monthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString();
    const weekStart=new Date(now.getTime()-7*24*60*60*1000).toISOString();
    let q=sb.from('leads').select('created_at').gte('created_at',monthStart);
    if(userClientId)q=q.eq('client_id',userClientId);
    const{data:monthLeads}=await q;
    if(!monthLeads)return;
    const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const weekCounts=new Array(7).fill(0);
    monthLeads.forEach(function(l){
      const d=new Date(l.created_at);
      if(d>=new Date(weekStart)){
        const dow=(d.getDay()+6)%7;
        weekCounts[dow]++;
      }
    });
    const weekMax=Math.max(...weekCounts,1);
    const weekTotal=weekCounts.reduce(function(a,b){return a+b;},0);
    const weekEl=document.getElementById('weekTrendBars');
    const weekTot=document.getElementById('weekTrendTotal');
    if(weekEl)weekEl.innerHTML=weekCounts.map(function(n,i){
      const h=Math.max(4,Math.round((n/weekMax)*50));
      const isToday=(new Date().getDay()+6)%7===i;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;">'+
        '<div style="font-size:.5rem;color:#409cff;font-weight:600;">'+n+'</div>'+
        '<div style="width:100%;background:'+(isToday?'#409cff':'#409cff33')+';border-top:2px solid #409cff;border-radius:2px 2px 0 0;height:'+h+'px;"></div>'+
        '<div style="font-size:.5rem;color:'+(isToday?'#409cff':'var(--muted)')+';">'+days[i].substring(0,1)+'</div></div>';
    }).join('');
    if(weekTot)weekTot.textContent=weekTotal+' leads';
    const daysInMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
    const monthCounts=new Array(daysInMonth).fill(0);
    monthLeads.forEach(function(l){
      const d=new Date(l.created_at).getDate()-1;
      if(d>=0&&d<daysInMonth)monthCounts[d]++;
    });
    const monthMax=Math.max(...monthCounts,1);
    const monthTotal=monthLeads.length;
    const monthEl=document.getElementById('monthTrendBars');
    const monthTot=document.getElementById('monthTrendTotal');
    if(monthEl)monthEl.innerHTML=monthCounts.map(function(n,i){
      const h=Math.max(2,Math.round((n/monthMax)*46));
      const isToday=i===now.getDate()-1;
      return '<div style="flex:1;background:'+(isToday?'#7f77dd':'#7f77dd33')+';border-top:2px solid #7f77dd;border-radius:1px 1px 0 0;height:'+h+'px;" title="Day '+(i+1)+': '+n+' leads"></div>';
    }).join('');
    if(monthTot)monthTot.textContent=monthTotal+' total';
  }catch(e){}
}

async function loadApiSummary(){
  try{
    const{data}=await sb.from('api_credits').select('service_name,current_balance,monthly_usage,status').neq('status','inactive');
    if(!data)return;
    const healthy=data.filter(r=>r.status==='healthy').length;
    const total=data.length;
    const allOk=healthy===total;
    const hasWarning=data.some(r=>r.status==='low');
    const hasCritical=data.some(r=>r.status==='critical'||r.status==='unknown');
    const healthColor=hasCritical?'#f85149':hasWarning?'#d29922':'#3fb950';
    const healthText=hasCritical?'Critical':hasWarning?'Warning':'All OK';
    const healthPct=Math.round((healthy/total)*100);
    const el=document.getElementById('apiHealthVal');
    const delta=document.getElementById('apiHealthDelta');
    const bar=document.getElementById('apiHealthBar');
    if(el){el.textContent=healthText;el.style.color=healthColor;}
    if(delta)delta.textContent=healthy+'/'+total+' services healthy';
    if(bar){bar.style.width=healthPct+'%';bar.style.background=healthColor;}
    const totalBalance=data.reduce((sum,r)=>sum+(parseFloat(r.current_balance)||0),0);
    const totalUsage=data.reduce((sum,r)=>sum+(parseFloat(r.monthly_usage)||0),0);
    const cv=document.getElementById('creditVal');
    const cd=document.getElementById('creditDelta');
    const cb=document.getElementById('creditBar');
    if(cv)cv.textContent='$'+totalBalance.toFixed(2);
    if(cd)cd.textContent='Used $'+totalUsage.toFixed(2)+' this month';
    if(cb)cb.style.width=Math.min(100,Math.round((totalUsage/(totalBalance+totalUsage+0.01))*100))+'%';
  }catch(e){}
}

async function loadUsageSummary(){
  try{
    const res=await fetch(`${API_URL}/api/client/usage-summary`,{headers:{'Authorization':'Bearer '+session.access_token}});
    if(!res.ok)return;
    const u=await res.json();
    const rows=[];
    function bar(label,used,limit,unit){
      const pct=limit>0?Math.min(100,Math.round((used/limit)*100)):0;
      const color=pct>=100?'#f85149':pct>=80?'#d29922':'#409cff';
      const usedLabel=unit==='GB'?(used/(1024*1024*1024)).toFixed(1)+'GB':used;
      const limitLabel=unit==='GB'?(limit/(1024*1024*1024)).toFixed(0)+'GB':limit;
      return `<div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:.72rem;color:var(--text);">${label}</span>
          <span style="font-size:.7rem;color:${pct>=100?'#f85149':'var(--muted)'};">${usedLabel} / ${limitLabel}</span>
        </div>
        <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${color};"></div>
        </div>
      </div>`;
    }
    if(u.sara&&u.sara.limit>0)rows.push(bar('Sara AI calls',u.sara.used,u.sara.limit));
    else if(u.sara&&u.sara.limit===-1)rows.push(`<div style="display:flex;align-items:center;justify-content:space-between;"><span style="font-size:.72rem;color:var(--text);">Sara AI calls</span><span style="font-size:.7rem;color:var(--muted);">${u.sara.used} · Unlimited</span></div>`);
    if(u.adam&&u.adam.enabled)rows.push(bar('Adam consultations',u.adam.used,u.adam.included));
    if(u.chat)rows.push(bar('Ask NES AI messages',u.chat.used,u.chat.limit));
    if(u.image){
      if(u.image.freeAllowanceActive){
        rows.push(bar('Image gen (daily, trial)',u.image.dailyUsed,u.image.dailyLimit));
      }else{
        rows.push(`<div style="display:flex;align-items:center;justify-content:space-between;"><span style="font-size:.72rem;color:var(--text);">Image gen</span><span style="font-size:.7rem;color:var(--muted);">${u.image.creditBalance} credits remaining · PAYG</span></div>`);
      }
    }
    if(u.storage)rows.push(bar('Briefcase storage',u.storage.usedBytes,u.storage.quotaBytes,'GB'));
    const el=document.getElementById('usageSummaryContent');
    if(el)el.innerHTML=rows.length?rows.join(''):'<div style="color:var(--muted);font-family:var(--mono);font-size:.7rem;">No usage data available</div>';
  }catch(e){
    const el=document.getElementById('usageSummaryContent');
    if(el)el.innerHTML='<div style="color:var(--muted);font-family:var(--mono);font-size:.7rem;">Could not load usage data</div>';
  }
}

async function loadCeoFeed(){
  try{
    let feedQ=sb.from('ceo_feed').select('id,title,content,tag,type,source_url,created_at,client_id').eq('archived',false).order('created_at',{ascending:false}).limit(20);
    if(userClientId)feedQ=feedQ.or('client_id.eq.'+userClientId+',client_id.is.null');
    const{data,error}=await feedQ;
    const el=document.getElementById('ceoFeedItems');
    if(!el)return;
    if(error||!data||data.length===0){
      el.innerHTML='<div style="color:var(--muted);font-family:var(--mono);font-size:.7rem;padding:10px 0;">No intelligence feed data yet. Check back after 6AM tomorrow.</div>';
      return;
    }
    const lastRead=localStorage.getItem('nesai_feed_lastread')||'';
    const lastReadTime=lastRead?new Date(lastRead):new Date(0);
    const unreadItems=data.filter(function(item){return new Date(item.created_at)>lastReadTime;});
    const unreadBadge=document.getElementById('feedUnreadBadge');
    if(unreadBadge){
      if(unreadItems.length>0){unreadBadge.textContent=unreadItems.length+' NEW';unreadBadge.style.display='block';}
      else{unreadBadge.style.display='none';}
    }
    const tagColors={briefing:'#409cff',intelligence:'#3fb950',default:'#d29922'};
    const tagLabels={briefing:'BRIEF',intelligence:'INTEL',default:'INFO'};
    el.innerHTML=data.map(function(item,idx){
      try{
      const isAlert=item.title&&(item.title.indexOf('Alert')>-1||item.title.indexOf('ALERT')>-1||item.title.indexOf('Breaking')>-1||item.title.indexOf('BREAKING')>-1);
      const alertIcon=isAlert?'<span style="color:#f0883e;margin-inline-end:4px;">⚡</span>':'';
      const tagColor=tagColors[item.type]||tagColors.default;
      const tagLabel=tagLabels[item.type]||tagLabels.default;
      const urls=[];
      if(item.source_url&&item.source_url.indexOf('http')===0){
        urls.push(item.source_url);
      } else if(item.content){
        var hrefRe=/href=["']([^"']+)["']/g;
        var hm;
        while((hm=hrefRe.exec(item.content))!==null){
          if(hm[1].indexOf('http')===0){try{new URL(hm[1]);urls.push(hm[1]);}catch(e){}}
        }
        if(urls.length===0){
          item.content.split(/\s+/).forEach(function(word){
            var w=word.replace(/[^a-zA-Z0-9/:._?=&%-]/g,'');
            if(w.indexOf('http')===0){try{new URL(w);urls.push(w);}catch(e){}}
          });
        }
        if(item.content){
          item.content.split('\n').forEach(function(line){
            var l=line.trim();
            if(l.startsWith('🔗')){
              var url=l.replace('🔗','').trim();
              if(url.indexOf('http')===0&&urls.indexOf(url)<0)urls.push(url);
            }
          });
        }
      }
      const cleaned=item.content
        ?item.content
          .replace(/https?:\/\/\S+/g,'')
          .replace(/\*/g,'')
          .replace(/---+/g,'')
          .replace(/🔗/g,'')
          .replace(/\s+/g,' ')
          .trim()
        :'';
      const sections=cleaned.split('  ').filter(function(s){return s.trim().length>10;});
      const preview=sections.slice(0,2).join(' ').substring(0,160)+'...';
      const uniqueUrls=[...new Set(urls)].slice(0,4);
      const sourceHtml=uniqueUrls.length
        ?'<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:5px;">'+
          uniqueUrls.map(function(u){
            var label=u;try{
                var host=new URL(u).hostname.replace('www.','');
                if(host==='news.google.com'){var tp=item.title.split(' - ');label=tp.length>1?tp[tp.length-1].trim():host;}
                else{label=host;}
              }catch(e){}
            return '<a href="'+u+'" target="_blank" rel="noopener" style="font-size:.62rem;font-family:var(--mono);padding:2px 7px;border-radius:5px;background:var(--bg);border:1px solid var(--border);color:var(--nes-blue);text-decoration:none;cursor:pointer;">'+label+'</a>';
          }).join('')+'</div>'
        :'';
      const expandedHtml=sections.map(function(s){
        return '<p style="margin:0 0 8px;line-height:1.6;font-size:.82rem;color:var(--text);">'+s.trim()+'</p>';
      }).join('');
      const isNew=new Date(item.created_at)>lastReadTime;
      const isToday=new Date(item.created_at).toDateString()===new Date().toDateString();
      let dividerHtml='';
      if(idx===0){dividerHtml='<div style="text-align:center;font-family:var(--mono);font-size:.58rem;color:var(--muted);padding:4px 0 6px;display:flex;align-items:center;gap:6px;margin-bottom:4px;"><div style=\"flex:1;height:1px;background:var(--border)\"></div>Today<div style=\"flex:1;height:1px;background:var(--border)\"></div></div>';}
      else if(!isToday&&new Date(data[idx-1]?.created_at).toDateString()===new Date().toDateString()){dividerHtml='<div style="text-align:center;font-family:var(--mono);font-size:.58rem;color:var(--muted);padding:4px 0 6px;display:flex;align-items:center;gap:6px;margin-bottom:4px;"><div style=\"flex:1;height:1px;background:var(--border)\"></div>Earlier<div style=\"flex:1;height:1px;background:var(--border)\"></div></div>';}
      // isAlert and alertIcon declared at top of try block
      return dividerHtml+'<div class="feed-card" id="feed-'+idx+'" style="background:'+(isNew?'#0c1827':'var(--surface)')+';border:1px solid '+(isNew?'#409cff33':'var(--border)')+';border-radius:12px;margin-bottom:8px;overflow:hidden;">'+
        '<div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;cursor:pointer;" onclick="toggleFeedItem('+idx+')">'+
        (isNew?'<div style="width:7px;height:7px;border-radius:50%;background:#409cff;flex-shrink:0;margin-top:5px;" class="feed-new-dot-'+idx+'"></div>':'')+
        '<div style="width:32px;height:32px;border-radius:50%;border:2px solid #1a56db;background:#0a0f1e;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+
        '<div style="width:16px;height:16px;border-radius:50%;background:#1a3a6e;display:flex;align-items:center;justify-content:center;">'+
        '<div style="width:6px;height:6px;border-radius:50%;background:#409cff;"></div></div></div>'+
        '<div style="flex:1;min-width:0;">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">'+

        '<div style="display:flex;align-items:center;gap:6px;">'+
        '<span style="font-size:.6rem;font-family:var(--mono);padding:2px 7px;border-radius:5px;background:'+
        (item.type==='intelligence'?'#0d2818':'#0c1f35')+';color:'+tagColor+';">'+tagLabel+'</span>'+
        '<span style="font-size:.6rem;color:var(--muted);font-family:var(--mono);">'+
        new Date(item.created_at).toLocaleDateString(getDateLocale('en-GB'),{day:'numeric',month:'short'})+'</span>'+
        '<i class="ti ti-chevron-down feed-chevron-'+idx+'" style="font-size:12px;color:var(--muted);transition:transform .2s;"></i>'+
        '</div></div>'+
        '<div style="font-size:.8rem;font-weight:600;color:var(--text);margin-bottom:4px;">'+
        (function(){
          if(!item.content)return item.title||'Intelligence Update';
          var lines=item.content.split('\n').map(function(l){return l.trim();});
          var skipWords=['NES INTELLIGENCE','NES AI','Oman •','GCC •','Global Tech','AST','━','OMAN & GCC','AI & TECH','BUSINESS & ECO','MARKET INSIGHT','MORNING BRIEF','Intelligence Feed','CEO Briefing','---','http','🌐','📰','🔵','•'];
          for(var i=0;i<lines.length;i++){
            var l=lines[i];
            if(l.length>=15&&l.length<=100){
              var skip=false;
              for(var j=0;j<skipWords.length;j++){if(l.includes(skipWords[j])){skip=true;break;}}
              if(!skip){
                var clean=l.replace(/^[*🔹◆·🔷📅👥☀️⛅🌧️🌫️🌤️⚙️📡☕🕌🌅\s]+/,'').trim();
                if(clean.length>=15)return clean.substring(0,80);
              }
            }
          }
          return item.title||'Intelligence Update';
        }())+alertIcon+'</div>'+
        '<div class="feed-preview-'+idx+'" style="font-size:.75rem;color:var(--muted);line-height:1.5;">'+preview+'</div>'+
        (isAlert?'':sourceHtml)+
        '</div></div>'+
        '<div class="feed-expanded-'+idx+'" style="display:none;padding:0 14px 14px 56px;border-top:1px solid var(--border);">'+
        '<div style="padding-top:12px;">'+expandedHtml+'</div>'+
        (uniqueUrls.length?'<div style="font-family:var(--mono);font-size:.62rem;color:var(--muted);margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em;">Sources</div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:5px;">'+
        uniqueUrls.map(function(u){
          var label=u;try{label=new URL(u).hostname.replace('www.','');}catch(e){}
          return '<a href="'+u+'" target="_blank" rel="noopener" style="font-size:.62rem;font-family:var(--mono);padding:2px 8px;border-radius:5px;background:var(--bg);border:1px solid var(--border);color:var(--nes-blue);text-decoration:none;">'+label+'</a>';
        }).join('')+'</div>':'')+
        '</div></div>';
      }catch(e){console.error('feed item error:',e,item);return '<div style="padding:8px;font-size:.75rem;color:#e6edf3;border-bottom:1px solid var(--border);">'+( item.title||'')+'</div>';}
    }).join('');
    const feedEl=document.getElementById('ceoFeedItems');
    if(feedEl){
      feedEl.onscroll=function(){
        if(feedEl.scrollTop+feedEl.clientHeight>=feedEl.scrollHeight-50){
          localStorage.setItem('nesai_feed_lastread',new Date().toISOString());
          document.querySelectorAll('[class^="feed-new-dot"]').forEach(function(d){d.style.opacity='0';});
          if(unreadBadge)unreadBadge.style.display='none';
        }
      };
    }
  }catch(e){
    const el=document.getElementById('ceoFeedItems');
    if(el)el.innerHTML='<div style="color:var(--muted);font-family:var(--mono);font-size:.7rem;padding:10px 0;">Feed unavailable.</div>';
  }
}

function toggleFeedItem(idx){
  const preview=document.querySelector('.feed-preview-'+idx);
  const expanded=document.querySelector('.feed-expanded-'+idx);
  const chevron=document.querySelector('.feed-chevron-'+idx);
  if(!expanded)return;
  const isOpen=expanded.style.display!=='none';
  expanded.style.display=isOpen?'none':'block';
  if(preview)preview.style.display=isOpen?'block':'none';
  if(chevron)chevron.style.transform=isOpen?'':'rotate(180deg)';
}

function detectCountry(email){
  if(email.endsWith('.om')||email.includes('oman'))return'Oman';
  if(email.endsWith('.ae')||email.includes('uae')||email.includes('dubai'))return'UAE';
  if(email.endsWith('.sa')||email.includes('saudi'))return'Saudi Arabia';
  if(email.endsWith('.kw'))return'Kuwait';
  if(email.endsWith('.bh'))return'Bahrain';
  if(email.endsWith('.qa'))return'Qatar';
  if(email.endsWith('.uk')||email.endsWith('.co.uk'))return'UK';
  if(email.endsWith('.de'))return'Germany';
  if(email.endsWith('.pk'))return'Pakistan';
  if(email.endsWith('.ca'))return'Canada';
  if(email.endsWith('.fr'))return'France';
  if(email.endsWith('.in'))return'India';
  if(email.endsWith('.jo'))return'Jordan';
  if(email.endsWith('.eg'))return'Egypt';
  if(email.endsWith('.us'))return'USA';
  return'Oman';
}

function showCommandCentre(){
  const mc=document.getElementById('mainContent');
  mc.style.overflow='hidden';
  let hub=document.getElementById('teamHubWrapper');
  if(!hub){
    hub=document.createElement('div');
    hub.id='teamHubWrapper';
    hub.style.cssText='position:absolute;top:0;inset-inline-start:228px;inset-inline-end:0;bottom:0;background:var(--bg);z-index:50;display:flex;flex-direction:column;';
    hub.style.overflow='hidden';
hub.innerHTML=`<div style="padding-block:11px;padding-inline-end:var(--header-clearance);padding-inline-start:60px;border-bottom:1px solid var(--border);flex-shrink:0;"><div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;">${t('sectionTitle.teamHub')}</div><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">Internal team communications</div></div><div class="command-wrap" style="width:100%;flex:1;"><iframe id="teamHubIframe" class="command-iframe" src="${ROCKET_URL}" title="NES Team Hub" allow="microphone; camera" style="width:100%;height:100%;border:none;"></iframe></div>`;
    document.getElementById('app').appendChild(hub);
  }
  hub.style.display='flex';
  mc.style.display='none';
  window._teamHubVisible=true;
}

function hideTeamHub(){
  const hub=document.getElementById('teamHubWrapper');
  if(hub){
    const iframe=document.getElementById('teamHubIframe');
    if(iframe)iframe.src='about:blank';
    hub.remove();
  }
  document.getElementById('mainContent').style.display='flex';
  window._teamHubVisible=false;
}
