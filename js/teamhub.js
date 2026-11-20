// teamhub.js - native Team Hub (Phase 3, 2026-11-20). Replaces the Rocket.Chat iframe.
// Reads come straight from Supabase (protected by Row Level Security).
// Every write goes through the backend (/api/team/...), where the database rules are enforced.
// All user text is rendered with esc() - never as HTML.

let TH = null;

function tht(key, fallback) { return t('teamHub.' + key, fallback); }

async function thApi(method, path, body) {
  const opts = { method, headers: { 'Authorization': 'Bearer ' + session.access_token } };
  if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const r = await fetch(API_URL + '/api' + path, opts);
  let j = {};
  try { j = await r.json(); } catch (e) {}
  if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
  return j;
}

function thName(id) {
  if (!id) return tht('bot', 'NES AI');
  const p = TH.people.get(id);
  return p ? p.name : tht('former', 'Former member');
}
function thInitials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';
}
function thTime(iso) {
  try { return new Date(iso).toLocaleString(getDateLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; }
}
function thText(s) { return esc(s).replace(/\n/g, '<br>'); }
function thToast(msg) { if (typeof showToast === 'function') showToast(msg); }
function thErr(e) { thToast(tht('error', 'Something went wrong') + ': ' + (e && e.message ? e.message : e)); }
function thChannelLabel(c) {
  if (c.kind === 'alerts') return '# ' + tht('chAlerts', 'alerts');
  if (c.kind === 'leads') return '# ' + tht('chLeads', 'leads');
  if (c.kind === 'ceo') return '# ' + tht('chCeo', 'ceo only');
  return '# ' + c.name;
}

const TH_CSS = `
#teamHubWrapper .th{max-width:1100px;margin:0 auto;padding:14px 16px 24px;display:flex;flex-direction:column;gap:10px;height:100%;box-sizing:border-box}
#teamHubWrapper .th-card{background:var(--card);border:1px solid var(--border);border-radius:12px}
#teamHubWrapper .th-wx{display:flex;justify-content:space-between;align-items:center;padding:10px 16px}
#teamHubWrapper .th-wx-l{display:flex;align-items:center;gap:12px}
#teamHubWrapper .th-cap{font-family:var(--mono);font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
#teamHubWrapper .th-box{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
#teamHubWrapper .th-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 14px;border-bottom:1px solid var(--border)}
#teamHubWrapper .th-grid{flex:1;min-height:0;display:grid;grid-template-columns:190px minmax(0,1fr)}
#teamHubWrapper .th-side{padding:8px;border-inline-end:1px solid var(--border);background:var(--card2);overflow-y:auto}
#teamHubWrapper .th-lb{font-size:.62rem;color:var(--muted);margin:12px 8px 4px;text-transform:uppercase;letter-spacing:.06em}
#teamHubWrapper .th-ci{font-size:.78rem;padding:6px 8px;border-radius:8px;color:var(--muted);display:flex;justify-content:space-between;align-items:center;gap:6px;cursor:pointer;user-select:none}
#teamHubWrapper .th-ci:hover{background:var(--accent-lo);color:var(--text)}
#teamHubWrapper .th-ci.on{background:var(--accent-md);color:var(--accent)}
#teamHubWrapper .th-n{font-size:.62rem;background:var(--accent);color:#fff;border-radius:10px;padding:0 6px}
#teamHubWrapper .th-main{display:flex;flex-direction:column;min-width:0;min-height:0}
#teamHubWrapper .th-mh{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 14px;border-bottom:1px solid var(--border)}
#teamHubWrapper .th-body{flex:1;overflow-y:auto;padding:12px 14px}
#teamHubWrapper .th-msg{display:flex;gap:8px;margin:0 0 12px}
#teamHubWrapper .th-av{width:28px;height:28px;border-radius:50%;background:var(--accent-lo);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:700;flex:none}
#teamHubWrapper .th-av.bot{background:rgba(210,153,34,.15);color:var(--amber)}
#teamHubWrapper .th-meta{font-size:.66rem;color:var(--muted);margin:0 0 2px}
#teamHubWrapper .th-txt{font-size:.82rem;line-height:1.5;color:var(--text);word-wrap:break-word;overflow-wrap:anywhere}
#teamHubWrapper .th-act{font-size:.62rem;color:var(--muted);cursor:pointer;margin-inline-start:8px}
#teamHubWrapper .th-act:hover{color:var(--accent)}
#teamHubWrapper .th-comp{display:flex;gap:8px;padding:10px 14px;border-top:1px solid var(--border)}
#teamHubWrapper textarea,#teamHubWrapper input,#teamHubWrapper select{background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:7px 10px;font-size:.8rem;font-family:inherit;box-sizing:border-box}
#teamHubWrapper textarea{flex:1;resize:none;min-height:38px;max-height:140px}
#teamHubWrapper .th-btn{background:var(--nes-btn-grad);color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:.75rem;cursor:pointer;white-space:nowrap}
#teamHubWrapper .th-btn2{background:transparent;color:var(--muted);border:1px solid var(--border);border-radius:8px;padding:5px 10px;font-size:.7rem;cursor:pointer;white-space:nowrap}
#teamHubWrapper .th-btn2:hover{color:var(--text);border-color:var(--accent)}
#teamHubWrapper .th-chip{font-size:.68rem;padding:3px 10px;border-radius:14px;background:var(--accent-lo);color:var(--muted);display:inline-flex;gap:5px;align-items:center}
#teamHubWrapper .th-pin{background:var(--accent-lo);border:1px solid var(--accent-md);border-radius:10px;padding:10px 12px;margin:0 0 10px}
#teamHubWrapper .th-note{border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin:0 0 10px}
#teamHubWrapper .th-alert{border:1px solid rgba(210,153,34,.4);background:rgba(210,153,34,.08);border-radius:10px;padding:8px 10px;margin:0 0 10px}
#teamHubWrapper .th-form{display:flex;flex-direction:column;gap:8px;border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin:0 0 14px}
#teamHubWrapper .th-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#teamHubWrapper .th-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center;font-size:.72rem;margin:0 0 12px}
#teamHubWrapper .th-cal span{padding:8px 0;border-radius:6px;color:var(--muted)}
#teamHubWrapper .th-cal .h{font-size:.6rem}
#teamHubWrapper .th-cal .wk{background:var(--card2)}
#teamHubWrapper .th-cal .ev{background:var(--accent-md);color:var(--accent);font-weight:700}
#teamHubWrapper .th-cal .td{outline:1px solid var(--accent)}
#teamHubWrapper .th-empty{color:var(--muted);font-size:.78rem;text-align:center;padding:30px 10px}
#teamHubWrapper .th-tbl{width:100%;border-collapse:collapse;font-size:.76rem}
#teamHubWrapper .th-tbl td,#teamHubWrapper .th-tbl th{padding:6px 4px;border-bottom:1px solid var(--border);text-align:start}
@media (max-width:900px){
  #teamHubWrapper{inset-inline-start:0 !important}
  #teamHubWrapper .th{padding:10px 8px 16px}
  #teamHubWrapper .th-grid{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}
  #teamHubWrapper .th-side{border-inline-end:none;border-bottom:1px solid var(--border);display:flex;flex-wrap:wrap;gap:4px;max-height:140px}
  #teamHubWrapper .th-lb{display:none}
  #teamHubWrapper .th-ci{border:1px solid var(--border);border-radius:16px;padding:3px 10px}
}`;

function thInjectCss() {
  if (document.getElementById('thCss')) return;
  const s = document.createElement('style');
  s.id = 'thCss';
  s.textContent = TH_CSS;
  document.head.appendChild(s);
}

// ---------------- start / stop ----------------
async function thInit(root) {
  thInjectCss();
  root.innerHTML = '<div class="th-empty">' + esc(t('loading.default', 'Loading...')) + '</div>';
  try {
    const info = await thApi('GET', '/team/people');
    TH = {
      root, me: info.me, role: info.role, owner: info.owner, fullHub: info.full_hub, weather: info.weather,
      isManager: info.role === 'manager',
      people: new Map(info.people.map((p) => [p.id, p])),
      channels: [], mine: new Map(), unread: {}, sel: null, rt: null, monthOffset: 0, events: [],
    };
    await thLoadChannels();
    if (TH.owner && TH.fullHub && !TH.channels.some((c) => c.kind === 'alerts')) {
      await thApi('POST', '/team/bootstrap');
      await thLoadChannels();
    }
    thRenderShell();
    thApi('POST', '/team/usage', { event: 'open_hub' }).catch(() => {});
    const first = TH.fullHub ? { type: 'notices' } : (TH.channels.find((c) => c.kind === 'team') ? { type: 'channel', id: TH.channels.find((c) => c.kind === 'team').id } : { type: 'empty' });
    thSelect(first);
  } catch (e) {
    root.innerHTML = '<div class="th-empty">' + esc(tht('loadFail', 'Team Hub could not load')) + ': ' + esc(e.message) + '</div>';
  }
}

function thTeardown() {
  if (TH && TH.rt) { try { sb.removeChannel(TH.rt); } catch (e) {} }
  TH = null;
}

async function thLoadChannels() {
  const [{ data: chs, error: e1 }, { data: mem, error: e2 }] = await Promise.all([
    sb.from('team_channels').select('id,slug,name,kind,archived_at,created_at').is('archived_at', null).order('created_at'),
    sb.from('team_members').select('channel_id,user_id,muted,last_read_at').eq('user_id', TH.me),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const order = { ceo: 0, alerts: 1, leads: 2, team: 3 };
  TH.channels = (chs || []).sort((a, b) => (order[a.kind] - order[b.kind]) || a.name.localeCompare(b.name));
  TH.mine = new Map((mem || []).map((m) => [m.channel_id, m]));
  await thLoadUnread();
}

async function thLoadUnread() {
  const jobs = [];
  TH.unread = {};
  TH.mine.forEach((m, chId) => {
    let q = sb.from('team_messages').select('id', { count: 'exact', head: true }).eq('channel_id', chId).neq('author_id', TH.me);
    if (m.last_read_at) q = q.gt('created_at', m.last_read_at);
    jobs.push(q.then(({ count }) => { TH.unread[chId] = count || 0; }));
  });
  await Promise.all(jobs);
}

// ---------------- shell ----------------
function thRenderShell() {
  const legacy = TH.role === 'nesadmin'
    ? '<a class="th-btn2" href="' + esc(ROCKET_URL) + '" target="_blank" rel="noopener">' + esc(tht('legacy', 'Rocket.Chat (old)')) + '</a>' : '';
  TH.root.innerHTML = '<div class="th">'
    + ((TH.fullHub && TH.weather) ? '<div class="th-card th-wx" id="thWx"><span class="th-cap">' + esc(tht('weatherLoading', 'Weather...')) + '</span></div>' : '')
    + '<div class="th-card th-box">'
    + '<div class="th-top"><div style="display:flex;gap:6px;flex-wrap:wrap" id="thForYou"></div>'
    + '<div style="display:flex;gap:6px;align-items:center">' + legacy
    + '<button class="th-btn2" onclick="thSelect({type:\'prefs\'})"><i class="ti ti-bell-off"></i> ' + esc(tht('quietHours', 'Quiet hours')) + '</button></div></div>'
    + '<div class="th-grid"><nav class="th-side" id="thSide"></nav><section class="th-main" id="thMain"></section></div>'
    + '</div></div>';
  thRenderSide();
  thForYou();
  if (TH.fullHub && TH.weather) thWeather();
}

// Muted channels show no unread badge.
function thBadge(id) { const m = TH.mine.get(id); return m && !m.muted ? (TH.unread[id] || 0) : 0; }

function thRenderSide() {
  const el = document.getElementById('thSide');
  if (!el) return;
  const s = TH.sel || {};
  const item = (key, icon, label, on, badge) => '<div class="th-ci' + (on ? ' on' : '') + '" onclick="' + key + '"><span><i class="ti ' + icon + '"></i> ' + esc(label) + '</span>' + (badge ? '<span class="th-n">' + badge + '</span>' : '') + '</div>';
  let h = '';
  if (TH.fullHub) {
    h += item("thSelect({type:'notices'})", 'ti-speakerphone', tht('noticeboard', 'Noticeboard'), s.type === 'notices');
    h += item("thSelect({type:'calendar'})", 'ti-calendar', tht('calendar', 'Calendar'), s.type === 'calendar');
  }
  const sys = TH.channels.filter((c) => c.kind !== 'team');
  if (sys.length) {
    h += '<p class="th-lb">' + esc(tht('management', 'Management')) + '</p>';
    sys.forEach((c) => { h += item("thSelect({type:'channel',id:'" + c.id + "'})", 'ti-hash', thChannelLabel(c).slice(2), s.type === 'channel' && s.id === c.id, thBadge(c.id)); });
  }
  h += '<p class="th-lb">' + esc(tht('teams', 'Teams')) + '</p>';
  TH.channels.filter((c) => c.kind === 'team').forEach((c) => { h += item("thSelect({type:'channel',id:'" + c.id + "'})", 'ti-hash', c.name, s.type === 'channel' && s.id === c.id, thBadge(c.id)); });
  if (TH.owner) h += item("thSelect({type:'newchannel'})", 'ti-plus', tht('newChannel', 'New channel'), s.type === 'newchannel');
  if (TH.fullHub && (TH.owner || TH.isManager)) h += item("thSelect({type:'access'})", 'ti-key', tht('access', 'Access'), s.type === 'access');
  el.innerHTML = h;
}

async function thForYou() {
  const el = document.getElementById('thForYou');
  if (!el) return;
  try {
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const [{ data: men }, ev] = await Promise.all([
      sb.from('team_mentions').select('message_id,team_messages!inner(created_at)').eq('user_id', TH.me).gte('team_messages.created_at', since),
      TH.fullHub ? sb.from('team_events').select('title,starts_at').gte('starts_at', new Date().toISOString()).order('starts_at').limit(1) : Promise.resolve({ data: [] }),
    ]);
    let h = '<span class="th-chip"><i class="ti ti-at"></i> ' + esc(tht('mentions7d', 'Mentions this week')) + ': ' + ((men || []).length) + '</span>';
    if (ev && ev.data && ev.data[0]) h += '<span class="th-chip"><i class="ti ti-clock"></i> ' + esc(tht('next', 'Next')) + ': ' + esc(ev.data[0].title) + ', ' + esc(thTime(ev.data[0].starts_at)) + '</span>';
    el.innerHTML = h;
  } catch (e) { el.innerHTML = ''; }
}

const TH_WX_LAT_LON = { pt: [38.72, -9.14] }; // default Muscat
async function thWeather() {
  const el = document.getElementById('thWx');
  if (!el) return;
  const [lat, lon] = TH_WX_LAT_LON[window.clientLocale] || [23.6, 58.59];
  try {
    const w = await thApi('GET', '/team/weather?lat=' + lat + '&lon=' + lon);
    if (!w.enabled) { el.remove(); return; }
    const c = w.weather_code;
    const k = c <= 1 ? 'sunny' : c <= 3 ? 'partlyCloudy' : c <= 48 ? 'foggy' : c <= 67 ? 'rainy' : 'cloudy';
    el.innerHTML = '<div class="th-wx-l"><i class="ti ti-sun" style="font-size:1.4rem;color:var(--accent)"></i><div>'
      + '<div class="th-cap">' + esc(tht('weather', 'Weather')) + '</div>'
      + '<div style="font-size:.85rem;font-weight:600">' + esc(t('weather.' + k)) + ' · ' + esc(t('weather.humidity')) + ' ' + esc(String(w.humidity)) + '%</div></div></div>'
      + '<div style="text-align:end"><div style="font-size:1.2rem;font-weight:700;color:var(--accent)">' + Math.round(w.temperature) + '°C</div>'
      + '<div class="th-cap">' + esc(t('ceoDashboardSection.feelsLike')) + ' ' + Math.round(w.feels_like) + '°C · <span title="' + esc(w.attribution) + '">Open-Meteo</span></div></div>';
  } catch (e) { el.remove(); }
}

// ---------------- navigation ----------------
async function thSelect(sel) {
  if (!TH) return;
  if (TH.rt) { try { sb.removeChannel(TH.rt); } catch (e) {} TH.rt = null; }
  TH.sel = sel;
  thRenderSide();
  const main = document.getElementById('thMain');
  if (!main) return;
  main.innerHTML = '<div class="th-empty">' + esc(t('loading.default', 'Loading...')) + '</div>';
  try {
    if (sel.type === 'channel') await thChannel(main, sel.id);
    else if (sel.type === 'members') await thMembers(main, sel.id);
    else if (sel.type === 'notices') await thNotices(main);
    else if (sel.type === 'calendar') await thCalendar(main);
    else if (sel.type === 'access') await thAccess(main);
    else if (sel.type === 'newchannel') thNewChannel(main);
    else if (sel.type === 'prefs') await thPrefs(main);
    else main.innerHTML = '<div class="th-empty">' + esc(TH.owner ? tht('emptyOwner', 'Create your first channel to start.') : tht('emptyStaff', 'You have not been added to a channel yet.')) + '</div>';
  } catch (e) {
    main.innerHTML = '<div class="th-empty">' + esc(tht('loadFail', 'Could not load')) + ': ' + esc(e.message) + '</div>';
  }
}

// ---------------- channel ----------------
function thMsgHtml(m) {
  const bot = m.author_kind !== 'user';
  const name = bot ? tht('bot', 'NES AI') : thName(m.author_id);
  const mineMsg = m.author_id === TH.me;
  const acts = (mineMsg ? '<span class="th-act" onclick="thEditMsg(\'' + m.id + '\')">' + esc(tht('edit', 'Edit')) + '</span>' : '')
    + ((mineMsg || TH.owner) ? '<span class="th-act" onclick="thDeleteMsg(\'' + m.id + '\')">' + esc(tht('delete', 'Delete')) + '</span>' : '');
  const inner = '<div class="th-meta">' + esc(name) + ' · ' + esc(thTime(m.created_at)) + (m.edited_at ? ' · ' + esc(tht('edited', 'edited')) : '') + acts + '</div>'
    + '<div class="th-txt" id="thBody_' + m.id + '">' + thText(m.body) + '</div>';
  if (m.kind === 'event') return '<div class="th-alert" id="thMsg_' + m.id + '"><div class="th-meta"><i class="ti ti-bell"></i> ' + esc(tht('alert', 'Alert')) + ' · ' + esc(thTime(m.created_at)) + '</div><div class="th-txt">' + thText(m.body) + '</div></div>';
  return '<div class="th-msg" id="thMsg_' + m.id + '"><div class="th-av' + (bot ? ' bot' : '') + '">' + esc(thInitials(name)) + '</div><div style="min-width:0;flex:1">' + inner + '</div></div>';
}

async function thChannel(main, id) {
  const ch = TH.channels.find((c) => c.id === id);
  if (!ch) { main.innerHTML = '<div class="th-empty">' + esc(tht('notFound', 'Channel not found')) + '</div>'; return; }
  const member = TH.mine.get(id);
  const { data, error } = await sb.from('team_messages')
    .select('id,author_id,author_kind,kind,event_type,body,created_at,edited_at')
    .eq('channel_id', id).order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  const msgs = (data || []).reverse();
  const canManage = TH.owner || (TH.isManager && TH.fullHub && ch.kind === 'team');
  main.innerHTML = '<div class="th-mh"><strong style="font-size:.85rem">' + esc(thChannelLabel(ch)) + '</strong><div class="th-row">'
    + (canManage ? '<button class="th-btn2" onclick="thSelect({type:\'members\',id:\'' + id + '\'})"><i class="ti ti-users"></i> ' + esc(tht('members', 'Members')) + '</button>' : '')
    + (member ? '<button class="th-btn2" onclick="thMute(\'' + id + '\',' + (!member.muted) + ')"><i class="ti ti-bell' + (member.muted ? '' : '-off') + '"></i> ' + esc(member.muted ? tht('unmute', 'Unmute') : tht('mute', 'Mute')) + '</button>' : '')
    + ((TH.owner && ch.kind === 'team') ? '<button class="th-btn2" onclick="thArchive(\'' + id + '\')"><i class="ti ti-archive"></i> ' + esc(tht('archive', 'Archive')) + '</button>' : '')
    + '</div></div>'
    + '<div class="th-body" id="thMsgs">' + (msgs.length ? msgs.map(thMsgHtml).join('') : '<div class="th-empty">' + esc(tht('noMessages', 'No messages yet.')) + '</div>') + '</div>'
    + '<div class="th-comp"><textarea id="thInput" rows="1" maxlength="4000" placeholder="' + esc(tht('typeMessage', 'Write a message. Use @name to mention.')) + '"></textarea>'
    + '<button class="th-btn" id="thSend" onclick="thSend(\'' + id + '\')"><i class="ti ti-send"></i></button></div>';
  const box = document.getElementById('thMsgs');
  box.scrollTop = box.scrollHeight;
  const inp = document.getElementById('thInput');
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); thSend(id); } });
  // Live updates for this channel (Row Level Security decides what arrives).
  TH.rt = sb.channel('team-' + id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'team_messages', filter: 'channel_id=eq.' + id }, (p) => {
      const m = p.new;
      if (!m || !document.getElementById('thMsgs')) return;
      const old = document.getElementById('thMsg_' + m.id);
      if (m.deleted_at) { if (old) old.remove(); return; }
      if (old) { old.outerHTML = thMsgHtml(m); return; }
      const b = document.getElementById('thMsgs');
      if (b.querySelector('.th-empty')) b.innerHTML = '';
      b.insertAdjacentHTML('beforeend', thMsgHtml(m));
      b.scrollTop = b.scrollHeight;
    }).subscribe();
  if (member) {
    thApi('PATCH', '/team/channels/' + id + '/me', { read: true }).then(() => { TH.unread[id] = 0; member.last_read_at = new Date().toISOString(); thRenderSide(); }).catch(() => {});
  }
  thApi('POST', '/team/usage', { event: ch.kind === 'alerts' ? 'open_alert' : 'open_channel' }).catch(() => {});
}

