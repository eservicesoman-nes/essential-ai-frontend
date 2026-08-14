// team.js — extracted from index.html, NES Locale Phase 0
// 19 functions, zero logic changes

async function loadClientUsers(clientId){
  const el=document.getElementById('cm-users-list-'+clientId);
  if(!el)return;
  el.innerHTML=`<div style="color:var(--muted);font-family:var(--mono);font-size:.75rem;">${t('common.loading')}</div>`;
  try{
    const res=await fetch(API_URL+'/api/client/'+clientId+'/users');
    const json=await res.json();
    const users=json.users||[];
    if(users.length===0){
      el.innerHTML='<div style="color:var(--muted);font-family:var(--mono);font-size:.75rem;padding:12px 0;">No users linked yet. Click Invite User to add one.</div>';
      return;
    }
    const roleColors={ceo:'#409cff',manager:'#3fb950',staff:'#8b949e',nes_partner:'#7f77dd'};
    el.innerHTML=users.map(u=>`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:32px;height:32px;border-radius:50%;background:#0c1f35;display:flex;align-items:center;justify-content:center;font-size:.75rem;color:var(--nes-blue);font-weight:700;">${(u.email||'?')[0].toUpperCase()}</div>
          <div>
            <div style="font-size:.82rem;color:var(--text);">${u.email||'—'}</div>
            <div style="font-size:.68rem;color:${roleColors[u.role]||'var(--muted)'};font-family:var(--mono);text-transform:uppercase;">${u.role||'staff'}</div>
          </div>
        </div>
        <button onclick="removeClientUser('${clientId}','${u.id}')" style="background:none;border:1px solid #2d0e0e;border-radius:6px;padding:4px 8px;color:#f85149;cursor:pointer;font-size:.7rem;"><i class="ti ti-user-minus"></i></button>
      </div>`).join('');
  }catch(e){
    el.innerHTML='<div style="color:var(--red);font-family:var(--mono);font-size:.75rem;">Error: '+e.message+'</div>';
  }
}

