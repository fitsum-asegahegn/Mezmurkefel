/* i18n.js — AM/EN dictionary + t() helper + language toggle */
(function (global) {
  const DICT = {
    app_title: { am: 'ዜማና ስነ ጥበባት ክፍል', en: 'Hymnody & Arts Department' },
    nav_dashboard: { am: 'ዳሽቦርድ', en: 'Dashboard' },
    nav_members: { am: 'አባላት', en: 'Members' },
    nav_attendance: { am: 'ጥናት ክትትል', en: 'Attendance' },
    nav_inventory: { am: 'ቁሳቁስ', en: 'Instruments & Vestments' },
    nav_programs: { am: 'ፕሮግራሞች', en: 'Programs' },
    nav_contrib: { am: 'መዋጮ', en: 'Contributions' },
    nav_plan: { am: 'ዕቅድ', en: 'Plan' },
    nav_settings: { am: 'ቅንብር', en: 'Settings' },

    today_ec: { am: 'የዛሬ ቀን', en: 'Today' },
    upcoming_due: { am: 'በቅርቡ የሚደርሱ', en: 'Coming up' },
    total_members: { am: 'ጠቅላላ አባላት', en: 'Total members' },
    needs_followup: { am: 'ክትትል የሚያስፈልጋቸው', en: 'Need follow-up' },
    upcoming_programs: { am: 'ቀጣይ መርሀግብሮች', en: 'Upcoming programs' },
    low_stock: { am: 'ትኩረት የሚያስፈልገው ቁሳቁስ', en: 'Inventory needing attention' },

    add_new: { am: '+ አዲስ ጨምር', en: '+ Add new' },
    save: { am: 'አስቀምጥ', en: 'Save' },
    cancel: { am: 'ይቅር', en: 'Cancel' },
    edit: { am: 'አርም', en: 'Edit' },
    delete: { am: 'ሰርዝ', en: 'Delete' },
    search: { am: 'ፈልግ...', en: 'Search...' },
    export_excel: { am: '⬇ ወደ Excel ላክ', en: '⬇ Export Excel' },
    import_excel: { am: '⬆ ከExcel አስገባ', en: '⬆ Import Excel' },
    print: { am: '🖨 አትም', en: '🖨 Print' },
    close: { am: 'ዝጋ', en: 'Close' },
    confirm_delete: { am: 'እርግጠኛ ነዎት መሰረዝ ይፈልጋሉ?', en: 'Delete this item?' },
    no_records: { am: 'ምንም መረጃ የለም', en: 'No records yet' },
    yes: { am: 'አዎ', en: 'Yes' },
    no: { am: 'አይ', en: 'No' },
    undo: { am: 'ቀልብስ', en: 'Undo' },

    // Members
    member_name: { am: 'የአባል ስም', en: 'Member name' },
    member_section: { am: 'ንዑስ ክፍል', en: 'Section' },
    section_hymn: { am: 'መዝሙር', en: 'Hymn' },
    section_kebero: { am: 'ከበሮ', en: 'Kebero (drum)' },
    section_art: { am: 'ስዕል', en: 'Painting' },
    section_drama: { am: 'ትወና', en: 'Drama' },
    section_writing: { am: 'ጽሑፍ', en: 'Writing' },
    section_other: { am: 'ሌላ', en: 'Other' },
    member_phone: { am: 'ስልክ', en: 'Phone' },
    join_date: { am: 'የገባበት ቀን', en: 'Join date' },
    member_status: { am: 'ሁኔታ', en: 'Status' },
    member_status_active: { am: 'ንቁ', en: 'Active' },
    member_status_inactive: { am: 'ንቁ ያልሆነ', en: 'Inactive' },
    robe_eligible: { am: 'ለክብር ልብስ ብቁ', en: 'Robe-eligible' },
    member_notes: { am: 'ማስታወሻ', en: 'Notes' },

    // Attendance
    attendance_for_date: { am: 'የቀን ጥናት ክትትል', en: 'Attendance for' },
    pick_date: { am: 'ቀን ምረጥ', en: 'Pick date' },
    save_attendance: { am: 'አስቀምጥ', en: 'Save attendance' },
    consecutive_absences: { am: 'ተከታታይ የቀሩ', en: 'Consecutive absences' },
    call_member: { am: '📞 ደውል', en: '📞 Call' },
    mark_called: { am: 'ተከታትያለሁ ✓', en: 'Followed up ✓' },
    already_called: { am: 'ክትትል ተደርጓል', en: 'Already followed up' },
    call_reason: { am: 'ምክንያት', en: 'Reason' },
    called_by: { am: 'የተከታተለው', en: 'Followed up by' },
    no_absentees: { am: 'ክትትል የሚያስፈልገው የለም 🎉', en: 'No one needs follow-up 🎉' },
    attendance_type_study: { am: 'ጥናት ክትትል', en: 'Hymn study' },
    attendance_type_meeting: { am: 'ክፍል ስብሰባ', en: 'Department meeting' },
    history_title: { am: '📋 ታሪክ', en: '📋 History' },
    history_present: { am: 'የተገኙ', en: 'Present' },
    history_absent: { am: 'ያልተገኙ', en: 'Absent' },
    history_no_dates: { am: 'ገና ምንም አቴንዳስ አልተመዘገበም', en: 'No attendance recorded yet' },

    // Inventory
    item_name: { am: 'የቁስ ስም', en: 'Item name' },
    item_category: { am: 'ምድብ', en: 'Category' },
    cat_instrument: { am: 'የሙዚቃ መሳሪያ', en: 'Instrument' },
    cat_vestment: { am: 'ልብሰ ስብሐት', en: 'Vestment' },
    cat_other: { am: 'ሌላ', en: 'Other' },
    item_quantity: { am: 'ብዛት', en: 'Quantity' },
    item_status: { am: 'ሁኔታ', en: 'Condition' },
    item_status_active: { am: 'ጥቅም ላይ', en: 'In use' },
    item_status_damaged: { am: 'ተጎድቷል', en: 'Damaged' },
    item_status_washing: { am: 'ማጠብ ያስፈልጋል', en: 'Needs washing' },
    item_last_washed: { am: 'መጨረሻ የታጠበበት ቀን', en: 'Last washed' },
    item_notes: { am: 'ማስታወሻ', en: 'Notes' },

    // Programs
    program_type: { am: 'የመርሀግብር አይነት', en: 'Program type' },
    program_christmas: { am: 'ገና መርሀ-ግብር', en: 'Christmas program' },
    program_art_night: { am: 'የኪነ-ጥበብ ምሽት', en: 'Art night' },
    program_theater: { am: 'ቲያትር/መድረክ', en: 'Theater' },
    program_exhibition: { am: 'የስዕል አውደ ርዕይ', en: 'Painting exhibition' },
    program_exchange: { am: 'ልምድ ልውውጥ', en: 'Peer-school exchange' },
    program_greeting: { am: 'የበዓል መልዕክት', en: 'Holiday greeting' },
    program_other: { am: 'ሌላ', en: 'Other' },
    program_date: { am: 'ቀን', en: 'Date' },
    program_desc: { am: 'መግለጫ', en: 'Description' },
    program_budget: { am: 'በጀት (ብር)', en: 'Budget (ETB)' },
    program_attendance_count: { am: 'የተሳተፉ ብዛት', en: 'Participants' },
    program_notes: { am: 'ማስታወሻ', en: 'Notes' },

    // Contributions
    contrib_period: { am: 'ወር', en: 'Month' },
    contrib_member: { am: 'ከማን', en: 'From whom' },
    contrib_expected: { am: 'የሚጠበቅ መጠን', en: 'Expected amount' },
    contrib_paid: { am: 'የተከፈለ መጠን', en: 'Amount paid' },
    contrib_date_paid: { am: 'የተከፈለበት ቀን', en: 'Date paid' },
    contrib_collected_by: { am: 'የሰበሰበው', en: 'Collected by' },
    contrib_handed_over: { am: 'ለንብረት ክፍል ገብቷል?', en: 'Handed to ንብረት ክፍል?' },
    total_collected: { am: 'ጠቅላላ የተሰበሰበ', en: 'Total collected' },

    // Plan
    plan_no: { am: 'ተ.ቁ', en: 'No.' },
    plan_subunit: { am: 'ንዑስ ክፍል', en: 'Sub-unit' },
    plan_title: { am: 'አብይ ተግባር', en: 'Main task' },
    plan_details: { am: 'ዝርዝር ተግባር', en: 'Details' },
    plan_outcome: { am: 'መግለጫ', en: 'Description' },
    plan_indicator: { am: 'መለኪያ', en: 'Indicator' },
    plan_target: { am: 'እቅድ', en: 'Target' },
    plan_timing: { am: 'የጊዜ ገደብ', en: 'Timing' },
    plan_executor: { am: 'ፈጻሚ አካል', en: 'Executor' },
    plan_budget: { am: 'በጀት', en: 'Budget' },
    plan_next_due: { am: 'ቀጣይ ጊዜ', en: 'Next due' },
    plan_mark_done: { am: 'ተከናውኗል ✓', en: 'Mark done ✓' },
    plan_done_note: { am: 'የክንውን ማስታወሻ', en: 'Completion note' },
    plan_history: { am: 'የክንውን ታሪክ', en: 'History' },
    plan_reset: { am: 'ወደ መጀመሪያው ዕቅድ መልስ', en: 'Reset to original plan' },
    plan_status_on_track: { am: 'እንደታቀደ እየሄደ ነው', en: 'On track' },
    plan_status_needs_attn: { am: 'ትኩረት ይፈልጋል', en: 'Needs attention' },
    generate_report: { am: '🖨 ሪፖርት አመንጭ', en: '🖨 Generate report' },
    generate_pptx: { am: '📊 PowerPoint አመንጭ', en: '📊 Generate PowerPoint' },
    report_period: { am: 'የሪፖርት ጊዜ', en: 'Report period' },
    admin_only_note: { am: 'ይህ ክፍል ለ አስተዳዳሪዎች ብቻ ነው', en: 'This section is admin-only' },

    // Settings
    language: { am: 'ቋንቋ', en: 'Language' },
    settings_supabase: { am: '☁️ የSupabase ግንኙነት', en: '☁️ Supabase connection' },
    settings_sync_now: { am: '🔄 አሁን አመሳስል', en: '🔄 Sync now' },
    settings_display_name: { am: 'የሚታይ ስም', en: 'Display name' },
    settings_offline_only: { am: 'ከመስመር ውጪ ብቻ (Skip)', en: 'Skip — offline only' },
    settings_signed_in_as: { am: 'ገብተዋል እንደ', en: 'Signed in as' },
    settings_sign_out: { am: 'ውጣ', en: 'Sign out' },
    settings_sign_in: { am: 'ግባ', en: 'Sign in' },
    settings_sign_up: { am: 'መለያ ፍጠር', en: 'Sign up' },
    email: { am: 'ኢሜይል', en: 'Email' },
    password: { am: 'የይለፍ ቃል', en: 'Password' },

    unauthorized: { am: 'ይህን ለማድረግ ፈቃድ የለዎትም', en: 'You are not authorized to do this' },

    approval_pending_title: { am: 'መለያዎ በአስተዳዳሪ ይሁንታ በመጠባበቅ ላይ ነው', en: 'Your account is waiting for admin approval' },
    approval_rejected_title: { am: 'የመለያዎ ጥያቄ ውድቅ ተደርጓል', en: 'Your account request was declined' },
    approval_refresh: { am: '🔄 እንደገና አረጋግጥ', en: '🔄 Check again' },
    users_title: { am: '👤 አባላት', en: '👤 Users' },
    users_role: { am: 'ደረጃ', en: 'Role' },
    users_role_admin: { am: 'አስተዳዳሪ', en: 'Admin' },
    users_role_member: { am: 'አባል', en: 'Member' },
    users_you: { am: 'እርስዎ', en: 'you' },
    status_pending: { am: 'በመጠባበቅ ላይ', en: 'Pending' },
    status_approved: { am: 'ጸድቋል', en: 'Approved' },
    status_rejected: { am: 'ውድቅ ተደርጓል', en: 'Rejected' },
    users_approve_member: { am: '✅ እንደ አባል ፍቀድ', en: '✅ Approve as member' },
    users_approve_admin: { am: '👑 እንደ አስተዳዳሪ ፍቀድ', en: '👑 Approve as admin' },
    users_reject: { am: '🚫 እምቢ በል', en: '🚫 Reject' },
    users_make_admin: { am: '👑 አስተዳዳሪ አድርግ', en: '👑 Make admin' },
    users_make_member: { am: '⬇ ወደ አባል ቀይር', en: '⬇ Make member' },
    users_revoke: { am: '🚫 ፈቃድ ሰርዝ', en: '🚫 Revoke access' },
    users_reapprove: { am: '↩ እንደገና ፍቀድ', en: '↩ Re-approve' },

    reminders_title: { am: '🔔 የአካባቢ ማሳሰቢያዎች', en: '🔔 Local reminders' },
    reminders_enable: { am: 'አብራ', en: 'Enable' },
    reminders_disable: { am: 'አጥፋ', en: 'Disable' },
    reminders_explain: { am: 'መተግበሪያው ክፍት ሆኖ በዚህ መሳሪያ ላይ ብቻ ይሰራል — መተግበሪያው ተዘግቶ ባለበት ጊዜ ማንቂያ መላክ አይችልም (እውነተኛ push አይደለም)። በቀን አንዴ ይጣራል።', en: "Works only while the app is open on this device — it can't wake the app when it's closed (not real push). Checked at most once a day." },
    reminders_check_now: { am: '🔔 አሁን አረጋግጥ', en: '🔔 Check now' },
    reminders_permission_denied: { am: 'ፈቃድ ተከልክሏል — ከስልኩ ቅንብር ውስጥ ለዚህ ገጽ ማንቂያ ፈቃድ ይስጡ', en: 'Permission denied — enable notifications for this site in your device settings' },
    reminders_unsupported: { am: 'ይህ መሳሪያ/አሳሽ ማሳሰቢያዎችን አይደግፍም', en: 'Notifications are not supported on this device/browser' },
    reminders_nothing: { am: 'ምንም የሚያሳስብ ነገር የለም', en: 'Nothing to flag right now' },
  };

  let currentLang = localStorage.getItem('zs_lang') ||
    (navigator.language && navigator.language.startsWith('am') ? 'am' : 'am');

  function t(key) {
    const entry = DICT[key];
    if (!entry) return key;
    return entry[currentLang] || entry.am || key;
  }

  function getLang() { return currentLang; }

  function setLang(lang) {
    currentLang = lang === 'en' ? 'en' : 'am';
    localStorage.setItem('zs_lang', currentLang);
    document.documentElement.setAttribute('lang', currentLang);
    document.dispatchEvent(new CustomEvent('zs-lang-changed'));
  }

  function applyStaticTranslations(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    (root || document).querySelectorAll('[data-i18n-ph]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
  }

  global.I18N = { t, getLang, setLang, applyStaticTranslations, DICT };
})(window);