function thMentionIds(text) {
  const ids = [];
  const tokens = (text.match(/@([^\s@.,!?:;]+)/g) || []).map((s) => s.slice(1).toLowerCase());
  if (!tokens.length) return ids;
  TH.people.forEach((p) => {
    const first = String(p.name).split(/\s+/)[0].toLowerCase();
    const joined = String(p.name).replace(/\s+/g, '').toLowerCase();
    if (tokens.includes(first) || tokens.includes(joined)) ids.push(p.id);
  });
  return ids.filter((id) => id !== TH.me);
}

async function thSend(id) {
  const inp = document.getElementById('thInput');
  const btn = document.getElementById('thSend');
  const body = (inp.value || '').trim();
  if (!body || btn.disabled) return;
  btn.disabled = true;
  try {
    await thApi('POST', '/team/channels/' + id + '/messages', { body, mentions: thMentionIds(body) });
    inp.value = '';
  } catch (e) { thErr(e); }
  btn.disabled = false;
  inp.focus();
}

async function thEditMsg(msgId) {
  const el = document.getElementById('thBody_' + msgId);
  const current = el ? el.innerText : '';
  const body = prompt(tht('editPrompt', 'Edit message'), current);
  if (body === null || !body.trim()) return;
  try { await thApi('PATCH', '/team/messages/' + msgId, { body }); } catch (e) { thErr(e); }
}
async function thDeleteMsg(msgId) {
  if (!confirm(tht('deleteConfirm', 'Delete this message?'))) return;
  try { await thApi('DELETE', '/team/messages/' + msgId); const el = document.getElementById('thMsg_' + msgId); if (el) el.remove(); } catch (e) { thErr(e); }
}
async function thMute(id, muted) {
  try { await thApi('PATCH', '/team/channels/' + id + '/me', { muted }); TH.mine.get(id).muted = muted; thSelect({ type: 'channel', id }); } catch (e) { thErr(e); }
}
async function thArchive(id) {
  if (!confirm(tht('archiveConfirm', 'Archive this channel? Messages are kept.'))) return;
  try { await thApi('PATCH', '/team/channels/' + id, { archived: true }); await thLoadChannels(); thSelect({ type: TH.fullHub ? 'notices' : 'empty' }); } catch (e) { thErr(e); }
}

