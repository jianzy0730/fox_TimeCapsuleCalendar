(() => {
  "use strict";

  const STORAGE_KEY = "TCC_DATA_V1";
  const THEME_KEY = "TCC_THEME_V1";
  const THEME_DEFAULT = { season: "winter", time: "auto" };
  const THEME_SEASONS = ["winter", "spring", "summer", "autumn"];
  const THEME_TIMES = ["auto", "sunset", "night"];

  const TEST_MESSAGES = [
    "【测试】你今天做得很好，哪怕只是把自己带到了这里。",
    "【测试】如果现在很困，就先把世界调到静音，抱抱自己一下。",
    "【测试】想她的时候，别忍着，把想念写下来，像把灯点亮。",
    "【测试】焦虑像雨，但你不是雨，你是会走出雨的人。",
    "【测试】开心也要记一笔：把幸福存成以后可取的利息。"
  ];

  const TEST_LOTS = {
    default: [
      { id:"t_default_1", text:"【测试】今天的你需要一杯温水和一个慢动作。", tags:["需要被哄"] },
      { id:"t_default_2", text:"【测试】把烦恼先放在门口，进屋只带自己。", tags:["焦虑","需要被哄"] },
      { id:"t_default_3", text:"【测试】想她就想她，不丢人，丢人的是假装不想。", tags:["想她"] }
    ],
    moods: {
      "困": [
        { id:"t_sleep_1", text:"【测试】困就困，先睡一小会儿，醒来再勇敢。", tags:["困"] },
        { id:"t_sleep_2", text:"【测试】把眼睛当作关灯开关，轻轻一按就好。", tags:["困","需要被哄"] }
      ],
      "焦虑": [
        { id:"t_anx_1", text:"【测试】焦虑像水杯晃荡，先把杯子放稳。", tags:["焦虑"] },
        { id:"t_anx_2", text:"【测试】你不必一次解决所有事，只要解决下一件。", tags:["焦虑","需要被哄"] }
      ],
      "想她": [
        { id:"t_miss_1", text:"【测试】想她的时候，把一句话写进日历里，未来会回信。", tags:["想她"] },
        { id:"t_miss_2", text:"【测试】想念是心在走路，你只是走得慢一点。", tags:["想她","需要被哄"] }
      ],
      "需要被哄": [
        { id:"t_hug_1", text:"【测试】来，给你一个很认真很安静的抱抱。", tags:["需要被哄"] },
        { id:"t_hug_2", text:"【测试】你已经很努力了，允许自己软一点。", tags:["需要被哄"] }
      ],
      "开心": [
        { id:"t_happy_1", text:"【测试】开心请别省着用，今天就用掉一大半。", tags:["开心"] },
        { id:"t_happy_2", text:"【测试】把开心写下来，留给下次阴天读。", tags:["开心"] }
      ]
    }
  };

  const TEST_LETTERS = [
    {
      id: "l_anx_1",
      type: "letter",
      tags: ["焦虑", "紧张"],
      title: "给焦虑的你",
      content: "【测试】慢慢来。你不是要一次把所有问题解决，而是先让自己安全着陆。先深呼吸三次，然后做一件很小很确定的事。"
    },
    {
      id: "l_lonely_1",
      type: "letter",
      tags: ["孤独", "想念"],
      title: "给孤独的你",
      content: "【测试】孤独不是你的错，它只是提醒你需要被拥抱。给自己一点温柔，把心里最柔软的那句话写下来。"
    },
    {
      id: "l_happy_1",
      type: "letter",
      tags: ["开心", "轻松"],
      title: "给开心的你",
      content: "【测试】把快乐好好收起来，未来的阴天也会被它照亮。谢谢你今天的努力。"
    },
    {
      id: "l_sleep_1",
      type: "letter",
      tags: ["困", "疲惫"],
      title: "给疲惫的你",
      content: "【测试】你已经很努力了。现在可以把世界稍微放下，先让自己安静下来。你值得一场好睡眠。"
    }
  ];

  const SCHEMA_EXAMPLE = {
    meta: { app: "TimeCapsuleCalendar", version: 1, exportedAt: "2026-02-05T12:34:56.789Z", settings:{ theme:{ season:"winter", time:"auto" } } },
    calendar: {
      "2026-02-05": { message: "寄语文本", updatedAt: "2026-02-05T12:00:00.000Z", source: "manual|generated|imported|lot" }
    },
    journal: {
      "2026-02-05": { text: "日记/回信", updatedAt: "2026-02-05T12:00:00.000Z" }
    },
    lots: {
      default: [{ id: "t1", text: "【测试】...", tags: ["想她"] }],
      moods: {
        "困": [{ id:"...", text:"...", tags:["困"] }],
        "焦虑": [],
        "想她": [],
        "需要被哄": [],
        "开心": []
      }
    },
    letters: [
      { id: "l1", type: "letter", tags: ["焦虑"], title: "给焦虑的你", content: "长文本内容..." }
    ],
    draws: [
      { at: "2026-02-05T12:00:00.000Z", mood: "想她", text: "抽到的签内容", writtenToDate: "2026-02-05" }
    ],
    gifts: {
      yearly: {
        "2030": { type:"capsule", status:"locked", style:"kraft", openDate: "2030-05-01", content: "礼物正文" }
      }
    }
  };

  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

  const app = {
    data: null,
    state: {
      tab: "calendar",
      viewYear: null,
      viewMonth: null, // 0-11
      selectedDate: null, // YYYY-MM-DD
      msgEditMode: false,
      drawMood: "全部",
      lastDraw: null,
      giftEditingYear: null
    },
    undo: {
      timer: null,
      payload: null
    }
  };

  function nowISO(){ return new Date().toISOString(); }

  function pad2(n){ return String(n).padStart(2,"0"); }

  function toDateStrLocal(d){
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  }

  function parseDateStr(s){
    // YYYY-MM-DD to Date (local)
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||"").trim());
    if(!m) return null;
    const y = +m[1], mo = +m[2]-1, da = +m[3];
    const d = new Date(y, mo, da);
    if(d.getFullYear()!==y || d.getMonth()!==mo || d.getDate()!==da) return null;
    return d;
  }

  function giftStatusByDate(openDate){
    const od = String(openDate || "").trim();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(od)) return "locked";
    const todayStr = toDateStrLocal(new Date());
    return od <= todayStr ? "unlocked" : "locked";
  }

  function normalizeGiftEntry(g){
    if(!g || typeof g !== "object") g = {};
    if(!g.type) g.type = "capsule";
    if(!["kraft","airmail","ivory"].includes(g.style)) g.style = "kraft";
    g.status = giftStatusByDate(g.openDate);
    return g;
  }

  function clampYear(y){
    y = Number(y);
    if(!Number.isFinite(y)) return null;
    return Math.max(1900, Math.min(2200, Math.floor(y)));
  }

  function defaultData(){
    // include a few visible test gifts (can be cleared)
    const now = new Date();
    const todayStr = toDateStrLocal(now);
    const y0 = String(now.getFullYear());
    const y1 = String(now.getFullYear() + 1);
    const y2 = String(now.getFullYear() + 2);
    return {
      meta: { app:"TimeCapsuleCalendar", version:1, exportedAt:null, settings:{ theme:{ season: THEME_DEFAULT.season, time: THEME_DEFAULT.time } } },
      calendar: {},
      journal: {},
      lots: JSON.parse(JSON.stringify(TEST_LOTS)),
      letters: JSON.parse(JSON.stringify(TEST_LETTERS)),
      draws: [],
      gifts: {
        yearly: {
          [y0]: { type:"capsule", status: giftStatusByDate(todayStr), style:"kraft", openDate: todayStr, content: "【测试】今天就能打开的礼物。愿你此刻被温柔接住。" },
          [y1]: { type:"capsule", status: giftStatusByDate(`${y1}-05-01`), style:"airmail", openDate: `${y1}-05-01`, content: "【测试】留给明年的礼物：你比想象中更厉害。" },
          [y2]: { type:"capsule", status: giftStatusByDate(`${y2}-12-31`), style:"ivory", openDate: `${y2}-12-31`, content: "【测试】很久以后的礼物：愿你依旧有光。" }
        },
        hints: {}
      }
    };
  }

  function loadData(){
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){
      const d = defaultData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
      return d;
    }
    try{
      const d = JSON.parse(raw);
      return ensureShape(d);
    }catch(e){
      // if corrupted, reset but keep a minimal backup in another key
      localStorage.setItem(STORAGE_KEY+"_CORRUPT_"+Date.now(), raw);
      const d = defaultData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
      return d;
    }
  }

  function saveData(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(app.data));
    renderStatus();
    updateReminderDots();
  }

  function ensureShape(d){
    // Ensure required keys exist
    if(!d || typeof d !== "object") d = defaultData();
    if(!d.meta) d.meta = { app:"TimeCapsuleCalendar", version:1, exportedAt:null };
    if(!d.meta.app) d.meta.app = "TimeCapsuleCalendar";
    if(typeof d.meta.version !== "number") d.meta.version = 1;
    if(!d.meta.settings) d.meta.settings = { theme:{ season: THEME_DEFAULT.season, time: THEME_DEFAULT.time } };
    if(!d.meta.settings.theme) d.meta.settings.theme = { season: THEME_DEFAULT.season, time: THEME_DEFAULT.time };
    d.meta.settings.theme = normalizeThemeSetting(d.meta.settings.theme);
    if(!d.calendar || typeof d.calendar !== "object") d.calendar = {};
    if(!d.journal || typeof d.journal !== "object") d.journal = {};
    if(!d.lots || typeof d.lots !== "object") d.lots = JSON.parse(JSON.stringify(TEST_LOTS));
    if(!Array.isArray(d.lots.default)) d.lots.default = [];
    if(!d.lots.moods || typeof d.lots.moods !== "object") d.lots.moods = {};
    for(const k of ["困","焦虑","想她","需要被哄","开心"]){
      if(!Array.isArray(d.lots.moods[k])) d.lots.moods[k] = [];
    }
    if(!Array.isArray(d.letters)) d.letters = JSON.parse(JSON.stringify(TEST_LETTERS));
    d.letters = d.letters.map(l => {
      if(!l || typeof l !== "object") return null;
      if(!l.type) l.type = "letter";
      if(!Array.isArray(l.tags)) l.tags = [];
      if(typeof l.title !== "string") l.title = String(l.title || "");
      if(typeof l.content !== "string") l.content = String(l.content || "");
      return l;
    }).filter(Boolean);
    if(!Array.isArray(d.draws)) d.draws = [];
    if(!d.gifts || typeof d.gifts !== "object") d.gifts = { yearly:{}, hints:{} };
    if(!d.gifts.yearly || typeof d.gifts.yearly !== "object") d.gifts.yearly = {};
    if(!d.gifts.hints || typeof d.gifts.hints !== "object") d.gifts.hints = {};
    if(Object.keys(d.gifts.yearly).length === 0){
      const now = new Date();
      const todayStr = toDateStrLocal(now);
      const y0 = String(now.getFullYear());
      const y1 = String(now.getFullYear() + 1);
      const y2 = String(now.getFullYear() + 2);
      d.gifts.yearly[y0] = { type:"capsule", status: giftStatusByDate(todayStr), style:"kraft", openDate: todayStr, content: "【测试】今天就能打开的礼物。愿你此刻被温柔接住。" };
      d.gifts.yearly[y1] = { type:"capsule", status: giftStatusByDate(`${y1}-05-01`), style:"airmail", openDate: `${y1}-05-01`, content: "【测试】留给明年的礼物：你比想象中更厉害。" };
      d.gifts.yearly[y2] = { type:"capsule", status: giftStatusByDate(`${y2}-12-31`), style:"ivory", openDate: `${y2}-12-31`, content: "【测试】很久以后的礼物：愿你依旧有光。" };
    }
    for(const y of Object.keys(d.gifts.yearly || {})){
      d.gifts.yearly[y] = normalizeGiftEntry(d.gifts.yearly[y]);
    }
    return d;
  }

  function normalizeThemeSetting(raw){
    if(raw && typeof raw === "object"){
      const season = THEME_SEASONS.includes(raw.season) ? raw.season : THEME_DEFAULT.season;
      const time = THEME_TIMES.includes(raw.time) ? raw.time : THEME_DEFAULT.time;
      return { season, time };
    }
    const s = String(raw || "").toLowerCase();
    if(s === "dark") return { season: THEME_DEFAULT.season, time: "night" };
    if(s === "light" || s === "auto") return { season: THEME_DEFAULT.season, time: "auto" };
    return { season: THEME_DEFAULT.season, time: THEME_DEFAULT.time };
  }

  function loadThemeFromStorage(){
    const raw = localStorage.getItem(THEME_KEY);
    if(!raw) return null;
    try{
      return normalizeThemeSetting(JSON.parse(raw));
    }catch(e){
      return normalizeThemeSetting(raw);
    }
  }

  function applyTheme(theme){
    const root = document.body;
    root.classList.remove(
      "season-winter",
      "season-spring",
      "season-summer",
      "season-autumn",
      "time-sunset",
      "time-night"
    );
    root.removeAttribute("data-theme");
    if(theme.season) root.classList.add(`season-${theme.season}`);
    if(theme.time === "sunset") root.classList.add("time-sunset");
    if(theme.time === "night") root.classList.add("time-night");
  }

  function formatThemeLabel(theme){
    const seasonMap = { winter:"\u51ac\u5b63", spring:"\u6625\u5b63", summer:"\u590f\u5b63", autumn:"\u79cb\u5b63" };
    const timeMap = { auto:"\u9ed8\u8ba4", sunset:"\u65e5\u843d", night:"\u591c\u95f4" };
    const s = seasonMap[theme.season] || theme.season || "default";
    const t = timeMap[theme.time] || theme.time || "default";
    return `${s} / ${t}`;
  }

  function updateThemeUI(theme){
    const seasonSel = $("#themeSeason");
    if(seasonSel) seasonSel.value = theme.season;
    const timeSel = $("#themeTime");
    if(timeSel) timeSel.value = theme.time;
    const badge = $("#themeBadge");
    if(badge) badge.textContent = formatThemeLabel(theme);
    const btn = $("#btnTheme");
    if(btn) btn.textContent = theme.time === "night" ? "\u767d\u5929" : "\u591c\u95f4";
  }

  function setTheme(theme){
    const next = normalizeThemeSetting(theme);
    applyTheme(next);
    app.data.meta.settings.theme = next;
    localStorage.setItem(THEME_KEY, JSON.stringify(next));
    saveData();
    updateThemeUI(next);
  }

  function initTheme(){
    const stored = loadThemeFromStorage();
    const dataTheme = normalizeThemeSetting(app.data.meta.settings.theme);
    const theme = stored || dataTheme || normalizeThemeSetting(null);
    app.data.meta.settings.theme = theme;
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    applyTheme(theme);
    updateThemeUI(theme);
  }

  function toggleTheme(){
    const cur = normalizeThemeSetting(app.data.meta.settings.theme);
    const next = { season: cur.season, time: cur.time === "night" ? "auto" : "night" };
    setTheme(next);
    showToast(next.time === "night" ? "\u5df2\u5207\u6362\u5230\u591c\u95f4\u4e3b\u9898" : "\u5df2\u5207\u6362\u5230\u9ed8\u8ba4\u4e3b\u9898");
  }

  function setTab(tab){
    app.state.tab = tab;
    $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
    $(".view#viewCalendar").classList.toggle("hidden", tab !== "calendar");
    $("#viewSurprise").classList.toggle("hidden", tab !== "surprise");
    $("#viewJournal").classList.toggle("hidden", tab !== "journal");
    $("#viewSettings").classList.toggle("hidden", tab !== "settings");
    $("#viewHelp").classList.toggle("hidden", tab !== "help");
    if(tab === "calendar"){ renderCalendar(); renderDateDetail(); }
    if(tab === "surprise"){ renderDraw(); renderDrawHistory(); renderGifts(); }
    if(tab === "journal"){ renderJournal(); }
    if(tab === "settings"){ renderStatus(); }
    if(tab === "help"){ renderHelp(); }
  }

  function initState(){
    const today = new Date();
    app.state.viewYear = today.getFullYear();
    app.state.viewMonth = today.getMonth();
    app.state.selectedDate = toDateStrLocal(today);
  }

  function monthName(m){
    return `${m+1} 月`;
  }

  function buildMonthSelect(){
    const sel = $("#monthSelect");
    sel.innerHTML = "";
    for(let i=0;i<12;i++){
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = monthName(i);
      sel.appendChild(opt);
    }
    sel.value = String(app.state.viewMonth);
  }

  function getContentFlags(dateStr){
    const hasMsg = !!(app.data.calendar[dateStr] && String(app.data.calendar[dateStr].message||"").trim());
    const hasJnl = !!(app.data.journal[dateStr] && String(app.data.journal[dateStr].text||"").trim());
    return { hasMsg, hasJnl };
  }

  function renderCalendar(){
    renderTodayMessage();
    $("#yearInput").value = String(app.state.viewYear);
    $("#monthSelect").value = String(app.state.viewMonth);

    const cells = $("#calendarCells");
    cells.innerHTML = "";

    const y = app.state.viewYear;
    const m = app.state.viewMonth;

    // Monday-first calendar: convert JS Sunday-first
    const first = new Date(y, m, 1);
    const last = new Date(y, m+1, 0);
    const daysInMonth = last.getDate();

    const jsDow = first.getDay(); // 0 Sun ... 6 Sat
    const mondayFirst = (jsDow === 0) ? 6 : jsDow - 1; // 0 Mon ... 6 Sun
    const blanks = mondayFirst;

    const todayStr = toDateStrLocal(new Date());

    // Leading blanks
    for(let i=0;i<blanks;i++){
      const d = document.createElement("div");
      d.className = "day blank";
      d.innerHTML = `<div class="n"></div><div></div>`;
      cells.appendChild(d);
    }

    for(let day=1; day<=daysInMonth; day++){
      const dateStr = `${y}-${pad2(m+1)}-${pad2(day)}`;
      const flags = getContentFlags(dateStr);

      let dot = "";
      if(flags.hasMsg || flags.hasJnl){
        let cls = "dot ";
        if(flags.hasMsg && flags.hasJnl) cls += "both";
        else if(flags.hasMsg) cls += "msg";
        else cls += "jnl";
        dot = `<div class="${cls}" title="有内容"></div>`;
      }else{
        dot = `<div style="height:7px;"></div>`;
      }

      const el = document.createElement("div");
      el.className = "day";
      if(dateStr === todayStr) el.classList.add("today");
      if(dateStr === app.state.selectedDate) el.classList.add("selected");
      el.dataset.date = dateStr;

      el.innerHTML = `<div class="n">${day}</div>${dot}`;
      el.addEventListener("click", () => {
        setSelectedDate(dateStr, true);
      });
      cells.appendChild(el);
    }

    // Fill trailing blanks to complete rows (nice layout)
    const total = blanks + daysInMonth;
    const remainder = total % 7;
    const tail = remainder === 0 ? 0 : (7 - remainder);
    for(let i=0;i<tail;i++){
      const d = document.createElement("div");
      d.className = "day blank";
      d.innerHTML = `<div class="n"></div><div></div>`;
      cells.appendChild(d);
    }

    renderDateDetail();
  }

  function setSelectedDate(dateStr, maybeScroll){
    app.state.selectedDate = dateStr;
    app.state.msgEditMode = false;
    renderCalendar();
    renderDateDetail();
    renderJournal(); // keep journal synced
    if(maybeScroll){
      // minimal: no forced scroll; mobile friendly
    }
  }

  function renderDateDetail(){
    const ds = app.state.selectedDate;
    $("#selectedDateText").textContent = ds || "-";

    const entry = app.data.calendar[ds];
    const msg = entry ? String(entry.message||"") : "";
    const source = entry ? entry.source : null;
    const updatedAt = entry ? entry.updatedAt : null;

    const today = parseDateStr(toDateStrLocal(new Date()));
    const selected = parseDateStr(ds);
    const isFuture = !!(selected && today && selected.getTime() > today.getTime());

    let info = [];
    const flags = getContentFlags(ds);
    if(flags.hasMsg) info.push("寄语✅");
    if(flags.hasJnl) info.push("日记✅");
    if(info.length === 0) info.push("空");

    $("#selectedInfo").textContent = `内容：${info.join(" / ")}`;

    const area = $("#msgViewArea");
    area.innerHTML = "";

    const genBtn = $("#btnGenOne");
    const delBtn = $("#btnDeleteMsg");

    if(isFuture){
      app.state.msgEditMode = false;
      const diffDays = Math.max(1, Math.ceil((selected.getTime() - today.getTime()) / 86400000));
      const locked = document.createElement("div");
      locked.className = "empty";
      locked.textContent = `还不可以开哦小狗，${diffDays} 天后才可以看。`;
      area.appendChild(locked);

      $("#btnEditMsg").classList.add("hidden");
      $("#btnSaveMsg").classList.add("hidden");
      if(genBtn) genBtn.classList.add("hidden");
      if(delBtn) delBtn.classList.add("hidden");
      return;
    }

    if(genBtn) genBtn.classList.remove("hidden");
    if(delBtn) delBtn.classList.remove("hidden");

    if(!app.state.msgEditMode){
      if(!msg.trim()){
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "这一天还没有留下话。你可以生成一句，或者手写保存。";
        area.appendChild(empty);
      }else{
        const box = document.createElement("div");
        box.className = "item";
        const srcLabel = source ? `来源：${source}` : "来源：-";
        const upLabel = updatedAt ? `更新：${updatedAt}` : "更新：-";
        box.innerHTML = `
          <div class="top">
            <div style="font-weight:900;">回信/寄语</div>
            <div class="badge">${srcLabel}</div>
          </div>
          <div class="text message-view">${escapeHtml(msg)}</div>
          <div class="meta">${escapeHtml(upLabel)}</div>
        `;
        area.appendChild(box);
      }

      $("#btnEditMsg").classList.remove("hidden");
      $("#btnSaveMsg").classList.add("hidden");
    }else{
      const ta = document.createElement("textarea");
      ta.className = "textarea";
      ta.id = "msgEditor";
      ta.placeholder = "写下这一天的寄语...";
      ta.value = msg;
      area.appendChild(ta);

      const hint = document.createElement("div");
      hint.className = "hint";
      hint.style.marginTop = "10px";
      hint.textContent = "保存后会写入 calendar[YYYY-MM-DD]，并记录 updatedAt 与 source=manual。";
      area.appendChild(hint);

      $("#btnEditMsg").classList.add("hidden");
      $("#btnSaveMsg").classList.remove("hidden");
    }
  }

  function isFutureDate(dateStr){
    const d = parseDateStr(dateStr);
    const t = parseDateStr(toDateStrLocal(new Date()));
    if(!d || !t) return false;
    return d.getTime() > t.getTime();
  }

  function escapeHtml(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;")
      .replaceAll("\n","<br/>");
  }

  function upsertCalendarMessage(dateStr, message, source){
    if(!dateStr) return;
    const msg = String(message||"");
    if(!msg.trim()){
      delete app.data.calendar[dateStr];
      saveData();
      renderCalendar();
      renderDateDetail();
      updateBanner();
      return;
    }
    app.data.calendar[dateStr] = {
      message: msg,
      updatedAt: nowISO(),
      source: source || "manual"
    };
    saveData();
    renderCalendar();
    renderDateDetail();
    updateBanner();
  }

  function deleteCalendarMessage(dateStr){
    if(isFutureDate(dateStr)){
      showToast("未到日期，无法删除未来寄语");
      return;
    }
    const prev = app.data.calendar[dateStr];
    if(!prev) {
      showToast("当天没有寄语可删除");
      return;
    }
    if(!confirm("确认删除该日期寄语？可在弹出的提示里撤销。")) return;

    delete app.data.calendar[dateStr];
    saveData();
    renderCalendar();
    renderDateDetail();
    updateBanner();

    setUndo({
      type: "calendar",
      date: dateStr,
      value: prev
    });
    showToast("已删除寄语", [
      { label:"撤销", action: undoOnce }
    ], 9000);
  }

  function randomPick(arr){
    if(!Array.isArray(arr) || arr.length===0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function genMessageForDate(dateStr){
    if(isFutureDate(dateStr)){
      showToast("未到日期，无法生成未来寄语");
      return;
    }
    const picked = randomPick(TEST_MESSAGES);
    if(!picked) return;
    upsertCalendarMessage(dateStr, picked, "generated");
    showToast("已生成并写入当天寄语");
  }

  function enterEdit(){
    if(isFutureDate(app.state.selectedDate)){
      showToast("未到日期，无法编辑未来寄语");
      return;
    }
    app.state.msgEditMode = true;
    renderDateDetail();
    setTimeout(() => {
      const ta = $("#msgEditor");
      if(ta) ta.focus();
    }, 0);
  }

  function saveEdit(){
    if(isFutureDate(app.state.selectedDate)){
      showToast("未到日期，无法保存未来寄语");
      return;
    }
    const ta = $("#msgEditor");
    if(!ta) return;
    const txt = ta.value;
    upsertCalendarMessage(app.state.selectedDate, txt, "manual");
    app.state.msgEditMode = false;
    renderDateDetail();
    showToast("已保存");
  }

  function initCalendarControls(){
    buildMonthSelect();

    $("#prevMonth").addEventListener("click", () => {
      let y = app.state.viewYear, m = app.state.viewMonth - 1;
      if(m < 0){ m = 11; y -= 1; }
      y = clampYear(y) ?? app.state.viewYear;
      app.state.viewYear = y; app.state.viewMonth = m;
      renderCalendar();
    });

    $("#nextMonth").addEventListener("click", () => {
      let y = app.state.viewYear, m = app.state.viewMonth + 1;
      if(m > 11){ m = 0; y += 1; }
      y = clampYear(y) ?? app.state.viewYear;
      app.state.viewYear = y; app.state.viewMonth = m;
      renderCalendar();
    });

    $("#monthSelect").addEventListener("change", (e) => {
      const m = Number(e.target.value);
      if(Number.isFinite(m) && m>=0 && m<=11){
        app.state.viewMonth = m;
        renderCalendar();
      }
    });

    $("#yearInput").addEventListener("change", (e) => {
      const y = clampYear(e.target.value);
      if(y){
        app.state.viewYear = y;
        renderCalendar();
      }else{
        $("#yearInput").value = String(app.state.viewYear);
        showToast("年份格式不正确");
      }
    });

    $("#jumpToday").addEventListener("click", () => {
      const t = new Date();
      app.state.viewYear = t.getFullYear();
      app.state.viewMonth = t.getMonth();
      setSelectedDate(toDateStrLocal(t), true);
      showToast("已跳转到今天");
    });

    $("#btnEditMsg").addEventListener("click", enterEdit);
    $("#btnSaveMsg").addEventListener("click", saveEdit);

    $("#btnGenOne").addEventListener("click", () => genMessageForDate(app.state.selectedDate));
    const btnGenAgain = $("#btnGenAgain");
    if(btnGenAgain){
      btnGenAgain.addEventListener("click", () => genMessageForDate(app.state.selectedDate));
    }
    $("#btnDeleteMsg").addEventListener("click", () => deleteCalendarMessage(app.state.selectedDate));

    const btnGoJournal = $("#btnGoJournal");
    if(btnGoJournal) btnGoJournal.addEventListener("click", () => setTab("journal"));
  }

  // Draw
  const MOODS = ["全部","困","焦虑","想她","需要被哄","开心"];

  function renderMoodChips(){
    const host = $("#moodChips");
    if(!host) return;
    host.innerHTML = "";
    MOODS.forEach(m => {
      const c = document.createElement("div");
      c.className = "chip" + (app.state.drawMood === m ? " active" : "");
      c.textContent = m;
      c.addEventListener("click", () => {
        app.state.drawMood = m;
        $("#drawMoodBadge").textContent = `当前：${m}`;
        renderMoodChips();
      });
      host.appendChild(c);
    });
  }

  function getLotPool(mood){
    if(mood && mood !== "全部"){
      const pool = app.data.lots.moods[mood];
      return Array.isArray(pool) ? pool : [];
    }
    // default + all moods combined
    const out = [];
    if(Array.isArray(app.data.lots.default)) out.push(...app.data.lots.default);
    for(const k of ["困","焦虑","想她","需要被哄","开心"]){
      const arr = app.data.lots.moods[k];
      if(Array.isArray(arr)) out.push(...arr);
    }
    return out;
  }

  function doDraw(){
    const mood = app.state.drawMood;
    const pool = getLotPool(mood);
    if(pool.length === 0){
      showToast("该分类签池为空。你可以在导入备份里补充 lots。");
      return;
    }
    const picked = randomPick(pool);
    if(!picked) return;

    app.state.lastDraw = {
      at: nowISO(),
      mood: (mood === "全部") ? (picked.tags && picked.tags[0] ? picked.tags[0] : "全部") : mood,
      text: picked.text,
      writtenToDate: null
    };
    renderDrawCard();
  }

  function renderDrawCard(){
    const d = app.state.lastDraw;
    if(!d){
      $("#drawCardMeta").textContent = "还没有抽签";
      const moodEl = $("#drawCardMood");
      if(moodEl) moodEl.textContent = "-";
      $("#drawCardText").textContent = "点一下「抽签」，签就会跳出来。";
      return;
    }
    $("#drawCardMeta").textContent = `时间：${d.at}`;
    const moodEl = $("#drawCardMood");
    if(moodEl) moodEl.textContent = d.mood || "-";
    $("#drawCardText").textContent = d.text || "-";
  }

  function saveDrawRecord(writtenToDate){
    const d = app.state.lastDraw;
    if(!d){
      showToast("还没有签卡");
      return null;
    }
    const rec = {
      at: nowISO(),
      mood: d.mood || "全部",
      text: d.text || "",
      writtenToDate: writtenToDate || null
    };
    app.data.draws.unshift(rec);
    saveData();
    renderDrawHistory();
    return rec;
  }

  function writeDrawToSelectedDate(){
    const d = app.state.lastDraw;
    if(!d){
      showToast("还没有签卡");
      return;
    }
    const dateStr = app.state.selectedDate;
    if(!dateStr){
      showToast("没有选中日期");
      return;
    }
    upsertCalendarMessage(dateStr, d.text, "lot");
    const rec = saveDrawRecord(dateStr);
    if(rec) showToast("已写入寄语，并保存到抽签历史");
  }

  function renderDraw(){
    renderMoodChips();
    const badge = $("#drawMoodBadge");
    if(badge) badge.textContent = `当前：${app.state.drawMood}`;
    renderDrawCard();
    renderDrawHistory();
  }

  function renderDrawHistory(){
    const list = $("#drawHistory");
    const q = String($("#drawFilter")?.value || "").trim().toLowerCase();
    const draws = Array.isArray(app.data.draws) ? app.data.draws : [];
    $("#drawCount").textContent = `${draws.length} 条`;

    const filtered = q ? draws.filter(r => {
      return (String(r.text||"").toLowerCase().includes(q) ||
              String(r.mood||"").toLowerCase().includes(q) ||
              String(r.at||"").toLowerCase().includes(q) ||
              String(r.writtenToDate||"").toLowerCase().includes(q));
    }) : draws;

    list.innerHTML = "";
    if(filtered.length === 0){
      const e = document.createElement("div");
      e.className = "empty";
      e.textContent = q ? "没有匹配的抽签记录。" : "还没有抽签记录。抽到的签可以保存下来。";
      list.appendChild(e);
      return;
    }

    filtered.slice(0, 200).forEach((r, idx) => {
      const item = document.createElement("div");
      item.className = "item";
      const mood = r.mood || "-";
      const w = r.writtenToDate ? `写入：${r.writtenToDate}` : "未写入日历";
      item.innerHTML = `
        <div class="top">
          <div>
            <div style="font-weight:900;">${escapeText(mood)}</div>
            <div class="meta">${escapeText(r.at || "-")} · ${escapeText(w)}</div>
          </div>
          <button class="btn tiny danger" data-del="${idx}">删除</button>
        </div>
        <div class="text">${escapeText(r.text || "-")}</div>
      `;
      item.querySelector("button[data-del]").addEventListener("click", () => {
        if(!confirm("确认删除这条抽签记录？")) return;
        // Need to delete by identity rather than idx in filtered list
        const pos = app.data.draws.indexOf(r);
        if(pos >= 0){
          app.data.draws.splice(pos,1);
          saveData();
          renderDrawHistory();
          showToast("已删除抽签记录");
        }
      });
      list.appendChild(item);
    });
  }

  function escapeText(s){
    return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  }

  // Journal

  function renderJournal(){
    const ds = app.state.selectedDate;
    if(!ds) return;

    $("#jnlDateBadge").textContent = ds;
    $("#jnlDateText").textContent = ds;

    const entry = app.data.journal[ds];
    $("#jnlText").value = entry ? String(entry.text||"") : "";
  }

  function saveJournal(){
    const ds = app.state.selectedDate;
    if(!ds) return;
    const text = String($("#jnlText").value || "");
    if(!text.trim()){
      delete app.data.journal[ds];
      saveData();
      renderCalendar();
      showToast("日记为空，已删除该日记条目");
      updateBanner();
      return;
    }
    app.data.journal[ds] = { text, updatedAt: nowISO() };
    saveData();
    renderCalendar();
    showToast("已保存日记");
    updateBanner();
  }

  function deleteJournal(){
    const ds = app.state.selectedDate;
    const prev = app.data.journal[ds];
    if(!prev){
      showToast("当天没有日记可删除");
      return;
    }
    if(!confirm("确认删除当天日记？可在提示里撤销。")) return;

    delete app.data.journal[ds];
    saveData();
    renderCalendar();
    renderJournal();
    updateBanner();

    setUndo({ type:"journal", date: ds, value: prev });
    showToast("已删除日记", [{label:"撤销", action: undoOnce}], 9000);
  }

  function doSearch(){
    const q0 = String($("#searchInput").value || "").trim();
    if(!q0){
      showToast("请输入关键词");
      return;
    }
    const q = q0.toLowerCase();
    const results = [];

    // calendar (message only, exclude future)
    const todayStr = toDateStrLocal(new Date());
    const today = parseDateStr(todayStr);
    for(const [date, obj] of Object.entries(app.data.calendar)){
      const d = parseDateStr(date);
      if(today && d && d.getTime() > today.getTime()) continue;
      const msg = String(obj?.message||"");
      if(msg.toLowerCase().includes(q)){
        results.push({ date, kind:"寄语", snippet: msg.slice(0, 120) });
      }
    }
    // journal (text only)
    for(const [date, obj] of Object.entries(app.data.journal)){
      const text = String(obj?.text||"");
      if(text.toLowerCase().includes(q)){
        results.push({ date, kind:"日记", snippet: text.slice(0, 120) });
      }
    }

    // sort by date desc
    results.sort((a,b) => String(b.date).localeCompare(String(a.date)));

    const host = $("#searchResults");
    host.innerHTML = "";
    if(results.length === 0){
      const e = document.createElement("div");
      e.className = "empty";
      e.textContent = "没有找到匹配内容。";
      host.appendChild(e);
      return;
    }

    results.slice(0, 120).forEach(r => {
      const it = document.createElement("div");
      it.className = "item";
      it.innerHTML = `
        <div class="top">
          <div>
            <div style="font-weight:900;">${escapeText(r.date)} · ${escapeText(r.kind)}</div>
            <div class="meta">点我跳转</div>
          </div>
          <div class="badge">${escapeText(r.kind)}</div>
        </div>
        <div class="text">${escapeText(r.snippet || "")}${(r.snippet && r.snippet.length>=120)?"...":""}</div>
      `;
      it.addEventListener("click", () => {
        // jump view month to this date
        const d = parseDateStr(r.date);
        if(d){
          app.state.viewYear = d.getFullYear();
          app.state.viewMonth = d.getMonth();
        }
        setSelectedDate(r.date, true);
        setTab("calendar");
        showToast("已跳转到该日期");
      });
      host.appendChild(it);
    });
  }

  // Mood Mailbox
  function getMailboxTags(){
    const tags = new Set();
    (app.data.letters || []).forEach(l => {
      (l.tags || []).forEach(t => {
        const s = String(t || "").trim();
        if(s) tags.add(s);
      });
    });
    if(tags.size === 0){
      ["焦虑","孤独","开心"].forEach(t => tags.add(t));
    }
    return Array.from(tags);
  }

  function renderMailboxTags(){
    const host = $("#mailboxTags");
    if(!host) return;
    host.innerHTML = "";
    const tags = getMailboxTags();
    tags.forEach(tag => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = tag;
      chip.addEventListener("click", () => openMoodLetter(tag));
      host.appendChild(chip);
    });
  }

  function openMoodLetter(tag){
    const pool = (app.data.letters || []).filter(l => {
      if(l?.type && l.type !== "letter") return false;
      const tags = Array.isArray(l?.tags) ? l.tags.map(String) : [];
      return tags.includes(tag);
    });
    const letter = randomPick(pool);
    if(!letter){
      showToast("暂时没有对应的信件");
      return;
    }
    openLetter(letter.content, {
      title: letter.title || "解忧信箱",
      meta: tag
    });
  }

  // Gifts
  function getGift(year){
    const y = String(year);
    return app.data.gifts.yearly[y] || null;
  }

  function getGiftOpenState(g){
    const openDate = String(g?.openDate || "").trim();
    const od = parseDateStr(openDate);
    const todayStr = toDateStrLocal(new Date());
    const today = parseDateStr(todayStr);
    const canOpen = !!(od && today && daysBetween(today, od) <= 0);
    const diff = (od && today) ? daysBetween(today, od) : null;
    const status = canOpen ? "unlocked" : "locked";
    return { openDate, od, todayStr, canOpen, diff, status, style: g?.style || "kraft", type: g?.type || "capsule" };
  }

  function daysBetween(a,b){
    // a,b are Date, return integer days (b - a) in local time
    const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return Math.round((db - da) / 86400000);
  }


  function renderGifts(){
    renderGiftsTimeline();
    renderGiftEditor();
  }

  function renderGiftsTimeline(){
    const years = Object.keys(app.data.gifts.yearly || {}).sort((a,b)=>b.localeCompare(a));
    $("#giftCount").textContent = `${years.length} 封`;
    const host = $("#giftGrid");
    host.innerHTML = "";
    if(years.length === 0){
      const e = document.createElement("div");
      e.className = "empty";
      e.textContent = "还没有时间胶囊。";
      host.appendChild(e);
      return;
    }

    years.forEach(y => {
      const yearHeader = document.createElement("div");
      yearHeader.className = "timeline-year";
      yearHeader.textContent = y;
      host.appendChild(yearHeader);

      const g = normalizeGiftEntry(app.data.gifts.yearly[y]);
      const state = getGiftOpenState(g);
      const locked = !state.canOpen;
      const title = `${y} 年时间胶囊`;
      const meta = state.openDate ? `解锁日期：${state.openDate}` : "未设置解锁日期";

      const item = document.createElement("div");
      item.className = `timeline-item ${locked ? "locked" : "open"}`;
      item.dataset.icon = locked ? "🔒" : "📩";
      item.innerHTML = `
        <div class="timeline-main">
          <div class="timeline-title">${escapeText(title)}</div>
          <div class="timeline-meta">${escapeText(meta)}</div>
        </div>
        <div class="timeline-actions">
          <button class="btn tiny" data-edit>编辑</button>
        </div>
      `;

      item.addEventListener("click", () => {
        if(locked){
          const tip = state.openDate
            ? (state.diff !== null ? `未到日期，还剩 ${state.diff} 天` : "未到日期")
            : "未设置日期，无法打开";
          showToast(tip);
          return;
        }
        const content = String(g?.content || "").trim() || "（内容为空）";
        openLetter(content, { title: `${y} 年时间胶囊`, meta: state.openDate ? `解锁日期：${state.openDate}` : "" });
      });

      const editBtn = item.querySelector("[data-edit]");
      if(editBtn){
        editBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          openGiftEditorModal(y);
          showToast("已打开胶囊编辑");
        });
      }

      host.appendChild(item);
    });
  }

  function openLetter(content, options = {}){
    const modal = $("#letterModal");
    const paper = $("#letterModalPaper");
    const title = $("#letterModalTitle");
    const meta = $("#letterModalMeta");
    const body = $("#letterModalContent");
    if(title) title.textContent = options.title || "来信";
    if(meta) meta.textContent = options.meta || "";
    if(body) {
      body.textContent = String(content || "").trim() || "（空白）";
      body.scrollTop = 0;
    }
    if(modal){
      modal.classList.remove("hidden");
      modal.classList.remove("show");
      requestAnimationFrame(() => modal.classList.add("show"));
    }
  }

  function closeLetterModal(){
    const modal = $("#letterModal");
    if(!modal) return;
    modal.classList.remove("show");
    setTimeout(() => modal.classList.add("hidden"), 360);
  }

  function openGiftEditorModal(year){
    if(year){
      loadGiftEditor(year);
    }else{
      app.state.giftEditingYear = null;
      renderGiftEditor();
    }
    const modal = $("#giftEditorModal");
    if(modal){
      modal.classList.remove("hidden");
      modal.classList.remove("show");
      requestAnimationFrame(() => modal.classList.add("show"));
    }
  }

  function closeGiftEditorModal(){
    const modal = $("#giftEditorModal");
    if(!modal) return;
    modal.classList.remove("show");
    setTimeout(() => modal.classList.add("hidden"), 360);
  }

  function loadGiftEditor(year){
    const y = String(clampYear(year) ?? "").trim();
    if(!/^\d{4}$/.test(y)){
      showToast("年份不正确");
      return;
    }
    app.state.giftEditingYear = y;
    if(!app.data.gifts.yearly[y]){
      app.data.gifts.yearly[y] = normalizeGiftEntry({ openDate:"", content:"", style:"kraft", type:"capsule" });
    }
    renderGiftEditor();
  }

  function escapeAttr(s){
    return String(s||"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  }

  function renderGiftEditor(){
    const badge = $("#giftEditBadge");
    const y = app.state.giftEditingYear;
    const yearInput = $("#giftYearInput");
    const openInput = $("#giftOpenDate");
    const styleSel = $("#giftStyle");
    const contentEl = $("#giftContent");

    if(!y || !app.data.gifts.yearly[y]){
      if(badge) badge.textContent = "未选择";
      if(yearInput) yearInput.value = "";
      if(openInput) openInput.value = "";
      if(styleSel) styleSel.value = "kraft";
      if(contentEl) contentEl.value = "";
      return;
    }

    const g = normalizeGiftEntry(app.data.gifts.yearly[y]);
    if(badge) badge.textContent = `${y} 年`;
    if(yearInput) yearInput.value = y;
    if(openInput) openInput.value = String(g.openDate || "");
    if(styleSel) styleSel.value = g.style || "kraft";
    if(contentEl) contentEl.value = String(g.content || "");
  }

  function saveGift(){
    const yearInput = $("#giftYearInput");
    const openInput = $("#giftOpenDate");
    const styleSel = $("#giftStyle");
    const contentEl = $("#giftContent");
    const y = String(clampYear(yearInput?.value) ?? "").trim();
    if(!/^\d{4}$/.test(y)){
      showToast("年份不正确");
      return;
    }
    const openDate = String(openInput?.value || "").trim();
    if(openDate && !parseDateStr(openDate)){
      showToast("解锁日期格式不正确（YYYY-MM-DD）");
      return;
    }
    const style = ["kraft","airmail","ivory"].includes(styleSel?.value) ? styleSel.value : "kraft";
    const content = String(contentEl?.value || "");
    const g = normalizeGiftEntry(app.data.gifts.yearly[y] || {});
    g.openDate = openDate;
    g.content = content;
    g.style = style;
    g.type = "capsule";
    g.status = giftStatusByDate(openDate);
    app.data.gifts.yearly[y] = g;
    app.state.giftEditingYear = y;
    saveData();
    renderGiftsTimeline();
    renderGiftEditor();
    updateBanner();
    showToast("已保存时间胶囊");
  }

  function deleteGiftYear(){
    const yearInput = $("#giftYearInput");
    const y = String(clampYear(yearInput?.value || app.state.giftEditingYear) ?? "").trim();
    if(!/^\d{4}$/.test(y)){
      showToast("年份不正确");
      return;
    }
    if(!confirm(`确认删除 ${y} 年的礼物？`)) return;

    const prevYear = app.data.gifts.yearly[y];
    const prevHints = app.data.gifts.hints[y];
    delete app.data.gifts.yearly[y];
    delete app.data.gifts.hints[y];
    saveData();

    const undoPayload = { type:"gift", year:y, value:{yearly:prevYear, hints:prevHints} };
    app.state.giftEditingYear = null;
    renderGiftsTimeline();
    renderGiftEditor();
    updateBanner();
    setUndo(undoPayload);
    showToast("已删除该年胶囊", [{label:"撤销", action: undoOnce}], 9000);
  }

  // ICS
  function buildICSForGifts(){
    const years = Object.keys(app.data.gifts.yearly || {}).sort();
    const lines = [];
    lines.push("BEGIN:VCALENDAR");
    lines.push("VERSION:2.0");
    lines.push("PRODID:-//TimeCapsuleCalendar//Offline//CN");
    lines.push("CALSCALE:GREGORIAN");

    const stamp = nowISO().replace(/[-:]/g,"").replace(/\.\d+Z$/,"Z");
    for(const y of years){
      const g = app.data.gifts.yearly[y];
      const od = String(g?.openDate || "").trim();
      if(!/^\d{4}-\d{2}-\d{2}$/.test(od)) continue;
      const dt = od.replaceAll("-","");
      const uid = `gift-${y}-${dt}@timecapsulecalendar`;
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${stamp}`);
      lines.push(`DTSTART;VALUE=DATE:${dt}`);
      lines.push(`SUMMARY:${escapeICS(`礼物解锁日 ${y}`)}`);
      lines.push(`DESCRIPTION:${escapeICS("TimeCapsuleCalendar 礼物抽屉解锁日（离线网页生成）")}`);
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  function escapeICS(s){
    return String(s||"")
      .replaceAll("\\","\\\\")
      .replaceAll(";","\\;")
      .replaceAll(",","\\,")
      .replaceAll("\n","\\n");
  }

  function downloadBlob(filename, mime, content){
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 500);
  }

  // Export/Import
  function exportJSON(){
    const d = JSON.parse(JSON.stringify(app.data));
    d.meta.exportedAt = nowISO();
    const ts = d.meta.exportedAt.replaceAll(":","").replaceAll("-","").replace(".","_");
    const name = `TimeCapsuleCalendar_backup_${ts}.json`;
    downloadBlob(name, "application/json", JSON.stringify(d, null, 2));
    showToast("已导出备份 JSON");
  }

  function validateImported(obj){
    if(!obj || typeof obj !== "object") return { ok:false, err:"JSON 根对象不是 object" };
    for(const k of ["meta","calendar","journal","lots","draws","gifts"]){
      if(!(k in obj)) return { ok:false, err:`缺少字段：${k}` };
    }
    // meta basic
    if(!obj.meta || obj.meta.app !== "TimeCapsuleCalendar") {
      // allow but warn
    }
    // types
    if(typeof obj.calendar !== "object" || Array.isArray(obj.calendar)) return { ok:false, err:"calendar 必须是 object" };
    if(typeof obj.journal !== "object" || Array.isArray(obj.journal)) return { ok:false, err:"journal 必须是 object" };
    if(typeof obj.lots !== "object") return { ok:false, err:"lots 必须是 object" };
    if(!Array.isArray(obj.draws)) return { ok:false, err:"draws 必须是 array" };
    if(typeof obj.gifts !== "object") return { ok:false, err:"gifts 必须是 object" };
    if("letters" in obj && !Array.isArray(obj.letters)) return { ok:false, err:"letters 必须是 array" };
    return { ok:true };
  }

  function mergeByUpdatedAt(localEntry, importedEntry){
    const lu = String(localEntry?.updatedAt || "");
    const iu = String(importedEntry?.updatedAt || "");
    const lOk = !!lu;
    const iOk = !!iu;
    if(iOk && lOk){
      return (iu > lu) ? importedEntry : localEntry;
    }
    if(iOk && !lOk) return importedEntry;
    if(!iOk && lOk) return localEntry;
    // both missing updatedAt: imported wins
    return importedEntry;
  }

  function importJSON(obj, mode){
    const before = app.data;
    let written = { calendar:0, journal:0, lots:0, draws:0, gifts:0, letters:0 };

    if(mode === "replace"){
      app.data = ensureShape(obj);
      saveData();
      showToast("导入成功（覆盖）");
      updateAllUI();
      return { ok:true, written: "覆盖模式：已替换全部数据" };
    }

    // merge
    const merged = ensureShape(JSON.parse(JSON.stringify(before)));

    // calendar
    for(const [date, entry] of Object.entries(obj.calendar || {})){
      if(!merged.calendar[date]){
        merged.calendar[date] = entry;
        written.calendar++;
      }else{
        const chosen = mergeByUpdatedAt(merged.calendar[date], entry);
        if(chosen !== merged.calendar[date]) written.calendar++;
        merged.calendar[date] = chosen;
      }
    }

    // journal
    for(const [date, entry] of Object.entries(obj.journal || {})){
      if(!merged.journal[date]){
        merged.journal[date] = entry;
        written.journal++;
      }else{
        const chosen = mergeByUpdatedAt(merged.journal[date], entry);
        if(chosen !== merged.journal[date]) written.journal++;
        merged.journal[date] = chosen;
      }
    }

    // lots: merge by id, imported wins on conflict
    const index = new Map();
    const addLot = (arr, item) => {
      if(!item || typeof item !== "object") return;
      const id = String(item.id || "");
      if(!id) return;
      index.set(id, item);
    };
    const putLotsFrom = (lots) => {
      (lots.default || []).forEach(it => addLot(null, it));
      for(const k of ["困","焦虑","想她","需要被哄","开心"]){
        (lots.moods?.[k] || []).forEach(it => addLot(null, it));
      }
    };

    // start with local
    putLotsFrom(merged.lots);
    // overwrite with imported
    putLotsFrom(obj.lots);

    // rebuild lots
    const rebuilt = { default: [], moods: { "困":[], "焦虑":[], "想她":[], "需要被哄":[], "开心":[] } };
    // Keep categories from imported where possible: if tag includes mood or has mood field, place; else default
    for(const it of index.values()){
      let placed = false;
      const tags = Array.isArray(it.tags) ? it.tags.map(String) : [];
      for(const k of ["困","焦虑","想她","需要被哄","开心"]){
        if(tags.includes(k)){
          rebuilt.moods[k].push(it);
          placed = true;
          break;
        }
      }
      if(!placed) rebuilt.default.push(it);
      written.lots++;
    }
    merged.lots = rebuilt;

    // letters: merge by id, imported wins
    const lIndex = new Map();
    (merged.letters || []).forEach(it => {
      const id = String(it?.id || "");
      if(id) lIndex.set(id, it);
    });
    (obj.letters || []).forEach(it => {
      const id = String(it?.id || "");
      if(!id) return;
      lIndex.set(id, it);
      written.letters++;
    });
    merged.letters = Array.from(lIndex.values());

    // draws: append and dedupe
    const key = (r) => `${r.at||""}||${r.mood||""}||${r.text||""}||${r.writtenToDate||""}`;
    const seen = new Set((merged.draws||[]).map(key));
    for(const r of (obj.draws || [])){
      const k = key(r);
      if(!seen.has(k)){
        merged.draws.push(r);
        seen.add(k);
        written.draws++;
      }
    }
    // gifts: by year, imported wins
    const iy = obj.gifts?.yearly || {};
    for(const y of Object.keys(iy)){
      merged.gifts.yearly[y] = iy[y];
      written.gifts++;
    }
    const ih = obj.gifts?.hints || {};
    for(const y of Object.keys(ih)){
      merged.gifts.hints[y] = ih[y];
      // not double counting strictly, but fine
    }

    merged.meta = merged.meta || {};
    merged.meta.app = "TimeCapsuleCalendar";
    merged.meta.version = 1;
    merged.meta.exportedAt = nowISO();

    app.data = ensureShape(merged);
    saveData();
    updateAllUI();
    showToast(`导入成功（合并）：寄语${written.calendar}，日记${written.journal}，签池${written.lots}，信件${written.letters}，历史${written.draws}，礼物${written.gifts}`);
    return { ok:true, written };
  }

  // Clear test content
  function isTestText(s){ return String(s||"").includes("【测试】"); }

  function clearTestContent(){
    // calendar: remove test messages where source is not manual and text matches known test pools or contains 【测试】
    let n = 0;
    for(const [date, entry] of Object.entries(app.data.calendar)){
      const src = String(entry?.source || "");
      const msg = String(entry?.message || "");
      if(src !== "manual" && isTestText(msg)){
        delete app.data.calendar[date];
        n++;
      }
    }
    // draws
    if(Array.isArray(app.data.draws)){
      const before = app.data.draws.length;
      app.data.draws = app.data.draws.filter(r => !isTestText(r?.text || ""));
      n += (before - app.data.draws.length);
    }
    // lots
    const filterLotsArr = (arr) => (arr||[]).filter(it => {
      const id = String(it?.id||"");
      const text = String(it?.text||"");
      return !(id.startsWith("t_") || isTestText(text));
    });
    app.data.lots.default = filterLotsArr(app.data.lots.default);
    for(const k of ["困","焦虑","想她","需要被哄","开心"]){
      app.data.lots.moods[k] = filterLotsArr(app.data.lots.moods[k]);
    }
    // letters
    if(Array.isArray(app.data.letters)){
      const beforeLetters = app.data.letters.length;
      app.data.letters = app.data.letters.filter(l => {
        const id = String(l?.id||"");
        const title = String(l?.title||"");
        const content = String(l?.content||"");
        return !(id.startsWith("l_") || isTestText(title) || isTestText(content));
      });
      n += (beforeLetters - app.data.letters.length);
    }
    // gifts
    for(const [y, g] of Object.entries(app.data.gifts.yearly)){
      const c = String(g?.content||"");
      if(isTestText(c)){
        delete app.data.gifts.yearly[y];
        delete app.data.gifts.hints[y];
        n++;
      }
    }
    saveData();
    updateAllUI();
    showToast(`已清除测试内容（约 ${n} 项）`);
  }

  // Wipe all
  function wipeAll(){
    const sure = prompt("危险操作：输入「清空」以确认删除全部本地数据：");
    if(sure !== "清空"){
      showToast("已取消清空");
      return;
    }
    const d = defaultData();
    app.data = d;
    saveData();
    initState();
    buildMonthSelect();
    updateAllUI();
    showToast("已清空并重置为默认数据");
  }

  // Undo
  function setUndo(payload){
    app.undo.payload = payload;
    if(app.undo.timer){
      clearTimeout(app.undo.timer);
      app.undo.timer = null;
    }
    app.undo.timer = setTimeout(() => {
      app.undo.payload = null;
      app.undo.timer = null;
    }, 10000);
  }

  function undoOnce(){
    const p = app.undo.payload;
    if(!p){
      showToast("没有可撤销操作");
      return;
    }
    if(p.type === "calendar"){
      app.data.calendar[p.date] = p.value;
      saveData();
      renderCalendar();
      renderDateDetail();
      showToast("已撤销：寄语已恢复");
    }else if(p.type === "journal"){
      app.data.journal[p.date] = p.value;
      saveData();
      renderCalendar();
      renderJournal();
      showToast("已撤销：日记已恢复");
    }else if(p.type === "gift"){
      const y = p.year;
      if(p.value?.yearly) app.data.gifts.yearly[y] = p.value.yearly;
      if(p.value?.hints) app.data.gifts.hints[y] = p.value.hints;
      saveData();
      renderGifts();
      showToast("已撤销：礼物已恢复");
    }
    app.undo.payload = null;
  }

  // Toast
  function showToast(text, actions=[], duration=3500){
    const toast = $("#toast");
    $("#toastText").textContent = text || "";
    const act = $("#toastActions");
    act.innerHTML = "";

    (actions||[]).forEach(a => {
      const b = document.createElement("button");
      b.className = "btn tiny";
      b.textContent = a.label;
      b.addEventListener("click", () => {
        toast.classList.remove("show");
        a.action && a.action();
      });
      act.appendChild(b);
    });

    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("show"), duration);
  }

  // Status & help
  function renderStatus(){
    const m = app.data.meta || {};
    $("#metaBadge").textContent = `${m.app || "?"} v${m.version || "?"}`;

    const counts = {
      calendar: Object.keys(app.data.calendar||{}).length,
      journal: Object.keys(app.data.journal||{}).length,
      lots: (app.data.lots?.default?.length || 0) + ["困","焦虑","想她","需要被哄","开心"].reduce((s,k)=>s+(app.data.lots?.moods?.[k]?.length||0),0),
      letters: (app.data.letters || []).length,
      draws: (app.data.draws||[]).length,
      gifts: Object.keys(app.data.gifts?.yearly||{}).length
    };

    const list = $("#statusList");
    list.innerHTML = "";
    const themeLabel = formatThemeLabel(normalizeThemeSetting(app.data.meta?.settings?.theme));
    const rows = [
      { k:"寄语日期数", v: counts.calendar },
      { k:"日记日期数", v: counts.journal },
      { k:"签池条目数", v: counts.lots },
      { k:"解忧信件数", v: counts.letters },
      { k:"抽签历史数", v: counts.draws },
      { k:"胶囊数量", v: counts.gifts },
      { k:"当前选中日期", v: app.state.selectedDate },
      { k:"当前视图", v: `${app.state.viewYear}-${pad2(app.state.viewMonth+1)}` },
      { k:"主题", v: themeLabel }
    ];
    rows.forEach(r => {
      const it = document.createElement("div");
      it.className = "item";
      it.innerHTML = `
        <div class="top">
          <div style="font-weight:900;">${escapeText(r.k)}</div>
          <div class="badge">${escapeText(String(r.v))}</div>
        </div>
      `;
      list.appendChild(it);
    });
  }

  function renderHelp(){
    $("#schemaBlock").textContent = JSON.stringify(SCHEMA_EXAMPLE, null, 2);
  }

  function renderTodayMessage(){
    const host = $("#todayMessageArea");
    if(!host) return;
    host.innerHTML = "";
    const todayStr = toDateStrLocal(new Date());
    const entry = app.data.calendar[todayStr];
    const msg = String(entry?.message || "").trim();
    if(!msg) return;

    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "14px";
    card.innerHTML = `
      <div class="hd">
        <h2>今日寄语</h2>
        <div class="kpi"><span class="badge">${escapeText(todayStr)}</span></div>
      </div>
      <div class="bd">
        <div class="text message-view" id="todayMessageText"></div>
      </div>
    `;
    host.appendChild(card);
    const text = $("#todayMessageText", card);
    if(text) text.textContent = msg;
  }

  // Banner reminders
  function updateBanner(){
    const host = $("#bannerArea");
    host.innerHTML = "";

    const todayStr = toDateStrLocal(new Date());
    const flagsToday = getContentFlags(todayStr);

    const notes = [];
    if(flagsToday.hasMsg) notes.push({ type:"ok", text:"今天有寄语，点日历即可查看。" });
    else notes.push({ type:"warn", text:"今天还没有寄语。要不要生成一句？" });

    if(flagsToday.hasJnl) notes.push({ type:"ok", text:"今天有日记。" });

    // Only show a compact banner if there is something meaningful
    const shouldShow = !flagsToday.hasMsg || !flagsToday.hasJnl;
    if(!shouldShow) return;

    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "14px";
    card.innerHTML = `
      <div class="hd">
        <h2>打开即提示</h2>
        <div class="kpi"><span class="badge">${escapeText(todayStr)}</span></div>
      </div>
      <div class="bd">
        <div class="list" id="bannerList"></div>
        <div class="sep"></div>
        <div class="row">
          <button class="btn small primary" id="bannerGoToday">📍 去今天</button>
          <button class="btn small" id="bannerGoGifts">✨ 去惊喜</button>
        </div>
      </div>
    `;
    host.appendChild(card);

    const list = $("#bannerList", card);
    notes.slice(0,3).forEach(n => {
      const it = document.createElement("div");
      it.className = "item";
      it.innerHTML = `
        <div class="top">
          <div style="font-weight:900;">${n.type === "ok" ? "✅" : "⚠️"} 提醒</div>
          <div class="badge ${n.type === "ok" ? "ok" : "warn"}">${n.type === "ok" ? "已存在" : "待处理"}</div>
        </div>
        <div class="text">${escapeText(n.text)}</div>
      `;
      list.appendChild(it);
    });

    $("#bannerGoToday", card).addEventListener("click", () => {
      const t = parseDateStr(todayStr);
      app.state.viewYear = t.getFullYear();
      app.state.viewMonth = t.getMonth();
      setSelectedDate(todayStr, true);
      setTab("calendar");
    });

    $("#bannerGoGifts", card).addEventListener("click", () => setTab("surprise"));
  }

  function getGiftReminderSummary(){
    return [];
  }

  function updateReminderDots(){
    const todayStr = toDateStrLocal(new Date());
    const flagsToday = getContentFlags(todayStr);

    $("#dotCalendar").classList.toggle("on", !flagsToday.hasMsg);
    $("#dotJournal").classList.toggle("on", !flagsToday.hasJnl);
    const dotSurprise = $("#dotSurprise");
    if(dotSurprise){
      dotSurprise.classList.toggle("on", (app.data.draws||[]).length === 0);
    }
    $("#dotSettings").classList.toggle("on", false);
  }

  function updateAllUI(){
    buildMonthSelect();
    renderCalendar();
    renderDateDetail();
    renderDraw();
    renderJournal();
    renderGifts();
    renderMailboxTags();
    renderStatus();
    renderHelp();
    updateBanner();
    updateReminderDots();
    const theme = normalizeThemeSetting(app.data.meta?.settings?.theme);
    applyTheme(theme);
    updateThemeUI(theme);
  }

  // Events init
  function initEvents(){
    // tabbar
    $$(".tab").forEach(t => {
      t.addEventListener("click", () => {
        const tab = t.dataset.tab;
        if(tab === "settings"){ setTab("settings"); return; }
        if(tab === "calendar"){ setTab("calendar"); return; }
        if(tab === "surprise"){ setTab("surprise"); return; }
        if(tab === "journal"){ setTab("journal"); return; }
      });
    });

    // long press to open help: double tap logo
    let lastTap = 0;
    $(".logo").addEventListener("click", () => {
      const now = Date.now();
      if(now - lastTap < 350){
        setTab("help");
        showToast("已打开帮助/说明");
      }
      lastTap = now;
    });

    $("#btnTheme").addEventListener("click", toggleTheme);
    const seasonSel = $("#themeSeason");
    if(seasonSel){
      seasonSel.addEventListener("change", () => {
        const t = normalizeThemeSetting(app.data.meta.settings.theme);
        t.season = seasonSel.value;
        setTheme(t);
        showToast("已切换季节主题");
      });
    }
    const timeSel = $("#themeTime");
    if(timeSel){
      timeSel.addEventListener("change", () => {
        const t = normalizeThemeSetting(app.data.meta.settings.theme);
        t.time = timeSel.value;
        setTheme(t);
        if(t.time === "sunset") showToast("已切换到日落主题");
        else if(t.time === "night") showToast("已切换到夜间主题");
        else showToast("已切换到默认主题");
      });
    }

    const btnMailbox = $("#btnMailbox");
    if(btnMailbox){
      btnMailbox.addEventListener("click", () => {
        const tags = $("#mailboxTags");
        if(!tags) return;
        tags.classList.toggle("hidden");
      });
    }

    const btnGiftSave = $("#btnGiftSave");
    if(btnGiftSave) btnGiftSave.addEventListener("click", saveGift);
    const btnGiftDelete = $("#btnGiftDelete");
    if(btnGiftDelete) btnGiftDelete.addEventListener("click", deleteGiftYear);
    const btnGiftNew = $("#btnGiftNew");
    if(btnGiftNew){
      btnGiftNew.addEventListener("click", () => {
        app.state.giftEditingYear = null;
        renderGiftEditor();
        showToast("已清空编辑器");
      });
    }

    // draw
    $("#btnDraw").addEventListener("click", doDraw);
    const btnRedraw = $("#btnRedraw");
    if(btnRedraw){
      btnRedraw.addEventListener("click", doDraw);
    }
    $("#btnSaveDraw").addEventListener("click", () => {
      const rec = saveDrawRecord(null);
      if(rec) showToast("已保存到抽签历史");
    });
    $("#btnWriteToDate").addEventListener("click", writeDrawToSelectedDate);

    $("#drawFilter").addEventListener("input", renderDrawHistory);

    // journal
    $("#btnSaveJnl").addEventListener("click", saveJournal);
    $("#btnDeleteJnl").addEventListener("click", deleteJournal);
    $("#btnSearch").addEventListener("click", doSearch);
    $("#searchInput").addEventListener("keydown", (e) => {
      if(e.key === "Enter"){ e.preventDefault(); doSearch(); }
    });

    // letter modal
    const letterClose = $("#letterModalClose");
    if(letterClose) letterClose.addEventListener("click", closeLetterModal);
    const letterBackdrop = $("#letterModalBackdrop");
    if(letterBackdrop) letterBackdrop.addEventListener("click", closeLetterModal);

    // gift editor modal
    const giftEditorClose = $("#giftEditorClose");
    if(giftEditorClose) giftEditorClose.addEventListener("click", closeGiftEditorModal);
    const giftEditorBackdrop = $("#giftEditorBackdrop");
    if(giftEditorBackdrop) giftEditorBackdrop.addEventListener("click", closeGiftEditorModal);

    document.addEventListener("keydown", (ev) => {
      if(ev.key !== "Escape") return;
      if(!$("#letterModal")?.classList.contains("hidden")) closeLetterModal();
      if(!$("#giftEditorModal")?.classList.contains("hidden")) closeGiftEditorModal();
    });

    // settings
    $("#btnExport").addEventListener("click", exportJSON);

    $("#importFile").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      const mode = $("#importMode").value || "replace";

      try{
        const text = await file.text();
        const obj = JSON.parse(text);
        const v = validateImported(obj);
        if(!v.ok){
          showToast("导入失败：" + v.err);
          e.target.value = "";
          return;
        }
        importJSON(obj, mode);
      }catch(err){
        showToast("导入失败：JSON 解析错误");
      }finally{
        e.target.value = "";
      }
    });

    $("#btnClearTest").addEventListener("click", () => {
      if(!confirm("确认清除测试内容？（尽量不影响手写内容）")) return;
      clearTestContent();
    });

    $("#btnWipeAll").addEventListener("click", wipeAll);
  }

  function updateBannerInitial(){
    updateBanner();
    updateReminderDots();
  }

  function renderDrawInit(){
    renderMoodChips();
    renderDrawCard();
  }

  function renderHelpInit(){
    $("#schemaBlock").textContent = JSON.stringify(SCHEMA_EXAMPLE, null, 2);
  }

  function renderDateDetailInit(){
    renderDateDetail();
  }

  // init
  function boot(){
    app.data = loadData();
    initState();
    initTheme();
    initCalendarControls();
    initEvents();
    renderDrawInit();
    renderMailboxTags();
    renderHelpInit();
    renderCalendar();
    renderDateDetailInit();
    renderJournal();
    renderGifts();
    renderStatus();
    updateBannerInitial();
  }

  boot();

  // Expose minimal for debugging (optional)
  window.TimeCapsuleCalendar = {
    getData: () => app.data,
    setTab
  };

})();
