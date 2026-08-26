// analytics.js — extracted from index.html, NES Locale Phase 0
// 3 functions, zero logic changes

async function showAnalytics(){
  const mc = document.getElementById('mainContent');
  mc.style.overflow = 'auto';
  mc.innerHTML = `
    <div style="padding-block:11px;padding-inline-end:var(--header-clearance);padding-inline-start:60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;" class="an-hdr">
      <div>
        <div style="font-family:var(--mono);font-size:.8rem;color:#d29922;font-weight:800;display:flex;align-items:center;gap:6px;"><i class="ti ti-chart-dots"></i>USAGE ANALYTICS</div>
        <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">${t('pageSubtitle.analytics')}</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button onclick="loadAnalytics('7')" id="anBtn7" style="font-family:var(--mono);font-size:.65rem;padding:4px 10px;border-radius:6px;border:1px solid var(--nes-blue);background:var(--nes-blue);color:#fff;cursor:pointer;">${t('daysFilter.d7')}</button>
        <button onclick="loadAnalytics('30')" id="anBtn30" style="font-family:var(--mono);font-size:.65rem;padding:4px 10px;border-radius:6px;border:1px solid var(--border);background:none;color:var(--muted);cursor:pointer;">${t('daysFilter.d30')}</button>
        <button onclick="loadAnalytics('90')" id="anBtn90" style="font-family:var(--mono);font-size:.65rem;padding:4px 10px;border-radius:6px;border:1px solid var(--border);background:none;color:var(--muted);cursor:pointer;">${t('daysFilter.d90')}</button>
      </div>
    </div>
    <div class="page scrollable" id="analyticsContent" style="padding:14px 18px;">
      <div style="text-align:center;padding:40px;color:var(--muted);font-family:var(--mono);font-size:.8rem;">${t('loading.analytics')}</div>
    </div>`;
  await loadAnalytics('7');
}

