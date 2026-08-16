// partners.js — extracted from index.html, NES Locale Phase 0
// 11 functions, zero logic changes

async function showSalesPortal(){
  const mc = document.getElementById('mainContent');
  mc.style.overflow = 'hidden';
  mc.innerHTML = `
    <div style="padding:11px 18px 11px 60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;display:flex;align-items:center;gap:6px;">
          <i class="ti ti-users-group" style="filter:drop-shadow(0 0 3px var(--nes-blue))"></i>PARTNER HUB
        </div>
        <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">${t('pageSubtitle.partnerHub')}</div>
      </div>
    </div>
    <div class="page scrollable" id="partnerContent" style="padding:14px 18px;">
      <div style="text-align:center;padding:40px;color:var(--muted);font-family:var(--mono);font-size:.8rem;">Loading partner data...</div>
    </div>`;
  await renderPartnerHub();
}

async function renderPartnerHub(){
  const el = document.getElementById('partnerContent');
  if(!el) return;

  // Fetch all data
  const [clientsRes, partnersRes, pendingRes, commissionsRes] = await Promise.all([
    sb.from('clients').select('id,name,plan,status,partner_ref,monthly_fee,first_payment_confirmed'),
    sb.from('partners').select('*').order('created_at', {ascending:false}),
    sb.from('partners').select('*').eq('status','pending').order('applied_at', {ascending:false}),
    sb.from('partner_commissions').select('*').order('created_at', {ascending:false})
  ]);

  const allClients = clientsRes.data || [];
  const allPartners = (partnersRes.data || []).filter(p => p.status !== 'pending');
  const pendingPartners = pendingRes.data || [];
  const allCommissions = commissionsRes.data || [];
  // Update pending badge
  setTimeout(()=>updatePendingBadge(pendingPartners.length), 100);

  const getPlanVal = (plan, fee) => {
    if(fee && fee > 0) return parseFloat(fee);
    const p = (plan||'').toLowerCase();
    if(p.includes('workforce')) return 149;
    if(p.includes('operations')) return 79;
    if(p.includes('presence')) return 29;
    return 79;
  };

  // Stats
  const directClients = allClients.filter(c => !c.partner_ref);
  const partnerClients = allClients.filter(c => c.partner_ref);
  const directMRR = directClients.filter(c=>c.status==='active').reduce((s,c)=>s+getPlanVal(c.plan,c.monthly_fee),0);
  const partnerMRR = partnerClients.filter(c=>c.status==='active').reduce((s,c)=>s+getPlanVal(c.plan,c.monthly_fee),0);
  const totalMRR = directMRR + partnerMRR;
  const pendingCommissions = allCommissions.filter(c=>c.status==='pending').reduce((s,c)=>s+parseFloat(c.amount_omr||0),0);
  const paidCommissions = allCommissions.filter(c=>c.status==='paid').reduce((s,c)=>s+parseFloat(c.amount_omr||0),0);
  const successRate = partnerClients.length > 0 ? Math.round((partnerClients.filter(c=>c.status==='active').length/partnerClients.length)*100) : 0;

  const tierColors = {apex:'#409cff', alliance:'#3fb950', elite:'#d29922', custom:'#7f77dd'};
  const tierBg = {apex:'rgba(64,156,255,0.08)', alliance:'rgba(63,185,80,0.08)', elite:'rgba(210,153,34,0.08)', custom:'rgba(127,119,221,0.08)'};

  el.innerHTML = `
    <style>
      .ph-tabs{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;}
      .ph-tab{font-family:var(--mono);font-size:.72rem;padding:6px 14px;border-radius:7px;border:1px solid var(--border);background:none;color:var(--muted);cursor:pointer;}
      .ph-tab.active{background:var(--nes-blue);color:#fff;border-color:var(--nes-blue);}
      .ph-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;}
      .ph-kcard{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:11px 13px;}
      .ph-klbl{font-size:.62rem;color:var(--muted);margin-bottom:3px;display:flex;align-items:center;gap:4px;}
      .ph-kval{font-size:1.2rem;font-weight:700;}
      .ph-kdelta{font-size:.62rem;color:var(--muted);margin-top:2px;}
      .ph-kbar{height:3px;background:var(--border);border-radius:2px;margin-top:7px;}
      .ph-kfill{height:100%;border-radius:2px;}
      .partner-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:10px;}
      .partner-card:hover{border-color:#409cff33;}
      .ph-badge{font-size:.6rem;padding:2px 7px;border-radius:5px;font-family:monospace;text-transform:uppercase;font-weight:600;}
      .ph-btn{padding:5px 12px;border-radius:7px;font-size:.72rem;cursor:pointer;font-weight:600;border:none;}
      .ph-section-title{font-family:var(--mono);font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;}
      @media(max-width:700px){.ph-grid{grid-template-columns:1fr 1fr;}}
    </style>

    <div class="ph-tabs">
      <button class="ph-tab active" onclick="switchPhTab('overview',this)">Overview</button>
      <button class="ph-tab" onclick="switchPhTab('pending',this)">Pending <span id="pendingBadge" style="display:none;background:#f85149;color:#fff;font-size:.55rem;padding:1px 5px;border-radius:8px;margin-left:4px;"></span></button>
      <button class="ph-tab" onclick="switchPhTab('partners',this)">Partners</button>
      <button class="ph-tab" onclick="switchPhTab('commissions',this)">Commissions</button>
      <button class="ph-tab" onclick="switchPhTab('tiers',this)">Programme</button>
      <button class="ph-tab" onclick="switchPhTab('add-partner',this)">${t('button.addPartnerTab')}</button>
    </div>

    <!-- OVERVIEW -->
    <div id="ph-overview">
      <div class="ph-grid">
        <div class="ph-kcard" style="border-color:#409cff33;">
          <div class="ph-klbl"><i class="ti ti-trending-up" style="font-size:11px;color:#409cff;"></i>${t('plan.totalMrr')}</div>
          <div class="ph-kval" style="color:#409cff;">OMR ${totalMRR.toFixed(0)}</div>
          <div class="ph-kdelta">${allClients.filter(c=>c.status==='active').length} active clients</div>
          <div class="ph-kbar"><div class="ph-kfill" style="width:100%;background:#409cff;"></div></div>
        </div>
        <div class="ph-kcard" style="border-color:#3fb95033;">
          <div class="ph-klbl"><i class="ti ti-building" style="font-size:11px;color:#3fb950;"></i>Partner MRR</div>
          <div class="ph-kval" style="color:#3fb950;">OMR ${partnerMRR.toFixed(0)}</div>
          <div class="ph-kdelta">${partnerClients.filter(c=>c.status==='active').length} partner clients · ${totalMRR>0?Math.round((partnerMRR/totalMRR)*100):0}% of total</div>
          <div class="ph-kbar"><div class="ph-kfill" style="width:${totalMRR>0?Math.round((partnerMRR/totalMRR)*100):0}%;background:#3fb950;"></div></div>
        </div>
        <div class="ph-kcard" style="border-color:#d2992233;">
          <div class="ph-klbl"><i class="ti ti-coin" style="font-size:11px;color:#d29922;"></i>Commission Due</div>
          <div class="ph-kval" style="color:#d29922;">OMR ${pendingCommissions.toFixed(2)}</div>
          <div class="ph-kdelta">Pending approval · OMR ${paidCommissions.toFixed(2)} paid to date</div>
          <div class="ph-kbar"><div class="ph-kfill" style="width:60%;background:#d29922;"></div></div>
        </div>
        <div class="ph-kcard" style="border-color:#7f77dd33;">
          <div class="ph-klbl"><i class="ti ti-chart-bar" style="font-size:11px;color:#7f77dd;"></i>Success Rate</div>
          <div class="ph-kval" style="color:#7f77dd;">${successRate}%</div>
          <div class="ph-kdelta">Partner clients still active</div>
          <div class="ph-kbar"><div class="ph-kfill" style="width:${successRate}%;background:#7f77dd;"></div></div>
        </div>
      </div>

      <!-- Partner MRR strip -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:12px;">
        <div class="ph-section-title">Active Partners</div>
        ${allPartners.filter(p=>p.status==='active').length === 0
          ? `<div style="color:var(--muted);font-size:.8rem;text-align:center;padding:16px;">No active partners yet. Add your first partner →</div>`
          : allPartners.filter(p=>p.status==='active').map(p => {
              const pClients = partnerClients.filter(c=>c.partner_ref===p.ref_code&&c.status==='active');
              const pMRR = pClients.reduce((s,c)=>s+getPlanVal(c.plan,c.monthly_fee),0);
              const color = tierColors[p.tier]||'#409cff';
              const nextTier = p.tier==='apex' ? `${pClients.length}/8 to Alliance` : p.tier==='alliance' ? `${pClients.length}/20 to Elite` : 'Elite';
              return `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
                <div style="width:32px;height:32px;border-radius:8px;background:${tierBg[p.tier]||'rgba(64,156,255,0.08)'};display:flex;align-items:center;justify-content:center;font-size:.85rem;font-weight:700;color:${color};">${(p.name||'?')[0].toUpperCase()}</div>
                <div style="flex:1;">
                  <div style="font-size:.8rem;font-weight:600;color:#e6edf3;">${p.name}</div>
                  <div style="font-size:.65rem;color:var(--muted);">${nextTier} · ${pClients.length} active clients</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:.82rem;font-weight:700;color:${color};">OMR ${pMRR.toFixed(0)}/mo</div>
                  <span class="ph-badge" style="background:${tierBg[p.tier]};color:${color};">${p.tier}</span>
                </div>
              </div>`;
            }).join('')}
      </div>
    </div>

    <!-- PENDING APPLICATIONS -->
    <div id="ph-pending" style="display:none;">
      <div class="ph-section-title">Pending Applications (${pendingPartners.length})</div>
      ${pendingPartners.length === 0
        ? `<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:24px;text-align:center;color:var(--muted);font-size:.8rem;">No pending applications</div>`
        : pendingPartners.map(p=>`
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:10px;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:.85rem;font-weight:700;color:#e6edf3;margin-bottom:2px;">${p.name}</div>
              <div style="font-size:.72rem;color:var(--muted);">${p.email} · ${p.phone||'—'}</div>
              <div style="font-size:.72rem;color:var(--muted);margin-top:2px;">${p.partner_type||'—'} · ${p.region||'—'}</div>
              <div style="font-size:.72rem;color:var(--muted);margin-top:2px;">Self-selected: <span style="color:#d29922;font-weight:600;">${(p.tier||'apex').toUpperCase()}</span> · ${p.expected_referrals||'—'}/month</div>
              ${p.network_description?`<div style="font-size:.7rem;color:var(--muted);margin-top:6px;padding:8px;background:rgba(255,255,255,.03);border-radius:6px;border:1px solid var(--border);">${p.network_description}</div>`:''}
              <div style="font-size:.65rem;color:var(--muted);margin-top:6px;">Applied: ${new Date(p.applied_at||p.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;flex-shrink:0;">
              <select id="tier-assign-${p.id}" style="background:#0a0f1e;border:1px solid var(--border);border-radius:6px;padding:5px 10px;color:#e6edf3;font-size:.72rem;outline:none;">
                <option value="apex" ${(p.tier||'apex')==='apex'?'selected':''}>Apex</option>
                <option value="alliance" ${p.tier==='alliance'?'selected':''}>Alliance</option>
                <option value="elite" ${p.tier==='elite'?'selected':''}>Elite</option>
              </select>
              <div style="display:flex;gap:6px;">
                <button onclick="approvePendingPartner('${p.id}','${p.name}','${p.email}')" style="background:linear-gradient(135deg,#1a56db,#2563eb);border:none;border-radius:6px;padding:6px 14px;color:#fff;font-size:.72rem;font-family:var(--mono);cursor:pointer;display:flex;align-items:center;gap:4px;"><i class="ti ti-check"></i> Approve</button>
                <button onclick="rejectPendingPartner('${p.id}','${p.name}')" style="background:rgba(248,81,73,.1);border:1px solid #f8514940;border-radius:6px;padding:6px 14px;color:#f85149;font-size:.72rem;font-family:var(--mono);cursor:pointer;"><i class="ti ti-x"></i> Reject</button>
              </div>
            </div>
          </div>
        </div>`).join('')}
    </div>

    <!-- PARTNERS -->
    <div id="ph-partners" style="display:none;">
      <div class="ph-section-title">All Partners (${allPartners.length})</div>
      ${allPartners.length === 0
        ? `<div style="background:var(--card);border:1px dashed var(--border);border-radius:10px;padding:32px;text-align:center;color:var(--muted);font-size:.8rem;">No partners yet. Use the + Add Partner tab to add your first partner.</div>`
        : allPartners.map(p => {
            const pClients = partnerClients.filter(c=>c.partner_ref===p.ref_code);
            const activeClients = pClients.filter(c=>c.status==='active').length;
            const pCommissions = allCommissions.filter(c=>c.partner_id===p.id);
            const totalEarned = pCommissions.filter(c=>c.status==='paid').reduce((s,c)=>s+parseFloat(c.amount_omr||0),0);
            const pendingAmt = pCommissions.filter(c=>c.status==='pending').reduce((s,c)=>s+parseFloat(c.amount_omr||0),0);
            const color = tierColors[p.tier]||'#409cff';
            const nextTierClients = p.tier==='apex' ? 8 : p.tier==='alliance' ? 20 : null;
            const progress = nextTierClients ? Math.min(100,Math.round((activeClients/nextTierClients)*100)) : 100;
            return `<div class="partner-card">
              <div style="display:flex;align-items:flex-start;gap:12px;">
                <div style="width:40px;height:40px;border-radius:10px;background:${tierBg[p.tier]};display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:700;color:${color};flex-shrink:0;">${(p.name||'?')[0].toUpperCase()}</div>
                <div style="flex:1;">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-size:.88rem;font-weight:700;color:#e6edf3;">${p.name}</span>
                    <span class="ph-badge" style="background:${tierBg[p.tier]};color:${color};">${p.tier}</span>
                    <span class="ph-badge" style="background:${p.status==='active'?'rgba(63,185,80,0.1)':'rgba(248,81,73,0.1)'};color:${p.status==='active'?'#3fb950':'#f85149'};">${p.status}</span>
                    ${p.custom_rate ? `<span class="ph-badge" style="background:rgba(127,119,221,0.1);color:#7f77dd;">Custom ${p.custom_rate}%</span>` : ''}
                  </div>
                  <div style="font-size:.72rem;color:var(--muted);margin-top:3px;">${p.email} · ${p.phone||'—'}</div>
                  <div style="font-size:.72rem;color:var(--muted);">Ref: <span style="color:#409cff;font-family:monospace;">${p.ref_code}</span></div>
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0;">
                  <button class="ph-btn" onclick="editPartner('${p.id}')" style="background:rgba(64,156,255,0.1);color:#409cff;">${t('common.edit')}</button>
                  <button class="ph-btn" onclick="approveCommissions('${p.id}')" style="background:rgba(63,185,80,0.1);color:#3fb950;">Approve</button>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px;">
                <div style="background:var(--surface);border-radius:7px;padding:8px 10px;">
                  <div style="font-size:.6rem;color:var(--muted);">ACTIVE CLIENTS</div>
                  <div style="font-size:1rem;font-weight:700;color:#e6edf3;">${activeClients}</div>
                </div>
                <div style="background:var(--surface);border-radius:7px;padding:8px 10px;">
                  <div style="font-size:.6rem;color:var(--muted);">TOTAL REFERRED</div>
                  <div style="font-size:1rem;font-weight:700;color:#e6edf3;">${pClients.length}</div>
                </div>
                <div style="background:var(--surface);border-radius:7px;padding:8px 10px;">
                  <div style="font-size:.6rem;color:var(--muted);">PAID TO DATE</div>
                  <div style="font-size:1rem;font-weight:700;color:#3fb950;">OMR ${totalEarned.toFixed(2)}</div>
                </div>
                <div style="background:var(--surface);border-radius:7px;padding:8px 10px;">
                  <div style="font-size:.6rem;color:var(--muted);">PENDING</div>
                  <div style="font-size:1rem;font-weight:700;color:#d29922;">OMR ${pendingAmt.toFixed(2)}</div>
                </div>
              </div>
              ${nextTierClients ? `
              <div style="margin-top:10px;">
                <div style="display:flex;justify-content:space-between;font-size:.65rem;color:var(--muted);margin-bottom:4px;">
                  <span>Progress to ${p.tier==='apex'?'Alliance':'Elite'}</span>
                  <span>${activeClients}/${nextTierClients} active clients</span>
                </div>
                <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;">
                  <div style="height:100%;width:${progress}%;background:${color};border-radius:2px;transition:width .3s;"></div>
                </div>
                ${progress >= 100 ? `<div style="font-size:.65rem;color:#3fb950;margin-top:4px;">🎉 Eligible for tier upgrade — review and offer ${p.tier==='apex'?'Alliance':'Elite'}</div>` : ''}
              </div>` : `<div style="margin-top:8px;font-size:.65rem;color:#d29922;">⭐ Elite Partner — top tier achieved</div>`}
              ${p.custom_notes ? `<div style="margin-top:8px;font-size:.7rem;color:var(--muted);background:var(--surface);border-radius:6px;padding:6px 10px;">📝 ${p.custom_notes}</div>` : ''}
            </div>`;
          }).join('')}
    </div>

    <!-- COMMISSIONS -->
    <div id="ph-commissions" style="display:none;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div class="ph-section-title" style="margin-bottom:0;">Commission Ledger</div>
        <div style="display:flex;gap:6px;">
          <select id="commFilter" onchange="filterCommissions()" style="background:var(--card);border:1px solid var(--border);border-radius:6px;padding:4px 8px;color:var(--muted);font-size:.72rem;">
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;font-size:.72rem;" id="commTable">
          <thead>
            <tr style="background:rgba(64,156,255,0.05);">
              <th style="padding:8px 12px;text-align:left;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.partner')}</th>
              <th style="padding:8px 12px;text-align:left;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.client')}</th>
              <th style="padding:8px 12px;text-align:left;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.type')}</th>
              <th style="padding:8px 12px;text-align:left;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.month')}</th>
              <th style="padding:8px 12px;text-align:right;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.rate')}</th>
              <th style="padding:8px 12px;text-align:right;color:#d29922;font-weight:600;border-bottom:1px solid var(--border);">${t('tableHeader.amount')}</th>
              <th style="padding:8px 12px;text-align:center;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);">Status</th>
              <th style="padding:8px 12px;text-align:center;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);">Action</th>
            </tr>
          </thead>
          <tbody>
            ${allCommissions.length === 0
              ? `<tr><td colspan="8" style="padding:24px;text-align:center;color:var(--muted);">No commissions yet</td></tr>`
              : allCommissions.map((c,i) => {
                  const partner = allPartners.find(p=>p.id===c.partner_id);
                  const client = allClients.find(cl=>cl.id===c.client_id);
                  const statusColors = {pending:'#d29922',approved:'#409cff',paid:'#3fb950',clawed_back:'#f85149',held:'#8b949e'};
                  const sc = statusColors[c.status]||'#8b949e';
                  return `<tr style="border-bottom:1px solid var(--border);background:${i%2===0?'transparent':'rgba(255,255,255,0.01)'};">
                    <td style="padding:8px 12px;color:#e6edf3;">${partner?.name||'—'}</td>
                    <td style="padding:8px 12px;color:var(--muted);">${client?.name||'—'}</td>
                    <td style="padding:8px 12px;"><span style="font-size:.62rem;padding:2px 6px;border-radius:4px;background:${c.type==='first_sale'?'rgba(64,156,255,0.1)':'rgba(63,185,80,0.1)'};color:${c.type==='first_sale'?'#409cff':'#3fb950'};">${c.type==='first_sale'?'First Sale':'Recurring'}</span></td>
                    <td style="padding:8px 12px;color:var(--muted);font-family:monospace;">${c.month||'—'}</td>
                    <td style="padding:8px 12px;text-align:right;color:var(--muted);">${c.rate_pct}%</td>
                    <td style="padding:8px 12px;text-align:right;color:#d29922;font-weight:600;font-family:monospace;">OMR ${parseFloat(c.amount_omr||0).toFixed(2)}</td>
                    <td style="padding:8px 12px;text-align:center;"><span style="font-size:.62rem;padding:2px 7px;border-radius:5px;background:rgba(128,128,128,0.1);color:${sc};">${c.status}</span></td>
                    <td style="padding:8px 12px;text-align:center;">
                      ${c.status==='pending' ? `<button onclick="updateCommissionStatus('${c.id}','approved')" style="background:rgba(64,156,255,0.1);color:#409cff;border:none;border-radius:5px;padding:3px 8px;font-size:.65rem;cursor:pointer;">Approve</button>` : ''}
                      ${c.status==='approved' ? `<button onclick="updateCommissionStatus('${c.id}','paid')" style="background:rgba(63,185,80,0.1);color:#3fb950;border:none;border-radius:5px;padding:3px 8px;font-size:.65rem;cursor:pointer;">Mark Paid</button>` : ''}
                    </td>
                  </tr>`;
                }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- PROGRAMME / TIERS -->
    <div id="ph-tiers" style="display:none;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
        ${[
          {tier:'apex',name:'Apex Affiliate',who:'Individuals · freelancers · casual referrers',color:'#409cff',bg:'rgba(64,156,255,0.08)',first:40,recurring:null,setup:null,trigger:'8 active clients → offered Alliance'},
          {tier:'alliance',name:'Alliance Partner',who:'Consultants · agencies · active referrers',color:'#3fb950',bg:'rgba(63,185,80,0.08)',first:40,recurring:20,setup:null,trigger:'20 active clients + agreement → offered Elite'},
          {tier:'elite',name:'Elite Partner',who:'Resellers · integrators · strategic partners',color:'#d29922',bg:'rgba(210,153,34,0.08)',first:40,recurring:25,setup:50,trigger:'Negotiated — signed agreement required'}
        ].map(t=>`
          <div style="background:var(--card);border:1px solid ${t.color}33;border-radius:10px;padding:16px;">
            <div style="font-size:.62rem;font-family:monospace;color:${t.color};text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">${t.tier}</div>
            <div style="font-size:.92rem;font-weight:700;margin-bottom:3px;color:#e6edf3;">${t.name}</div>
            <div style="font-size:.7rem;color:var(--muted);margin-bottom:14px;">${t.who}</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              <div style="display:flex;justify-content:space-between;font-size:.75rem;padding:6px 8px;background:${t.bg};border-radius:6px;">
                <span style="color:var(--muted);">First sale</span>
                <span style="font-weight:700;color:${t.color};">${t.first}% one-time</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:.75rem;padding:6px 8px;background:${t.bg};border-radius:6px;">
                <span style="color:var(--muted);">Recurring</span>
                <span style="font-weight:700;color:${t.color};">${t.recurring ? t.recurring+'%/mo' : '—'}</span>
              </div>
              ${t.setup ? `<div style="display:flex;justify-content:space-between;font-size:.75rem;padding:6px 8px;background:${t.bg};border-radius:6px;">
                <span style="color:var(--muted);">Setup fee share</span>
                <span style="font-weight:700;color:${t.color};">${t.setup}%</span>
              </div>` : ''}
            </div>
            <div style="margin-top:12px;font-size:.65rem;color:var(--muted);border-top:1px solid var(--border);padding-top:8px;">
              <i class="ti ti-arrow-up-right" style="color:${t.color};"></i> ${t.trigger}
            </div>
          </div>`).join('')}
      </div>

      <!-- Rules -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 16px;">
        <div class="ph-section-title">Programme Rules</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.75rem;">
          ${[
            ['💰 Commission timing','Paid after client full monthly payment confirmed'],
            ['⏱️ First commission hold','7-day hold — NES Admin approves before payment'],
            ['🔄 Plan upgrades','Commission automatically recalculates on new plan value'],
            ['↩️ Clawback','First sale reversed if client refunded within 30 days'],
            ['📊 Pro-rata churn','If client churns mid-month, commission paid for days active'],
            ['🏆 Tier retention','Tier earned permanently — no downgrade for churn'],
            ['😴 Inactive rule','Tier review if no activity for 12 months'],
            ['🔗 Double referral','First registered ref code wins — timestamp is proof'],
            ['🚨 Fraud protection','Flagged if partner and client email domains match'],
            ['💳 Payment hold','Max 90 days if no bank details — then Telegram alert']
          ].map(([label,desc])=>`
            <div style="background:var(--surface);border-radius:7px;padding:8px 10px;">
              <div style="font-weight:600;color:#e6edf3;margin-bottom:2px;">${label}</div>
              <div style="color:var(--muted);font-size:.68rem;">${desc}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- ADD PARTNER -->
    <div id="ph-add-partner" style="display:none;">
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:20px;max-width:560px;">
        <div class="ph-section-title">Add New Partner</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div>
            <label style="font-size:.68rem;color:var(--muted);font-weight:600;display:block;margin-bottom:4px;">FULL NAME</label>
            <input id="np-name" placeholder="Ahmed Al Rashdi" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:9px 12px;color:#e6edf3;font-size:.8rem;outline:none;box-sizing:border-box;">
          </div>
          <div>
            <label style="font-size:.68rem;color:var(--muted);font-weight:600;display:block;margin-bottom:4px;">TIER</label>
            <select id="np-tier" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:9px 12px;color:#e6edf3;font-size:.8rem;outline:none;box-sizing:border-box;">
              <option value="apex">Apex Affiliate</option>
              <option value="alliance">Alliance Partner</option>
              <option value="elite">Elite Partner</option>
              <option value="custom">Custom/Strategic</option>
            </select>
          </div>
          <div>
            <label style="font-size:.68rem;color:var(--muted);font-weight:600;display:block;margin-bottom:4px;">EMAIL</label>
            <input id="np-email" type="email" placeholder="ahmed@company.com" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:9px 12px;color:#e6edf3;font-size:.8rem;outline:none;box-sizing:border-box;">
          </div>
          <div>
            <label style="font-size:.68rem;color:var(--muted);font-weight:600;display:block;margin-bottom:4px;">PHONE (WHATSAPP)</label>
            <input id="np-phone" placeholder="+968 9XXX XXXX" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:9px 12px;color:#e6edf3;font-size:.8rem;outline:none;box-sizing:border-box;">
          </div>
        </div>

        <div id="np-custom-section" style="display:none;background:rgba(127,119,221,0.05);border:1px solid rgba(127,119,221,0.2);border-radius:8px;padding:12px;margin-bottom:12px;">
          <div style="font-size:.68rem;color:#7f77dd;font-weight:600;margin-bottom:8px;">CUSTOM RATE OVERRIDE</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
            <div>
              <label style="font-size:.62rem;color:var(--muted);display:block;margin-bottom:3px;">RATE %</label>
              <input id="np-custom-rate" type="number" min="0" max="100" placeholder="e.g. 50" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:#e6edf3;font-size:.78rem;outline:none;box-sizing:border-box;">
            </div>
            <div>
              <label style="font-size:.62rem;color:var(--muted);display:block;margin-bottom:3px;">TYPE</label>
              <select id="np-custom-type" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:#e6edf3;font-size:.78rem;outline:none;box-sizing:border-box;">
                <option value="one_time">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
            <div>
              <label style="font-size:.62rem;color:var(--muted);display:block;margin-bottom:3px;">MONTHS (blank=forever)</label>
              <input id="np-custom-months" type="number" min="1" placeholder="e.g. 12" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:#e6edf3;font-size:.78rem;outline:none;box-sizing:border-box;">
            </div>
          </div>
          <div style="margin-top:8px;">
            <label style="font-size:.62rem;color:var(--muted);display:block;margin-bottom:3px;">NOTES / TERMS</label>
            <input id="np-custom-notes" placeholder="e.g. Strategic partner — exclusive Muscat territory, 6 month review" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:#e6edf3;font-size:.78rem;outline:none;box-sizing:border-box;">
          </div>
        </div>

        <div id="np-err" style="font-size:.72rem;color:#f85149;margin-bottom:10px;display:none;"></div>
        <div style="display:flex;gap:8px;">
          <button onclick="switchPhTab('partners',document.querySelector('.ph-tab'))" style="flex:1;background:none;border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--muted);cursor:pointer;font-size:.78rem;">${t('common.cancel')}</button>
          <button onclick="addPartner()" style="flex:1;background:linear-gradient(135deg,#1a56db,#2563eb);border:none;border-radius:8px;padding:10px;color:#fff;cursor:pointer;font-size:.78rem;font-weight:600;">${t('button.addPartner')}</button>
        </div>
      </div>
    </div>`;

  // Show/hide custom section based on tier
  const tierSel = el.querySelector('#np-tier');
  if(tierSel) tierSel.addEventListener('change', function(){
    const customSec = document.getElementById('np-custom-section');
    if(customSec) customSec.style.display = this.value==='custom' ? 'block' : 'none';
  });
}

function switchPhTab(tab, btn){
  ['overview','partners','commissions','tiers','add-partner'].forEach(t=>{
    const el=document.getElementById('ph-'+t);
    if(el) el.style.display = t===tab ? 'block' : 'none';
  });
  document.querySelectorAll('.ph-tab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
}

function updatePendingBadge(count) {
  const badge = document.getElementById('pendingBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline' : 'none';
  }
}

async function approvePendingPartner(id, name, email) {
  const tierEl = document.getElementById('tier-assign-' + id);
  const tier = tierEl ? tierEl.value : 'apex';
  if (!confirm('Approve ' + name + ' as ' + tier.toUpperCase() + ' partner and send agreement link?')) return;

  // Generate unique token
  const token = crypto.randomUUID().replace(/-/g,'').slice(0,24);
  const refInitials = name.split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2);
  const rand = Math.random().toString(36).slice(-4).toUpperCase();
  const ref_code = tier.toUpperCase().slice(0,4) + '-' + refInitials + '-' + rand;

  const { error } = {error:null};
  const r_upd = await fetch(API_URL+'/api/admin/partner/'+id,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({tier,status:'agreement_pending',ref_code,agreement_token:token,agreement_sent_at:new Date().toISOString()})});
  if (!r_upd.ok) { showToast(t('toast.errorUpdatingPartner')); return; }

  // Send agreement email via n8n
  try {
    await fetch('https://n8n.essential-services.org/webhook/partner-agreement-approval', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        name, email, tier, ref_code,
        agreement_url: 'https://nes-ai.com/partner-agreement.html?token=' + token
      })
    });
  } catch(e) { console.log('n8n webhook failed:', e.message); }

  // Telegram alert
  try {
    await fetch(API_URL+'/api/admin/notify', {
      method: 'POST', headers: {'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body: JSON.stringify({
        text: '✅ Partner Approved\n\nName: ' + name + '\nTier: ' + tier.toUpperCase() + '\nRef Code: ' + ref_code + '\nAgreement link sent to: ' + email
      })
    });
  } catch(e) {}

  showToast('✓ ' + name + ' approved — agreement link sent to ' + email);
  await renderPartnerHub();
}

