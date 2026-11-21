// Client Manager → Custom plan tab (NES admin only). Draft quotes only.
// All prices are computed server-side by the custom_quote_price RPC; the browser only sends item keys.
// Sending to the client and payment are not wired yet and are shown as "coming soon".
(function () {
  const GROUPS = ['sara_minutes_per_month', 'daily_ai_messages', 'team_user_limit', 'storage_free_gb', 'social_posts_per_day'];
  const ct = (k, fb) => t('customPlan.' + k, fb);
  const num = (v, d) => (v === null || v === undefined || v === '') ? '—' : Number(v).toFixed(d == null ? 0 : d);
  const modName = (k) => ct('mod.' + k, k);

  async function loadCustomPlan(clientId) {
    const box = document.getElementById('cm-custom-body-' + clientId);
    if (!box) return;
    box.innerHTML = '<div style="color:var(--muted);font-family:var(--mono);font-size:.75rem;">' + esc(ct('loading', 'Loading…')) + '</div>';
    const { data, error } = await sb.rpc('custom_quote_catalogue');
    if (error || !data) {
      box.innerHTML = '<div style="color:#f85149;font-size:.8rem;">' + esc(ct('loadError', 'Could not load the custom plan catalogue.')) + '</div>';
      return;
    }
    const s = data.settings || {};
    const items = data.items || [];
    let html = '';
    if (!s.enabled) {
      html += '<div style="background:rgba(210,153,34,.10);border:1px solid rgba(210,153,34,.45);border-radius:8px;padding:9px 12px;font-size:.75rem;margin-bottom:12px;">'
        + esc(ct('off', 'Custom plan is switched off. Quotes are internal drafts only; sending to the client and payment are coming soon.')) + '</div>';
    }
    html += '<div style="font-family:var(--mono);font-size:.68rem;color:var(--muted);margin-bottom:12px;">'
      + esc(ct('settingsLine', 'Margin {m}% · minimum margin {f}% · minimum price OMR {min} · base fee {base}')
        .replace('{m}', num(s.margin_pct)).replace('{f}', num(s.margin_floor_pct)).replace('{min}', num(s.min_total_omr))
        .replace('{base}', s.base_fee_omr == null ? ct('notSet', 'not set') : 'OMR ' + num(s.base_fee_omr, 2)))
      + '</div>';

    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:12px;">';
    GROUPS.forEach(g => {
      const steps = items.filter(i => i.limit_key === g);
      if (!steps.length) return;
      html += '<label style="display:flex;flex-direction:column;gap:4px;font-size:.72rem;color:var(--muted);">' + esc(ct('group.' + g, g))
        + '<select class="cp-step" data-client="' + esc(clientId) + '" style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px;color:var(--text);">'
        + '<option value="">' + esc(ct('none', 'None')) + '</option>'
        + steps.map(i => '<option value="' + esc(i.key) + '"' + (i.status === 'coming_soon' ? ' disabled' : '') + '>' + num(i.qty) + '</option>').join('')
        + '</select></label>';
    });
    html += '</div>';

    const flats = items.filter(i => i.unit === 'flat');
    html += '<div style="font-family:var(--mono);font-size:.68rem;color:var(--muted);margin-bottom:6px;">' + esc(ct('modules', 'Modules')) + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:6px;margin-bottom:12px;">';
    flats.forEach(i => {
      const soon = i.status === 'coming_soon';
      html += '<label style="display:flex;align-items:center;gap:7px;font-size:.78rem;' + (soon ? 'opacity:.5;' : '') + '">'
        + '<input type="checkbox" class="cp-mod" value="' + esc(i.key) + '"' + (soon ? ' disabled' : '') + '>'
        + esc(modName(i.module_key))
        + (soon ? ' <span style="font-size:.6rem;color:#f0883e;border:1px solid #f0883e;border-radius:4px;padding:0 4px;">' + esc(ct('comingSoon', 'Coming soon')) + '</span>' : '')
        + '</label>';
    });
    html += '</div>';

    html += '<div style="display:flex;gap:8px;margin-bottom:12px;">'
      + '<button class="cm-btn" onclick="calcCustomPlan(\'' + esc(clientId) + '\',false)">' + esc(ct('calc', 'Calculate')) + '</button>'
      + '<button class="cm-btn primary" onclick="calcCustomPlan(\'' + esc(clientId) + '\',true)">' + esc(ct('save', 'Save draft')) + '</button>'
      + '</div>'
      + '<div id="cp-result-' + esc(clientId) + '"></div>'
      + '<div style="font-family:var(--mono);font-size:.68rem;color:var(--muted);margin:14px 0 6px;">' + esc(ct('quotes', 'Saved quotes')) + '</div>'
      + '<div id="cp-list-' + esc(clientId) + '"></div>';
    box.innerHTML = html;
    loadCustomQuoteList(clientId);
  }

  async function calcCustomPlan(clientId, save) {
    const box = document.getElementById('cm-custom-body-' + clientId);
    const out = document.getElementById('cp-result-' + clientId);
    if (!box || !out) return;
    const keys = [...box.querySelectorAll('.cp-step')].map(e => e.value).filter(Boolean)
      .concat([...box.querySelectorAll('.cp-mod:checked')].map(e => e.value));
    if (!keys.length) { showToast(ct('pickOne', 'Pick at least one item')); return; }
    out.innerHTML = '<div style="color:var(--muted);font-size:.75rem;">' + esc(ct('loading', 'Loading…')) + '</div>';
    const { data, error } = await sb.rpc('custom_quote_price', { p_client_id: clientId, p_keys: keys, p_save: !!save });
    if (error || !data) {
      out.innerHTML = '<div style="color:#f85149;font-size:.78rem;">' + esc((error && error.message) || ct('calcError', 'Could not price this selection.')) + '</div>';
      return;
    }
    const rows = (data.lines || []).map(l =>
      '<tr><td style="padding:5px 4px;">' + esc(l.key.replace(/^cm_/, '')) + '</td>'
      + '<td style="text-align:right;padding:5px 4px;font-family:var(--mono);">' + num(l.qty) + '</td>'
      + '<td style="text-align:right;padding:5px 4px;font-family:var(--mono);">' + num(l.cost_usd, 2) + '</td>'
      + '<td style="text-align:right;padding:5px 4px;font-family:var(--mono);color:' + (l.priced ? 'var(--text)' : '#f0883e') + ';">'
      + (l.priced ? num(l.line_omr, 2) : esc(ct('noFloor', 'minimum price not set'))) + '</td></tr>').join('');
    const warns = (data.warnings || []).map(w => '<li>' + esc(w) + '</li>').join('');
    out.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:.75rem;margin-bottom:8px;">'
      + '<tr style="color:var(--muted);font-family:var(--mono);font-size:.65rem;"><th style="text-align:left;padding:4px;">' + esc(ct('item', 'Item')) + '</th>'
      + '<th style="text-align:right;padding:4px;">' + esc(ct('qty', 'Qty')) + '</th><th style="text-align:right;padding:4px;">' + esc(ct('cost', 'Our cost (USD)')) + '</th>'
      + '<th style="text-align:right;padding:4px;">' + esc(ct('price', 'Price (OMR)')) + '</th></tr>' + rows + '</table>'
      + '<div style="display:flex;justify-content:space-between;font-weight:700;font-size:.9rem;margin:6px 0;"><span>' + esc(ct('total', 'Monthly price')) + '</span>'
      + '<span style="font-family:var(--mono);color:#d29922;">OMR ' + num(data.total_omr) + ' ' + esc(ct('vat', '+ {v}% VAT').replace('{v}', num(data.vat_pct))) + '</span></div>'
      + '<div style="font-family:var(--mono);font-size:.68rem;color:var(--muted);">' + esc(ct('margin', 'Margin at full use')) + ': ' + num(data.margin_pct, 1) + '%</div>'
      + (warns ? '<div style="font-size:.72rem;margin-top:8px;"><b>' + esc(ct('warnings', 'Checks')) + '</b><ul style="margin:4px 0 0 16px;padding:0;">' + warns + '</ul></div>' : '');
    if (save && data.quote_id) { showToast(ct('saved', 'Draft quote saved')); loadCustomQuoteList(clientId); }
  }

  async function loadCustomQuoteList(clientId) {
    const box = document.getElementById('cp-list-' + clientId);
    if (!box) return;
    const { data, error } = await sb.rpc('custom_quote_list', { p_client_id: clientId });
    if (error) { box.innerHTML = '<div style="color:#f85149;font-size:.75rem;">' + esc(error.message) + '</div>'; return; }
    if (!data || !data.length) { box.innerHTML = '<div style="color:var(--muted);font-size:.75rem;">' + esc(ct('noQuotes', 'No quotes yet')) + '</div>'; return; }
    const btn = (label, fn) => '<button class="cm-btn" style="padding:2px 9px;font-size:.68rem;" onclick="' + fn + '">' + esc(label) + '</button>';
    box.innerHTML = data.map(q => {
      const live = q.status === 'sent' && q.valid_until && new Date(q.valid_until) > new Date();
      const st = q.status === 'sent' && !live ? 'expired' : q.status;
      const extra = q.status === 'sent' && q.valid_until ? ' · ' + esc(ct('validUntil', 'valid until {d}').replace('{d}', fmtDate(q.valid_until))) : '';
      const action = q.status === 'draft' ? btn(ct('send', 'Send to client'), "sendCustomQuote('" + esc(q.id) + "','" + esc(clientId) + "')")
        : (q.status === 'sent' || q.status === 'accepted') ? btn(ct('withdraw', 'Withdraw'), "withdrawCustomQuote('" + esc(q.id) + "','" + esc(clientId) + "')") : '';
      return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px solid var(--border);padding:6px 0;font-size:.74rem;">'
        + '<span>' + esc(new Date(q.created_at).toLocaleString()) + ' · <b>' + esc(st) + '</b>' + extra + ' · ' + (q.lines || []).length + ' ' + esc(ct('items', 'items')) + '</span>'
        + '<span style="display:flex;align-items:center;gap:8px;"><span style="font-family:var(--mono);">OMR ' + num(q.price_omr) + ' · ' + num(q.margin_pct, 1) + '%</span>' + action + '</span></div>';
    }).join('');
  }

  function fmtDate(d) {
    try { return new Date(d).toLocaleDateString(typeof getDateLocale === 'function' ? getDateLocale('en-GB') : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return String(d).slice(0, 10); }
  }

  async function sendCustomQuote(quoteId, clientId) {
    if (!confirm(ct('sendConfirm', 'Send this quote to the client? Their account owner will see it on the Plans page for 14 days.'))) return;
    const { error } = await sb.rpc('custom_quote_send', { p_quote_id: quoteId });
    if (error) { showToast(error.message); return; }
    showToast(ct('sent', 'Quote sent to the client'));
    loadCustomQuoteList(clientId);
  }

  async function withdrawCustomQuote(quoteId, clientId) {
    if (!confirm(ct('withdrawConfirm', 'Withdraw this quote? The client will no longer see it.'))) return;
    const { error } = await sb.rpc('custom_quote_withdraw', { p_quote_id: quoteId });
    if (error) { showToast(error.message); return; }
    showToast(ct('withdrawn', 'Quote withdrawn'));
    loadCustomQuoteList(clientId);
  }

  // Client side: the account owner's current quote on the Plans page. Items and one total only.
  const qt = (k, fb) => t('quoteCard.' + k, fb);
  function itemLabel(i) {
    if (i.limit_key) return ct('group.' + i.limit_key, i.limit_key) + ': ' + num(i.qty);
    return modName(i.module_key);
  }
  async function loadCustomQuoteCard() {
    const box = document.getElementById('customQuoteCard');
    if (!box || typeof sb === 'undefined') return;
    let data = null;
    try { const r = await sb.rpc('custom_quote_mine'); if (r.error) return; data = r.data; } catch (e) { return; }
    if (!data || !data.id) { box.innerHTML = ''; return; }
    const accepted = data.status === 'accepted';
    const items = (data.items || []).map(i => '<li style="display:flex;gap:8px;align-items:center;padding:3px 0;"><i class="ti ti-check" style="color:#3fb950;font-size:13px;"></i>' + esc(itemLabel(i)) + '</li>').join('');
    box.innerHTML = '<div style="max-width:560px;margin:0 auto 22px;background:var(--surface);border:1px solid #d29922;border-radius:12px;padding:18px 20px;">'
      + '<div style="font-family:\'Syne\',sans-serif;font-size:.7rem;color:#d29922;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;">' + esc(qt('title', 'Your custom plan quote')) + '</div>'
      + '<div style="color:var(--muted);font-size:.78rem;margin-bottom:10px;">' + esc(qt('intro', 'Prepared for you by New Essential Services. Prices are per month.')) + '</div>'
      + '<ul style="list-style:none;margin:0 0 12px;padding:0;font-size:.85rem;">' + items + '</ul>'
      + '<div style="display:flex;justify-content:space-between;font-size:.85rem;"><span>' + esc(qt('monthly', 'Monthly price')) + '</span><span style="font-family:var(--mono);">OMR ' + num(data.price_omr, 3) + '</span></div>'
      + '<div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--muted);"><span>' + esc(qt('vat', 'VAT {v}%').replace('{v}', num(data.vat_pct))) + '</span><span style="font-family:var(--mono);">OMR ' + num(data.vat_omr, 3) + '</span></div>'
      + '<div style="display:flex;justify-content:space-between;font-weight:700;font-size:.95rem;margin-top:6px;border-top:1px solid var(--border);padding-top:6px;"><span>' + esc(qt('totalIncl', 'Total per month incl. VAT')) + '</span><span style="font-family:var(--mono);color:#d29922;">OMR ' + num(data.total_incl_vat_omr, 3) + '</span></div>'
      + (accepted
        ? '<div style="margin-top:12px;padding:9px 12px;background:rgba(63,185,80,.10);border:1px solid rgba(63,185,80,.4);border-radius:8px;font-size:.8rem;">' + esc(qt('accepted', 'Accepted on {d}. New Essential Services will contact you with your invoice and your start date.').replace('{d}', fmtDate(data.accepted_at))) + '</div>'
        : '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:12px;"><span style="font-family:var(--mono);font-size:.68rem;color:var(--muted);">' + esc(qt('validUntil', 'Valid until {d}').replace('{d}', fmtDate(data.valid_until))) + '</span>'
          + '<button class="plan-action-btn" style="width:auto;padding:8px 18px;margin:0;" onclick="acceptCustomQuote(\'' + esc(data.id) + '\')">' + esc(qt('accept', 'Accept quote')) + '</button></div>')
      + '</div>';
  }
  async function acceptCustomQuote(quoteId) {
    if (!confirm(qt('acceptConfirm', 'Accept this quote? New Essential Services will send you an invoice. Nothing is charged automatically.'))) return;
    const { error } = await sb.rpc('custom_quote_accept', { p_quote_id: quoteId });
    if (error) { showToast(error.message); return; }
    showToast(qt('acceptedToast', 'Quote accepted. We will send your invoice.'));
    loadCustomQuoteCard();
  }

  window.loadCustomPlan = loadCustomPlan;
  window.calcCustomPlan = calcCustomPlan;
  window.loadCustomQuoteList = loadCustomQuoteList;
  window.sendCustomQuote = sendCustomQuote;
  window.withdrawCustomQuote = withdrawCustomQuote;
  window.loadCustomQuoteCard = loadCustomQuoteCard;
  window.acceptCustomQuote = acceptCustomQuote;
})();