function showInviteUserForm(clientId){
  const modal=document.createElement('div');
  modal.id='inviteModal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
  modal.innerHTML=`
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:14px;padding:24px;width:340px;max-width:95vw;">
      <div style="font-family:var(--mono);font-size:.85rem;font-weight:700;color:var(--nes-blue);margin-bottom:16px;"><i class="ti ti-user-plus" style="margin-right:6px;"></i>Invite User</div>
      <div class="form-field">
        <label class="form-label">Email Address</label>
        <input id="inviteEmail" type="email" class="form-input" placeholder="user@company.com">
      </div>
      <div class="form-field" style="margin-top:10px;">
        <label class="form-label">Role</label>
        <select id="inviteRole" class="form-select">
          <option value="ceo">CEO</option>
          <option value="manager" selected>Manager</option>
          <option value="staff">Staff</option>
        </select>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button onclick="sendClientInvite('${clientId}')" class="form-submit" style="flex:1;"><i class="ti ti-send"></i> Send Invite</button>
        <button onclick="document.getElementById('inviteModal').remove()" style="background:none;border:1px solid var(--border);border-radius:8px;padding:8px 14px;color:var(--muted);cursor:pointer;font-size:.8rem;">${t('common.cancel')}</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  setTimeout(()=>document.getElementById('inviteEmail')?.focus(),100);
}

async function sendClientInvite(clientId){
  const email=document.getElementById('inviteEmail')?.value?.trim();
  const role=document.getElementById('inviteRole')?.value;
  if(!email){alert('Please enter an email address');return;}
  const btn=document.querySelector('#inviteModal .form-submit');
  if(btn){btn.disabled=true;btn.innerHTML='<i class="ti ti-loader"></i> Sending...';}
  try{
    const res=await fetch(API_URL+'/api/client/'+clientId+'/invite',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({email,role})
    });
    const json=await res.json();
    if(!res.ok)throw new Error(json.error||'Failed');
    document.getElementById('inviteModal')?.remove();
    showToast('Invite sent to '+email+' ✓');
    loadClientUsers(clientId);
  }catch(e){
    alert('Error: '+e.message);
    if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-send"></i> Send Invite';}
  }
}

async function removeClientUser(clientId,userId){
  if(!confirm('Remove this user from the client?'))return;
  try{
    const res=await fetch(API_URL+'/api/client/'+clientId+'/user/'+userId,{method:'DELETE'});
    const json=await res.json();
    if(!res.ok)throw new Error(json.error||'Failed');
    showToast('User removed ✓');
    loadClientUsers(clientId);
  }catch(e){alert('Error: '+e.message);}
}

function cmTab(name,el){
  if(window._activeTab && window._activeTab!==name && window._cmUnsaved){
    if(!confirm('You have unsaved changes. Switch tab anyway?'))return;
    window._cmUnsaved=false;
  }
  window._activeTab=name;
  ['modules','creds','branding','agents','billing','users','email'].forEach(t=>{const e=document.getElementById('cm-'+t);if(e)e.style.display=t===name?'block':'none';});
  document.querySelectorAll('.cm-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');
  if(name==='users'&&window._activeClientId)loadClientUsers(window._activeClientId);
  if(name==='email'&&window._activeClientId)loadEmailAccounts(window._activeClientId);
  if(name==='billing'&&window._activeClientId)loadPaymentHistory(window._activeClientId);
}

function showDeptAccessModal(){
  const depts = ['Management','Sales','IT','Finance','HR','Operations'];
  const accessMap = {
    Management: ['CEO Dashboard','Team','Intelligence Feed','Email','Social Media','Leads','Briefcase','WhatsApp Auto-Reply'],
    Sales: ['Leads','Email','Social Media','Briefcase','WhatsApp Auto-Reply'],
    IT: ['System Logs','Team','Email'],
    Finance: ['CEO Dashboard','Email'],
    HR: ['Team','Email'],
    Operations: ['Email','Social Media','Briefcase']
  };
  const rows = depts.map(d => `
    <div style="padding:8px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;">
      <div style="width:90px;font-size:.75rem;font-weight:600;color:#e6edf3;">${d}</div>
      <div style="flex:1;display:flex;flex-wrap:wrap;gap:4px;">${(accessMap[d]||[]).map(m=>`<span style="font-size:.62rem;padding:2px 7px;border-radius:4px;background:rgba(64,156,255,0.1);color:#409cff;">${m}</span>`).join('')}</div>
    </div>`).join('');
  const modal = document.createElement('div');
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML=`<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;width:560px;max-width:95vw;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;">
    <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
      <div style="font-family:var(--mono);font-size:.8rem;color:#409cff;font-weight:700;">DEPARTMENT ACCESS</div>
      <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.2rem;">×</button>
    </div>
    <div style="overflow-y:auto;padding:8px 0;">${rows}</div>
    <div style="padding:10px 14px;border-top:1px solid var(--border);font-size:.68rem;color:var(--muted);">Access enforcement coming in next update — this shows the planned permissions per department.</div>
  </div>`;
  document.body.appendChild(modal);
}

async function showTeam(){
  const mc = document.getElementById('mainContent');
  mc.innerHTML = `
    <div style="padding:11px 160px 11px 60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;" class="an-hdr">
      <div>
        <div style="font-family:var(--mono);font-size:.8rem;color:#3fb950;font-weight:800;display:flex;align-items:center;gap:6px;"><i class="ti ti-users"></i>TEAM MANAGEMENT</div>
        <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">Invite staff · Assign departments · Manage roles</div>
      </div>
      <button onclick="showInviteModal()" style="background:linear-gradient(135deg,#1a56db,#2563eb);border:none;border-radius:8px;padding:7px 14px;color:#fff;font-size:.75rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;">
        <i class="ti ti-user-plus"></i> Invite Staff
      </button>
    </div>
    <div class="page scrollable" id="teamContent" style="padding:14px 18px;">
      <div style="text-align:center;padding:40px;color:var(--muted);font-family:var(--mono);font-size:.8rem;">${t('loading.team')}</div>
    </div>`;
  await loadTeam();
}

async function loadTeam(){
  const el = document.getElementById('teamContent');
  if(!el) return;
  try{
    // CEO/Manager already have their own client — use it directly, skip the admin picker
    if(userClientId && userRole !== 'nesadmin'){
      window.userClientId = userClientId;
    }
    // NES Admin — pick a client first
    if(!window.userClientId){
      const {data:clients} = await sb.from('clients').select('id,name,plan,status').order('name');
      el.innerHTML = `
        <div style="margin-bottom:16px;">
          <div style="font-family:var(--mono);font-size:.72rem;color:var(--muted);margin-bottom:10px;text-transform:uppercase;">Select Client to Manage</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${(clients||[]).map(c=>`
              <div onclick="window._adminTeamClientId='${c.id}';window._adminTeamClientName='${c.name}';loadTeamForClient('${c.id}')" 
                style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:border-color .15s;"
                onmouseover="this.style.borderColor='#409cff'" onmouseout="this.style.borderColor='var(--border)'">
                <div>
                  <div style="font-size:.82rem;color:#e6edf3;font-weight:600;">${c.name}</div>
                  <div style="font-size:.68rem;color:var(--muted);margin-top:2px;">${c.plan||'presence'} · ${c.status||'active'}</div>
                </div>
                <i class="ti ti-chevron-right" style="color:var(--muted);font-size:14px;"></i>
              </div>`).join('')}
          </div>
        </div>`;
      return;
    }
    const clientId = window.userClientId;

    // Get users + departments in parallel
    const [usersRes, deptsRes] = await Promise.all([
      fetch(API_URL+'/api/client/'+clientId+'/users', {headers:{Authorization:'Bearer '+session.access_token}}),
      sb.from('departments').select('id,name,permissions').eq('client_id',clientId).order('name')
    ]);
    const usersData = await usersRes.json();
    const users = usersData.users || [];
    const depts = deptsRes.data || [];

    const roleColors = {nesadmin:'#f85149',ceo:'#d29922',manager:'#409cff',staff:'#8b949e',nes_partner:'#7f77dd'};
    const deptOptions = depts.map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
    window._deptOptions = deptOptions;

    // Stats row
    const planLimits = {presence:3,operations:10,workforce:999,infrastructure:999};
    const limit = planLimits[window.userPlan] || 3;
    const used = users.length;

    let html = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;">
          <div style="font-size:.65rem;color:var(--muted);font-family:var(--mono);margin-bottom:4px;">TEAM MEMBERS</div>
          <div style="font-size:1.4rem;font-weight:700;color:#e6edf3;">${used}<span style="font-size:.75rem;color:var(--muted);font-weight:400;"> / ${limit}</span></div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;">
          <div style="font-size:.65rem;color:var(--muted);font-family:var(--mono);margin-bottom:4px;">DEPARTMENTS</div>
          <div style="font-size:1.4rem;font-weight:700;color:#3fb950;">${depts.length}</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;">
          <div style="font-size:.65rem;color:var(--muted);font-family:var(--mono);margin-bottom:4px;">SEATS LEFT</div>
          <div style="font-size:1.4rem;font-weight:700;color:#409cff;">${Math.max(0,limit-used)}</div>
        </div>
      </div>`;

    // Departments section
    html += `<div style="margin-bottom:20px;">
      <div style="font-family:var(--mono);font-size:.72rem;color:var(--muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em;">Departments</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${depts.map(d=>`
          <div onclick="filterByDept('${d.id}')" data-dept-badge="${d.id}" style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:8px;cursor:pointer;">
            <i class="ti ti-building" style="color:#409cff;font-size:13px;"></i>
            <span style="font-size:.78rem;color:#e6edf3;font-weight:500;">${d.name}</span>
            <span style="font-size:.65rem;color:var(--muted);">${users.filter(u=>u.department_id===d.id).length} staff</span>
            <i onclick="event.stopPropagation();deleteDept('${d.id}','${d.name.replace(/'/g,"\\'")}')" class="ti ti-x" style="color:var(--muted);font-size:13px;cursor:pointer;margin-left:4px;" title="Delete department"></i>
          </div>`).join('')}
        <div onclick="showAddDeptModal()" style="background:rgba(64,156,255,0.05);border:1px dashed rgba(64,156,255,0.3);border-radius:8px;padding:8px 14px;display:flex;align-items:center;gap:6px;cursor:pointer;color:#409cff;font-size:.75rem;">
          <i class="ti ti-plus"></i> Add Department
        </div>
        <div id="deptFilterClear" onclick="filterByDept(null)" style="display:none;background:rgba(248,81,73,0.08);border:1px solid rgba(248,81,73,0.25);border-radius:8px;padding:8px 14px;align-items:center;gap:6px;cursor:pointer;color:#f85149;font-size:.75rem;">
          <i class="ti ti-x"></i> Clear filter
        </div>
      </div>
    </div>`;

    // Staff list
    html += `<div>
      <div style="font-family:var(--mono);font-size:.72rem;color:var(--muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em;">Staff</div>`;

    if(users.length === 0){
      html += `<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:32px;text-align:center;color:var(--muted);font-size:.8rem;">
        No team members yet. <span style="color:#409cff;cursor:pointer;" onclick="showInviteModal()">Invite your first staff member →</span>
      </div>`;
    } else {
      html += `<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;overflow:hidden;">`;
      users.forEach((u,i) => {
        const roleColor = roleColors[u.role] || '#8b949e';
        html += `
          <div data-user-dept="${u.department_id||''}" style="display:flex;align-items:center;gap:12px;padding:12px 16px;${i<users.length-1?'border-bottom:1px solid var(--border);':''}">
            <div style="width:34px;height:34px;border-radius:50%;background:rgba(64,156,255,0.1);border:1px solid rgba(64,156,255,0.2);display:flex;align-items:center;justify-content:center;font-size:.85rem;font-weight:700;color:#409cff;flex-shrink:0;">
              ${(u.email||'?')[0].toUpperCase()}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:.8rem;color:#e6edf3;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${u.email||'—'}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                <span style="font-size:.6rem;padding:1px 6px;border-radius:4px;background:rgba(${roleColor==='#f85149'?'248,81,73':roleColor==='#d29922'?'210,153,34':roleColor==='#409cff'?'64,156,255':'139,148,158'},0.12);color:${roleColor};font-family:monospace;">${u.role||'staff'}</span>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
              <select onchange="updateUserDept('${u.id}','${clientId}',this.value)" style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:4px 8px;color:var(--muted);font-size:.7rem;cursor:pointer;">
                <option value="">No dept</option>
                ${deptOptions}
              </select>
              <select onchange="updateUserRole('${u.id}','${clientId}',this.value)" style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:4px 8px;color:var(--muted);font-size:.7rem;cursor:pointer;">
                <option value="ceo" ${u.role==='ceo'?'selected':''}>CEO</option>
                <option value="nes_partner" ${u.role==='nes_partner'?'selected':''}>Technology Partner</option>
                <option value="manager" ${u.role==='manager'?'selected':''}>Manager</option>
                <option value="staff" ${u.role==='staff'?'selected':''}>Staff</option>
              </select>
              <button onclick='showEditAccessModal(${JSON.stringify(u.id)},${JSON.stringify(clientId)},${JSON.stringify(u.granted_modules||[])})' style="background:none;border:1px solid rgba(64,156,255,0.3);border-radius:6px;padding:4px 8px;color:#409cff;cursor:pointer;font-size:.7rem;">Access</button>
              <button onclick="removeTeamMember('${u.id}','${clientId}')" style="background:none;border:1px solid rgba(248,81,73,0.3);border-radius:6px;padding:4px 8px;color:#f85149;cursor:pointer;font-size:.7rem;">Remove</button>
            </div>
          </div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
    el.innerHTML = html;
  }catch(e){
    if(el) el.innerHTML=`<div style="color:var(--red);padding:20px;font-size:.8rem;">Error loading team: ${e.message}</div>`;
  }
}

function showEditAccessModal(userId, clientId, currentModules){
  const existing = document.getElementById('accessModal');
  if(existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'accessModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#161b22;border:1px solid #1a2332;border-radius:14px;padding:28px;width:320px;max-width:90vw;">
      <div style="font-size:16px;font-weight:700;margin-bottom:6px;color:#e6edf3;">Edit Access</div>
      <div style="font-size:12px;color:#8b949e;margin-bottom:20px;">Grant or remove access to specific features</div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#e6edf3;margin-bottom:8px;cursor:pointer;"><input type="checkbox" id="editGrantItSetup" ${currentModules.includes('it_setup')?'checked':''} style="width:16px;height:16px;"> IT Setup</label>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#e6edf3;margin-bottom:8px;cursor:pointer;"><input type="checkbox" id="editGrantBriefcase" ${currentModules.includes('briefcase')?'checked':''} style="width:16px;height:16px;"> Briefcase</label>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#e6edf3;margin-bottom:20px;cursor:pointer;"><input type="checkbox" id="editGrantWhatsapp" ${currentModules.includes('whatsapp_autoreply')?'checked':''} style="width:16px;height:16px;"> WhatsApp Auto-Reply</label>
      <div id="accessErr" style="font-size:12px;color:#f85149;margin-bottom:10px;display:none;"></div>
      <div style="display:flex;gap:8px;">
        <button onclick="document.getElementById('accessModal').remove()" style="flex:1;background:none;border:1px solid #1a2332;border-radius:8px;padding:10px;color:#8b949e;cursor:pointer;font-size:13px;">${t('common.cancel')}</button>
        <button onclick="saveUserAccess('${userId}','${clientId}')" style="flex:1;background:linear-gradient(135deg,#1a56db,#2563eb);border:none;border-radius:8px;padding:10px;color:#fff;cursor:pointer;font-size:13px;font-weight:600;">${t('common.save')}</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function saveUserAccess(userId, clientId){
  const granted_modules = [];
  if(document.getElementById('editGrantItSetup')?.checked) granted_modules.push('it_setup');
  if(document.getElementById('editGrantBriefcase')?.checked) granted_modules.push('briefcase');
  if(document.getElementById('editGrantWhatsapp')?.checked) granted_modules.push('whatsapp_autoreply');
  const err = document.getElementById('accessErr');
  const btn = document.querySelector('#accessModal button:last-child');
  btn.textContent='Saving...'; btn.disabled=true;
  try{
    const res = await fetch(API_URL+'/api/client/'+clientId+'/user/'+userId+'/modules',{
      method:'PATCH',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({granted_modules})
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error||'Failed');
    document.getElementById('accessModal').remove();
    showToast('Access updated ✓');
    loadTeam();
  }catch(e){
    err.textContent=e.message; err.style.display='block';
    btn.textContent='Save'; btn.disabled=false;
  }
}

function showInviteModal(){
  const existing = document.getElementById('inviteModal');
  if(existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'inviteModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#161b22;border:1px solid #1a2332;border-radius:14px;padding:28px;width:360px;max-width:90vw;">
      <div style="font-size:16px;font-weight:700;margin-bottom:6px;color:#e6edf3;">Invite Staff Member</div>
      <div style="font-size:12px;color:#8b949e;margin-bottom:20px;">They'll receive an email to set up their account</div>
      <label style="font-size:11px;color:#8b949e;font-weight:600;display:block;margin-bottom:5px;">WORK EMAIL</label>
      <input id="inviteEmail" type="email" placeholder="ahmed@company.com" style="width:100%;background:#0a0f1e;border:1px solid #1a2332;border-radius:8px;padding:10px 12px;color:#e6edf3;font-size:13px;margin-bottom:12px;outline:none;box-sizing:border-box;">
      <label style="font-size:11px;color:#8b949e;font-weight:600;display:block;margin-bottom:5px;">ROLE</label>
      <select id="inviteRole" style="width:100%;background:#0a0f1e;border:1px solid #1a2332;border-radius:8px;padding:10px 12px;color:#e6edf3;font-size:13px;margin-bottom:12px;outline:none;box-sizing:border-box;">
        <option value="manager">Manager</option>
        <option value="staff" selected>Staff</option>
      </select>
      <label style="font-size:11px;color:#8b949e;font-weight:600;display:block;margin-bottom:5px;">DEPARTMENT (OPTIONAL)</label>
      <select id="inviteDept" style="width:100%;background:#0a0f1e;border:1px solid #1a2332;border-radius:8px;padding:10px 12px;color:#e6edf3;font-size:13px;margin-bottom:20px;outline:none;box-sizing:border-box;">
        <option value="">No department</option>
        ${window._deptOptions || ''}
      </select>
      <label style="font-size:11px;color:#8b949e;font-weight:600;display:block;margin-bottom:5px;">GRANT ACCESS TO (OPTIONAL)</label>
      <div style="margin-bottom:20px;">
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#e6edf3;margin-bottom:8px;cursor:pointer;"><input type="checkbox" id="grantItSetup" style="width:16px;height:16px;"> IT Setup</label>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#e6edf3;margin-bottom:8px;cursor:pointer;"><input type="checkbox" id="grantBriefcase" style="width:16px;height:16px;"> Briefcase</label>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#e6edf3;cursor:pointer;"><input type="checkbox" id="grantWhatsapp" style="width:16px;height:16px;"> WhatsApp Auto-Reply</label>
      </div>
      <div id="inviteErr" style="font-size:12px;color:#f85149;margin-bottom:10px;display:none;"></div>
      <div style="display:flex;gap:8px;">
        <button onclick="document.getElementById('inviteModal').remove()" style="flex:1;background:none;border:1px solid #1a2332;border-radius:8px;padding:10px;color:#8b949e;cursor:pointer;font-size:13px;">${t('common.cancel')}</button>
        <button onclick="sendTeamInvite()" style="flex:1;background:linear-gradient(135deg,#1a56db,#2563eb);border:none;border-radius:8px;padding:10px;color:#fff;cursor:pointer;font-size:13px;font-weight:600;">Send Invite</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('inviteEmail').focus();
}

async function sendTeamInvite(){
  const email = document.getElementById('inviteEmail').value.trim();
  const role = document.getElementById('inviteRole').value;
  const err = document.getElementById('inviteErr');
  err.style.display='none';
  if(!email){ err.textContent='Email is required.'; err.style.display='block'; return; }
  const granted_modules = [];
  if(document.getElementById('grantItSetup')?.checked) granted_modules.push('it_setup');
  if(document.getElementById('grantBriefcase')?.checked) granted_modules.push('briefcase');
  if(document.getElementById('grantWhatsapp')?.checked) granted_modules.push('whatsapp_autoreply');
  const department_id = document.getElementById('inviteDept')?.value || null;
  const btn = document.querySelector('#inviteModal button:last-child');
  btn.textContent='Sending...'; btn.disabled=true;
  try{
    const res = await fetch(API_URL+'/api/client/'+window.userClientId+'/invite',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({email,role,granted_modules,department_id})
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error||'Failed');
    document.getElementById('inviteModal').remove();
    showToast('Invite sent to '+email+' ✓');
    loadTeam();
  }catch(e){
    err.textContent=e.message; err.style.display='block';
    btn.textContent='Send Invite'; btn.disabled=false;
  }
}

async function loadTeamForClient(clientId){
  const el = document.getElementById('teamContent');
  if(!el) return;
  el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted);font-family:var(--mono);font-size:.8rem;">${t('common.loading')}</div>`;
  window.userClientId = clientId;
  await loadTeam();
  // Add back button
  const backBtn = document.createElement('div');
  backBtn.style.cssText = 'padding:10px 0;margin-bottom:16px;';
  backBtn.innerHTML = `<button onclick="window.userClientId=null;loadTeam()" style="background:none;border:1px solid var(--border);border-radius:7px;padding:6px 12px;color:var(--muted);font-size:.75rem;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class='ti ti-arrow-left'></i> Back to clients</button>`;
  const teamContent = document.getElementById('teamContent');
  if(teamContent) teamContent.insertBefore(backBtn, teamContent.firstChild);
}

async function updateUserRole(userId, clientId, role){
  try{
    const res = await fetch(API_URL+'/api/client/'+clientId+'/user/'+userId+'/role',{
      method:'PATCH',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({role})
    });
    if(res.ok) showToast('Role updated ✓');
  }catch(e){ showToast('Failed: '+e.message); }
}

async function updateUserDept(userId, clientId, deptId){
  try{
    const res = await fetch(API_URL+'/api/client/'+clientId+'/user/'+userId+'/department',{
      method:'PATCH',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({department_id: deptId||null})
    });
    const data = await res.json();
    if(res.ok) showToast('Department updated ✓');
    else showToast('Failed: '+(data.error||'Unknown error'));
  }catch(e){ showToast('Failed: '+e.message); }
}

async function removeTeamMember(userId, clientId){
  if(!confirm('Remove this team member?')) return;
  try{
    const res = await fetch(API_URL+'/api/client/'+clientId+'/user/'+userId,{
      method:'DELETE',
      headers:{'Authorization':'Bearer '+session.access_token}
    });
    if(res.ok){ showToast('Member removed ✓'); loadTeam(); }
  }catch(e){ showToast('Failed: '+e.message); }
}

function showAddDeptModal(){
  const name = prompt('Department name:');
  if(!name||!name.trim()) return;
  fetch(API_URL+'/api/admin/client/'+window.userClientId+'/department',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({name:name.trim()})})
    .then(async r=>{
      const data = await r.json().catch(()=>({}));
      if(r.ok && !data.error){ showToast('Department added ✓'); loadTeam(); }
      else showToast('Failed: '+(data.error||'Unknown error'));
    })
    .catch(e=>showToast('Failed: '+e.message));
}

function filterByDept(deptId){
  const rows = document.querySelectorAll('[data-user-dept]');
  const badges = document.querySelectorAll('[data-dept-badge]');
  const clearBtn = document.getElementById('deptFilterClear');
  rows.forEach(r => {
    r.style.display = (deptId === null || r.getAttribute('data-user-dept') === deptId) ? 'flex' : 'none';
  });
  badges.forEach(b => {
    b.style.borderColor = (deptId !== null && b.getAttribute('data-dept-badge') === deptId) ? '#409cff' : 'var(--border)';
  });
  if(clearBtn) clearBtn.style.display = deptId === null ? 'none' : 'flex';
}

function deleteDept(deptId, deptName){
  if(!confirm('Delete department \'' + deptName + '\'? This cannot be undone.')) return;
  if(!confirm('Are you absolutely sure? Staff assigned to \'' + deptName + '\' will be unassigned.')) return;
  fetch(API_URL+'/api/admin/client/'+window.userClientId+'/department/'+deptId,{method:'DELETE',headers:{'Authorization':'Bearer '+session.access_token}})
    .then(async r=>{
      const data = await r.json().catch(()=>({}));
      if(r.ok && !data.error){ showToast('Department deleted ✓'); loadTeam(); }
      else showToast('Failed: '+(data.error||'Unknown error'));
    })
    .catch(e=>showToast('Failed: '+e.message));
}