async function loadAnalytics(days){
  ['7','30','90'].forEach(d => {
    const btn = document.getElementById('anBtn'+d);
    if(btn){
      btn.style.background = d===days ? 'var(--nes-blue)' : 'none';
      btn.style.color = d===days ? '#fff' : 'var(--muted)';
      btn.style.borderColor = d===days ? 'var(--nes-blue)' : 'var(--border)';
    }
  });

  const el = document.getElementById('analyticsContent');
  if(!el) return;

  try{
    const since = new Date(Date.now() - parseInt(days)*24*60*60*1000).toISOString();

    const [leadsRes, clientsRes, feedRes] = await Promise.all([
      sb.from('leads').select('id,created_at,status,client_id,country').gte('created_at',since),
      sb.from('clients').select('id,name,plan,status,created_at'),
      sb.from('ceo_feed').select('id,created_at,type,tag').gte('created_at',since)
    ]);

    const leads = leadsRes.data || [];
    const clients = clientsRes.data || [];
    const feed = feedRes.data || [];

    const activeClients = clients.filter(c=>c.status==='active').length;
    const totalLeads = leads.length;
    const newLeads = leads.filter(l=>l.status==='new').length;
    const closedLeads = leads.filter(l=>l.status==='closed').length;
    const convRate = totalLeads > 0 ? Math.round((closedLeads/totalLeads)*100) : 0;

    const dailyLeads = {};
    for(let i=parseInt(days)-1; i>=0; i--){
      const d = new Date(Date.now() - i*24*60*60*1000);
      const key = d.toISOString().split('T')[0];
      dailyLeads[key] = 0;
    }
    leads.forEach(l => {
      const key = l.created_at.split('T')[0];
      if(dailyLeads[key] !== undefined) dailyLeads[key]++;
    });

    const dailyKeys = Object.keys(dailyLeads);
    const dailyVals = Object.values(dailyLeads);
    const maxVal = Math.max(...dailyVals, 1);

    const planCounts = {presence:0,operations:0,workforce:0,infrastructure:0};
    clients.forEach(c => {
      const p = (c.plan||'').toLowerCase();
      if(p.includes('operations')) planCounts.operations++;
      else if(p.includes('workforce')) planCounts.workforce++;
      else if(p.includes('infrastructure')) planCounts.infrastructure++;
      else planCounts.presence++;
    });

    const countries = {};
    leads.forEach(l => { const cn = l.country||'Unknown'; countries[cn]=(countries[cn]||0)+1; });
    const topCountries = Object.entries(countries).sort((a,b)=>b[1]-a[1]).slice(0,5);

    const feedByType = {};
    feed.forEach(f => { const t=f.type||'intel'; feedByType[t]=(feedByType[t]||0)+1; });

    const planValues = {presence:29,operations:79,workforce:149,infrastructure:299};
    const mrr = clients.filter(c=>c.status==='active').reduce((s,c) => {
      const p=(c.plan||'').toLowerCase();
      if(p.includes('operations')) return s+79;
      if(p.includes('workforce')) return s+149;
      if(p.includes('infrastructure')) return s+299;
      return s+29;
    }, 0);

    el.innerHTML = `
      <style>
        .an-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;}
        .an-card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px 14px;}
        .an-lbl{font-size:.6rem;font-family:var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;}
        .an-val{font-size:1.4rem;font-weight:700;}
        .an-sub{font-size:.62rem;color:var(--muted);margin-top:2px;}
        .an-bar{height:3px;background:var(--border2);border-radius:2px;margin-top:7px;}
        .an-fill{height:100%;border-radius:2px;}
        .an-row2{display:grid;grid-template-columns:2fr 1fr;gap:10px;margin-bottom:10px;}
        .an-sec{font-family:var(--mono);font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;margin-top:12px;display:flex;align-items:center;gap:5px;}
        .geo-row{display:flex;align-items:center;gap:8px;margin-bottom:5px;}
        .geo-name{font-size:.72rem;min-width:70px;}
        .geo-track{flex:1;background:var(--border2);border-radius:2px;height:5px;overflow:hidden;}
        .geo-fill{height:100%;border-radius:2px;background:var(--nes-blue);}
        .geo-n{font-size:.65rem;color:var(--muted);min-width:24px;text-align:right;}
        .client-row-an{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);}
        .client-row-an:last-child{border-bottom:none;}
      </style>

      <div class="an-grid">
        <div class="an-card" style="border-color:#409cff33;">
          <div class="an-lbl">${t('plan.totalMrr')}</div>
          <div class="an-val" style="color:#409cff;">OMR ${mrr}</div>
          <div class="an-sub">${activeClients} active clients</div>
          <div class="an-bar"><div class="an-fill" style="width:100%;background:#409cff;"></div></div>
        </div>
        <div class="an-card" style="border-color:#3fb95033;">
          <div class="an-lbl">${t('analyticsSection.totalLeads')}</div>
          <div class="an-val" style="color:#3fb950;">${totalLeads}</div>
          <div class="an-sub">Last ${days} days</div>
          <div class="an-bar"><div class="an-fill" style="width:${Math.min(100,totalLeads*2)}%;background:#3fb950;"></div></div>
        </div>
        <div class="an-card" style="border-color:#7f77dd33;">
          <div class="an-lbl">${t('analyticsSection.conversionRate')}</div>
          <div class="an-val" style="color:#7f77dd;">${convRate}%</div>
          <div class="an-sub">${closedLeads} closed of ${totalLeads}</div>
          <div class="an-bar"><div class="an-fill" style="width:${convRate}%;background:#7f77dd;"></div></div>
        </div>
        <div class="an-card" style="border-color:#d2992233;">
          <div class="an-lbl">${t('analyticsSection.intelArticles')}</div>
          <div class="an-val" style="color:#d29922;">${feed.length}</div>
          <div class="an-sub">Last ${days} days</div>
          <div class="an-bar"><div class="an-fill" style="width:${Math.min(100,feed.length)}%;background:#d29922;"></div></div>
        </div>
      </div>

      <div class="an-sec"><i class="ti ti-chart-bar" style="font-size:11px;color:#409cff;"></i>Lead trend — last ${days} days</div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:10px;">
        <div style="display:flex;align-items:flex-end;gap:${parseInt(days)>30?'1':'3'}px;height:80px;">
          ${dailyKeys.map((key,i) => {
            const val = dailyVals[i];
            const h = Math.max(2, Math.round((val/maxVal)*76));
            const isToday = key === new Date().toISOString().split('T')[0];
            const label = parseInt(days) <= 7 ? new Date(key).toLocaleDateString('en',{weekday:'short'}) : 
                          parseInt(days) <= 30 ? new Date(key).getDate() : '';
            return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;">
              ${val>0?`<div style="font-size:.45rem;color:#409cff;font-weight:600;">${val}</div>`:'<div style="font-size:.45rem;color:transparent;">0</div>'}
              <div style="width:100%;background:${isToday?'#409cff':'#409cff33'};border-top:2px solid ${isToday?'#409cff':'#409cff88'};border-radius:2px 2px 0 0;height:${h}px;"></div>
              ${label?`<div style="font-size:.45rem;color:${isToday?'#409cff':'var(--muted)'};">${label}</div>`:''}
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="an-row2">
        <div>
          <div class="an-sec"><i class="ti ti-map-pin" style="font-size:11px;color:#7f77dd;"></i>${t('analyticsSection.leadGeography')}</div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;">
            ${topCountries.length > 0 ? topCountries.map(([cn,n]) => `
              <div class="geo-row">
                <div class="geo-name">${cn}</div>
                <div class="geo-track"><div class="geo-fill" style="width:${Math.round((n/totalLeads)*100)}%;"></div></div>
                <div class="geo-n">${n}</div>
              </div>`).join('') : `<div style="color:var(--muted);font-size:.72rem;">${t('empty.noLeadData')}</div>`}
          </div>
        </div>

        <div>
          <div class="an-sec"><i class="ti ti-users" style="font-size:11px;color:#3fb950;"></i>Plan breakdown</div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;">
            ${[
              [t('plan.aiPresence'),'#409cff',planCounts.presence],
              [t('plan.aiOperations'),'#3fb950',planCounts.operations],
              [t('plan.aiWorkforce'),'#7f77dd',planCounts.workforce],
              [t('plan.aiInfrastructure'),'#d29922',planCounts.infrastructure]
            ].map(([name,color,count]) => `
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;">
                <div style="display:flex;align-items:center;gap:5px;">
                  <div style="width:7px;height:7px;border-radius:50%;background:${color};"></div>
                  <div style="font-size:.7rem;">${name}</div>
                </div>
                <div style="font-size:.8rem;font-weight:600;color:${color};">${count}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="an-sec"><i class="ti ti-building" style="font-size:11px;color:#d29922;"></i>${t('analyticsSection.clientOverview')}</div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;">
        ${clients.length === 0 ? `<div style="color:var(--muted);font-size:.72rem;">${t('empty.noClientsAnalytics')}</div>` :
          clients.map(cl => {
            const p=(cl.plan||'').toLowerCase();
            const val=p.includes('operations')?79:p.includes('workforce')?149:p.includes('infrastructure')?299:29;
            const color=cl.status==='active'?'#3fb950':'#d29922';
            const clientLeads = leads.filter(l=>l.client_id===cl.id).length;
            const initials=(cl.name||'?').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
            return `<div class="client-row-an">
              <div style="width:30px;height:30px;border-radius:7px;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:var(--nes-blue);flex-shrink:0;">${initials}</div>
              <div style="flex:1;">
                <div style="font-size:.78rem;font-weight:600;">${cl.name}</div>
                <div style="font-size:.62rem;color:var(--muted);">${cl.plan||'presence'} · ${cl.status}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:.75rem;font-weight:600;color:var(--nes-blue);">OMR ${val}/mo</div>
                <div style="font-size:.6rem;color:var(--muted);">${clientLeads} leads</div>
              </div>
              <div style="width:7px;height:7px;border-radius:50%;background:${color};margin-left:8px;flex-shrink:0;"></div>
            </div>`;
          }).join('')}
        <div style="border-top:1px solid var(--border);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-family:var(--mono);font-size:.65rem;">
          <span style="color:var(--muted);">${t('plan.totalMrr')}</span>
          <span style="color:var(--nes-blue);font-weight:700;">OMR ${mrr}/mo</span>
        </div>
      </div>
    `;

    // AI Cost by Client
    const { data: costData } = await sb
      .from('monthly_usage')
      .select('client_id, month, model, calls, cost_usd')
      .order('month', { ascending: false });

    const costRows = costData || [];
    const clientMap = {};
    clients.forEach(c => { clientMap[c.id] = c.name; });

    const grouped = {};
    costRows.forEach(r => {
      const key = (clientMap[r.client_id] || 'Unknown') + '|' + r.month;
      if (!grouped[key]) grouped[key] = { client: clientMap[r.client_id] || 'Unknown', month: r.month, gemini: 0, anthropic: 0, deepseek: 0, stream: 0, total_usd: 0 };
      const model = r.model || 'gemini';
      if (model.includes('gemini')) grouped[key].gemini += (r.calls || 0);
      else if (model.includes('anthropic') || model.includes('claude')) grouped[key].anthropic += (r.calls || 0);
      else if (model.includes('deepseek')) grouped[key].deepseek += (r.calls || 0);
      else if (model.includes('stream')) grouped[key].stream += (r.calls || 0);
      grouped[key].total_usd += parseFloat(r.cost_usd || 0);
    });
    const costTable = Object.values(grouped).sort((a,b) => b.month.localeCompare(a.month) || a.client.localeCompare(b.client));
    const noData = costTable.length === 0;

    el.innerHTML += `
      <div style="margin-top:24px;">
        <div style="font-family:var(--mono);font-size:.75rem;color:#d29922;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
          <i class="ti ti-currency-dollar"></i> AI COST BY CLIENT
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;font-size:.72rem;">
            <thead>
              <tr style="background:rgba(210,153,34,0.08);">
                <th style="padding:8px 12px;text-align:left;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.client')}</th>
                <th style="padding:8px 12px;text-align:left;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.month')}</th>
                <th style="padding:8px 12px;text-align:right;color:#409cff;font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.gemini')}</th>
                <th style="padding:8px 12px;text-align:right;color:#7f77dd;font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.claude')}</th>
                <th style="padding:8px 12px;text-align:right;color:#3fb950;font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.deepseek')}</th>
                <th style="padding:8px 12px;text-align:right;color:#f85149;font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.stream')}</th>
                <th style="padding:8px 12px;text-align:right;color:#d29922;font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.costUsd')}</th>
                <th style="padding:8px 12px;text-align:right;color:#d29922;font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.costOmr')}</th>
              </tr>
            </thead>
            <tbody>
              ${noData
                ? `<tr><td colspan="8" style="padding:20px;text-align:center;color:var(--muted);font-family:var(--mono);">${t('empty.noUsageData')}</td></tr>`
                : costTable.map((r,i) => `
                  <tr style="border-bottom:1px solid var(--border);background:${i%2===0?'transparent':'rgba(255,255,255,0.01)'};">
                    <td style="padding:8px 12px;color:var(--text);font-weight:500;">${r.client}</td>
                    <td style="padding:8px 12px;color:var(--muted);font-family:var(--mono);">${r.month}</td>
                    <td style="padding:8px 12px;text-align:right;color:#409cff;">${r.gemini||0}</td>
                    <td style="padding:8px 12px;text-align:right;color:#7f77dd;">${r.anthropic||0}</td>
                    <td style="padding:8px 12px;text-align:right;color:#3fb950;">${r.deepseek||0}</td>
                    <td style="padding:8px 12px;text-align:right;color:#f85149;">${r.stream||0}</td>
                    <td style="padding:8px 12px;text-align:right;color:#d29922;font-family:var(--mono);">$${r.total_usd.toFixed(4)}</td>
                    <td style="padding:8px 12px;text-align:right;color:#d29922;font-weight:600;font-family:var(--mono);">OMR ${(r.total_usd*0.385).toFixed(4)}</td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="an-sec"><i class="ti ti-flame"></i>Client Usage Ranking — Highest Usage First</div>
      <div id="fleetUsageRanking" style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;">
        <div style="color:var(--muted);font-family:var(--mono);font-size:.75rem;">Loading usage ranking...</div>
      </div>
    `;

    loadFleetUsageRanking();
  }catch(e){
    if(el) el.innerHTML = `<div style="color:var(--red);font-family:var(--mono);font-size:.75rem;padding:20px;">Error loading analytics: ${e.message}</div>`;
  }
}

async function loadFleetUsageRanking(){
  const el=document.getElementById('fleetUsageRanking');
  if(!el)return;
  try{
    const res=await fetch(`${API_URL}/api/admin/usage-summary-all`,{
      headers:{'Authorization':'Bearer '+session.access_token}
    });
    if(!res.ok){el.innerHTML='<div style="color:var(--muted);font-family:var(--mono);font-size:.75rem;">Could not load usage ranking.</div>';return;}
    const data=await res.json();
    const clients=data.clients||[];
    if(!clients.length){el.innerHTML='<div style="color:var(--muted);font-family:var(--mono);font-size:.75rem;">No active clients with usage data.</div>';return;}
    el.innerHTML=clients.map(c=>{
      const pctColor=c.maxUsagePct>=100?'#f85149':c.maxUsagePct>=80?'#d29922':'#3fb950';
      const storagePct=c.storage.quotaBytes>0?Math.round((c.storage.usedBytes/c.storage.quotaBytes)*100):0;
      return `<div style="padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div style="font-size:.8rem;font-weight:700;">${esc(c.clientName)} <span style="font-size:.65rem;color:var(--muted);font-weight:400;text-transform:capitalize;">· ${c.plan}</span></div>
          <div style="font-size:.72rem;font-weight:700;color:${pctColor};">${c.maxUsagePct}% peak usage</div>
        </div>
        <div style="display:flex;gap:14px;font-size:.65rem;color:var(--muted);font-family:var(--mono);flex-wrap:wrap;">
          <span>Sara: ${c.sara.used}/${c.sara.limit===-1?'∞':c.sara.limit}</span>
          ${c.adam.enabled?`<span>Adam: ${c.adam.used}/${c.adam.included} (${c.adam.creditBalance} credits)</span>`:''}
          <span>Chat: ${c.chat.used}/${c.chat.limit}</span>
          <span>Storage: ${storagePct}%</span>
        </div>
      </div>`;
    }).join('');
  }catch(e){
    el.innerHTML='<div style="color:var(--muted);font-family:var(--mono);font-size:.75rem;">Could not load usage ranking.</div>';
  }
}