async function rejectPendingPartner(id, name) {
  const reason = prompt('Reason for rejection (optional — will be included in email):');
  if (reason === null) return;
  const r_rej=await fetch(API_URL+'/api/admin/partner/'+id,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({status:'rejected'})});const { error } = r_rej.ok?{}:{message:'Failed'};
  if (error) { showToast('Error: ' + error.message); return; }

  try {
    await fetch('https://n8n.essential-services.org/webhook/partner-agreement-approval', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, status: 'rejected', reason: reason || 'No reason provided' })
    });
  } catch(e) {}

  showToast(name + ' application rejected');
  await renderPartnerHub();
}

async function addPartner(){
  const name = document.getElementById('np-name').value.trim();
  const email = document.getElementById('np-email').value.trim();
  const phone = document.getElementById('np-phone').value.trim();
  const tier = document.getElementById('np-tier').value;
  const customRate = document.getElementById('np-custom-rate')?.value || null;
  const customType = document.getElementById('np-custom-type')?.value || null;
  const customMonths = document.getElementById('np-custom-months')?.value || null;
  const customNotes = document.getElementById('np-custom-notes')?.value || null;
  const err = document.getElementById('np-err');
  err.style.display='none';

  if(!name||!email){ err.textContent='Name and email are required.'; err.style.display='block'; return; }

  // Generate ref code: TIER-INITIALS-RANDOM
  const initials = name.split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2);
  const rand = Math.random().toString(36).slice(-4).toUpperCase();
  const ref_code = `${tier.toUpperCase().slice(0,4)}-${initials}-${rand}`;

  const r_ins = await fetch(API_URL+'/api/admin/partner',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({name,email,phone,tier,ref_code,custom_rate:customRate?parseFloat(customRate):null,custom_type:customType||null,custom_duration_months:customMonths?parseInt(customMonths):null,custom_notes:customNotes||null,status:'active'})});
  if(!r_ins.ok){ const ed=await r_ins.json();err.textContent=ed.error||'Failed';err.style.display='block'; return; }
  // Send agreement email via n8n
  try {
    await fetch('https://n8n.essential-services.org/webhook/partner-agreement', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, email, phone, tier, ref_code })
    });
    showToast(`Partner added! Agreement sent to ${email} ✓`);
  } catch(e) {
    showToast(`Partner added! Ref code: ${ref_code} ✓`);
  }
  await renderPartnerHub();
}

