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
      + '<button class="cm-btn" disabled title="' + esc(ct('comingSoon', 'Coming soon')) + '" style="opacity:.5;cursor:not-allowed;">' + esc(ct('send', 'Send to client')) + ' · ' + esc(ct('comingSoon', 'Coming soon')) + '</button>'
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
    box.innerHTML = data.map(q => '<div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid var(--border);padding:6px 0;font-size:.74rem;">'
      + '<span>' + esc(new Date(q.created_at).toLocaleString()) + ' · ' + esc(q.status) + ' · ' + (q.lines || []).length + ' ' + esc(ct('items', 'items')) + '</span>'
      + '<span style="font-family:var(--mono);">OMR ' + num(q.price_omr) + ' · ' + num(q.margin_pct, 1) + '%</span></div>').join('');
  }

  window.loadCustomPlan = loadCustomPlan;
  window.calcCustomPlan = calcCustomPlan;
  window.loadCustomQuoteList = loadCustomQuoteList;
})();
