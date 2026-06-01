// Trends — third Analyse sub-page.
// Focuses on hotspot analytics, top contributors, and YoY changes.
// AI chat and AI insights now live on the Home page; Trends pages display
// any AI insights the user has pinned to this board at the top.

// Board actions menu — kebab (...) next to a board title that consolidates
// Edit layout / Rename / Export / Delete into a single dropdown.
//
// `editLayoutActive` + `onToggleEditLayout` make the menu's "Edit layout"
// item a toggle (with a checkmark when active). Other actions fire callbacks
// or fall through to a "not implemented in this prototype" toast.
function BoardActionsMenu({
  editLayoutActive,
  onToggleEditLayout,
  onRename,
  onExport,
  onDelete,
  canDelete = false,
  canRename = false,
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const stub = (label) => () => {
    window.dispatchEvent(new CustomEvent("fe-toast", {
      detail: `${label} — not built in this prototype`,
    }));
    setOpen(false);
  };

  const Item = ({ icon, label, onClick, active, danger, disabled, hint }) => (
    <button
      type="button"
      className={"board-actions__item"
        + (active ? " is-active" : "")
        + (danger ? " is-danger" : "")
        + (disabled ? " is-disabled" : "")}
      onClick={() => { if (disabled) return; onClick(); }}
      title={hint || undefined}
    >
      <Icon name={icon} size={14}/>
      <span className="board-actions__item-label">{label}</span>
      {active && <Icon name="check" size={14}/>}
    </button>
  );

  return (
    <div className="board-actions" ref={ref}>
      <button
        type="button"
        className={"board-actions__trigger" + (open ? " is-open" : "")}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Board actions"
      >
        <Icon name="dots" size={16}/>
      </button>
      {open && (
        <div className="board-actions__menu" role="menu">
          <Item
            icon="pencil"
            label="Edit layout"
            onClick={() => { onToggleEditLayout(); setOpen(false); }}
            active={editLayoutActive}
          />
          <Item
            icon="pencil"
            label="Rename board"
            onClick={onRename ? () => { onRename(); setOpen(false); } : stub("Rename")}
            disabled={!canRename}
            hint={!canRename ? "Built-in boards can't be renamed" : undefined}
          />
          <Item
            icon="download"
            label="Export board"
            onClick={onExport ? () => { onExport(); setOpen(false); } : stub("Export")}
          />
          <div className="board-actions__sep" />
          <Item
            icon="trash"
            label="Delete board"
            onClick={onDelete ? () => { onDelete(); setOpen(false); } : stub("Delete")}
            danger
            disabled={!canDelete}
            hint={!canDelete ? "Built-in boards can't be deleted" : undefined}
          />
        </div>
      )}
    </div>
  );
}

function Trends({ calcs, entries, onJumpTo }) {
  const [editLayout, setEditLayout] = React.useState(false);
  const [hm12Open, setHm12Open] = React.useState(() => localStorage.getItem("fe-tr-hm12-open") !== "0");
  const [hm3Open,  setHm3Open]  = React.useState(() => localStorage.getItem("fe-tr-hm3-open") !== "0");
  const totalKg = calcs.reduce((s,c) => s + c.kgCO2e, 0);

  // Top contributors helpers
  const topN = (keyFn, n=8, labelFn=null) => {
    const m = {};
    const labels = {};
    calcs.forEach(c => {
      const k = keyFn(c); if (!k) return;
      m[k] = (m[k]||0) + c.kgCO2e;
      if (labelFn) labels[k] = labelFn(c) || k;
    });
    const arr = Object.entries(m).sort((a,b) => b[1]-a[1]);
    return arr.slice(0, n).map(([k, v]) => ({
      k, label: labelFn ? (labels[k] || k) : k, kg: v, pct: v/totalKg
    }));
  };

  const CAT_LABELS = {
    electricity: "Electricity",
    natural_gas: "Natural gas",
    diesel: "Diesel / fleet",
    flight: "Business travel — air",
    purchased_goods: "Purchased goods",
  };

  const topCategories = topN(c => c.category, 6, c => CAT_LABELS[c.category]);
  const topSites = topN(c => c.site && c.site !== "—" ? c.site : null, 6);
  const topByEntry = (() => {
    const byEntry = {};
    calcs.forEach(c => { byEntry[c.entryId] = (byEntry[c.entryId]||0) + c.kgCO2e; });
    return Object.entries(byEntry)
      .sort((a,b) => b[1]-a[1]).slice(0, 5)
      .map(([eid, kg]) => {
        const e = entries.find(x => x.id === eid);
        return { id: eid, summary: e?.summary || eid, kg, pct: kg/totalKg, category: e?.category };
      });
  })();

  // Top 5 helpers
  const topNPct = (keyFn, n=5) => {
    const m = {};
    calcs.forEach(c => { const k = keyFn(c); if (!k) return; m[k] = (m[k]||0) + c.kgCO2e; });
    const arr = Object.entries(m).sort((a,b) => b[1]-a[1]);
    const tot = arr.reduce((s,[,v]) => s+v, 0) || 1;
    return arr.slice(0, n).map(([k, v]) => ({ k, v, pct: v/tot }));
  };
  const topSuppliers = topNPct(c => c.business_activity);
  const topMaterials = topNPct(c => c.category);
  const topLocations = topNPct(c => c.business_unit);

  // 12-month mock trend series for the trend chart
  const monthLabels = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
  const trendData = {
    scope1: [12, 14, 13, 11, 10, 12, 15, 17, 19, 22, 20, 18],
    scope2: [22, 24, 23, 21, 19, 18, 20, 22, 26, 28, 26, 24],
    scope3: [48, 54, 52, 46, 40, 44, 52, 60, 74, 88, 84, 78],
  };

  // AI insights catalog — same data Home builds, so any insight pinned to
  // Trends from Home can be re-rendered here.
  const allInsights = (window.buildHomeInsights
    ? window.buildHomeInsights({ calcs, entries, total: totalKg,
        byScope: [1,2,3].map(s => ({
          scope: s,
          kg: calcs.filter(c => c.scope === s).reduce((a, c) => a + c.kgCO2e, 0),
          color: s === 1 ? "#F35151" : s === 2 ? "#AD6EFF" : "#00BBA7",
        })),
        onJumpTo })
    : []);

  return (
    <>
      <div className="page-head">
        <div className="page-head__main">
          <div className="page-head__titlerow">
            <h1 className="page-title">Trends</h1>
            <BoardActionsMenu
              editLayoutActive={editLayout}
              onToggleEditLayout={() => setEditLayout(v => !v)}
            />
          </div>
          <div className="page-subtitle">Hotspots, top contributors, period comparison</div>
        </div>
      </div>

      <BoardFilters boardKey="trends" />

      <PinnedBoardInsights
        boardKey="trends"
        boardLabel="Trends"
        allInsights={allInsights}
        onJumpHome={() => onJumpTo("overview")}
      />

      <PageSections pageKey="trends" editMode={editLayout}>

      <PageSection id="trend-chart" label="12-month emissions trend">
      {/* Trend chart */}
      <div className="card" style={{marginBottom: 24}}>
        <div className="card-head">
          <div>
            <h3 className="card-title">Emissions trend · 12 months</h3>
            <div className="card-sub">Stacked by scope · tCO₂e per month</div>
          </div>
        </div>
        <TrendStackChart labels={monthLabels} series={trendData}/>
        <div className="trend-legend">
          <div className="trend-legend-item"><span className="swatch" style={{background:"#F35151"}}/>Scope 1</div>
          <div className="trend-legend-item"><span className="swatch" style={{background:"#AD6EFF"}}/>Scope 2</div>
          <div className="trend-legend-item"><span className="swatch" style={{background:"#5A4DFF"}}/>Scope 3</div>
        </div>
      </div>
      </PageSection>

      <PageSection id="hotspots" label="Top categories & sites">
      {/* Hotspot breakdowns */}
      <div className="grid-2" style={{marginBottom: 24}}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Top emitting categories</h3>
              <div className="card-sub">Where to focus first</div>
            </div>
          </div>
          <div className="hotspot-list">
            {topCategories.map(c => (
              <div key={c.k} className={"hotspot-row scope-" + (c.k === "electricity" ? 2 : (c.k === "natural_gas" || c.k === "diesel" ? 1 : 3))}>
                <div className="label">{c.label}</div>
                <div className="track"><div className="fill" style={{width: (c.pct/topCategories[0].pct*100) + "%"}}/></div>
                <div className="val">{(c.kg/1000).toFixed(1)} t</div>
                <div className="pct">{Math.round(c.pct*100)}%</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Top sites</h3>
              <div className="card-sub">By Q1 2026 total emissions</div>
            </div>
          </div>
          <div className="hotspot-list">
            {topSites.map(s => (
              <div key={s.k} className="hotspot-row">
                <div className="label">{s.k}</div>
                <div className="track"><div className="fill" style={{width: (s.pct/topSites[0].pct*100) + "%"}}/></div>
                <div className="val">{(s.kg/1000).toFixed(1)} t</div>
                <div className="pct">{Math.round(s.pct*100)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </PageSection>

      <PageSection id="top-5" label="Top 5 tables">
      {/* Top 5 tables — moved from Home */}
      <div className="grid-3" style={{marginBottom: 24}}>
        {window.TopCard && (<>
          <window.TopCard title="Top 5 Suppliers" rows={topSuppliers} color="var(--fe-primary-200)"
            onDeepDive={() => onJumpTo("calcs", { deepDive: {} })}
            onRowDeepDive={(row) => onJumpTo("calcs", { deepDive: { query: row.k } })}
          />
          <window.TopCard title="Top 5 Materials" rows={topMaterials.map(r => ({...r, _raw: r.k, k: window.CAT_LABEL?.(r.k) || r.k}))} color="var(--fe-accent-primary)"
            onDeepDive={() => onJumpTo("calcs", { deepDive: {} })}
            onRowDeepDive={(row) => onJumpTo("calcs", { deepDive: { category: row._raw } })}
            showRawTooltip
          />
          <window.TopCard title="Top 5 Locations" rows={topLocations} color="#F87171"
            onDeepDive={() => onJumpTo("calcs", { deepDive: {} })}
            onRowDeepDive={(row) => onJumpTo("calcs", { deepDive: { bu: row.k } })}
          />
        </>)}
      </div>
      </PageSection>

      <PageSection id="top-entries" label="Biggest individual contributors">
      {/* Big individual contributors */}
      <div className="card" id="top-entries" style={{marginBottom: 24}}>
        <div className="card-head">
          <div>
            <h3 className="card-title">Biggest individual contributors</h3>
            <div className="card-sub">
              Top 5 line items represent <strong>{Math.round(topByEntry.reduce((s,t)=>s+t.pct,0)*100)}%</strong> of Q1 emissions
            </div>
          </div>
        </div>
        <div className="hotspot-list">
          {topByEntry.map(t => (
            <div key={t.id} className="hotspot-row" style={{gridTemplateColumns: "260px 1fr 80px 64px"}}>
              <div className="label">
                {t.summary}
                <span className="meta">{CAT_LABELS[t.category] || t.category} · {t.id}</span>
              </div>
              <div className="track"><div className="fill" style={{width: (t.pct/topByEntry[0].pct*100) + "%"}}/></div>
              <div className="val">{(t.kg/1000).toFixed(2)} t</div>
              <div className="pct">{Math.round(t.pct*100)}%</div>
            </div>
          ))}
        </div>
      </div>
      </PageSection>

      <PageSection id="heatmap-12" label="Scope 1 & 2 heatmap">
      {window.Heatmap && (
        <window.Heatmap
          title="Scope 1 & 2 Heatmap"
          subtitle="Site × month · Q1 2026 · tCO₂e"
          open={hm12Open}
          onToggle={() => { const n = !hm12Open; setHm12Open(n); localStorage.setItem("fe-tr-hm12-open", n ? "1" : "0"); }}
          onDeepDive={() => onJumpTo("calcs", { deepDive: { scope: 1 } })}
          rows={(() => {
            const monthsAll = ["2026-01", "2026-02", "2026-03"];
            const sites = Array.from(new Set(calcs.filter(c => (c.scope === 1 || c.scope === 2) && c.site && c.site !== "—").map(c => c.site)));
            return sites.map(site => ({
              label: site,
              cells: monthsAll.map(m => ({
                kg: calcs.filter(c => (c.scope === 1 || c.scope === 2) && c.site === site && (c.date || "").startsWith(m)).reduce((s, c) => s + c.kgCO2e, 0),
                key: m,
                onClick: () => onJumpTo("calcs", { deepDive: { bu: site } }),
              })),
            })).sort((a, b) => b.cells.reduce((s,c)=>s+c.kg,0) - a.cells.reduce((s,c)=>s+c.kg,0));
          })()}
          cols={[{label:"Jan"},{label:"Feb"},{label:"Mar"}]}
          accent="var(--fe-primary-600)"
        />
      )}
      </PageSection>

      <PageSection id="heatmap-3" label="Scope 3 heatmap">
      {window.Heatmap && (
        <window.Heatmap
          title="Scope 3 Heatmap"
          subtitle="Category × month · Q1 2026 · tCO₂e"
          open={hm3Open}
          onToggle={() => { const n = !hm3Open; setHm3Open(n); localStorage.setItem("fe-tr-hm3-open", n ? "1" : "0"); }}
          onDeepDive={() => onJumpTo("calcs", { deepDive: { scope: 3 } })}
          rows={(() => {
            const monthsAll = ["2026-01", "2026-02", "2026-03"];
            const cats = Array.from(new Set(calcs.filter(c => c.scope === 3).map(c => c.category)));
            return cats.map(cat => ({
              label: window.CAT_LABEL?.(cat) || cat,
              cells: monthsAll.map(m => ({
                kg: calcs.filter(c => c.scope === 3 && c.category === cat && (c.date || "").startsWith(m)).reduce((s, c) => s + c.kgCO2e, 0),
                key: m,
                onClick: () => onJumpTo("calcs", { deepDive: { category: cat } }),
              })),
            })).sort((a, b) => b.cells.reduce((s,c)=>s+c.kg,0) - a.cells.reduce((s,c)=>s+c.kg,0));
          })()}
          cols={[{label:"Jan"},{label:"Feb"},{label:"Mar"}]}
          accent="#00BBA7"
        />
      )}
      </PageSection>
      </PageSections>
    </>
  );
}


// --- Stacked trend chart (SVG) ---
function TrendStackChart({ labels, series }) {
  const W = 800, H = 240, PAD_L = 40, PAD_R = 12, PAD_T = 12, PAD_B = 28;
  const totals = labels.map((_, i) => series.scope1[i] + series.scope2[i] + series.scope3[i]);
  const yMax = Math.ceil(Math.max(...totals) / 20) * 20;
  const xStep = (W - PAD_L - PAD_R) / (labels.length - 1);
  const y = (v) => PAD_T + (1 - v/yMax) * (H - PAD_T - PAD_B);
  const x = (i) => PAD_L + i * xStep;

  const buildPath = (vals, baseline = []) => {
    let d = "";
    vals.forEach((v, i) => {
      const total = (baseline[i] || 0) + v;
      d += (i === 0 ? "M" : "L") + x(i) + "," + y(total);
    });
    for (let i = baseline.length - 1; i >= 0; i--) {
      d += "L" + x(i) + "," + y(baseline[i] || 0);
    }
    if (baseline.length === 0) {
      for (let i = vals.length - 1; i >= 0; i--) d += "L" + x(i) + "," + y(0);
    }
    d += "Z";
    return d;
  };

  const baseline1 = labels.map(() => 0);
  const baseline2 = labels.map((_, i) => series.scope1[i]);
  const baseline3 = labels.map((_, i) => series.scope1[i] + series.scope2[i]);

  // y-axis ticks
  const ticks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  return (
    <svg className="trend-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {/* gridlines */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD_L} y1={y(t)} x2={W-PAD_R} y2={y(t)} stroke="var(--fe-border-subtle, #EAEBF6)" strokeWidth="1"/>
          <text x={PAD_L - 6} y={y(t) + 4} fontSize="10" fill="var(--fe-fg-muted)" textAnchor="end">{Math.round(t)}</text>
        </g>
      ))}
      {/* stack areas */}
      <path d={buildPath(series.scope1, baseline1)} fill="#F35151" opacity="0.85"/>
      <path d={buildPath(series.scope2, baseline2)} fill="#AD6EFF" opacity="0.85"/>
      <path d={buildPath(series.scope3, baseline3)} fill="#5A4DFF" opacity="0.85"/>
      {/* x-axis labels */}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={H - 8} fontSize="10" fill="var(--fe-fg-muted)" textAnchor="middle">{l}</text>
      ))}
      {/* current period marker (last 3 = Q1 2026) */}
      <line x1={x(labels.length - 3)} y1={PAD_T} x2={x(labels.length - 3)} y2={H-PAD_B}
        stroke="var(--fe-primary-500)" strokeDasharray="4 4" strokeWidth="1.5" opacity="0.7"/>
      <text x={x(labels.length - 3) + 6} y={PAD_T + 12} fontSize="10" fill="var(--fe-primary-700)" fontWeight="500">Q1 2026</text>
    </svg>
  );
}

Object.assign(window, { Trends, BoardActionsMenu });
