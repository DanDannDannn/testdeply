// All data — combined view that uses activity-data rows as the spine and shows
// every relevant field about each activity AND its calculation(s) rolled up.
// Designed as the single "what's going on across the dataset" surface.
//
// Column order matches the customer's reference spreadsheet for the leading
// (visible-without-horizontal-scroll) columns:
//   ID · Supplier · Description · Category · EF name · Business unit ·
//   EF factor confidence · calculationGhg_co2e
// Everything else follows after, available in the Columns menu and via scroll.

const ALL_COLUMNS_ALLDATA = [
  // ── Lead columns (match reference spreadsheet) ──
  { k:"id",                  label:"ID",                       w: 110 },
  { k:"supplier",            label:"Supplier name",            w: 180 },
  { k:"description",         label:"Description",              w: 240 },
  { k:"category",            label:"Category",                 w: 170 },
  { k:"ef_name",             label:"EF name",                  w: 220 },
  { k:"business_unit",       label:"Business unit",            w: 140 },
  { k:"ef_confidence",       label:"EF factor confidence",     w: 170 },
  { k:"co2e_value",          label:"calculationGhg_co2e",      w: 170 },
  // ── Activity / entry ──
  { k:"entry_status",        label:"Status",                   w: 130 },
  { k:"business_activity",   label:"Business activity",        w: 200 },
  { k:"user_assigned",       label:"User assigned",            w: 160 },
  { k:"start_date",          label:"Start date",               w: 110 },
  { k:"end_date",            label:"End date",                 w: 110 },
  { k:"data_input_type",     label:"Data input type",          w: 160 },
  { k:"site",                label:"Site",                     w: 130 },
  // ── Consumption ──
  { k:"consumption_value",   label:"Consumption value",        w: 130 },
  { k:"consumption_unit",    label:"Consumption unit",         w: 110 },
  { k:"consumption_details", label:"Consumption details",      w: 220 },
  // ── Emission factor (rest) ──
  { k:"ef_value",            label:"Emission factor value",    w: 140 },
  { k:"ef_unit",             label:"Emission factor unit",     w: 130 },
  { k:"ef_source",           label:"Emission factor source",   w: 150 },
  { k:"ef_dataset",          label:"Emission factor dataset",  w: 160 },
  { k:"ef_year",             label:"Emission factor year",     w: 100 },
  { k:"ef_region",           label:"Emission factor region",   w: 130 },
  { k:"ef_lca",              label:"Emission factor LCA activity", w: 180 },
  { k:"custom_factor",       label:"Custom emission factor",   w: 170 },
  // ── Result (rest) ──
  { k:"co2e_unit",            label:"CO₂e emission unit",      w: 130 },
  { k:"co2e_method",          label:"CO₂e calculation method", w: 200 },
  { k:"emission_details",     label:"Emission details",        w: 180 },
  { k:"calcs_count",          label:"GHG emission calculations", w: 180 },
  { k:"calc_status",          label:"Calc status mix",         w: 170 },
  // ── Meta ──
  { k:"notes",               label:"Notes",                    w: 220 },
  { k:"source_import",       label:"Source import",            w: 180 },
  { k:"bulk_import_ref",     label:"Bulk import",              w: 160 },
  { k:"created_on",          label:"Created on",               w: 110 },
  { k:"last_updated",        label:"Last updated",             w: 110 },
  { k:"files",               label:"Files",                    w: 80 },
];
const ALLDATA_DEFAULT_VIS = [
  // Lead 8 — visible before any horizontal scroll
  "id","supplier","description","category","ef_name","business_unit","ef_confidence","co2e_value",
  // Then a useful run of the rest
  "entry_status","user_assigned","start_date","end_date","data_input_type","site",
  "consumption_value","consumption_unit",
  "ef_source","ef_year","ef_region",
  "co2e_unit","calcs_count","calc_status",
  "notes","source_import","created_on","last_updated","files",
];