// ---------------- members ----------------
async function thMembers(main, id) {
  const ch = TH.channels.find((c) => c.id === id);
  const { data, error } = await sb.from('team_members').select('user_id,granted_by').eq('channel_id', id);
  if (error) throw error;
  const inIt = new Set((data || []).map((m) => m.user_id));
  const roleLbl = (r) => tht('role_' + r, r);
  const rows = (data || []).map((m) => {
    const canRemove = TH.owner || m.granted_by === TH.me;
    return '<tr><td>' + esc(thName(m.user_id)) + '</td><td>' + esc(roleLbl((TH.people.get(m.user_id) || {}).role || '')) + '</td><td style="text-align:end">'
      + (canRemove && m.user_id !== TH.me ? '<button class="th-btn2" onclick="thRemoveMember(\'' + id + '\',\'' + m.user_id + '\')">' + esc(tht('remove', 'Remove')) + '</button>' : '') + '</td></tr>';
  }).join('');
  const options = [...TH.people.values()].filter((p) => !inIt.has(p.id) && (TH.owner || p.role === 'staff'))
    .map((p) => '<option value="' + esc(p.id) + '">' + esc(p.name) + ' (' + esc(roleLbl(p.role)) + ')</option>').join('');
  main.innerHTML = '<div class="th-mh"><strong style="font-size:.85rem">' + esc(thChannelLabel(ch)) + ' · ' + esc(tht('members', 'Members')) + '</strong>'
    + '<button class="th-btn2" onclick="thSelect({type:\'channel\',id:\'' + id + '\'})"><i class="ti ti-arrow-back-up"></i> ' + esc(tht('back', 'Back')) + '</button></div>'
    + '<div class="th-body">'
    + (options ? '<div class="th-form"><div class="th-row"><select id="thAddUser" style="flex:1">' + options + '</select><button class="th-btn" onclick="thAddMember(\'' + id + '\')">' + esc(tht('add', 'Add')) + '</button></div>'
      + (TH.isManager ? '<div class="th-cap">' + esc(tht('quotaHint', 'You can add staff within the quota the CEO gave you.')) + '</div>' : '') + '</div>' : '')
    + '<table class="th-tbl">' + rows + '</table></div>';
}
async function thAddMember(id) {
  const uid = document.getElementById('thAddUser').value;
  try { await thApi('POST', '/team/channels/' + id + '/members', { user_id: uid }); thSelect({ type: 'members', id }); } catch (e) { thErr(e); }
}
async function thRemoveMember(id, uid) {
  if (!confirm(tht('removeConfirm', 'Remove this person from the channel?'))) return;
  try { await thApi('DELETE', '/team/channels/' + id + '/members/' + uid); thSelect({ type: 'members', id }); } catch (e) { thErr(e); }
}

