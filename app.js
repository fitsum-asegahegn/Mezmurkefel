/* app.js — module CRUD, attendance + member follow-up, ዕቅድ engine, reports */
(function () {
  const { t } = window.I18N;

  const MODULES = {
    members: {
      store: 'members', navKey: 'nav_members', titleKey: 'nav_members',
      importMatchKeys: ['name', 'phone'],
      fields: [
        { key: 'name', labelKey: 'member_name', type: 'text', required: true },
        { key: 'section', labelKey: 'member_section', type: 'select', options: [['hymn', 'section_hymn'], ['kebero', 'section_kebero'], ['art', 'section_art'], ['drama', 'section_drama'], ['writing', 'section_writing'], ['other', 'section_other']] },
        { key: 'phone', labelKey: 'member_phone', type: 'text' },
        { key: 'joinDate', labelKey: 'join_date', type: 'date' },
        { key: 'status', labelKey: 'member_status', type: 'select', options: [['active', 'member_status_active'], ['inactive', 'member_status_inactive']] },
        { key: 'robeEligible', labelKey: 'robe_eligible', type: 'checkbox' },
        { key: 'notes', labelKey: 'member_notes', type: 'textarea' },
      ],
      listColumns: ['name', 'section', 'status', 'robeEligible'],
    },
    inventory: {
      store: 'inventory', navKey: 'nav_inventory', titleKey: 'nav_inventory',
      importMatchKeys: ['name'],
      fields: [
        { key: 'name', labelKey: 'item_name', type: 'text', required: true },
        { key: 'category', labelKey: 'item_category', type: 'select', options: [['instrument', 'cat_instrument'], ['vestment', 'cat_vestment'], ['other', 'cat_other']] },
        { key: 'quantity', labelKey: 'item_quantity', type: 'number' },
        { key: 'status', labelKey: 'item_status', type: 'select', options: [['active', 'item_status_active'], ['damaged', 'item_status_damaged'], ['washing', 'item_status_washing']] },
        { key: 'lastWashed', labelKey: 'item_last_washed', type: 'date' },
        { key: 'notes', labelKey: 'item_notes', type: 'textarea' },
      ],
      listColumns: ['name', 'category', 'quantity', 'status'],
    },
    programs: {
      store: 'programs', navKey: 'nav_programs', titleKey: 'nav_programs',
      importMatchKeys: ['date', 'type', 'description'],
      fields: [
        { key: 'type', labelKey: 'program_type', type: 'select', options: [['christmas', 'program_christmas'], ['art_night', 'program_art_night'], ['theater', 'program_theater'], ['exhibition', 'program_exhibition'], ['exchange', 'program_exchange'], ['greeting', 'program_greeting'], ['other', 'program_other']] },
        { key: 'date', labelKey: 'program_date', type: 'date', required: true },
        { key: 'description', labelKey: 'program_desc', type: 'text' },
        { key: 'budget', labelKey: 'program_budget', type: 'number' },
        { key: 'attendanceCount', labelKey: 'program_attendance_count', type: 'number' },
        { key: 'notes', labelKey: 'program_notes', type: 'textarea' },
      ],
      listColumns: ['date', 'type', 'description', 'attendanceCount'],
    },
    contributions: {
      store: 'contributions', navKey: 'nav_contrib', titleKey: 'nav_contrib',
      importMatchKeys: ['period', 'fromWhom'],
      fields: [
        { key: 'period', labelKey: 'contrib_period', type: 'text', required: true },
        { key: 'fromWhom', labelKey: 'contrib_member', type: 'text', required: true },
        { key: 'expected', labelKey: 'contrib_expected', type: 'number' },
        { key: 'paid', labelKey: 'contrib_paid', type: 'number' },
        { key: 'datePaid', labelKey: 'contrib_date_paid', type: 'date' },
        { key: 'collectedBy', labelKey: 'contrib_collected_by', type: 'text' },
        { key: 'handedOver', labelKey: 'contrib_handed_over', type: 'checkbox' },
      ],
      listColumns: ['period', 'fromWhom', 'paid', 'handedOver'],
    },
  };

  const app = document.getElementById('app');
  let currentTab = 'dashboard';
  let searchTerm = '';

  // ---------- helpers ----------
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    });
    (children || []).forEach((c) => e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return e;
  }

  function fmtMoney(n) {
    n = Number(n) || 0;
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ብር';
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return window.EthCal.formatBoth(d, window.I18N.getLang());
  }

  function todayIso() { return new Date().toISOString().slice(0, 10); }

  // ---------- nav ----------
  const TABS = [
    ['dashboard', 'nav_dashboard', '📊'],
    ['members', 'nav_members', '🎤'],
    ['attendance', 'nav_attendance', '✅'],
    ['inventory', 'nav_inventory', '🥁'],
    ['programs', 'nav_programs', '🎭'],
    ['contributions', 'nav_contrib', '🤝'],
    ['plan', 'nav_plan', '🗓️'],
    ['settings', 'nav_settings', '⚙️'],
  ];

  function renderNav() {
    const nav = document.getElementById('tabbar');
    nav.innerHTML = '';
    TABS.forEach(([key, labelKey, icon]) => {
      const btn = el('button', {
        class: 'tab-btn' + (currentTab === key ? ' active' : ''),
        onclick: () => { currentTab = key; searchTerm = ''; render(); },
      }, [el('span', { class: 'tab-icon' }, [icon]), el('span', { class: 'tab-label' }, [t(labelKey)])]);
      nav.appendChild(btn);
    });
  }

  async function render() {
    renderNav();
    app.innerHTML = '';
    if (currentTab === 'dashboard') await renderDashboard();
    else if (currentTab === 'members') await renderModule('members');
    else if (currentTab === 'attendance') await renderAttendance();
    else if (currentTab === 'inventory') await renderModule('inventory');
    else if (currentTab === 'programs') await renderModule('programs');
    else if (currentTab === 'contributions') await renderModule('contributions');
    else if (currentTab === 'plan') await renderPlan();
    else if (currentTab === 'settings') await renderSettings();
    window.I18N.applyStaticTranslations(app);
  }

  function statCard(labelKey, value, tone, sub) {
    const children = [
      el('div', { class: 'stat-value' }, [value]),
      el('div', { class: 'stat-label' }, [t(labelKey)]),
    ];
    if (sub) children.push(el('div', { class: 'stat-sub' }, [sub]));
    return el('div', { class: 'stat-card ' + (tone || '') }, children);
  }

  function fieldLabelKey(mod, key) {
    const f = mod.fields.find((x) => x.key === key);
    return f ? f.labelKey : key;
  }

  // ---------- generic module list/form ----------
  async function renderModule(modKey) {
    const mod = MODULES[modKey];
    const wrap = el('div', { class: 'panel' });
    const header = el('div', { class: 'panel-header' }, [
      el('h2', {}, [t(mod.titleKey)]),
      el('button', { class: 'btn primary', onclick: () => openForm(modKey) }, [t('add_new')]),
    ]);
    const toolbar = el('div', { class: 'toolbar' }, [
      el('input', {
        type: 'search', placeholder: t('search'), value: searchTerm,
        oninput: (e) => { searchTerm = e.target.value; renderList(); },
      }),
      el('button', { class: 'btn ghost', onclick: () => importModuleExcel(modKey) }, [t('import_excel')]),
      el('button', { class: 'btn ghost', onclick: () => exportModuleExcel(modKey) }, [t('export_excel')]),
    ]);
    const listHost = el('div', { class: 'list-host' });
    wrap.appendChild(header);
    wrap.appendChild(toolbar);
    wrap.appendChild(listHost);
    app.appendChild(wrap);

    async function renderList() {
      listHost.innerHTML = '';
      let records = await window.NKDB.getAll(mod.store);
      records.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        records = records.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
      }
      if (!records.length) {
        listHost.appendChild(el('p', { class: 'empty' }, [t('no_records')]));
        return;
      }
      const table = el('table', { class: 'data-table' });
      const thead = el('tr', {}, mod.listColumns.map((c) => el('th', {}, [t(fieldLabelKey(mod, c))])));
      thead.appendChild(el('th', {}, ['']));
      table.appendChild(el('thead', {}, [thead]));
      const tbody = el('tbody');
      records.forEach((r) => {
        const tr = el('tr');
        mod.listColumns.forEach((c) => {
          const f = mod.fields.find((x) => x.key === c);
          tr.appendChild(el('td', {}, [renderCell(f, r[c])]));
        });
        tr.appendChild(el('td', { class: 'row-actions' }, [
          el('button', { class: 'icon-btn', title: t('edit'), onclick: () => openForm(modKey, r) }, ['✏️']),
          el('button', { class: 'icon-btn danger', title: t('delete'), onclick: () => deleteRecord(mod, r) }, ['🗑️']),
        ]));
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      listHost.appendChild(table);
    }

    function renderCell(field, value) {
      if (!field) return String(value ?? '—');
      if (field.type === 'checkbox') return value ? '✅' : '—';
      if (field.type === 'date') return fmtDate(value);
      if (field.type === 'select') {
        const opt = field.options.find((o) => o[0] === value);
        return opt ? t(opt[1]) : (value || '—');
      }
      if (field.type === 'number' && ['budget', 'expected', 'paid', 'attendanceCount'].includes(field.key)) {
        return value != null && value !== '' ? (field.key === 'attendanceCount' ? String(value) : fmtMoney(value)) : '—';
      }
      return value != null && value !== '' ? String(value) : '—';
    }

    await renderList();
  }

  async function deleteRecord(mod, record) {
    if (!confirm(t('confirm_delete'))) return;
    await window.NKDB.remove(mod.store, record.id);
    render();
  }

  function openForm(modKey, record) {
    const mod = MODULES[modKey];
    const isEdit = !!record;
    record = record ? { ...record } : {};
    const overlay = el('div', { class: 'modal-overlay' });
    const form = el('form', { class: 'modal-card' });
    form.appendChild(el('h3', {}, [t(mod.titleKey)]));
    const fieldEls = {};
    mod.fields.forEach((f) => {
      const row = el('div', { class: 'form-row' });
      row.appendChild(el('label', {}, [t(f.labelKey) + (f.required ? ' *' : '')]));
      let input;
      if (f.type === 'select') {
        input = el('select', { name: f.key });
        input.appendChild(el('option', { value: '' }, ['—']));
        f.options.forEach(([val, labelKey]) => {
          const o = el('option', { value: val }, [t(labelKey)]);
          if (record[f.key] === val) o.setAttribute('selected', 'selected');
          input.appendChild(o);
        });
      } else if (f.type === 'textarea') {
        input = el('textarea', { name: f.key, rows: '3' }, [record[f.key] || '']);
      } else if (f.type === 'checkbox') {
        input = el('input', { type: 'checkbox', name: f.key });
        if (record[f.key]) input.setAttribute('checked', 'checked');
      } else {
        input = el('input', { type: f.type, name: f.key, value: record[f.key] != null ? record[f.key] : '' });
      }
      fieldEls[f.key] = input;
      row.appendChild(input);
      form.appendChild(row);
    });
    form.appendChild(el('div', { class: 'form-actions' }, [
      el('button', { type: 'button', class: 'btn ghost', onclick: () => overlay.remove() }, [t('cancel')]),
      el('button', { type: 'submit', class: 'btn primary' }, [t('save')]),
    ]));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const out = isEdit ? { ...record } : {};
      mod.fields.forEach((f) => {
        const input = fieldEls[f.key];
        if (f.type === 'checkbox') out[f.key] = input.checked;
        else if (f.type === 'number') out[f.key] = input.value === '' ? null : Number(input.value);
        else out[f.key] = input.value;
      });
      await window.NKDB.put(mod.store, out);
      overlay.remove();
      render();
    });
    overlay.appendChild(form);
    document.body.appendChild(overlay);
  }

  function normalizeDateValue(raw) {
    if (raw instanceof Date) return raw.toISOString().slice(0, 10);
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
    return '';
  }

  function coerceFieldValue(field, raw) {
    if (raw === undefined || raw === null) return undefined;
    if (field.type === 'checkbox') {
      const s = String(raw).trim().toLowerCase();
      return ['true', '1', 'yes', 'y', '✓', '✅', 'አዎ'].includes(s);
    }
    if (field.type === 'number') {
      if (raw === '') return null;
      const n = Number(raw);
      return isNaN(n) ? null : n;
    }
    if (field.type === 'date') return normalizeDateValue(raw);
    if (field.type === 'select') {
      const s = String(raw).trim();
      const opt = field.options.find(([val, labelKey]) => {
        const entry = window.I18N.DICT[labelKey] || {};
        return val === s || entry.am === s || entry.en === s;
      });
      return opt ? opt[0] : s;
    }
    return String(raw);
  }

  function pick(row, keys) {
    for (const k of keys) if (row[k] !== undefined && row[k] !== '') return row[k];
    return undefined;
  }

  function importModuleExcel(modKey) {
    const mod = MODULES[modKey];
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const sheetRows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      const existing = await window.NKDB.getAll(mod.store);
      let created = 0, updated = 0;
      for (const row of sheetRows) {
        const record = {};
        mod.fields.forEach((f) => {
          const entry = window.I18N.DICT[f.labelKey] || {};
          const raw = pick(row, [entry.am, entry.en, f.key].filter(Boolean));
          const val = coerceFieldValue(f, raw);
          if (val !== undefined) record[f.key] = val;
        });
        const hasContent = Object.values(record).some((v) => v !== '' && v != null && v !== false);
        if (!hasContent) continue;
        const matchFieldKeys = mod.importMatchKeys || [];
        let match = null;
        if (matchFieldKeys.every((k) => record[k] !== undefined && record[k] !== '' && record[k] !== null)) {
          match = existing.find((e) => matchFieldKeys.every((k) => String(e[k]) === String(record[k])));
        }
        if (match) { record.id = match.id; updated++; } else { created++; }
        const saved = await window.NKDB.put(mod.store, record);
        if (!match) existing.push(saved);
      }
      alert(`${t('import_excel')}: +${created} / ~${updated}`);
      render();
    };
    input.click();
  }

  async function exportModuleExcel(modKey) {
    const mod = MODULES[modKey];
    const records = await window.NKDB.getAll(mod.store);
    const rows = records.map((r) => {
      const row = {};
      mod.fields.forEach((f) => { row[t(f.labelKey)] = r[f.key]; });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, modKey.slice(0, 30));
    XLSX.writeFile(wb, `${modKey}-${todayIso()}.xlsx`);
  }

  // ---------- attendance + member follow-up ----------
  async function getDistinctAttendanceDates() {
    const records = await window.NKDB.getAll('attendance');
    return Array.from(new Set(records.map((r) => r.date))).sort().reverse();
  }

  async function computeConsecutiveAbsences(memberId, dates, attendanceByKey) {
    let count = 0;
    for (const d of dates) {
      const rec = attendanceByKey[memberId + '|' + d];
      const present = rec ? !!rec.present : false;
      if (present) break;
      count++;
    }
    return count;
  }

  async function renderAttendance() {
    const wrap = el('div', { class: 'panel' });
    wrap.appendChild(el('div', { class: 'panel-header' }, [el('h2', {}, [t('nav_attendance')])]));

    const dateInput = el('input', { type: 'date', value: todayIso() });
    wrap.appendChild(el('div', { class: 'form-row' }, [el('label', {}, [t('pick_date')]), dateInput]));

    const listHost = el('div', { class: 'list-host' });
    const saveBtn = el('button', { class: 'btn primary', style: 'margin-top:10px' }, [t('save_attendance')]);
    wrap.appendChild(listHost);
    wrap.appendChild(saveBtn);

    const followUpHost = el('div', { style: 'margin-top:22px' });
    wrap.appendChild(followUpHost);
    app.appendChild(wrap);

    let checks = {};

    async function renderChecklist() {
      listHost.innerHTML = '';
      const members = (await window.NKDB.getAll('members')).filter((m) => m.status !== 'inactive');
      const dateVal = dateInput.value || todayIso();
      const attendance = await window.NKDB.getAll('attendance');
      const existingForDate = {};
      attendance.filter((r) => r.date === dateVal).forEach((r) => { existingForDate[r.memberId] = r; });
      checks = {};
      members.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      if (!members.length) {
        listHost.appendChild(el('p', { class: 'empty' }, [t('no_records')]));
        return;
      }
      members.forEach((m) => {
        const existing = existingForDate[m.id];
        checks[m.id] = existing ? !!existing.present : false;
        const row = el('label', { class: 'attend-row' });
        const cb = el('input', { type: 'checkbox' });
        cb.checked = checks[m.id];
        cb.addEventListener('change', () => { checks[m.id] = cb.checked; });
        row.appendChild(cb);
        row.appendChild(el('span', { class: 'attend-name' }, [m.name]));
        if (m.section) row.appendChild(el('span', { class: 'attend-sub' }, [t('section_' + m.section) || m.section]));
        listHost.appendChild(row);
      });
    }

    dateInput.addEventListener('change', renderChecklist);
    await renderChecklist();

    saveBtn.addEventListener('click', async () => {
      const dateVal = dateInput.value || todayIso();
      const attendance = await window.NKDB.getAll('attendance');
      const members = await window.NKDB.getAll('members');
      for (const [memberId, present] of Object.entries(checks)) {
        const existing = attendance.find((r) => r.memberId === memberId && r.date === dateVal);
        await window.NKDB.put('attendance', existing ? { ...existing, present } : { memberId, date: dateVal, present });
        if (present) {
          const member = members.find((m) => m.id === memberId);
          if (member && member.followedUpAt) {
            await window.NKDB.put('members', { ...member, followedUpAt: null, followUpReason: null, followedUpBy: null });
          }
        }
      }
      await renderFollowUp();
      alert(t('save_attendance') + ' ✓');
    });

    async function renderFollowUp() {
      followUpHost.innerHTML = '';
      followUpHost.appendChild(el('h3', {}, [t('needs_followup')]));
      const members = (await window.NKDB.getAll('members')).filter((m) => m.status !== 'inactive');
      const attendance = await window.NKDB.getAll('attendance');
      const dates = await getDistinctAttendanceDates();
      const attendanceByKey = {};
      attendance.forEach((r) => { attendanceByKey[r.memberId + '|' + r.date] = r; });

      const flagged = [];
      for (const m of members) {
        const count = await computeConsecutiveAbsences(m.id, dates.slice(0, 8), attendanceByKey);
        if (count >= 3) flagged.push({ member: m, count });
      }
      if (!flagged.length) {
        followUpHost.appendChild(el('p', { class: 'empty' }, [t('no_absentees')]));
        return;
      }
      flagged.sort((a, b) => b.count - a.count);
      flagged.forEach(({ member, count }) => followUpHost.appendChild(renderFollowUpCard(member, count)));
    }

    function renderFollowUpCard(member, count) {
      const card = el('div', { class: 'followup-card' });
      card.appendChild(el('div', { class: 'followup-head' }, [
        el('strong', {}, [member.name]),
        el('span', { class: 'followup-count' }, [`${count} ${t('consecutive_absences')}`]),
      ]));
      if (member.followedUpAt) {
        card.appendChild(el('div', { class: 'followup-called' }, [
          `${t('already_called')} — ${fmtDate(member.followedUpAt)}${member.followedUpBy ? ' (' + member.followedUpBy + ')' : ''}`,
        ]));
        if (member.followUpReason) card.appendChild(el('div', { class: 'followup-reason' }, [member.followUpReason]));
        card.appendChild(el('button', { class: 'btn small ghost', onclick: () => undoFollowUp(member) }, [t('undo')]));
      } else {
        const actions = el('div', { class: 'followup-actions' });
        if (member.phone) {
          actions.appendChild(el('a', { class: 'btn small ghost', href: 'tel:' + member.phone }, [t('call_member')]));
        }
        actions.appendChild(el('button', { class: 'btn small primary', onclick: () => markFollowedUp(member) }, [t('mark_called')]));
        card.appendChild(actions);
      }
      return card;
    }

    function markFollowedUp(member) {
      const overlay = el('div', { class: 'modal-overlay' });
      const form = el('form', { class: 'modal-card' });
      form.appendChild(el('h3', {}, [member.name]));
      form.appendChild(el('div', { class: 'form-row' }, [el('label', {}, [t('call_reason')]), el('textarea', { name: 'reason', rows: '3' })]));
      form.appendChild(el('div', { class: 'form-row' }, [el('label', {}, [t('called_by')]), el('input', { type: 'text', name: 'by' })]));
      form.appendChild(el('div', { class: 'form-actions' }, [
        el('button', { type: 'button', class: 'btn ghost', onclick: () => overlay.remove() }, [t('cancel')]),
        el('button', { type: 'submit', class: 'btn primary' }, [t('save')]),
      ]));
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const reason = form.querySelector('[name=reason]').value;
        const by = form.querySelector('[name=by]').value;
        const history = (member.followUpHistory || []).concat([{ date: todayIso(), reason, by }]);
        await window.NKDB.put('members', { ...member, followedUpAt: todayIso(), followUpReason: reason, followedUpBy: by, followUpHistory: history });
        overlay.remove();
        renderFollowUp();
      });
      overlay.appendChild(form);
      document.body.appendChild(overlay);
    }

    async function undoFollowUp(member) {
      await window.NKDB.put('members', { ...member, followedUpAt: null, followUpReason: null, followedUpBy: null });
      renderFollowUp();
    }

    await renderFollowUp();
  }

  // ---------- dashboard ----------
  async function renderDashboard() {
    const wrap = el('div', { class: 'panel' });
    const today = new Date();
    const ec = window.EthCal.toEthiopian(today);
    wrap.appendChild(el('div', { class: 'today-banner' }, [
      el('span', {}, [t('today_ec') + ': ']),
      el('strong', {}, [window.EthCal.formatEC(ec, window.I18N.getLang())]),
    ]));

    const [members, attendance, inventory, programs, plan] = await Promise.all([
      window.NKDB.getAll('members'), window.NKDB.getAll('attendance'),
      window.NKDB.getAll('inventory'), window.NKDB.getAll('programs'), window.NKDB.getAll('planItems'),
    ]);
    const activeMembers = members.filter((m) => m.status !== 'inactive');
    const dates = Array.from(new Set(attendance.map((r) => r.date))).sort().reverse();
    const attendanceByKey = {};
    attendance.forEach((r) => { attendanceByKey[r.memberId + '|' + r.date] = r; });
    let flaggedCount = 0;
    for (const m of activeMembers) {
      const count = await computeConsecutiveAbsences(m.id, dates.slice(0, 8), attendanceByKey);
      if (count >= 3) flaggedCount++;
    }
    const needsAttention = inventory.filter((i) => i.status === 'damaged' || i.status === 'washing').length;

    wrap.appendChild(el('div', { class: 'stat-row' }, [
      statCard('total_members', String(activeMembers.length), 'neutral'),
      statCard('needs_followup', String(flaggedCount), flaggedCount ? 'danger' : 'good'),
      statCard('low_stock', String(needsAttention), needsAttention ? 'warn' : 'good'),
    ]));

    wrap.appendChild(el('h3', {}, [t('upcoming_programs')]));
    const upcoming = programs.filter((p) => p.date && p.date >= todayIso()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
    const progList = el('div', { class: 'due-list' });
    if (!upcoming.length) progList.appendChild(el('p', { class: 'empty' }, [t('no_records')]));
    upcoming.forEach((p) => {
      progList.appendChild(el('div', { class: 'due-item' }, [
        el('div', { class: 'due-title' }, [p.description || t('program_' + p.type) || p.type]),
        el('div', { class: 'due-date' }, [fmtDate(p.date)]),
      ]));
    });
    wrap.appendChild(progList);

    wrap.appendChild(el('h3', {}, [t('upcoming_due')]));
    const upcomingPlan = plan.filter((p) => p.nextDateGC).sort((a, b) => a.nextDateGC.localeCompare(b.nextDateGC)).slice(0, 6);
    const planList = el('div', { class: 'due-list' });
    if (!upcomingPlan.length) planList.appendChild(el('p', { class: 'empty' }, [t('no_records')]));
    upcomingPlan.forEach((p) => {
      planList.appendChild(el('div', { class: 'due-item' }, [
        el('div', { class: 'due-title' }, [p.title]),
        el('div', { class: 'due-date' }, [fmtDate(p.nextDateGC)]),
      ]));
    });
    wrap.appendChild(planList);
    app.appendChild(wrap);
  }

  // ---------- plan (ዕቅድ) ----------
  async function seedPlanIfEmpty() {
    const existing = await window.NKDB.getAll('planItems');
    if (existing.length) return;
    const seeded = window.ZS_PLAN_SEED.map((item) => {
      const due = window.EthCal.computeNextDue(item.timing, null);
      return { ...item, history: [], nextDateEC: due.ec, nextDateGC: due.gDate ? due.gDate.toISOString().slice(0, 10) : null };
    });
    await window.NKDB.bulkPut('planItems', seeded);
  }

  async function seedInventoryIfEmpty() {
    const existing = await window.NKDB.getAll('inventory');
    if (existing.length) return;
    await window.NKDB.bulkPut('inventory', window.ZS_INVENTORY_SEED.map((i) => ({ ...i })));
  }

  async function renderPlan() {
    await seedPlanIfEmpty();
    if (window.NKAuth && window.NKAuth.refreshProfile) {
      try { await window.NKAuth.refreshProfile(); } catch (e) { /* offline or not signed in — ignore */ }
    }
    const wrap = el('div', { class: 'panel' });
    wrap.appendChild(el('div', { class: 'panel-header' }, [
      el('h2', {}, [t('nav_plan')]),
      el('div', {}, [
        el('button', { class: 'btn ghost', onclick: () => importPlanExcel() }, [t('import_excel')]),
        el('button', { class: 'btn ghost', onclick: () => exportPlanExcel() }, [t('export_excel')]),
      ]),
    ]));

    const isAdmin = window.NKAuth ? window.NKAuth.isAdmin() : true;
    const reportBar = el('div', { class: 'toolbar' });
    if (isAdmin) {
      const periodSel = el('select', {}, [
        el('option', { value: '3' }, ['3 ' + t('report_period')]),
        el('option', { value: '6' }, ['6 ' + t('report_period')]),
        el('option', { value: '12' }, ['12 ' + t('report_period')]),
      ]);
      reportBar.appendChild(periodSel);
      reportBar.appendChild(el('button', { class: 'btn ghost', onclick: () => generateReport(Number(periodSel.value)) }, [t('generate_report')]));
      reportBar.appendChild(el('button', { class: 'btn primary', onclick: () => generatePptxReport(Number(periodSel.value)) }, [t('generate_pptx')]));
    } else {
      reportBar.appendChild(el('p', { class: 'muted' }, [t('admin_only_note')]));
    }
    wrap.appendChild(reportBar);

    const list = el('div', { class: 'plan-list' });
    const items = (await window.NKDB.getAll('planItems')).sort((a, b) => (a.no || 0) - (b.no || 0));
    items.forEach((p) => list.appendChild(renderPlanCard(p)));
    wrap.appendChild(list);
    wrap.appendChild(el('button', { class: 'btn ghost danger-text', onclick: () => resetPlan() }, [t('plan_reset')]));
    app.appendChild(wrap);
  }

  function renderPlanCard(p) {
    const card = el('div', { class: 'plan-card' });
    card.appendChild(el('div', { class: 'plan-card-head' }, [
      el('span', { class: 'plan-no' }, ['#' + p.no]),
      el('strong', {}, [p.title]),
    ]));
    if (p.details) card.appendChild(el('div', { class: 'plan-details' }, [p.details]));
    card.appendChild(el('div', { class: 'plan-meta' }, [
      metaChip(t('plan_timing'), p.timing || '—'),
      metaChip(t('plan_target'), p.target || '—'),
      metaChip(t('plan_executor'), p.executor || '—'),
      metaChip(t('plan_budget'), p.budget || '—'),
    ]));
    card.appendChild(el('div', { class: 'plan-due' }, [
      el('span', {}, [t('plan_next_due') + ': ']),
      el('strong', {}, [p.nextDateGC ? fmtDate(p.nextDateGC) : '—']),
    ]));
    card.appendChild(el('div', { class: 'plan-actions' }, [
      el('button', { class: 'btn small primary', onclick: () => markPlanDone(p) }, [t('plan_mark_done')]),
    ]));
    if (p.history && p.history.length) {
      const hist = el('details', { class: 'plan-history' }, [el('summary', {}, [t('plan_history') + ` (${p.history.length})`])]);
      p.history.slice().reverse().forEach((h) => hist.appendChild(el('div', { class: 'history-row' }, [`${fmtDate(h.date)} — ${h.note || ''}`])));
      card.appendChild(hist);
    }
    return card;
  }

  function metaChip(label, value) {
    return el('div', { class: 'meta-chip' }, [el('span', { class: 'meta-label' }, [label]), el('span', {}, [value])]);
  }

  function markPlanDone(p) {
    const overlay = el('div', { class: 'modal-overlay' });
    const form = el('form', { class: 'modal-card' });
    form.appendChild(el('h3', {}, [p.title]));
    form.appendChild(el('div', { class: 'form-row' }, [el('label', {}, [t('plan_done_note')]), el('textarea', { name: 'note', rows: '3' })]));
    form.appendChild(el('div', { class: 'form-actions' }, [
      el('button', { type: 'button', class: 'btn ghost', onclick: () => overlay.remove() }, [t('cancel')]),
      el('button', { type: 'submit', class: 'btn primary' }, [t('save')]),
    ]));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const note = form.querySelector('[name=note]').value;
      const now = new Date();
      const history = (p.history || []).concat([{ date: now.toISOString().slice(0, 10), note }]);
      const due = window.EthCal.computeNextDue(p.timing, now);
      await window.NKDB.put('planItems', { ...p, history, nextDateEC: due.ec, nextDateGC: due.gDate ? due.gDate.toISOString().slice(0, 10) : null });
      overlay.remove();
      render();
    });
    overlay.appendChild(form);
    document.body.appendChild(overlay);
  }

  async function resetPlan() {
    if (!confirm(t('confirm_delete'))) return;
    const existing = await window.NKDB.getAll('planItems');
    for (const p of existing) await window.NKDB.remove('planItems', p.id);
    await seedPlanIfEmpty();
    render();
  }

  function exportPlanExcel() {
    window.NKDB.getAll('planItems').then((items) => {
      const rows = items.map((p) => ({
        [t('plan_no')]: p.no, [t('plan_subunit')]: p.subUnit, [t('plan_title')]: p.title,
        [t('plan_details')]: p.details, [t('plan_outcome')]: p.outcome, [t('plan_indicator')]: p.indicator,
        [t('plan_target')]: p.target, [t('plan_timing')]: p.timing, [t('plan_executor')]: p.executor,
        [t('plan_budget')]: p.budget, category: p.category,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ዕቅድ');
      XLSX.writeFile(wb, `plan-${todayIso()}.xlsx`);
    });
  }

  function importPlanExcel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      const existing = await window.NKDB.getAll('planItems');
      for (const row of rows) {
        const title = pick(row, ['አብይ ተግባር', 'Title', 'title']);
        const subUnit = pick(row, ['ንዑስ ክፍል', 'Sub-unit', 'subUnit']) || '';
        if (!title) continue;
        const match = existing.find((e) => e.title === title && (e.subUnit || '') === subUnit);
        const timing = pick(row, ['የጊዜ ገደብ', 'Timing', 'timing']) || '';
        const due = window.EthCal.computeNextDue(timing, null);
        const record = {
          id: match ? match.id : undefined,
          no: Number(pick(row, ['ተ.ቁ', 'No', 'no'])) || (match ? match.no : existing.length + 1),
          subUnit, title,
          details: pick(row, ['ዝርዝር ተግባር', 'Details', 'details']) || '',
          outcome: pick(row, ['መግለጫ', 'Outcome', 'outcome']) || '',
          indicator: pick(row, ['መለኪያ', 'Indicator', 'indicator']) || '',
          target: pick(row, ['እቅድ', 'Target', 'target']) || '',
          timing,
          executor: pick(row, ['ፈጻሚ አካል', 'Executor', 'executor']) || '',
          budget: pick(row, ['በጀት', 'Budget', 'budget']) || '',
          category: (pick(row, ['ምድብ', 'Category', 'category']) || 'main').toLowerCase(),
          history: match ? match.history : [],
          nextDateEC: match ? match.nextDateEC : due.ec,
          nextDateGC: match ? match.nextDateGC : (due.gDate ? due.gDate.toISOString().slice(0, 10) : null),
        };
        await window.NKDB.put('planItems', record);
      }
      render();
    };
    input.click();
  }

  // ---------- report generation ----------
  async function gatherReportData(months) {
    const [members, attendance, inventory, programs, plan, contributions] = await Promise.all([
      window.NKDB.getAll('members'), window.NKDB.getAll('attendance'), window.NKDB.getAll('inventory'),
      window.NKDB.getAll('programs'), window.NKDB.getAll('planItems'), window.NKDB.getAll('contributions'),
    ]);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const inRange = (d) => d && new Date(d) >= cutoff;
    const activeMembers = members.filter((m) => m.status !== 'inactive');
    const periodAttendance = attendance.filter((r) => inRange(r.date));
    const presentCount = periodAttendance.filter((r) => r.present).length;
    const attendanceRate = periodAttendance.length ? Math.round((presentCount / periodAttendance.length) * 100) : 0;
    const periodPrograms = programs.filter((p) => inRange(p.date));
    const periodContrib = contributions.filter((c) => inRange(c.datePaid));
    const contribTotal = periodContrib.reduce((s, r) => s + (Number(r.paid) || 0), 0);
    const needsAttention = inventory.filter((i) => i.status === 'damaged' || i.status === 'washing').length;

    const dates = Array.from(new Set(attendance.map((r) => r.date))).sort().reverse();
    const attendanceByKey = {};
    attendance.forEach((r) => { attendanceByKey[r.memberId + '|' + r.date] = r; });
    let flaggedCount = 0;
    for (const m of activeMembers) {
      let count = 0;
      for (const d of dates.slice(0, 8)) {
        const rec = attendanceByKey[m.id + '|' + d];
        if (rec ? rec.present : false) break;
        count++;
      }
      if (count >= 3) flaggedCount++;
    }

    const planRows = plan.slice().sort((a, b) => (a.no || 0) - (b.no || 0)).map((p) => {
      const doneInPeriod = (p.history || []).filter((h) => inRange(h.date)).length;
      const status = doneInPeriod > 0 ? t('plan_status_on_track') : t('plan_status_needs_attn');
      return { no: p.no, title: p.title, timing: p.timing || '', doneInPeriod, status };
    });
    const planOnTrack = planRows.filter((p) => p.doneInPeriod > 0).length;
    const planNeedsAttn = planRows.length - planOnTrack;

    return {
      months, memberCount: activeMembers.length, attendanceRate, flaggedCount, needsAttention,
      programCount: periodPrograms.length, contribTotal, planRows, planOnTrack, planNeedsAttn,
    };
  }

  async function generateReport(months) {
    const d = await gatherReportData(months);
    const win = window.open('', '_blank');
    const lang = window.I18N.getLang();
    const rows = d.planRows.map((p) =>
      `<tr><td>${p.no}</td><td>${p.title}</td><td>${p.timing}</td><td>${p.doneInPeriod}</td><td>${p.status}</td></tr>`
    ).join('');

    win.document.write(`
      <html lang="${lang}"><head><meta charset="utf-8"><title>${t('generate_report')}</title>
      <style>
        body{font-family:'Noto Sans Ethiopic',sans-serif;padding:32px;color:#1a1a1a;}
        h1{font-family:'Noto Serif Ethiopic',serif;}
        table{width:100%;border-collapse:collapse;margin:16px 0;}
        th,td{border:1px solid #ccc;padding:6px 10px;text-align:${lang === 'en' ? 'left' : 'right'};font-size:13px;}
        th{background:#efe7f7;}
        .stats{display:flex;gap:16px;margin:16px 0;flex-wrap:wrap;}
        .stat{border:1px solid #ccc;padding:10px 16px;border-radius:6px;}
      </style></head><body>
      <h1>${t('app_title')} — ${t('generate_report')} (${d.months} ${lang === 'en' ? 'months' : 'ወር'})</h1>
      <p>${new Date().toLocaleDateString()} — ${window.EthCal.formatEC(window.EthCal.toEthiopian(new Date()), lang)}</p>
      <div class="stats">
        <div class="stat"><strong>${t('total_members')}:</strong> ${d.memberCount}</div>
        <div class="stat"><strong>${t('nav_programs')}:</strong> ${d.programCount}</div>
        <div class="stat"><strong>${t('needs_followup')}:</strong> ${d.flaggedCount}</div>
        <div class="stat"><strong>${t('low_stock')}:</strong> ${d.needsAttention}</div>
        <div class="stat"><strong>${t('total_collected')}:</strong> ${fmtMoney(d.contribTotal)}</div>
      </div>
      <h2>${t('nav_plan')}</h2>
      <table><thead><tr><th>${t('plan_no')}</th><th>${t('plan_title')}</th><th>${t('plan_timing')}</th><th>#</th><th>${t('plan_status_on_track')}</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <script>window.print()</script>
      </body></html>`);
    win.document.close();
  }

  const PPTX_FONT = 'Nyala';
  const INDIGO = '3B3260';
  const GOLD = 'C9A24B';
  const PARCH = 'F4F1E8';
  const SAGE = '7C9473';
  const DANGER = 'B5563C';

  async function generatePptxReport(months) {
    if (typeof PptxGenJS === 'undefined') {
      alert('PowerPoint library failed to load — check your connection and reload the app once online, then try again.');
      return;
    }
    const d = await gatherReportData(months);
    const lang = window.I18N.getLang();
    const monthsLabel = `${d.months} ${lang === 'en' ? 'months' : 'ወር'}`;
    const todayStr = window.EthCal.formatEC(window.EthCal.toEthiopian(new Date()), lang) + ' / ' + new Date().toLocaleDateString();

    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'ZS16x9', width: 10, height: 5.63 });
    pptx.layout = 'ZS16x9';

    let slide = pptx.addSlide();
    slide.background = { color: INDIGO };
    slide.addText(t('app_title'), { x: 0.5, y: 1.7, w: 9, h: 1, fontFace: PPTX_FONT, fontSize: 30, bold: true, color: GOLD, align: 'center' });
    slide.addText(`${t('generate_report')} — ${monthsLabel}`, { x: 0.5, y: 2.6, w: 9, h: 0.6, fontFace: PPTX_FONT, fontSize: 18, color: PARCH, align: 'center' });
    slide.addText(todayStr, { x: 0.5, y: 3.2, w: 9, h: 0.5, fontFace: PPTX_FONT, fontSize: 12, color: 'B8AED9', align: 'center' });

    slide = pptx.addSlide();
    slide.background = { color: INDIGO };
    slide.addText(t('nav_dashboard'), { x: 0.4, y: 0.3, w: 9, h: 0.5, fontFace: PPTX_FONT, fontSize: 22, bold: true, color: GOLD });
    slide.addChart(pptx.ChartType.bar, [{
      name: t('nav_dashboard'),
      labels: [t('total_members'), t('nav_programs'), t('needs_followup'), t('low_stock')],
      values: [d.memberCount, d.programCount, d.flaggedCount, d.needsAttention],
    }], {
      x: 0.4, y: 0.9, w: 9.2, h: 3.3,
      chartColors: [GOLD, SAGE, DANGER, 'D3A24A'],
      showLegend: false, showValue: true,
      dataLabelColor: PARCH, dataLabelFontFace: PPTX_FONT, dataLabelFontSize: 11,
      catAxisLabelColor: PARCH, catAxisLabelFontFace: PPTX_FONT, catAxisLabelFontSize: 12,
      valAxisHidden: true,
      catAxisLineColor: '564A8A', valGridLine: { color: '4A3F73' },
      plotArea: { fill: { color: INDIGO } }, chartArea: { fill: { color: INDIGO } },
    });
    slide.addText(`${t('total_collected')}: ${fmtMoney(d.contribTotal)}`, {
      x: 0.4, y: 4.35, w: 9.2, h: 0.5, fontFace: PPTX_FONT, fontSize: 13, color: PARCH, bold: true,
    });

    slide = pptx.addSlide();
    slide.background = { color: INDIGO };
    slide.addText(t('nav_plan') + ' — ' + t('nav_dashboard'), { x: 0.4, y: 0.3, w: 9, h: 0.5, fontFace: PPTX_FONT, fontSize: 22, bold: true, color: GOLD });
    slide.addChart(pptx.ChartType.doughnut, [{
      name: t('nav_plan'),
      labels: [t('plan_status_on_track'), t('plan_status_needs_attn')],
      values: [d.planOnTrack, d.planNeedsAttn],
    }], {
      x: 0.3, y: 1.0, w: 4.4, h: 3.6,
      chartColors: [SAGE, DANGER],
      showLegend: true, legendPos: 'b', legendColor: PARCH, legendFontFace: PPTX_FONT, legendFontSize: 11,
      showPercent: true, dataLabelColor: INDIGO, dataLabelFontFace: PPTX_FONT, dataLabelFontSize: 11,
      title: t('nav_plan'), showTitle: true, titleColor: PARCH, titleFontFace: PPTX_FONT, titleFontSize: 13,
      chartArea: { fill: { color: INDIGO } },
    });
    slide.addChart(pptx.ChartType.doughnut, [{
      name: t('nav_attendance'),
      labels: [t('total_members'), t('needs_followup')],
      values: [Math.max(0, d.memberCount - d.flaggedCount), d.flaggedCount],
    }], {
      x: 5.0, y: 1.0, w: 4.4, h: 3.6,
      chartColors: [GOLD, DANGER],
      showLegend: true, legendPos: 'b', legendColor: PARCH, legendFontFace: PPTX_FONT, legendFontSize: 11,
      showPercent: true, dataLabelColor: INDIGO, dataLabelFontFace: PPTX_FONT, dataLabelFontSize: 11,
      title: t('nav_attendance'), showTitle: true, titleColor: PARCH, titleFontFace: PPTX_FONT, titleFontSize: 13,
      chartArea: { fill: { color: INDIGO } },
    });

    const CHUNK = 8;
    for (let i = 0; i < d.planRows.length; i += CHUNK) {
      const chunk = d.planRows.slice(i, i + CHUNK);
      slide = pptx.addSlide();
      slide.background = { color: INDIGO };
      slide.addText(`${t('nav_plan')}${d.planRows.length > CHUNK ? ` (${i + 1}–${Math.min(i + CHUNK, d.planRows.length)})` : ''}`, {
        x: 0.4, y: 0.25, w: 9, h: 0.5, fontFace: PPTX_FONT, fontSize: 20, bold: true, color: GOLD,
      });
      const header = [t('plan_no'), t('plan_title'), t('plan_timing'), '#', t('plan_status_on_track')]
        .map((h) => ({ text: h, options: { bold: true, color: INDIGO, fill: { color: GOLD }, fontFace: PPTX_FONT, fontSize: 10 } }));
      const bodyRows = chunk.map((p) => [
        { text: String(p.no || ''), options: { fontFace: PPTX_FONT, fontSize: 9, color: '2A2444' } },
        { text: p.title, options: { fontFace: PPTX_FONT, fontSize: 9, color: '2A2444' } },
        { text: p.timing, options: { fontFace: PPTX_FONT, fontSize: 9, color: '2A2444' } },
        { text: String(p.doneInPeriod), options: { fontFace: PPTX_FONT, fontSize: 9, color: '2A2444', align: 'center' } },
        { text: p.status, options: { fontFace: PPTX_FONT, fontSize: 9, color: '2A2444' } },
      ]);
      slide.addTable([header, ...bodyRows], {
        x: 0.4, y: 0.9, w: 9.2, colW: [0.5, 3.6, 2.2, 0.6, 2.3],
        fill: { color: PARCH }, border: { type: 'solid', color: 'B8AED9', pt: 0.5 },
        autoPage: false, valign: 'middle',
      });
    }

    await pptx.writeFile({ fileName: `zemana-sinetibebat-report-${months}m-${todayIso()}.pptx` });
  }

  // ---------- settings ----------
  async function renderSettings() {
    const wrap = el('div', { class: 'panel' });
    wrap.appendChild(el('h2', {}, [t('nav_settings')]));
    wrap.appendChild(el('div', { class: 'form-row' }, [
      el('label', {}, [t('language')]),
      el('div', { class: 'lang-toggle' }, [
        el('button', { class: 'btn small' + (window.I18N.getLang() === 'am' ? ' primary' : ' ghost'), onclick: () => { window.I18N.setLang('am'); render(); } }, ['አማ']),
        el('button', { class: 'btn small' + (window.I18N.getLang() === 'en' ? ' primary' : ' ghost'), onclick: () => { window.I18N.setLang('en'); render(); } }, ['EN']),
      ]),
    ]));
    if (window.NKReminders) wrap.appendChild(renderRemindersPanel());
    if (window.NKAuth) wrap.appendChild(await window.NKAuth.renderSettingsPanel(el));
    app.appendChild(wrap);
  }

  function renderRemindersPanel() {
    const R = window.NKReminders;
    const wrap = el('div', { class: 'auth-panel' });
    wrap.appendChild(el('h3', {}, [t('reminders_title')]));
    wrap.appendChild(el('p', { class: 'muted' }, [t('reminders_explain')]));

    const perm = R.permissionState();
    const status = el('p', { class: perm === 'denied' ? 'error-text' : 'muted' });
    if (perm === 'unsupported') status.textContent = t('reminders_unsupported');
    else if (perm === 'denied') status.textContent = t('reminders_permission_denied');
    wrap.appendChild(status);

    if (perm !== 'unsupported' && perm !== 'denied') {
      const enabled = R.isEnabled();
      const toggleBtn = el('button', {
        class: 'btn ' + (enabled ? 'primary' : 'ghost'),
        onclick: async () => {
          if (!enabled) {
            const res = await R.requestPermission();
            if (res === 'granted') { R.setEnabled(true); await R.checkAndNotify(true); }
          } else {
            R.setEnabled(false);
          }
          render();
        },
      }, [enabled ? t('reminders_disable') : t('reminders_enable')]);
      wrap.appendChild(toggleBtn);

      if (enabled) {
        const checkBtn = el('button', {
          class: 'btn ghost', style: 'margin-left:8px',
          onclick: async () => {
            const res = await R.checkAndNotify(true);
            if (!res.fired) alert(t('reminders_nothing'));
          },
        }, [t('reminders_check_now')]);
        wrap.appendChild(checkBtn);
      }
    }
    return wrap;
  }

  // ---------- boot ----------
  function showBootError(msg) {
    app.innerHTML = '';
    app.appendChild(el('div', { class: 'panel' }, [
      el('h2', {}, ['⚠️ Could not start']),
      el('p', {}, [msg]),
      el('p', { class: 'muted' }, [
        "If you opened this file directly (file://...), that's usually why: " +
        'the local database this app needs is blocked on that origin in most ' +
        'mobile browsers. Serve it over http(s) instead — deploy to GitHub ' +
        'Pages, or run a quick local server and open it via http://localhost/...',
      ]),
    ]));
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      if (typeof indexedDB === 'undefined') {
        showBootError('IndexedDB is not available on this page (origin: ' + location.origin + location.pathname + ').');
        return;
      }
      await window.NKDB.open();
      await seedPlanIfEmpty();
      await seedInventoryIfEmpty();
      if (window.NKAuth) {
        try { await window.NKAuth.init(); } catch (e) { console.warn('auth init failed, continuing offline', e); }
        if (window.NKAuth.needsAuthGate && window.NKAuth.needsAuthGate()) {
          document.getElementById('tabbar').innerHTML = '';
          app.innerHTML = '';
          app.appendChild(window.NKAuth.renderAuthGate(el));
          window.I18N.applyStaticTranslations(app);
          return;
        }
        if ((window.NKAuth.isPending && window.NKAuth.isPending()) || (window.NKAuth.isRejected && window.NKAuth.isRejected())) {
          document.getElementById('tabbar').innerHTML = '';
          app.innerHTML = '';
          app.appendChild(window.NKAuth.renderApprovalGate(el));
          window.I18N.applyStaticTranslations(app);
          return;
        }
      }
      render();
      if (window.NKReminders) {
        window.NKReminders.checkAndNotify(false).catch((e) => console.warn('reminders check failed', e));
      }
    } catch (err) {
      console.error('Boot failed:', err);
      showBootError(String(err && err.message ? err.message : err));
    }
  });

  document.addEventListener('zs-lang-changed', render);
})();
