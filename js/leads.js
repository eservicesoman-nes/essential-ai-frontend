// leads.js — extracted from index.html, NES Locale Phase 0
// 8 functions, zero logic changes

async function showLeadsPage(){
  const mc=document.getElementById('mainContent');
  mc.style.overflow='auto';
  mc.innerHTML=`
    <div style="padding:11px 18px 11px 60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;">LEADS</div><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);" id="leadsSubtitle">${t('common.loading')}</div></div>
      <button onclick="exportLeads()" style="font-size:.7rem;padding:4px 9px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--muted);cursor:pointer;font-family:var(--mono);display:flex;align-items:center;gap:5px;"><i class="ti ti-download" style="font-size:13px"></i> Export CSV</button>
    </div>
    <div class="page scrollable" id="leadsContent"><div style="text-align:center;padding:40px;color:var(--muted);font-family:var(--mono);font-size:.8rem;">${t('loading.leads')}</div></div>`;
  try{
    let leadsQ=sb.from('leads').select('*').order('created_at',{ascending:false}).limit(100);
    if(userClientId)leadsQ=leadsQ.eq('client_id',userClientId);
    const{data:leads,error}=await leadsQ;
    if(error)throw error;
    const today=new Date().toISOString().split('T')[0];
    const todayLeads=(leads||[]).filter(l=>l.created_at?.startsWith(today)).length;
    document.getElementById('leadsSubtitle').textContent=`${leads?.length||0} total · ${todayLeads} today`;
    const hotLeads=(leads||[]).filter(l=>['Government','Ports & Customs','Aviation & Airports'].includes(l.industry)).length;
    document.getElementById('leadsContent').innerHTML=`
      <div class="leads-stats">
        <div class="kcard hot"><div class="klbl" style="display:flex;align-items:center;gap:4px;"><i class="ti ti-users" style="font-size:11px;color:var(--nes-blue);filter:drop-shadow(0 0 3px var(--nes-blue))"></i>Total leads</div><div class="kval" style="color:var(--nes-blue)">${leads?.length||0}</div><div class="kdelta kup">${todayLeads} today</div></div>
        <div class="kcard"><div class="klbl" style="display:flex;align-items:center;gap:4px;"><i class="ti ti-flame" style="font-size:11px;color:#3fb950;filter:drop-shadow(0 0 3px #3fb950)"></i>High value</div><div class="kval" style="color:#3fb950">${hotLeads}</div><div class="kdelta kneu">Gov · Ports · Aviation</div></div>
        <div class="kcard"><div class="klbl" style="display:flex;align-items:center;gap:4px;"><i class="ti ti-calendar-week" style="font-size:11px;color:#7f77dd;filter:drop-shadow(0 0 3px #7f77dd)"></i>This week</div><div class="kval">${(leads||[]).filter(l=>new Date(l.created_at)>new Date(Date.now()-7*24*60*60*1000)).length}</div><div class="kdelta kneu">Last 7 days</div></div>
      </div>
      <div class="tabs-bar">
        <button class="tab-btn active" onclick="filterLeads('all',this)">All</button>
        <button class="tab-btn" onclick="filterLeads('today',this)">Today</button>
        <button class="tab-btn" onclick="filterLeads('week',this)">This week</button>
      </div>
      <div class="leads-table">
        <div class="lt-header"><div>Name / Email</div><div>Industry</div><div>Phone</div><div>Date</div><div>Status</div></div>
        <div id="leadsRows">${renderLeadRows(leads||[])}</div>
      </div>`;
    window._allLeads=leads||[];
  }catch(e){document.getElementById('leadsContent').innerHTML=`<div style="text-align:center;padding:40px;color:#f85149;font-family:var(--mono);">Error: ${e.message}</div>`;}
}

