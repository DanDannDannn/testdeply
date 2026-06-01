// Data entries page — common columns + drawer with category-specific fields & child calcs

const ENTRY_COLUMNS = [
  { k:"id",                label:"ID",                    w: 92 },
  { k:"status",            label:"Status",                w: 150 },
  { k:"business_unit",     label:"Business unit",         w: 140 },
  { k:"business_activity", label:"Business activity",     w: 200 },
  { k:"user_assigned",     label:"User assigned",         w: 160 },
  { k:"start_date",        label:"Start date",            w: 110 },
  { k:"end_date",          label:"End date",              w: 110 },
  { k:"data_input_type",   label:"Data input type",       w: 160 },
  { k:"site",              label:"Site",                  w: 140 },
  { k:"consumption",       label:"Consumption details",   w: 260 },
  { k:"factor",            label:"Emission factor",       w: 240 },
  { k:"emission",          label:"Emission details",      w: 170 },
  { k:"calcs_count",       label:"GHG calculations",      w: 130 },
  { k:"source_import",     label:"Source import",         w: 180 },
  { k:"notes",             label:"Notes",                 w: 220 },
  { k:"created_on",        label:"Created on",            w: 110 },
  { k:"last_updated",      label:"Last updated",          w: 110 },
  { k:"files",             label:"Files",                 w: 80 },
  { k:"bulk_import_ref",   label:"Bulk import file",      w: 180 },
  { k:"custom_factor",     label:"Custom Emission Factor",w: 180 },
];
const ENTRY_DEFAULT_VIS = ["id","status","business_unit","business_activity","user_assigned","start_date","end_date","data_input_type","consumption","factor","emission","calcs_count","source_import","notes"];