function thNewChannel(main) {
  main.innerHTML = '<div class="th-mh"><strong style="font-size:.85rem">' + esc(tht('newChannel', 'New channel')) + '</strong></div><div class="th-body"><div class="th-form">'
    + '<input id="thChName" maxlength="60" placeholder="' + esc(tht('channelName', 'Channel name, e.g. Sales staff')) + '">'
    + '<div class="th-row"><button class="th-btn" onclick="thCreateChannel()">' + esc(tht('create', 'Create')) + '</button></div></div></div>';
}
async function thCreateChannel() {
  const name = document.getElementById('thChName').value;
  try { const r = await thApi('POST', '/team/channels', { name }); await thLoadChannels(); thSelect({ type: 'members', id: r.channel.id }); } catch (e) { thErr(e); }
}

// ---------------- noticeboard ----------------
async function thNotices(main) {
  const [{ data: notes, error }, { data: reads }] = await Promise.all([
    sb.from('team_notices').select('id,channel_id,author_id,title,body,pinned,created_at').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(50),
    sb.from('team_notice_reads').select('notice_id').eq('user_id', TH.me),
  ]);
  if (error) throw error;
  const seen = new Set((reads || []).map((r) => r.notice_id));
  const canPost = TH.owner || TH.isManager;
  const scopes = (TH.owner ? '<option value="">' + esc(tht('companyWide', 'Whole company')) + '</option>' : '')
    + TH.channels.filter((c) => c.kind === 'team' && (TH.owner || TH.mine.has(c.id))).map((c) => '<option value="' + c.id + '"># ' + esc(c.name) + '</option>').join('');
  const form = canPost && scopes ? '<div class="th-form"><input id="thNTitle" maxlength="120" placeholder="' + esc(tht('noticeTitle', 'Title')) + '">'
    + '<textarea id="thNBody" rows="3" maxlength="2000" placeholder="' + esc(tht('noticeBody', 'Notice text')) + '"></textarea>'
    + '<div class="th-row"><select id="thNScope">' + scopes + '</select><label style="font-size:.72rem;color:var(--muted)"><input type="checkbox" id="thNPin"> ' + esc(tht('pin', 'Pin')) + '</label>'
    + '<button class="th-btn" onclick="thPostNotice()">' + esc(tht('post', 'Post')) + '</button></div></div>' : '';
  const chName = (id) => { const c = TH.channels.find((x) => x.id === id); return c ? '# ' + c.name : ''; };
  const list = (notes || []).map((n) => {
    const mineN = n.author_id === TH.me;
    return '<div class="' + (n.pinned ? 'th-pin' : 'th-note') + '"><div class="th-meta">' + (n.pinned ? '<i class="ti ti-pin"></i> ' : '')
      + esc(n.channel_id ? chName(n.channel_id) : tht('companyWide', 'Whole company')) + ' · ' + esc(thName(n.author_id)) + ' · ' + esc(thTime(n.created_at))
      + ((mineN || TH.owner) ? '<span class="th-act" onclick="thReads(\'' + n.id + '\',this)">' + esc(tht('readBy', 'Read by...')) + '</span><span class="th-act" onclick="thDeleteNotice(\'' + n.id + '\')">' + esc(tht('delete', 'Delete')) + '</span>' : '')
      + '</div><div style="font-weight:600;font-size:.84rem;margin:2px 0">' + esc(n.title) + '</div><div class="th-txt">' + thText(n.body) + '</div></div>';
  }).join('');
  main.innerHTML = '<div class="th-mh"><strong style="font-size:.85rem"><i class="ti ti-speakerphone"></i> ' + esc(tht('noticeboard', 'Noticeboard')) + '</strong></div>'
    + '<div class="th-body">' + form + (list || '<div class="th-empty">' + esc(tht('noNotices', 'No notices yet.')) + '</div>') + '</div>';
  const unseen = (notes || []).filter((n) => !seen.has(n.id));
  unseen.forEach((n) => thApi('POST', '/team/notices/' + n.id + '/read').catch(() => {}));
  if (unseen.length) thApi('POST', '/team/usage', { event: 'read_notice' }).catch(() => {});
}
async function thPostNotice() {
  const title = document.getElementById('thNTitle').value;
  const body = document.getElementById('thNBody').value;
  const scope = document.getElementById('thNScope').value;
  const pinned = document.getElementById('thNPin').checked;
  try { await thApi('POST', '/team/notices', { title, body, channel_id: scope || null, pinned }); thSelect({ type: 'notices' }); } catch (e) { thErr(e); }
}
async function thReads(id, el) {
  try { const r = await thApi('GET', '/team/notices/' + id + '/reads'); el.textContent = tht('readByN', 'Read by {r} of {n}').replace('{r}', r.read).replace('{n}', r.audience); } catch (e) { thErr(e); }
}
async function thDeleteNotice(id) {
  if (!confirm(tht('deleteNoticeConfirm', 'Delete this notice?'))) return;
  try { await thApi('DELETE', '/team/notices/' + id); thSelect({ type: 'notices' }); } catch (e) { thErr(e); }
}