function renderLeadRows(leads){
  if(!leads.length)return`<div style="padding:20px;text-align:center;color:var(--muted);font-family:var(--mono);font-size:.8rem;">${t('empty.noLeadsFound')}</div>`;
  return leads.map(l=>{
    const date=new Date(l.created_at);const timeAgo=getTimeAgo(date);const badge=getBadge(l,date);
    const _msg=(l.message||'').trim();const _msgId='msg-'+l.id;
    return`<div class="lt-row" id="lead-row-${l.id}"><div><div class="lead-name">${l.name||'—'}</div><div class="lead-email">${l.email||'—'}</div>${_msg?`<div><button onclick="const el=document.getElementById('${_msgId}');el.style.display=el.style.display==='none'?'block':'none';" style="font-size:.58rem;padding:1px 6px;border-radius:4px;background:rgba(64,156,255,.08);color:var(--nes-blue);border:1px solid rgba(64,156,255,.2);cursor:pointer;margin-top:3px;"><i class='ti ti-message'></i> Message</button><div id="${_msgId}" style="display:none;font-size:.68rem;color:var(--muted);margin-top:4px;padding:6px 8px;background:var(--card);border-radius:5px;border:1px solid var(--border);font-style:italic;">${_msg}</div></div>`:''}</div><div class="lead-industry">${l.industry||'General'}</div><div class="lead-email">${l.phone||'—'}</div><div class="lead-time">${timeAgo}</div><div style="display:flex;align-items:center;gap:6px;"><span class="lead-badge ${badge.cls}">${badge.label}</span>${(userRole==='nesadmin'||userRole==='ceo'||userRole==='nes_partner')&&l.phone?`<button onclick="callWithSara('${l.id}','${(l.phone||'').replace(/'/g,'').replace(/\+/g,'%2B')}','${(l.name||'Lead').replace(/'/g,'')}')" style="font-size:.6rem;padding:2px 8px;border-radius:5px;background:rgba(63,185,80,0.1);color:#3fb950;border:1px solid rgba(63,185,80,0.3);cursor:pointer;white-space:nowrap;"><i class="ti ti-phone"></i> Sara</button>`:''}<button onclick="deleteLead('${l.id}','${(l.name||'this lead').replace(/'/g,'')}')" title="Delete permanently" style="font-size:.6rem;padding:2px 7px;border-radius:5px;background:rgba(248,81,73,0.1);color:#f85149;border:1px solid rgba(248,81,73,0.3);cursor:pointer;"><i class="ti ti-trash"></i></button></div></div>`;
  }).join('');
}

async function deleteLead(leadId, leadName){
  if(!confirm(`Permanently delete lead "${leadName}"?\n\nThis removes it everywhere — lead stats, pipeline totals, and any dashboards. This cannot be undone.`)) return;
  try{
    const{error}=await sb.from('leads').delete().eq('id',leadId);
    if(error)throw error;
    window._allLeads=(window._allLeads||[]).filter(l=>l.id!==leadId);
    const row=document.getElementById('lead-row-'+leadId);
    if(row)row.remove();
    const todayStr=new Date().toISOString().split('T')[0];
    const todayLeads=window._allLeads.filter(l=>l.created_at?.startsWith(todayStr)).length;
    const subEl=document.getElementById('leadsSubtitle');
    if(subEl)subEl.textContent=`${window._allLeads.length} total · ${todayLeads} today`;
    showToast('Lead deleted');
  }catch(e){
    showToast('❌ Delete failed: '+e.message);
  }
}

async function callWithSara(leadId, phone, name){
  const code = prompt(`Enter confirmation code to call ${name}:`);
  if(!code) return;
  if(code !== '4321'){ showToast('Incorrect code — call cancelled'); return; }
  const decoded = decodeURIComponent(phone);
  showToast(`Calling ${name}... Sara is dialing`);
  try {
    const res = await fetch(`${API_URL}/api/leads/${leadId}/call`, {
      method: 'POST',
      headers: {'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body: JSON.stringify({ phone: decoded, name })
    });
    const data = await res.json();
    if(data.success){
      showToast(`✅ Sara is calling ${name} now`);
    } else {
      showToast('❌ Call failed: ' + (data.error||'Unknown error'));
    }
  } catch(e) {
    showToast('❌ Call failed: ' + e.message);
  }
}

function getBadge(lead,date){
  const hrs=(Date.now()-date.getTime())/3600000;
  const highValue=['Government','Ports & Customs','Aviation & Airports'].includes(lead.industry);
  if(highValue&&hrs<24)return{cls:'lbhot',label:'Hot'};
  if(hrs<24)return{cls:'lbnew',label:'New'};
  return{cls:'lbwarm',label:'Warm'};
}

function getTimeAgo(date){
  const hrs=Math.floor((Date.now()-date.getTime())/3600000);
  if(hrs<1)return'Just now';if(hrs<24)return hrs+'h ago';
  return Math.floor(hrs/24)+'d ago';
}

function filterLeads(filter,btn){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  let filtered=window._allLeads||[];
  if(filter==='today')filtered=filtered.filter(l=>l.created_at?.startsWith(new Date().toISOString().split('T')[0]));
  if(filter==='week')filtered=filtered.filter(l=>new Date(l.created_at)>new Date(Date.now()-7*24*60*60*1000));
  document.getElementById('leadsRows').innerHTML=renderLeadRows(filtered);
}

function exportLeads(){
  const leads=window._allLeads||[];
  const csv=['Name,Email,Phone,Industry,Country,Message,Date',...leads.map(l=>`"${l.name||''} ","${l.email||''} ","${l.phone||''} ","${l.industry||''} ","${l.country||''} ","${(l.message||'').replace(/"/g,"'")}" ,"${l.created_at||''} "`)].join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='nes-leads-'+new Date().toISOString().split('T')[0]+'.csv';a.click();
}