function AllData({ entries, calcs, headerPortal, onViewEntry, onViewCalc }) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState(null);
  // Reporting period — null means no period filter applied (all time).
  // User can add a Period filter via the + Filter menu when needed.
  const [period, setPeriod] = React.useState(null);
  // Column-level filters from per-header dropdown menus (Notion-style).
  // Business unit is hosted inside this map so the top filter pill and the
  // business_unit column header stay in sync (one source of truth).
  const [colFilters, setColFilters] = React.useState({});
  const setColFilter = (k, v) => setColFilters(f => {
    const next = { ...f };
    if (!v || v === "all" || v === "") delete next[k]; else next[k] = v;
    return next;
  });
  const bu = colFilters.business_unit || "all";
  // Bumped to v2 when the column keys were expanded (period→start/end, consumption→value/unit, etc.).
  // v1 keys are obsolete — fall through to ALLDATA_DEFAULT_VIS so users see the full new set.
  const [visible, setVisible] = React.useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("fe-alldata-cols-v3"));
      if (Array.isArray(stored)) {
        // Drop any stale keys (in case columns get removed in future revisions)
        const known = new Set(ALL_COLUMNS_ALLDATA.map(c => c.k));
        const cleaned = stored.filter(k => known.has(k));
        return cleaned.length ? cleaned : ALLDATA_DEFAULT_VIS;
      }
      return ALLDATA_DEFAULT_VIS;
    } catch { return ALLDATA_DEFAULT_VIS; }
  });
  React.useEffect(() => { localStorage.setItem("fe-alldata-cols-v3", JSON.stringify(visible)); }, [visible]);
  const isVisible = (k) => visible.includes(k);
  const toggleCol = (k) => setVisible(v => v.includes(k) ? v.filter(x=>x!==k) : [...v, k]);
  const [colMenu, setColMenu] = React.useState(false);

  const calcsByEntry = React.useMemo(() => {
    const m = new Map();
    calcs.forEach(c => {
      const arr = m.get(c.entryId) || [];
      arr.push(c);
      m.set(c.entryId, arr);
    });
    return m;
  }, [calcs]);

  const rollup = (e) => {
    const mine = calcsByEntry.get(e.id) || [];
    const total = mine.reduce((s,c) => s + c.kgCO2e, 0);
    const first = mine[0];
    return {
      mine, first, total,
      count: mine.length,
      pending:   mine.filter(c => c.status === "pending").length,
      suggested: mine.filter(c => c.status === "suggested").length,
      confirmed: mine.filter(c => c.status === "confirmed").length,
      factors: [...new Set(mine.map(c => c.factor.name))],
    };
  };

  const consumption = (e) => {
    const d = e.details || {};
    if (e.category === "electricity" || e.category === "natural_gas") return { v: d.kWh, u: "kWh" };
    if (e.category === "diesel")       return { v: d.liters, u: "L" };
    if (e.category === "flight")       return { v: d.distance_km, u: "km" };
    if (e.category === "purchased_goods") return { v: d.spend_eur, u: "EUR" };
    return { v: null, u: "" };
  };

  // Supplier — prefer details.supplier; fall back to category-specific signals
  // (airline for flights, fuel-card issuer for diesel) so the column is rarely empty.
  const supplierOf = (e) => {
    const d = e.details || {};
    if (d.supplier) return d.supplier;
    if (e.category === "flight" && d.ticket) {
      const code = d.ticket.split("-")[0];
      const map = { BA:"British Airways", AF:"Air France", LH:"Lufthansa", IB:"Iberia", EK:"Emirates", KL:"KLM", UA:"United", DL:"Delta", AA:"American" };
      return map[code] || `Airline (${code})`;
    }
    if (e.category === "diesel" && d.card_issuer) return d.card_issuer + " (fuel card)";
    return null;
  };

  const CATEGORY_LABELS = {
    electricity: "ELECTRICITY",
    natural_gas: "STATIONARY_COMBUSTION",
    diesel: "MOBILE_COMBUSTION",
    flight: "BUSINESS_TRAVEL_AIR",
    purchased_goods: "PURCHASED_GOODS",
  };

  // Map a column key to a comparable scalar for that entry. Used by both the
  // per-column filter and the sort. Keeping this in one place means a column's
  // filter and its visible cell value are always lined up.
  const getCol = (e, key) => {
    const r = (window._tmpRollup && window._tmpRollup[e.id]); // unused — kept for parity
    const calcsByEntry = e._calcs;
    const mine = calcsByEntry || [];
    const first = mine[0];
    const f = first?.factor;
    const cons = consumption(e);
    switch (key) {
      case "id": return e.id;
      case "supplier": return supplierOf(e) || "";
      case "description": return e.summary || "";
      case "category": return e.category;
      case "ef_name": return f?.name || "";
      case "business_unit": return e.business_unit;
      case "ef_confidence": return first?.confidence ?? null;
      case "co2e_value": return mine.reduce((s,c)=>s+c.kgCO2e, 0);
      case "entry_status": return e.entry_status;
      case "business_activity": return e.business_activity;
      case "user_assigned": return e.user_assigned;
      case "start_date": return e.start_date;
      case "end_date": return e.end_date;
      case "data_input_type": return e.data_input_type;
      case "site": return e.site;
      case "consumption_value": return cons.v;
      case "consumption_unit": return cons.u;
      case "consumption_details": return e.summary;
      case "ef_value": return f?.kg_per_unit ?? null;
      case "ef_unit": return f ? `kgCO₂e/${f.unit}` : "";
      case "ef_source": return f?.source || "";
      case "ef_dataset": return f?.dataset || f?.source || "";
      case "ef_year": return f?.vintage || "";
      case "ef_region": return f?.region || (f ? "Global" : "");
      case "ef_lca": return f?.lca || (f ? "Cradle-to-gate" : "");
      case "co2e_unit": return mine.length ? "tCO₂e" : "";
      case "co2e_method": return first?.method || "";
      case "calcs_count": return mine.length;
      case "calc_status": {
        if (mine.length === 0) return "none";
        if (mine.some(c => c.status === "pending")) return "pending";
        if (mine.some(c => c.status === "suggested")) return "suggested";
        return "confirmed";
      }
      case "notes": return e.notes || "";
      case "source_import": return e.batchId || "";
      case "bulk_import_ref": return e.bulk_import_ref || "";
      case "created_on": return e.created_on || "";
      case "last_updated": return e.last_updated || "";
      case "files": return e.files_count || 0;
      default: return "";
    }
  };

  // Build dropdown option lists from the actual data (so they reflect what's
  // present, not a hard-coded global list). Computed once per render — cheap
  // for ≤ a few hundred rows.
  const uniqueOpts = (key, labelize) => {
    const set = new Set();
    entries.forEach(en => {
      const v = getCol({ ...en, _calcs: calcsByEntry.get(en.id) }, key);
      if (v != null && v !== "") set.add(v);
    });
    return [...set].sort().map(v => ({ k: String(v), l: labelize ? labelize(v) : String(v) }));
  };

  // Per-column filter behaviours: dropdown options where finite, free-text
  // otherwise. Keys not listed get a free-text contains filter.
  const colFilterCfg = React.useMemo(() => ({
    business_unit:    { options: uniqueOpts("business_unit") },
    category:         { options: Object.entries(CATEGORY_LABELS).map(([k,l]) => ({k, l})) },
    entry_status:     { options: [
      {k:"draft", l:"Draft"}, {k:"ready", l:"Ready"}, {k:"in_review", l:"In review"}, {k:"signed_off", l:"Signed off"},
    ]},
    site:             { options: uniqueOpts("site") },
    user_assigned:    { options: uniqueOpts("user_assigned") },
    data_input_type:  { options: uniqueOpts("data_input_type") },
    supplier:         { options: uniqueOpts("supplier") },
    ef_source:        { options: uniqueOpts("ef_source") },
    ef_year:          { options: uniqueOpts("ef_year") },
    ef_region:        { options: uniqueOpts("ef_region") },
    consumption_unit: { options: uniqueOpts("consumption_unit") },
    co2e_unit:        { options: [{k:"tCO₂e", l:"tCO₂e"}] },
    calc_status:      { options: [
      {k:"none", l:"No calculations"},
      {k:"pending", l:"Has pending"},
      {k:"suggested", l:"Has suggested"},
      {k:"confirmed", l:"All confirmed"},
    ]},
    ef_confidence:    { options: [
      {k:"high",   l:"High (≥80%)"},
      {k:"medium", l:"Medium (60–80%)"},
      {k:"low",    l:"Low (<60%)"},
      {k:"none",   l:"No match"},
    ]},
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [entries, calcsByEntry]);

  const passesColFilter = (e, key, val) => {
    if (!val || val === "all") return true;
    if (key === "ef_confidence") {
      const c = getCol(e, key);
      if (val === "none")   return c == null;
      if (val === "low")    return c != null && c < 0.6;
      if (val === "medium") return c != null && c >= 0.6 && c < 0.8;
      if (val === "high")   return c != null && c >= 0.8;
    }
    const cellVal = getCol(e, key);
    if (cellVal == null) return false;
    if (colFilterCfg[key]?.options) return String(cellVal) === String(val);
    return String(cellVal).toLowerCase().includes(String(val).toLowerCase());
  };

  const filtered = React.useMemo(() => {
    let r = entries;
    // Reporting period (defaults to Q1 2026)
    if (period && period !== "all") r = r.filter(e => window.inPeriod(e, period));
    // Apply per-column filters (incl. business_unit which is hosted in this map)
    Object.entries(colFilters).forEach(([k, val]) => {
      if (!val) return;
      r = r.filter(e => passesColFilter({ ...e, _calcs: calcsByEntry.get(e.id) }, k, val));
    });
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(e =>
        e.id.toLowerCase().includes(q) ||
        (e.summary||"").toLowerCase().includes(q) ||
        (e.business_activity||"").toLowerCase().includes(q) ||
        (e.business_unit||"").toLowerCase().includes(q) ||
        (e.user_assigned||"").toLowerCase().includes(q) ||
        (e.site||"").toLowerCase().includes(q)
      );
    }
    if (sort) {
      r = [...r].sort((a,b) => cmpBy(
        { ...a, _calcs: calcsByEntry.get(a.id) },
        { ...b, _calcs: calcsByEntry.get(b.id) },
        (e) => getCol(e, sort.key),
        sort.dir,
      ));
    }
    return r;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, query, colFilters, sort, calcsByEntry, period]);

  const totalEmissions = filtered.reduce((s,e) => s + rollup(e).total, 0);

  const actions = (
    <div className="page-actions" style={{gap:8}}>
      <div className="col-menu-wrap">
        <button className="btn secondary small" onClick={() => setColMenu(v => !v)}>
          <Icon name="filter" size={16}/>Columns <span style={{color:"var(--fe-fg-muted)"}}>{visible.length}/{ALL_COLUMNS_ALLDATA.length}</span>
        </button>
        {colMenu && (
          <>
            <div style={{position:"fixed", inset:0, zIndex:20}} onClick={() => setColMenu(false)}/>
            <div className="col-menu">
              <div className="head">
                <span>Show columns</span>
                <span><a onClick={() => setVisible(ALL_COLUMNS_ALLDATA.map(c=>c.k))}>Show all</a> · <a onClick={() => setVisible([])}>Hide all</a></span>
              </div>
              {ALL_COLUMNS_ALLDATA.map(col => (
                <label key={col.k}>
                  <input type="checkbox" checked={isVisible(col.k)} onChange={() => toggleCol(col.k)} />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
      <button className="btn secondary small" onClick={() => window.dispatchEvent(new CustomEvent("fe-export-start", {detail: { title: "All data", meta: `${filtered.length.toLocaleString()} rows · CSV`, filename: `all_data_${new Date().toISOString().slice(0,10)}.csv`, rows: filtered.length }}))}>
        <Icon name="arrowDown" size={16}/>Export
      </button>
    </div>
  );

  const muted = {color:"var(--fe-fg-subtle)"};

  return (
    <>
      {headerPortal && ReactDOM.createPortal(actions, headerPortal)}

      <div className="filter-bar">
        <span className="filter-search">
          <Icon name="search" size={14} style={{color:"var(--fe-fg-muted)"}}/>
          <input placeholder="Search ID, summary, site…" value={query} onChange={e => setQuery(e.target.value)}/>
        </span>

        {/* Business unit — only when set */}
        {bu !== "all" && (
          <FilterPill
            icon="users"
            label="Business unit"
            value={bu}
            options={(window.BUSINESS_UNITS || []).map(u => ({k:u, l:u}))}
            onChange={(v) => setColFilter("business_unit", v)}
            onClear={() => setColFilter("business_unit", null)}
          />
        )}

        {/* Reporting period — only when set */}
        {period && (
          <FilterPill
            icon="calendar"
            label="Period"
            value={period}
            options={window.PERIOD_OPTIONS}
            onChange={(v) => setPeriod(v)}
            onClear={() => setPeriod(null)}
          />
        )}

        {/* Per-column filters surfaced as removable pills (excludes BU — surfaced above) */}
        {Object.entries(colFilters).filter(([k]) => k !== "business_unit").map(([k, val]) => {
          const col = ALL_COLUMNS_ALLDATA.find(c => c.k === k);
          if (!col) return null;
          const cfg = colFilterCfg[k];
          const display = cfg?.options ? (cfg.options.find(o => o.k === val)?.l || val) : `"${val}"`;
          return (
            <FilterPill
              key={k}
              icon="filter"
              label={col.label}
              value={display}
              options={cfg?.options || null}
              onChange={(v) => setColFilter(k, v)}
              onClear={() => setColFilter(k, null)}
            />
          );
        })}

        {/* + Filter — quick-add menu of unused facets (BU + Period + per-column) */}
        <AddFilterButton
          facets={[
            ...(bu === "all" ? [{k: "__bu", label: "Business unit", icon: "users"}] : []),
            ...(!period      ? [{k: "__period", label: "Period",      icon: "calendar"}] : []),
            ...ALL_COLUMNS_ALLDATA
              .filter(c => colFilterCfg[c.k]?.options && !colFilters[c.k] && c.k !== "business_unit")
              .map(c => ({k: c.k, label: c.label, icon: "filter"})),
          ]}
          onAdd={(k) => {
            if (k === "__bu") {
              const first = (window.BUSINESS_UNITS || [])[0];
              if (first) setColFilter("business_unit", first);
              return;
            }
            if (k === "__period") { setPeriod("q1_2026"); return; }
            const first = colFilterCfg[k]?.options?.[0]?.k;
            if (first) setColFilter(k, first);
          }}
        />

        {(() => {
          const activeCount = Object.keys(colFilters).length + (period ? 1 : 0);
          if (activeCount < 2) return null;
          return (
            <button className="filter-clear-all" onClick={() => { setColFilters({}); setPeriod(null); }}>
              Clear all {activeCount}
            </button>
          );
        })()}

        <span style={{marginLeft:"auto", fontSize:12, color:"var(--fe-fg-muted)"}}>
          Σ {(totalEmissions/1000).toLocaleString(undefined, {maximumFractionDigits:1})} tCO₂e · {filtered.length} of {entries.length}
        </span>
      </div>

      <div className="card" style={{padding:0, overflow:"hidden"}}>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {ALL_COLUMNS_ALLDATA.filter(c => isVisible(c.k)).map(col => {
                  const align = ["co2e_value","calcs_count","ef_value","consumption_value","ef_confidence"].includes(col.k) ? "right" : "left";
                  const cfg = colFilterCfg[col.k];
                  return (
                    <th key={col.k} style={{width: col.w, minWidth: col.w, textAlign: align}}>
                      <SortableHeader
                        label={col.label}
                        colKey={col.k}
                        align={align}
                        sort={sort}
                        onSort={(key, dir) => setSort(key ? {key, dir} : null)}
                        filterValue={colFilters[col.k]}
                        onFilter={(v) => setColFilter(col.k, v)}
                        filterOptions={cfg?.options}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const r = rollup(e);
                const f = r.first?.factor;
                const cons = consumption(e);
                const batch = (window.BATCHES || []).find(x => x.id === e.batchId);
                return (
                  <tr key={e.id} onClick={() => onViewEntry(e.id)}>
                    {ALL_COLUMNS_ALLDATA.filter(col => isVisible(col.k)).map(col => {
                      switch (col.k) {
                        case "id":
                          return <td key={col.k} style={{fontFamily:"var(--fe-font-mono)", fontSize:12, color:"var(--fe-fg-strong)"}}>{e.id}</td>;
                        case "supplier": {
                          const s = supplierOf(e);
                          return <td key={col.k} style={{color: s ? "var(--fe-fg-strong)" : "var(--fe-fg-subtle)", fontWeight: s ? 500 : 400}}>{s || "—"}</td>;
                        }
                        case "description":
                          return <td key={col.k} className="wrap" style={{color:"var(--fe-fg-strong)", whiteSpace:"normal"}}>{e.summary}</td>;
                        case "category":
                          return <td key={col.k} style={{fontFamily:"var(--fe-font-mono)", fontSize:11, color:"var(--fe-fg-default)", letterSpacing:0.2}}>{CATEGORY_LABELS[e.category] || e.category.toUpperCase()}</td>;
                        case "ef_confidence":
                          return <td key={col.k} style={{textAlign:"right"}}>
                            {r.first?.confidence != null
                              ? <Confidence value={r.first.confidence} inline={true} showLabel={false}/>
                              : <span style={muted}>—</span>}
                          </td>;
                        case "entry_status":
                          return <td key={col.k}><StatusChip status={e.entry_status}/></td>;
                        case "business_unit":
                          return <td key={col.k} style={{color:"var(--fe-fg-strong)", fontWeight:500}}>{e.business_unit}</td>;
                        case "business_activity":
                          return <td key={col.k}>
                            <div style={{color:"var(--fe-fg-strong)", fontWeight:500}}>{e.business_activity}</div>
                          </td>;
                        case "user_assigned":
                          return <td key={col.k}>{e.user_assigned}</td>;
                        case "start_date":
                          return <td key={col.k} style={{color:"var(--fe-fg-muted)"}}>{e.start_date}</td>;
                        case "end_date":
                          return <td key={col.k} style={{color:"var(--fe-fg-muted)"}}>{e.end_date}</td>;
                        case "data_input_type":
                          return <td key={col.k}><span className="chip"><span className="dot"></span>{e.data_input_type}</span></td>;
                        case "site":
                          return <td key={col.k} style={{color:"var(--fe-fg-strong)", fontWeight:500}}>{e.site}</td>;
                        case "consumption_value":
                          return <td key={col.k} style={{textAlign:"right", color:"var(--fe-fg-strong)", fontWeight:500}} className="num">
                            {cons.v != null ? cons.v.toLocaleString() : <span style={muted}>—</span>}
                          </td>;
                        case "consumption_unit":
                          return <td key={col.k} style={{color: cons.u ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)", fontSize:12}}>{cons.u || "—"}</td>;
                        case "consumption_details":
                          return <td key={col.k} style={{color:"var(--fe-fg-strong)", fontWeight:500}}>{e.summary}</td>;
                        case "ef_name":
                          return <td key={col.k} className="wrap" style={{fontSize:12}}>
                            {f ? <>
                              <div style={{color:"var(--fe-fg-strong)", fontWeight:500, whiteSpace:"normal"}}>{f.name}{r.factors.length > 1 && <span style={{color:"var(--fe-fg-muted)", fontWeight:500}}> +{r.factors.length-1}</span>}</div>
                            </> : <span style={muted}>—</span>}
                          </td>;
                        case "ef_value":
                          return <td key={col.k} style={{textAlign:"right", color: f ? "var(--fe-fg-strong)" : "var(--fe-fg-subtle)"}} className="num">
                            {f ? f.kg_per_unit : "—"}
                          </td>;
                        case "ef_unit":
                          return <td key={col.k} style={{fontSize:12, color: f ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)"}}>{f ? `kgCO₂e/${f.unit}` : "—"}</td>;
                        case "ef_source":
                          return <td key={col.k} style={{color: f ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)"}}>{f?.source || "—"}</td>;
                        case "ef_dataset":
                          return <td key={col.k} style={{color: f ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)", fontSize:12}}>{f ? (f.dataset || f.source) : "—"}</td>;
                        case "ef_year":
                          return <td key={col.k} style={{color:"var(--fe-fg-muted)"}}>{f?.vintage || "—"}</td>;
                        case "ef_region":
                          return <td key={col.k} style={{color: f ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)"}}>{f?.region || (f ? "Global" : "—")}</td>;
                        case "ef_lca":
                          return <td key={col.k} style={{color: f ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)", fontSize:12}}>{f ? (f.lca || "Cradle-to-gate") : "—"}</td>;
                        case "custom_factor":
                          return <td key={col.k} style={{fontSize:12, color: e.custom_factor && e.custom_factor !== "—" ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)"}}>{e.custom_factor || "—"}</td>;
                        case "co2e_value":
                          return <td key={col.k} style={{textAlign:"right", fontWeight:500, color: r.count > 0 ? "var(--fe-fg-strong)" : "var(--fe-fg-subtle)"}} className="num">
                            {r.count > 0 ? (r.total/1000).toLocaleString(undefined, {maximumFractionDigits: r.total<100 ? 3 : 2}) : "—"}
                          </td>;
                        case "co2e_unit":
                          return <td key={col.k} style={{fontSize:12, color: r.count > 0 ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)"}}>{r.count > 0 ? "tCO₂e" : "—"}</td>;
                        case "co2e_method":
                          return <td key={col.k} style={{fontSize:12, color: r.first ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)"}}>{r.first?.method || "—"}</td>;
                        case "emission_details":
                          return <td key={col.k} style={{fontSize:12, color: r.count > 0 ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)"}}>
                            {r.count > 0 ? `${r.first.gas} · ${fmtKgSmart(r.total)} kgCO₂e` : "—"}
                          </td>;
                        case "calcs_count":
                          return <td key={col.k} style={{textAlign:"right"}} className="num">
                            {r.count > 0 ? (
                              <span className="link" onClick={(ev) => { ev.stopPropagation(); onViewCalc(r.first.id); }}>
                                {r.count} calculation{r.count>1?"s":""}
                              </span>
                            ) : <span style={muted}>0</span>}
                          </td>;
                        case "calc_status":
                          return <td key={col.k}>
                            {r.count === 0 ? <span style={muted}>—</span> : (
                              <span className="rollup">
                                {r.pending > 0   && <span className="pill r" title={`${r.pending} pending`}>{r.pending}</span>}
                                {r.suggested > 0 && <span className="pill s" title={`${r.suggested} suggested`}>{r.suggested}</span>}
                                {r.confirmed > 0 && <span className="pill v" title={`${r.confirmed} confirmed`}>{r.confirmed}</span>}
                              </span>
                            )}
                          </td>;
                        case "notes":
                          return <td key={col.k} className="wrap" style={{color: e.notes ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)", fontSize:12, whiteSpace:"normal"}}>{e.notes || "—"}</td>;
                        case "source_import":
                          return <td key={col.k} style={{fontSize:12}}>
                            {batch ? <span style={{display:"inline-flex", alignItems:"center", gap:6}}>
                              <Icon name={batch.source === "csv" ? "upload" : batch.source === "erp" ? "check" : "pencil"} size={12}/>
                              {batch.fileName || batch.id}
                            </span> : <span style={muted}>—</span>}
                          </td>;
                        case "bulk_import_ref":
                          return <td key={col.k} style={{fontSize:12, color: e.bulk_import_ref ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)"}}>{e.bulk_import_ref || "—"}</td>;
                        case "created_on":
                          return <td key={col.k} style={{color:"var(--fe-fg-muted)"}}>{e.created_on}</td>;
                        case "last_updated":
                          return <td key={col.k} style={{color:"var(--fe-fg-muted)"}}>{e.last_updated}</td>;
                        case "files":
                          return <td key={col.k}>
                            {e.files_count > 0
                              ? <span style={{display:"inline-flex", alignItems:"center", gap:4}}><Icon name="upload" size={14} style={{color:"var(--fe-fg-muted)"}}/>{e.files_count}</span>
                              : <span style={muted}>—</span>}
                          </td>;
                        default: return <td key={col.k}/>;
                      }
                    })}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={visible.length}><div className="empty">No data matches these filters.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { AllData });