// ---------------- calendar ----------------
async function thCalendar(main) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + TH.monthOffset, 1);
  const next = new Date(first.getFullYear(), first.getMonth() + 1, 1);
  const { data, error } = await sb.from('team_events').select('id,title,kind,starts_at,ends_at,all_day,created_by')
    .gte('starts_at', first.toISOString()).lt('starts_at', next.toISOString()).order('starts_at');
  if (error) throw error;
  const evs = data || [];
  const evDays = new Set(evs.map((e) => new Date(e.starts_at).getDate()));
  const loc = getDateLocale();
  const dayNames = [...Array(7)].map((_, i) => new Date(2023, 0, 1 + i).toLocaleDateString(loc, { weekday: 'short' }));
  let grid = dayNames.map((d) => '<span class="h">' + esc(d) + '</span>').join('');
  for (let i = 0; i < first.getDay(); i++) grid += '<span></span>';
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const wd = new Date(first.getFullYear(), first.getMonth(), d).getDay();
    const cls = [(wd === 5 || wd === 6) ? 'wk' : '', evDays.has(d) ? 'ev' : '', (TH.monthOffset === 0 && d === now.getDate()) ? 'td' : ''].join(' ');
    grid += '<span class="' + cls + '">' + d + '</span>';
  }
  const kinds = ['meeting', 'holiday', 'closed', 'event'];
  const canAdd = TH.owner || TH.isManager;
  const form = canAdd ? '<div class="th-form"><div class="th-row"><input id="thETitle" maxlength="120" style="flex:1" placeholder="' + esc(tht('eventTitle', 'Event title')) + '">'
    + '<select id="thEKind">' + kinds.map((k) => '<option value="' + k + '">' + esc(tht('kind_' + k, k)) + '</option>').join('') + '</select></div>'
    + '<div class="th-row"><input type="date" id="thEDate"><input type="time" id="thETime"><button class="th-btn" onclick="thAddEvent()">' + esc(tht('add', 'Add')) + '</button></div></div>' : '';
  const list = evs.map((e) => '<div class="th-note"><div class="th-meta">' + esc(tht('kind_' + e.kind, e.kind)) + ' · ' + esc(e.all_day ? new Date(e.starts_at).toLocaleDateString(loc, { day: 'numeric', month: 'short' }) : thTime(e.starts_at))
    + ((e.created_by === TH.me || TH.owner) ? '<span class="th-act" onclick="thDeleteEvent(\'' + e.id + '\')">' + esc(tht('delete', 'Delete')) + '</span>' : '')
    + '</div><div class="th-txt">' + esc(e.title) + '</div></div>').join('');
  main.innerHTML = '<div class="th-mh"><strong style="font-size:.85rem"><i class="ti ti-calendar"></i> ' + esc(first.toLocaleDateString(loc, { month: 'long', year: 'numeric' })) + '</strong>'
    + '<div class="th-row"><button class="th-btn2" onclick="TH.monthOffset--;thSelect({type:\'calendar\'})"><i class="ti ti-chevron-left"></i></button>'
    + '<button class="th-btn2" onclick="TH.monthOffset=0;thSelect({type:\'calendar\'})">' + esc(tht('today', 'Today')) + '</button>'
    + '<button class="th-btn2" onclick="TH.monthOffset++;thSelect({type:\'calendar\'})"><i class="ti ti-chevron-right"></i></button></div></div>'
    + '<div class="th-body"><div class="th-cal">' + grid + '</div>' + form + (list || '<div class="th-empty">' + esc(tht('noEvents', 'No events this month.')) + '</div>')
    + '<div class="th-cap" style="margin-top:8px">' + esc(tht('calNote', 'Team events, holidays and closures only. No leads or bookings here.')) + '</div></div>';
}
async function thAddEvent() {
  const title = document.getElementById('thETitle').value;
  const kind = document.getElementById('thEKind').value;
  const date = document.getElementById('thEDate').value;
  const time = document.getElementById('thETime').value;
  if (!date) { thToast(tht('pickDate', 'Pick a date')); return; }
  const allDay = !time;
  const startsAt = new Date(date + 'T' + (time || '00:00'));
  try { await thApi('POST', '/team/events', { title, kind, starts_at: startsAt.toISOString(), all_day: allDay }); thSelect({ type: 'calendar' }); } catch (e) { thErr(e); }
}
async function thDeleteEvent(id) {
  if (!confirm(tht('deleteEventConfirm', 'Delete this event?'))) return;
  try { await thApi('DELETE', '/team/events/' + id); thSelect({ type: 'calendar' }); } catch (e) { thErr(e); }
}