function DataEntries({ entries, calcs, selectedId, setSelectedId, onViewCalc, preselectEntryId, onViewImport, bulk, batchFilter, onClearBatchFilter, embedded, headerPortal }) {
  React.useEffect(() => { if (preselectEntryId) setSelectedId(preselectEntryId); }, [preselectEntryId]);

  const rollupFor = (entryId) => {
    const mine = calcs.filter(c => c.entryId === entryId);
    const pending   = mine.filter(c => c.status === "pending").length;
    const suggested = mine.filter(c => c.status === "suggested").length;
    const confirmed = mine.filter(c => c.status === "confirmed").length;
    const total = mine.reduce((s, c) => s + c.kgCO2e, 0);
    const uniqFactors = [...new Set(mine.map(c => c.factor.name))];
    const avgConf = mine.reduce((s,c) => s + (c.confidence ?? 1), 0) / (mine.length || 1);
    return { count: mine.length, pending, suggested, confirmed, total, uniqFactors, avgConf };
  };

  const [query, setQuery] = React.useState("");
  const [bu, setBu] = React.useState("all");
  const [cat, setCat] = React.useState("all");
  const [period, setPeriod] = React.useState("q1_2026");
  const [sort, setSort] = React.useState(null); // {key, dir}
  const [colFilters, setColFilters] = React.useState({});
  const setColFilter = (k, v) => setColFilters(f => {
    const next = { ...f };
    if (!v || v === "all" || v === "") delete next[k]; else next[k] = v;
    return next;
  });
  const handleSort = (key, dir) => setSort(key ? { key, dir } : null);
  const [visible, setVisible] = React.useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("fe-entry-cols"));
      if (!stored) return ENTRY_DEFAULT_VIS;
      // Merge any NEW default columns added after the user's prefs were first saved
      const missing = ENTRY_DEFAULT_VIS.filter(k => !stored.includes(k));
      return missing.length ? [...stored, ...missing] : stored;
    } catch { return ENTRY_DEFAULT_VIS; }
  });
  const [colMenu, setColMenu] = React.useState(false);
  React.useEffect(() => { localStorage.setItem("fe-entry-cols", JSON.stringify(visible)); }, [visible]);
  const isVisible = (k) => visible.includes(k);
  const toggleCol = (k) => setVisible(v => v.includes(k) ? v.filter(x=>x!==k) : [...v, k]);

  // Getter per column for sorting/filtering
  const entryGet = (e, key) => {
    switch (key) {
      case "id": return e.id;
      case "status": return e.entry_status;
      case "business_unit": return e.business_unit;
      case "business_activity": return e.business_activity;
      case "user_assigned": return e.user_assigned;
      case "start_date": return e.start_date;
      case "end_date": return e.end_date;
      case "data_input_type": return e.data_input_type;
      case "site": return e.site;
      case "consumption": return e.summary;
      case "factor": {
        const m = calcs.filter(c => c.entryId === e.id);
        return m[0]?.factor?.name || "";
      }
      case "emission": {
        const m = calcs.filter(c => c.entryId === e.id);
        return m.reduce((s,c)=>s+c.kgCO2e, 0);
      }
      case "calcs_count": return calcs.filter(c => c.entryId === e.id).length;
      case "source_import": {
        const b = (window.BATCHES || []).find(x => x.id === e.batchId);
        return b ? (b.fileName || b.label || b.id) : "";
      }
      case "notes": return e.notes;
      case "created_on": return e.created_on;
      case "last_updated": return e.last_updated;
      case "files": return e.files_count;
      case "bulk_import_ref": return e.bulk_import_ref;
      case "custom_factor": return e.custom_factor;
      default: return "";
    }
  };

  // Build per-column filter config: dropdown options for enumerable cols,
  // otherwise free-text filter.
  const entryFilterConfig = {
    status:           { options: [{k:"draft",l:"Draft"},{k:"ready",l:"Ready"},{k:"processing",l:"Processing"},{k:"calculated",l:"Calculated"},{k:"failed",l:"Failed"}] },
    business_unit:    { options: (window.BUSINESS_UNITS || []).map(u => ({k:u,l:u})) },
    user_assigned:    { options: (window.USERS || []).map(u => ({k:u,l:u})) },
    data_input_type:  { options: [{k:"Manual",l:"Manual"},{k:"Bulk import (CSV)",l:"Bulk import (CSV)"},{k:"Integration (ERP)",l:"Integration (ERP)"}] },
    site:             { options: [...new Set(entries.map(e=>e.site))].map(s => ({k:s,l:s})) },
    files:            { options: [{k:"has",l:"Has files"},{k:"none",l:"No files"}] },
    custom_factor:    { options: [{k:"yes",l:"Uses custom factor"},{k:"no",l:"Default factor"}] },
  };

  const filteredEntries = React.useMemo(() => {
    let r = entries;
    if (batchFilter) r = r.filter(e => e.batchId === batchFilter);
    if (period && period !== "all") r = r.filter(e => window.inPeriod(e, period));
    if (bu !== "all") r = r.filter(e => e.business_unit === bu);
    if (cat !== "all") r = r.filter(e => e.category === cat);
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
    // Per-column filters
    Object.entries(colFilters).forEach(([k, val]) => {
      if (!val) return;
      if (k === "files") {
        r = r.filter(e => val === "has" ? (e.files_count > 0) : (e.files_count === 0));
        return;
      }
      if (k === "custom_factor") {
        r = r.filter(e => val === "yes" ? (e.custom_factor && e.custom_factor !== "—") : (!e.custom_factor || e.custom_factor === "—"));
        return;
      }
      const cfg = entryFilterConfig[k];
      if (cfg?.options) {
        r = r.filter(e => String(entryGet(e, k)) === String(val));
      } else {
        const q = String(val).toLowerCase();
        r = r.filter(e => String(entryGet(e, k) ?? "").toLowerCase().includes(q));
      }
    });
    if (sort) {
      r = [...r].sort((a, b) => cmpBy(a, b, (x) => entryGet(x, sort.key), sort.dir));
    }
    return r;
  }, [entries, query, bu, cat, batchFilter, colFilters, sort, calcs, period]);

  // Selection state
  const [selected, setSelected] = React.useState(() => new Set());
  React.useEffect(() => {
    // Drop any stale selections that are no longer visible or no longer exist
    const ids = new Set(entries.map(e => e.id));
    setSelected(prev => new Set([...prev].filter(id => ids.has(id))));
  }, [entries]);
  const visibleIds = filteredEntries.map(e => e.id);
  const visSel = visibleIds.filter(id => selected.has(id));
  const allVisSelected = visibleIds.length > 0 && visSel.length === visibleIds.length;
  const someVisSelected = visSel.length > 0 && !allVisSelected;
  const toggleOne = (id) => setSelected(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAllVisible = () => setSelected(s => {
    const n = new Set(s);
    if (allVisSelected) visibleIds.forEach(id => n.delete(id));
    else visibleIds.forEach(id => n.add(id));
    return n;
  });
  const clearSel = () => setSelected(new Set());

  // Resolve a batch to a display label
  const batchLabel = (e) => {
    const b = (window.BATCHES || []).find(x => x.id === e.batchId);
    if (!b) return null;
    if (b.source === "csv") return { id: b.id, label: b.fileName || b.id, icon: "upload" };
    if (b.source === "erp") return { id: b.id, label: b.id + " · ERP", icon: "check" };
    return { id: b.id, label: "Manual entry", icon: "collect" };
  };

  // j/k/Esc
  const selectedIndex = filteredEntries.findIndex(e => e.id === selectedId);
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "Escape" && selectedId) { setSelectedId(null); e.preventDefault(); }
      if (e.key === "j" || e.key === "ArrowDown") {
        const idx = selectedIndex < 0 ? 0 : Math.min(filteredEntries.length - 1, selectedIndex + 1);
        setSelectedId(filteredEntries[idx]?.id ?? null); e.preventDefault();
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        const idx = selectedIndex <= 0 ? 0 : selectedIndex - 1;
        setSelectedId(filteredEntries[idx]?.id ?? null); e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selectedIndex, filteredEntries, setSelectedId]);

  React.useEffect(() => {
    if (!selectedId) return;
    const el = document.querySelector(`[data-entry-id="${selectedId}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      const inView = rect.top > 120 && rect.bottom < window.innerHeight - 40;
      if (!inView) el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedId]);

  const actions = (
    <div className="page-actions" style={embedded ? {gap:8} : undefined}>
      <div className="col-menu-wrap">
        <button className="btn secondary small" onClick={() => setColMenu(v => !v)}>
          <Icon name="filter" size={16}/>Columns <span style={{color:"var(--fe-fg-muted)"}}>{visible.length}/{ENTRY_COLUMNS.length}</span>
        </button>
        {colMenu && (
          <>
            <div style={{position:"fixed", inset:0, zIndex:20}} onClick={() => setColMenu(false)}/>
            <div className="col-menu">
              <div className="head">
                <span>Show columns</span>
                <span><a onClick={() => setVisible(ENTRY_COLUMNS.map(c=>c.k))}>Show all</a> · <a onClick={() => setVisible([])}>Hide all</a></span>
              </div>
              {ENTRY_COLUMNS.map(col => (
                <label key={col.k}>
                  <input type="checkbox" checked={isVisible(col.k)} onChange={() => toggleCol(col.k)} />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
      <button className="btn secondary small"><Icon name="upload" size={16}/>Import</button>
      <button className="btn primary small"><Icon name="plus" size={16}/>Data</button>
    </div>
  );

  return (
    <>
      {!embedded && (
        <div className="page-head">
          <div>
            <h1 className="page-title">Activity data</h1>
            <div className="page-subtitle">Every activity input behind your calculations · {entries.length} records in Q1 2026</div>
          </div>
          {actions}
        </div>
      )}
      {embedded && headerPortal && ReactDOM.createPortal(actions, headerPortal)}

      {selected.size > 0 ? (
        <BulkToolbar
          count={selected.size}
          kind="entries"
          onClear={clearSel}
          onStatus={(s) => { bulk?.status([...selected], s); }}
          onAssign={(u) => { bulk?.assign([...selected], u); }}
          onCategory={() => bulk?.export([...selected]) /* placeholder - would open picker */}
          onExport={() => bulk?.export([...selected])}
          onDelete={() => {
            if (confirm(`Delete ${selected.size} entries and their calculations?`)) {
              bulk?.delete([...selected]);
              clearSel();
            }
          }}
        />
      ) : (
      <div className="filter-bar">
        {batchFilter && (
          <FilterPill
            icon="upload"
            label="Batch"
            value={batchFilter}
            options={[{k: batchFilter, l: batchFilter}]}
            onChange={() => {}}
            onClear={() => onClearBatchFilter?.()}
          />
        )}
        <span className="filter active">All <span style={{color:"var(--fe-fg-muted)"}}>{filteredEntries.length}</span></span>

        {/* Status — combined into a single filter pill (parity with Calculations).
            Reads/writes colFilters.status so it stacks naturally with the rest. */}
        {(() => {
          const statusOpts = entryFilterConfig.status?.options || [];
          // Counts AFTER non-status filters, so the popover shows contextual values.
          // Cheap to compute against entries since the page volume is small.
          const baseForCount = entries.filter(e => {
            if (batchFilter && e.batchId !== batchFilter) return false;
            if (cat !== "all" && e.category !== cat) return false;
            if (bu !== "all" && e.business_unit !== bu) return false;
            return true;
          });
          const counts = {};
          for (const o of statusOpts) counts[o.k] = baseForCount.filter(e => e.entry_status === o.k).length;
          const current = colFilters.status;
          return (
            <FilterPill
              icon="filter"
              label="Status"
              value={current || null}
              options={statusOpts.map(o => ({k: o.k, l: `${o.l} (${counts[o.k] || 0})`}))}
              onChange={(v) => setColFilter("status", v)}
              onClear={() => setColFilter("status", null)}
              renderValue={(v) => {
                const opt = statusOpts.find(o => o.k === v);
                return <>{opt?.l || v} <span style={{opacity:0.65, marginLeft:2}}>({counts[v] || 0})</span></>;
              }}
            />
          );
        })()}

        {/* Category */}
        <FilterPill
          icon="filter"
          label="Category"
          value={cat !== "all" ? cat : null}
          options={[
            {k:"electricity",l:"Electricity"},
            {k:"natural_gas",l:"Natural gas"},
            {k:"diesel",l:"Diesel / fleet"},
            {k:"flight",l:"Flight"},
            {k:"purchased_goods",l:"Purchased goods"},
          ]}
          onChange={(v) => setCat(v)}
          onClear={() => setCat("all")}
        />

        {/* Business unit */}
        <FilterPill
          icon="users"
          label="Business unit"
          value={bu !== "all" ? bu : null}
          options={(window.BUSINESS_UNITS || []).map(u => ({k:u, l:u}))}
          onChange={(v) => setBu(v)}
          onClear={() => setBu("all")}
        />

        {/* Reporting period */}
        <FilterPill
          icon="calendar"
          label="Period"
          value={period}
          options={window.PERIOD_OPTIONS}
          onChange={(v) => setPeriod(v)}
          onClear={() => setPeriod("q1_2026")}
        />

        {/* Per-column filters as pills (excludes status — surfaced above as a primary pill) */}
        {Object.entries(colFilters).filter(([k]) => k !== "status").map(([k, val]) => {
          const col = ENTRY_COLUMNS.find(c => c.k === k);
          if (!col) return null;
          const cfg = entryFilterConfig[k];
          return (
            <FilterPill
              key={k}
              icon="filter"
              label={col.label}
              value={val}
              options={cfg?.options}
              onChange={(v) => setColFilter(k, v)}
              onClear={() => setColFilter(k, null)}
            />
          );
        })}

        {/* + Filter */}
        <AddFilterButton
          facets={ENTRY_COLUMNS
            .filter(c => entryFilterConfig[c.k]?.options && !colFilters[c.k] && c.k !== "business_unit" && c.k !== "status")
            .map(c => ({k: c.k, label: c.label, icon: "filter"}))}
          onAdd={(k) => {
            const first = entryFilterConfig[k]?.options?.[0]?.k;
            if (first) setColFilter(k, first);
          }}
        />

        {/* Clear-all */}
        {(() => {
          const activeCount = (cat !== "all" ? 1 : 0) + (bu !== "all" ? 1 : 0) + (batchFilter ? 1 : 0) + Object.keys(colFilters).length;
          if (activeCount < 2) return null;
          return (
            <button className="filter-clear-all" onClick={() => {
              setCat("all"); setBu("all"); setColFilters({});
              if (batchFilter && onClearBatchFilter) onClearBatchFilter();
            }}>Clear all {activeCount}</button>
          );
        })()}

        <span className="filter-search">
          <Icon name="search" size={14} style={{color:"var(--fe-fg-muted)"}}/>
          <input placeholder="Search ID, summary, site…" value={query} onChange={e => setQuery(e.target.value)}/>
        </span>
        <span style={{marginLeft:"auto", fontSize:12, color:"var(--fe-fg-muted)"}}>
          Showing {filteredEntries.length} of {entries.length}
        </span>
      </div>
      )}

      <div className="card" style={{padding:0, overflow:"hidden"}}>
        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th className="cb-cell">
                <HeaderCheckbox
                  checked={allVisSelected}
                  indeterminate={someVisSelected}
                  onChange={toggleAllVisible}
                />
              </th>
              {ENTRY_COLUMNS.filter(c => isVisible(c.k)).map((col, i) => {
                const align = (col.k === "emission" || col.k === "calcs_count") ? "right" : "left";
                const cfg = entryFilterConfig[col.k];
                return (
                  <th key={col.k} style={{ width: col.w, minWidth: col.w, textAlign: align }}>
                    <SortableHeader
                      label={col.label}
                      colKey={col.k}
                      align={align}
                      sort={sort}
                      onSort={handleSort}
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
            {filteredEntries.map(e => {
              const r = rollupFor(e.id);
              const isSel = selected.has(e.id);
              return (
                <tr key={e.id}
                    data-entry-id={e.id}
                    className={`${selectedId === e.id ? "selected" : ""} ${isSel ? "sel" : ""}`.trim()}
                    onClick={(ev) => {
                      if (ev.target.closest(".cb-cell") || ev.target.closest(".src-link")) return;
                      setSelectedId(e.id);
                    }}>
                  <td className="cb-cell" onClick={(ev) => ev.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="fe-cb"
                      checked={isSel}
                      onChange={() => toggleOne(e.id)}
                    />
                  </td>
                  {ENTRY_COLUMNS.filter(col => isVisible(col.k)).map((col) => {
                    switch (col.k) {
                      case "id":
                        return <td key={col.k} style={{fontFamily:"var(--fe-font-mono)", fontSize:12, color:"var(--fe-fg-strong)"}}>{e.id}</td>;
                      case "status":
                        return <td key={col.k}>
                          <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-start"}}>
                            <StatusChip status={e.entry_status}/>
                            {r.count > 0 && (
                              <span className="rollup">
                                {r.pending > 0   && <span className="pill r" title="Pending AI match">{r.pending}</span>}
                                {r.suggested > 0 && <span className="pill s" title="Suggested — awaiting confirmation">{r.suggested}</span>}
                                {r.confirmed > 0 && <span className="pill v" title="Confirmed">{r.confirmed}</span>}
                              </span>
                            )}
                          </div>
                        </td>;
                      case "business_unit":
                        return <td key={col.k} style={{color:"var(--fe-fg-strong)", fontWeight:500}}>{e.business_unit}</td>;
                      case "business_activity":
                        return <td key={col.k}>
                          <div style={{color:"var(--fe-fg-strong)", fontWeight:500}}>{e.business_activity}</div>
                          <div style={{fontSize:11, color:"var(--fe-fg-muted)", marginTop:1}}><CatLabel cat={e.category}/></div>
                        </td>;
                      case "user_assigned":
                        return <td key={col.k}>{e.user_assigned}</td>;
                      case "start_date":
                        return <td key={col.k} style={{color:"var(--fe-fg-muted)"}}>{e.start_date}</td>;
                      case "end_date":
                        return <td key={col.k} style={{color:"var(--fe-fg-muted)"}}>{e.end_date}</td>;
                      case "data_input_type":
                        return <td key={col.k}>
                          <span className="chip"><span className="dot"></span>{e.data_input_type}</span>
                        </td>;
                      case "site":
                        return <td key={col.k} style={{color:"var(--fe-fg-strong)", fontWeight:500}}>{e.site}</td>;
                      case "consumption":
                        return <td key={col.k}>
                          <div style={{color:"var(--fe-fg-strong)", fontWeight:500}}>{e.summary}</div>
                          <div style={{fontSize:11, color:"var(--fe-fg-muted)", marginTop:1}}>{e.site}</div>
                        </td>;
                      case "factor":
                        return <td key={col.k} className="wrap" style={{fontSize:12}}>
                          <div style={{color:"var(--fe-fg-strong)", fontWeight:500, whiteSpace:"normal"}}>
                            {r.uniqFactors[0] || "—"}
                            {r.uniqFactors.length > 1 && <span style={{color:"var(--fe-fg-muted)", fontWeight:500}}> +{r.uniqFactors.length - 1}</span>}
                          </div>
                        </td>;
                      case "emission":
                        return <td key={col.k} style={{textAlign:"right", fontWeight:500, color:"var(--fe-fg-strong)"}} className="num">
                          {(r.total/1000).toLocaleString(undefined, {maximumFractionDigits: r.total<100 ? 3 : 2})} <span style={{fontSize:11, color:"var(--fe-fg-muted)", fontWeight:500}}>tCO₂e</span>
                        </td>;
                      case "calcs_count":
                        return <td key={col.k} style={{textAlign:"right"}} className="num">{r.count}</td>;
                      case "source_import": {
                        const b = batchLabel(e);
                        if (!b) return <td key={col.k}><span style={{color:"var(--fe-fg-subtle)"}}>—</span></td>;
                        return <td key={col.k}>
                          <span
                            className="src-link"
                            onClick={(ev) => { ev.stopPropagation(); onViewImport?.(b.id); }}
                            title={`Open bulk import ${b.id}`}>
                            <Icon name={b.icon} size={14}/>{b.label}
                          </span>
                        </td>;
                      }
                      case "notes":
                        return <td key={col.k} className="wrap" style={{color: e.notes ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)", fontSize:12, whiteSpace:"normal"}}>{e.notes || "—"}</td>;
                      case "created_on":
                        return <td key={col.k} style={{color:"var(--fe-fg-muted)"}}>{e.created_on}</td>;
                      case "last_updated":
                        return <td key={col.k} style={{color:"var(--fe-fg-muted)"}}>{e.last_updated}</td>;
                      case "files":
                        return <td key={col.k}>
                          {e.files_count > 0
                            ? <span style={{display:"inline-flex", alignItems:"center", gap:4}}><Icon name="upload" size={14} style={{color:"var(--fe-fg-muted)"}}/>{e.files_count}</span>
                            : <span style={{color:"var(--fe-fg-subtle)"}}>—</span>}
                        </td>;
                      case "bulk_import_ref":
                        return <td key={col.k} style={{fontSize:12}}>{e.bulk_import_ref}</td>;
                      case "custom_factor":
                        return <td key={col.k} style={{fontSize:12, color: e.custom_factor === "—" ? "var(--fe-fg-subtle)" : "var(--fe-fg-default)"}}>{e.custom_factor}</td>;
                      default: return <td key={col.k}/>;
                    }
                  })}
                </tr>
              );
            })}
            {filteredEntries.length === 0 && (
              <tr><td colSpan={(visible.length || 0) + 1}><div className="empty">No entries match these filters.</div></td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}

// Category-specific detail rendering
function CategoryFields({ entry }) {
  const d = entry.details;
  const rows = [];
  if (entry.category === "electricity") {
    rows.push(["Consumption", `${d.kWh.toLocaleString()} kWh`]);
    rows.push(["Grid region", d.grid_region]);
    rows.push(["Supplier", d.supplier]);
    rows.push(["Meter ID", d.meter_id]);
    if (d.tariff) rows.push(["Tariff", d.tariff]);
    if (d.renewable_share) rows.push(["Renewable share", d.renewable_share]);
  } else if (entry.category === "natural_gas") {
    rows.push(["Consumption", `${d.kWh.toLocaleString()} kWh`]);
    rows.push(["Supplier", d.supplier]);
    rows.push(["Meter ID", d.meter_id]);
    rows.push(["Calorific value", d.cv]);
    if (d.end_use) rows.push(["End use", d.end_use]);
  } else if (entry.category === "diesel") {
    rows.push(["Volume", `${d.liters.toLocaleString()} L`]);
    if (d.vehicle_count) rows.push(["Vehicles", `${d.vehicle_count}`]);
    if (d.avg_mpg) rows.push(["Avg. consumption", `${d.avg_mpg} mpg`]);
    if (d.equipment) rows.push(["Equipment", d.equipment]);
    rows.push(["Card issuer", d.card_issuer]);
    if (d.fuel_grade) rows.push(["Fuel grade", d.fuel_grade]);
  } else if (entry.category === "flight") {
    rows.push(["Origin", d.origin]);
    rows.push(["Destination", d.destination]);
    rows.push(["Class", d.class]);
    rows.push(["Passengers", `${d.pax}`]);
    rows.push(["Distance", `${d.distance_km.toLocaleString()} km`]);
    if (d.traveller) rows.push(["Traveller(s)", d.traveller]);
    if (d.ticket) rows.push(["Itinerary", d.ticket]);
  } else if (entry.category === "purchased_goods") {
    rows.push(["Supplier", d.supplier]);
    rows.push(["Spend", `€${d.spend_eur.toLocaleString()}`]);
    if (d.mass_kg) rows.push(["Mass", `${d.mass_kg.toLocaleString()} kg`]);
    if (d.sku_count) rows.push(["Line items", `${d.sku_count}`]);
    rows.push(["Category code", d.category_code]);
  }
  return (
    <div className="d-grid">
      {rows.map(([k,v]) => (
        <React.Fragment key={k}><div className="k">{k}</div><div className="v">{v}</div></React.Fragment>
      ))}
    </div>
  );
}

function EntryDrawer({ entry, calcs, batches, onClose, onNav, onViewCalc, onViewImport }) {
  if (!entry) return null;
  const mine = calcs.filter(c => c.entryId === entry.id);
  const batch = batches.find(b => b.id === entry.batchId);
  const total = mine.reduce((s,c) => s + c.kgCO2e, 0);
  const needs = mine.filter(c => c.status === "pending" || c.status === "suggested").length;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}/>
      <aside className="drawer" role="dialog" aria-label="Entry detail">
        <div className="drawer-head">
          <div style={{flex:1, minWidth:0}}>
            <div className="kicker">Activity · {entry.id}</div>
            <h2><CatLabel cat={entry.category}/> — {entry.site}</h2>
            <div style={{display:"flex", gap:8, alignItems:"center", marginTop:10, flexWrap:"wrap"}}>
              <span className="chip"><span className="dot"></span>{entry.date}</span>
              <span className="chip neutral"><span className="dot"></span>{batch?.source === "manual" ? "Manual" : batch?.source === "csv" ? "CSV upload" : "ERP sync"} · {batch?.id}</span>
              {needs > 0 && <span className="chip alert"><span className="dot"></span>{needs} calc{needs>1?"s":""} need review</span>}
            </div>
          </div>
          <button className="btn-close" onClick={onClose} title="Close (Esc)"><Icon name="close" size={18}/></button>
        </div>

        <div className="drawer-body">
          {(entry.entry_status === "draft" || entry.entry_status === "ready") ? (
            <div className="d-section">
              <div className={`precalc-hero ${entry.entry_status}`}>
                <div className="ph-icon">
                  <Icon name={entry.entry_status === "draft" ? "pencil" : "check"} size={22}/>
                </div>
                <div className="ph-body">
                  <div className="ph-title">
                    {entry.entry_status === "draft" ? "Draft — not ready to calculate" : "Ready to send for calculation"}
                  </div>
                  <div className="ph-subtitle">{entry.summary}</div>
                  {entry.entry_status === "draft" && entry.missing_fields?.length > 0 && (
                    <div className="ph-missing">
                      <div className="ph-missing-label">Missing required fields</div>
                      <ul>
                        {entry.missing_fields.map(f => (
                          <li key={f}><Icon name="warn" size={12}/>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {entry.entry_status === "ready" && (
                    <div className="ph-ready-note">
                      <Icon name="info" size={13}/>
                      All required fields validated. Sending will run AI factor matching and create one or more calculation rows.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="d-section">
              <div className="big-number">
                <span className="n">{(total/1000).toLocaleString(undefined, {maximumFractionDigits: total<100 ? 3 : 2})}</span>
                <span className="u">tCO₂e total from {mine.length} calculation{mine.length>1?"s":""}</span>
              </div>
              <div style={{fontSize:13, color:"var(--fe-fg-muted)", marginTop:4}}>{entry.summary}</div>
            </div>
          )}

          <div className="d-section">
            <div className="d-section-head">Entry details</div>
            <div className="d-grid">
              <div className="k">ID</div>
              <div className="v" style={{fontFamily:"var(--fe-font-mono)", fontSize:12}}>{entry.id}</div>

              <div className="k">Status</div>
              <div className="v"><StatusChip status={entry.entry_status}/></div>

              <div className="k">Business unit</div>
              <div className="v">{entry.business_unit}</div>

              <div className="k">Business activity</div>
              <div className="v">
                {entry.business_activity}
                <div style={{fontSize:11, color:"var(--fe-fg-muted)", marginTop:2}}><CatLabel cat={entry.category}/></div>
              </div>

              <div className="k">User assigned</div>
              <div className="v">{entry.user_assigned}</div>

              <div className="k">Period</div>
              <div className="v">{entry.start_date} → {entry.end_date}</div>

              <div className="k">Data input type</div>
              <div className="v"><span className="chip"><span className="dot"></span>{entry.data_input_type}</span></div>

              <div className="k">Site</div>
              <div className="v">{entry.site}</div>

              <div className="k">Consumption</div>
              <div className="v">{entry.summary}</div>

              <div className="k">Emission factor</div>
              <div className="v">{mine[0]?.factor?.name || "—"}{mine.length > 1 && <span style={{color:"var(--fe-fg-muted)"}}> +{mine.length - 1} more</span>}</div>

              <div className="k">Emissions</div>
              <div className="v">
                {mine.length > 0
                  ? <>{(total/1000).toLocaleString(undefined, {maximumFractionDigits: total<100 ? 3 : 2})} <span style={{color:"var(--fe-fg-muted)"}}>tCO₂e</span></>
                  : <span style={{color:"var(--fe-fg-subtle)"}}>—</span>}
              </div>

              <div className="k">GHG calculations</div>
              <div className="v">{mine.length}</div>

              <div className="k">Source import</div>
              <div className="v">
                {batch ? (
                  <span className="link" onClick={() => onViewImport?.(batch.id)} title={`Open bulk import ${batch.id}`}>
                    <Icon name={batch.source === "csv" ? "upload" : batch.source === "erp" ? "check" : "collect"} size={12}/>
                    {batch.label}
                    <Icon name="arrowRight" size={12}/>
                  </span>
                ) : "—"}
              </div>

              <div className="k">Created on</div>
              <div className="v" style={{color:"var(--fe-fg-muted)"}}>{entry.created_on}</div>

              <div className="k">Last updated</div>
              <div className="v" style={{color:"var(--fe-fg-muted)"}}>{entry.last_updated}</div>

              <div className="k">Files</div>
              <div className="v">
                {entry.files_count > 0
                  ? <span style={{display:"inline-flex", alignItems:"center", gap:4}}><Icon name="upload" size={13}/>{entry.files_count} attachment{entry.files_count>1?"s":""}</span>
                  : <span style={{color:"var(--fe-fg-subtle)"}}>—</span>}
              </div>

              <div className="k">Bulk import file</div>
              <div className="v" style={{fontSize:12}}>{entry.bulk_import_ref}</div>

              <div className="k">Custom emission factor</div>
              <div className="v" style={{color: entry.custom_factor === "—" ? "var(--fe-fg-subtle)" : "var(--fe-fg-default)"}}>{entry.custom_factor}</div>

              <div className="k">Notes</div>
              <div className="v" style={{color: entry.notes ? "var(--fe-fg-default)" : "var(--fe-fg-subtle)"}}>{entry.notes || "—"}</div>
            </div>
          </div>

          <div className="d-section">
            <div className="d-section-head">Activity data</div>
            <CategoryFields entry={entry}/>
          </div>

          {entry.extra_meta && (
            <div className="d-section">
              <div className="d-section-head">
                Additional info from bulk import
                <span className="d-section-sub">Optional columns captured from <b>{entry.bulk_import_ref}</b></span>
              </div>
              <div className="d-grid">
                {Object.entries(entry.extra_meta).map(([k, v]) => (
                  <React.Fragment key={k}><div className="k">{k}</div><div className="v">{v}</div></React.Fragment>
                ))}
              </div>
            </div>
          )}

          {mine.length > 0 ? (
            <div className="d-section">
              <div className="d-section-head">Calculations from this entry ({mine.length})</div>
              <div className="sibling-list">
                {mine.map(c => (
                  <div key={c.id} className="sibling-row" onClick={() => onViewCalc(c.id)}>
                    <ScopeBadge scope={c.scope}/>
                    <div>
                      <div className="label">{c.activity}</div>
                      <div className="sub">{c.gas} · {c.factor.name} · {c.factor.source}</div>
                    </div>
                    <div className="kg num">{fmtKgSmart(c.kgCO2e)} <span style={{fontSize:11, color:"var(--fe-fg-muted)", fontWeight:500}}>kg</span></div>
                    <StatusChip status={c.status}/>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="d-section">
              <div className="d-section-head">Calculations</div>
              <div className="nocalc-note">
                <Icon name="info" size={14}/>
                No calculations yet. {entry.entry_status === "draft" ? "Complete required fields first to enable submission." : "Submit to run AI factor matching."}
              </div>
            </div>
          )}
        </div>

        <div className="drawer-foot">
          <EntryActions entry={entry}/>
          <div className="spacer"/>
          <span className="drawer-nav-hint">
            <span className="kbd">J</span><span className="kbd">K</span> navigate
            <span style={{margin:"0 4px"}}>·</span>
            <span className="kbd">Esc</span> close
          </span>
          <button className="btn secondary small" onClick={() => onNav(-1)}><Icon name="chev" size={14} style={{transform:"rotate(180deg)"}}/></button>
          <button className="btn secondary small" onClick={() => onNav(1)}><Icon name="chev" size={14}/></button>
        </div>
      </aside>
    </>
  );
}

// --- Drawer CTAs keyed off entry state --------------------------------------
// Spec:
//   Draft      → Primary: Save            Secondary: Discard changes
//   Ready      → Primary: Submit          Secondary: —
//   Processing → Spinner (+ optional Cancel → back to ready)
//   Calculated → Primary: Update (warns)  Secondary: —
//   Failed     → Primary: Retry           Secondary: Delete
// Menu (⋯): Duplicate, Delete, contextual warnings.
function EntryActions({ entry }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const s = entry.entry_status;

  const Menu = (items) => (
    <div className="entry-actions-menu-wrap">
      <button className="btn ghost small" onClick={() => setMenuOpen(v => !v)} aria-label="More actions">
        <Icon name="dots" size={16}/>
      </button>
      {menuOpen && (
        <>
          <div className="entry-actions-overlay" onClick={() => setMenuOpen(false)}/>
          <div className="entry-actions-menu">
            {items.map((it, i) => it === "sep" ? (
              <div key={i} className="entry-actions-sep"/>
            ) : (
              <button key={i} className={`entry-actions-item ${it.danger ? "danger" : ""}`} onClick={() => { setMenuOpen(false); it.onClick?.(); }}>
                <Icon name={it.icon} size={14}/> {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  if (s === "draft") {
    return <>
      <button className="btn ghost small">Discard changes</button>
      <button className="btn primary small"><Icon name="check" size={14}/>Save</button>
      {Menu([
        { icon: "plus",  label: "Duplicate" },
        { icon: "close", label: "Delete", danger: true },
      ])}
    </>;
  }
  if (s === "ready") {
    return <>
      <button className="btn secondary small"><Icon name="pencil" size={14}/>Edit</button>
      <button className="btn primary small"><Icon name="sparkle" size={14}/>Submit</button>
      {Menu([
        { icon: "plus",  label: "Duplicate" },
        { icon: "close", label: "Delete", danger: true },
      ])}
    </>;
  }
  if (s === "processing") {
    return <>
      <div className="entry-processing">
        <span className="entry-spinner" aria-hidden/>
        <span>Matching factors…</span>
      </div>
      <button className="btn ghost small" title="Cancel and return to Ready">Cancel</button>
      {Menu([
        { icon: "close", label: "Delete", danger: true },
      ])}
    </>;
  }
  if (s === "failed") {
    return <>
      <button className="btn ghost small"><Icon name="close" size={14}/>Delete</button>
      <button className="btn primary small"><Icon name="refresh" size={14}/>Retry</button>
    </>;
  }
  // calculated (default)
  return <>
    <button className="btn primary small" title="Updating this entry will delete its calculation"><Icon name="pencil" size={14}/>Update</button>
    {Menu([
      { icon: "plus",  label: "Duplicate (no calculation carried over)" },
      "sep",
      { icon: "close", label: "Delete (warns if closed period)", danger: true },
    ])}
  </>;
}

Object.assign(window, { DataEntries, EntryDrawer });
