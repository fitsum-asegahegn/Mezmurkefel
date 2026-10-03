/* reminders.js — LOCAL reminders only. Uses the browser Notification API
 * while this app is open on this device. This is NOT push — there is no
 * server, so nothing can wake the app or send a notification once it's
 * closed. A digest is checked at most once per calendar day (or on demand
 * via "Check now") and only fires if there's something worth flagging. */
(function (global) {
  const ENABLED_KEY = 'zs_reminders_enabled';
  const LAST_KEY = 'zs_reminders_last_date';

  function isEnabled() { return localStorage.getItem(ENABLED_KEY) === '1'; }
  function setEnabled(v) { localStorage.setItem(ENABLED_KEY, v ? '1' : '0'); }

  function permissionState() {
    return ('Notification' in window) ? Notification.permission : 'unsupported';
  }

  async function requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    try { return await Notification.requestPermission(); } catch (e) { return 'denied'; }
  }

  function fire(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try { new Notification(title, { body, icon: 'icon-192.png' }); } catch (e) { console.warn('notify failed', e); }
  }

  async function computeFlaggedCount() {
    const members = (await window.NKDB.getAll('members')).filter((m) => m.status !== 'inactive');
    const attendance = await window.NKDB.getAll('attendance');
    const dates = Array.from(new Set(attendance.map((r) => r.date))).sort().reverse().slice(0, 8);
    const byKey = {};
    attendance.forEach((r) => { byKey[r.memberId + '|' + r.date] = r; });
    let flagged = 0;
    for (const m of members) {
      let count = 0;
      for (const d of dates) {
        const rec = byKey[m.id + '|' + d];
        if (rec ? rec.present : false) break;
        count++;
      }
      if (count >= 3) flagged++;
    }
    return flagged;
  }

  async function gatherDigest() {
    const [inventory, programs, plan] = await Promise.all([
      window.NKDB.getAll('inventory'), window.NKDB.getAll('programs'), window.NKDB.getAll('planItems'),
    ]);
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const todayIso = new Date().toISOString().slice(0, 10);
    const dueSoon = plan.filter((p) => p.nextDateGC && new Date(p.nextDateGC) <= soon);
    const upcomingPrograms = programs.filter((p) => p.date && p.date >= todayIso && new Date(p.date) <= soon);
    const needsAttention = inventory.filter((i) => i.status === 'damaged' || i.status === 'washing').length;
    const flaggedCount = await computeFlaggedCount();

    const t = window.I18N.t;
    const lines = [];
    if (flaggedCount > 0) lines.push(`🎤 ${flaggedCount} — ${t('needs_followup')}`);
    if (needsAttention > 0) lines.push(`🥁 ${needsAttention} — ${t('low_stock')}`);
    if (upcomingPrograms.length > 0) lines.push(`🎭 ${upcomingPrograms.length} — ${t('upcoming_programs')}`);
    if (dueSoon.length > 0) lines.push(`🗓️ ${dueSoon.length} — ${t('upcoming_due')}`);
    return { lines, hasAny: lines.length > 0 };
  }

  async function checkAndNotify(force) {
    if (!isEnabled()) return { skipped: 'disabled' };
    if (permissionState() !== 'granted') return { skipped: 'no-permission' };
    const today = new Date().toISOString().slice(0, 10);
    if (!force && localStorage.getItem(LAST_KEY) === today) return { skipped: 'already-today' };
    const digest = await gatherDigest();
    if (digest.hasAny) fire(window.I18N.t('app_title'), digest.lines.join('\n'));
    localStorage.setItem(LAST_KEY, today);
    return { fired: digest.hasAny, lines: digest.lines };
  }

  global.NKReminders = { isEnabled, setEnabled, permissionState, requestPermission, checkAndNotify };
})(window);