// ---------------- access (CEO quotas, D4) ----------------
async function thAccess(main) {
  const { data: grants, error } = await sb.from('team_access_grants').select('channel_id,manager_id,quota');
  if (error) throw error;
  const { data: given } = await sb.from('team_members').select('channel_id,granted_by').not('granted_by', 'is', null);
  const used = (ch, mgr) => (given || []).filter((g) => g.channel_id === ch && g.granted_by === mgr).length;
  const chName = (id) => { const c = TH.channels.find((x) => x.id === id); return c ? thChannelLabel(c) : ''; };
  let h = '';
  if (TH.owner) {
    const managers = [...TH.people.values()].filter((p) => p.role === 'manager');
    const shareable = TH.channels.filter((c) => c.kind !== 'ceo');
    h += '<div class="th-form"><div class="th-cap">' + esc(tht('accessIntro', 'Give a manager a quota: how many staff they may add to a channel. Only you change quotas.')) + '</div>';
    if (!managers.length) h += '<div class="th-txt">' + esc(tht('noManagers', 'No managers yet. Give someone the Manager role in Team first.')) + '</div>';
    else {
      h += '<div class="th-row"><select id="thGCh">' + shareable.map((c) => '<option value="' + c.id + '">' + esc(thChannelLabel(c)) + '</option>').join('') + '</select>'
        + '<select id="thGMgr">' + managers.map((m) => '<option value="' + m.id + '">' + esc(m.name) + '</option>').join('') + '</select>'
        + '<input type="number" id="thGQuota" min="0" max="100" value="3" style="width:80px"><button class="th-btn" onclick="thSetQuota()">' + esc(tht('save', 'Save')) + '</button></div>';
    }
    h += '</div>';
  }
  const rows = (grants || []).filter((g) => TH.owner || g.manager_id === TH.me).map((g) => '<tr><td>' + esc(chName(g.channel_id)) + '</td><td>' + esc(thName(g.manager_id)) + '</td><td>'
    + esc(tht('usedOf', '{u} of {q} used').replace('{u}', used(g.channel_id, g.manager_id)).replace('{q}', g.quota)) + '</td><td style="text-align:end">'
    + (TH.owner ? '<button class="th-btn2" onclick="thRemoveQuota(\'' + g.channel_id + '\',\'' + g.manager_id + '\')">' + esc(tht('remove', 'Remove')) + '</button>' : '') + '</td></tr>').join('');
  main.innerHTML = '<div class="th-mh"><strong style="font-size:.85rem"><i class="ti ti-key"></i> ' + esc(tht('access', 'Access')) + '</strong></div><div class="th-body">' + h
    + (rows ? '<table class="th-tbl">' + rows + '</table>' : '<div class="th-empty">' + esc(tht('noQuotas', 'No quotas yet.')) + '</div>')
    + (TH.isManager ? '<div class="th-cap" style="margin-top:8px">' + esc(tht('managerNote', 'Quotas are set by the CEO. You cannot raise them.')) + '</div>' : '') + '</div>';
}
async function thSetQuota() {
  const ch = document.getElementById('thGCh').value;
  const manager_id = document.getElementById('thGMgr').value;
  const quota = parseInt(document.getElementById('thGQuota').value, 10);
  try {
    // A manager must be in the channel before they can share it.
    if (!(await sb.from('team_members').select('user_id').eq('channel_id', ch).eq('user_id', manager_id).maybeSingle()).data) {
      await thApi('POST', '/team/channels/' + ch + '/members', { user_id: manager_id });
    }
    await thApi('PUT', '/team/channels/' + ch + '/grants', { manager_id, quota });
    thSelect({ type: 'access' });
  } catch (e) { thErr(e); }
}
async function thRemoveQuota(ch, mgr) {
  if (!confirm(tht('removeQuotaConfirm', 'Remove this quota? Staff this manager added to the channel lose access.'))) return;
  try { await thApi('DELETE', '/team/channels/' + ch + '/grants/' + mgr); thSelect({ type: 'access' }); } catch (e) { thErr(e); }
}