async function updateCommissionStatus(id, status){
  const r_cs=await fetch(API_URL+'/api/admin/commission/'+id,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({status,payment_date:status==='paid'?new Date().toISOString().split('T')[0]:null})});
  if(r_cs.ok){ showToast('Commission '+status+' ✓'); await renderPartnerHub(); switchPhTab('commissions', null); }
}

async function approveCommissions(partnerId){
  const r_app=await fetch(API_URL+'/api/admin/commissions/approve/'+partnerId,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token}});const { error } = r_app.ok?{}:{message:'Failed'};
  if(!error){ showToast(t('toast.allCommissionsApproved')); await renderPartnerHub(); switchPhTab('commissions',null); }
}

async function editPartner(id){
  const { data: p } = await sb.from('partners').select('*').eq('id',id).single();
  if(!p) return;
  const newRate = prompt(`Custom rate % for ${p.name} (current: ${p.custom_rate||'default'})`);
  if(newRate === null) return;
  const newNotes = prompt(`Notes/terms (current: ${p.custom_notes||'none'})`);
  if(newNotes === null) return;
  const r_pr=await fetch(API_URL+'/api/admin/partner/'+id,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({custom_rate:newRate?parseFloat(newRate):null,custom_notes:newNotes||null})});
  if(r_pr.ok){ showToast(t('toast.partnerUpdated')); await renderPartnerHub(); }
}

function filterCommissions(){
  const filter = document.getElementById('commFilter').value;
  const rows = document.querySelectorAll('#commTable tbody tr');
  rows.forEach(row => {
    const status = row.querySelector('td:nth-child(7)')?.textContent?.trim()||'';
    row.style.display = (filter==='all'||status===filter) ? '' : 'none';
  });
}