// ---------------- quiet hours ----------------
async function thPrefs(main) {
  const { data } = await sb.from('team_user_prefs').select('quiet_start,quiet_end').eq('user_id', TH.me).maybeSingle();
  const v = (x) => (x ? String(x).slice(0, 5) : '');
  main.innerHTML = '<div class="th-mh"><strong style="font-size:.85rem"><i class="ti ti-bell-off"></i> ' + esc(tht('quietHours', 'Quiet hours')) + '</strong></div><div class="th-body"><div class="th-form">'
    + '<div class="th-cap">' + esc(tht('quietIntro', 'Team Hub does not send phone or email alerts yet. Your quiet hours are saved and will apply when it does.')) + '</div>'
    + '<div class="th-row"><input type="time" id="thQS" value="' + esc(v(data && data.quiet_start)) + '"> - <input type="time" id="thQE" value="' + esc(v(data && data.quiet_end)) + '">'
    + '<button class="th-btn" onclick="thSavePrefs()">' + esc(tht('save', 'Save')) + '</button></div></div></div>';
}
async function thSavePrefs() {
  const qs = document.getElementById('thQS').value || null;
  const qe = document.getElementById('thQE').value || null;
  try { await thApi('PUT', '/team/prefs', { quiet_start: qs, quiet_end: qe }); thToast(tht('saved', 'Saved')); } catch (e) { thErr(e); }
}

Object.assign(window, { thInit, thTeardown, thSelect, thSend, thEditMsg, thDeleteMsg, thMute, thArchive, thAddMember, thRemoveMember,
  thCreateChannel, thPostNotice, thReads, thDeleteNotice, thAddEvent, thDeleteEvent, thSetQuota, thRemoveQuota, thSavePrefs });
