// Overview page — totals, scope breakdown, sparkline, review queue
const SCOPE3_CATS = [
  ["3.1", "Purchased Goods and Services", "purchased_goods"],
  ["3.2", "Capital Goods", null],
  ["3.3", "Fuel- and Energy-Related Activities Not Included in Scope 1 or 2", "wtt"],
  ["3.4", "Upstream Transportation and Distribution", null],
  ["3.5", "Waste Generated in Operations", null],
  ["3.6", "Business Travel", "flight"],
  ["3.7", "Employee Commuting", null],
  ["3.8", "Upstream Leased Assets", null],
  ["3.9", "Downstream Transportation and Distribution", null],
  ["3.10", "Processing of Sold Products", null],
  ["3.11", "Use of Sold Products", null],
  ["3.12", "End-of-Life Treatment of Sold Products", null],
  ["3.13", "Downstream Leased Assets", null],
  ["3.14", "Franchises", null],
  ["3.15", "Investments", null],
];
function Overview({ calcs, entries, onJumpTo }) {
  const [qbOpen, setQbOpen] = React.useState(() => localStorage.getItem("fe-qb-open") !== "0");
  const [s3Open, setS3Open] = React.useState(() => localStorage.getItem("fe-s3-open") === "1");
  const [hm12Open, setHm12Open] = React.useState(() => localStorage.getItem("fe-hm12-open") === "1");
  const [hm3Open, setHm3Open] = React.useState(() => localStorage.getItem("fe-hm3-open") === "1");
  React.useEffect(() => { localStorage.setItem("fe-qb-open", qbOpen ? "1" : "0"); }, [qbOpen]);

  const total = calcs.reduce((s, c) => s + c.kgCO2e, 0);
  const byScope = [1, 2, 3].map(s => ({
    scope: s,
    kg: calcs.filter(c => c.scope === s).reduce((a, c) => a + c.kgCO2e, 0),
    color: s === 1 ? "#F35151" : s === 2 ? "#AD6EFF" : "#00BBA7",
  }));
  byScope.forEach(b => b.pct = total ? b.kg / total : 0);

  const needsReview = calcs.filter(c => c.status === "pending" || c.status === "suggested").length;
  const verified = calcs.filter(c => c.status === "confirmed").length;
  const coverage = Math.round((verified / calcs.length) * 100);

  // Data quality synthesis
  const primaryActivity = Math.round((entries.filter(e => e.data_input_type !== "Manual entry").length / (entries.length||1)) * 100);
  const primaryFactor = Math.round((calcs.filter(c => c.factor.source && c.factor.source.toLowerCase().includes("supplier")).length / (calcs.length||1)) * 100);
  const spendBased = 85; // mock — spend-based majority
  const activityBased = 100 - spendBased + 20; // just for chart width, clamp 35
  const activityPct = 35;
  const qualityLabel = coverage > 85 ? "Good" : coverage > 60 ? "Fair" : "Poor";

  // Calculation scale metrics
  const uniqFactors = new Set(calcs.map(c => c.factor.id || c.factor.name)).size;
  const lineItems = entries.length + calcs.length; // mock
  const matBasedShare = Math.round((calcs.filter(c => c.scope !== 3 || c.factor.source?.includes("DEFRA")).length / (calcs.length||1)) * 100);

  // Top N helpers
  const topN = (keyFn, n=5) => {
    const m = {};
    calcs.forEach(c => { const k = keyFn(c); if (!k) return; m[k] = (m[k]||0) + c.kgCO2e; });
    const arr = Object.entries(m).sort((a,b) => b[1]-a[1]);
    const tot = arr.reduce((s,[,v]) => s+v, 0) || 1;
    return arr.slice(0, n).map(([k, v]) => ({ k, v, pct: v/tot }));
  };
  const topSuppliers = topN(c => c.business_activity);
  const topMaterials = topN(c => c.category);
  const topLocations = topN(c => c.business_unit);

  // Sparkline — last 6 months of mock data
  const spark = [78, 84, 91, 87, 102, 96, 105];
  const maxS = Math.max(...spark), minS = Math.min(...spark);
  const pts = spark.map((v, i) => `${(i/(spark.length-1))*100},${40 - ((v-minS)/(maxS-minS||1))*36}`).join(" ");

  // EF matching progress (5 buckets)
  const total_n = calcs.length || 1;
  const ef_confirmed   = calcs.filter(c => c.status === "confirmed").length;
  const ef_high        = calcs.filter(c => c.status === "suggested" && c.confidence >= 0.8).length;
  const ef_medium      = calcs.filter(c => c.status === "suggested" && c.confidence >= 0.6 && c.confidence < 0.8).length;
  const ef_low         = calcs.filter(c => c.status === "suggested" && c.confidence != null && c.confidence < 0.6).length;
  const ef_missing     = calcs.filter(c => c.status === "pending" || (c.status === "suggested" && c.confidence == null)).length;
  const pctOf = (n) => Math.round((n / total_n) * 100);
  const efBuckets = [
    { key: "confirmed", label: "Confirmed",          n: ef_confirmed, pct: pctOf(ef_confirmed), tone: "ok" },
    { key: "high",      label: "Suggested · high",   n: ef_high,      pct: pctOf(ef_high),      tone: "high" },
    { key: "medium",    label: "Suggested · medium", n: ef_medium,    pct: pctOf(ef_medium),    tone: "med" },
    { key: "low",       label: "Suggested · low",    n: ef_low,       pct: pctOf(ef_low),       tone: "low" },
    { key: "missing",   label: "Missing / pending",  n: ef_missing,   pct: pctOf(ef_missing),   tone: "miss" },
  ];

  // Data quality method split — buckets follow GHG Protocol method hierarchy
  // (activity > distance > location > spend), using the `method` field set in data.jsx
  const dq_activity = calcs.filter(c => /activity/i.test(c.method || "")).length;
  const dq_distance = calcs.filter(c => /distance/i.test(c.method || "")).length;
  const dq_location = calcs.filter(c => /location/i.test(c.method || "")).length;
  const dq_spend    = calcs.filter(c => /spend/i.test(c.method || "")).length;
  const dq_other    = total_n - dq_activity - dq_distance - dq_location - dq_spend;
  const dqBuckets = [
    { key: "activity", label: "Activity-based",     n: dq_activity,            pct: pctOf(dq_activity),            tone: "ok" },
    { key: "distance", label: "Distance-based",     n: dq_distance,            pct: pctOf(dq_distance),            tone: "high" },
    { key: "location", label: "Location-based",     n: dq_location,            pct: pctOf(dq_location),            tone: "high" },
    { key: "spend",    label: "Spend-based",        n: dq_spend,               pct: pctOf(dq_spend),               tone: "med" },
    { key: "other",    label: "Other / unspec.",    n: Math.max(dq_other, 0),  pct: pctOf(Math.max(dq_other, 0)),  tone: "miss" },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Overview</h1>
          <div className="page-subtitle">GHG emissions · Reporting period Q1 2026</div>
        </div>
        <div className="page-actions">
          <button className="btn secondary small"><Icon name="calendar" size={16}/>Q1 2026</button>
        </div>
      </div>

      {/* Needs-review banner + emission hero + data quality — at top */}
      {needsReview > 0 && (
        <div className="queue-card compact" onClick={() => onJumpTo("calcs", { filter: "needs_review" })} style={{marginBottom: 20}}>
          <div className="icon"><Icon name="warn" size={18}/></div>
          <div style={{flex:1}}>
            <div className="big">{needsReview} calculations need your review</div>
            <div className="small">Low-confidence AI matches and unresolved factor matches — resolve them before closing the period.</div>
          </div>
          <Icon name="arrowRight" size={16} style={{color:"var(--fe-alert-700)"}}/>
        </div>
      )}

      <div className="ov-hero-row" style={{marginBottom: 20}}>
        <div className="calc-scale-hero">
          <div className="csh-metrics">
            <div className="csh-m">
              <div className="n">{(total/1000).toFixed(0)}<span className="u">t</span></div>
              <div className="d">CO₂e emissions calculated in Q1 2026</div>
            </div>
          </div>
        </div>

        <div>
        <div className={`dq-card dq-combined ${qbOpen ? "open" : "closed"}`}>
          <div className="dq-head">
            <div className="dq-title">Data Quality Score</div>
            <span className={`dq-pill ${qualityLabel.toLowerCase()}`}>{qualityLabel}</span>
            <button
              type="button"
              className="dq-toggle dq-toggle-corner"
              onClick={() => setQbOpen(v => !v)}
              aria-expanded={qbOpen}
              aria-label={qbOpen ? "Hide breakdown" : "Show breakdown"}
              title={qbOpen ? "Hide breakdown" : "Show breakdown"}
            >
              <span className="dq-chev" aria-hidden="true"><Icon name="chev" size={16}/></span>
            </button>
          </div>
          <div className="dq-coverage">
            <div className="dq-coverage-stat">
              <div className="dq-coverage-n">{lineItems.toLocaleString()}</div>
              <div className="dq-coverage-k">Line items processed</div>
            </div>
            <div className="dq-coverage-stat">
              <div className="dq-coverage-n">{uniqFactors}</div>
              <div className="dq-coverage-k">Emission factors used</div>
            </div>
            <div className="dq-coverage-stat">
              <div className="dq-coverage-n">{matBasedShare}<span className="dq-coverage-u">%</span></div>
              <div className="dq-coverage-k">Material-based approach</div>
            </div>
          </div>
          {qbOpen && (
            <div className="dq-breakdown">
              <DqBucketBlock title="Emission factor matching" subtitle={`${total_n} calculations`} buckets={efBuckets}/>
              <DqBucketBlock title="Calculation method" subtitle="Higher-quality methods at top" buckets={dqBuckets}/>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Scope + category */}
      <div className="grid-2" style={{marginBottom: 20}}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Emissions by scope</h3>
              <div className="card-sub">Q1 2026 · total {(total/1000).toFixed(1)} tCO₂e</div>
            </div>
            <button className="deep-dive" title="Deep dive" onClick={() => onJumpTo("calcs", { deepDive: {} })}>
              <Icon name="search" size={14}/><span className="dd-label">Deep dive</span>
            </button>
          </div>
          <div className="donut-wrap" style={{marginTop: 16}}>
            {(() => {
              // SVG donut: 200x200 viewBox, r=80, stroke-width=24
              const C = 2 * Math.PI * 80;
              let offset = 0;
              return (
                <svg className="donut-svg" viewBox="0 0 200 200" width="180" height="180" aria-label="Emissions by scope donut chart">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="var(--fe-bg-subtle, #F4F5F8)" strokeWidth="24"/>
                  {byScope.map(b => {
                    if (b.kg <= 0) return null;
                    const len = b.pct * C;
                    const dasharray = `${len} ${C - len}`;
                    const dashoffset = -offset;
                    const seg = (
                      <circle
                        key={b.scope}
                        cx="100" cy="100" r="80"
                        fill="none"
                        stroke={b.color}
                        strokeWidth="24"
                        strokeDasharray={dasharray}
                        strokeDashoffset={dashoffset}
                        transform="rotate(-90 100 100)"
                        style={{cursor:"pointer", transition:"stroke-width .15s ease"}}
                        onClick={() => onJumpTo("calcs", { deepDive: { scope: b.scope } })}
                      >
                        <title>{`Scope ${b.scope}: ${(b.kg/1000).toFixed(2)} tCO₂e (${Math.round(b.pct*100)}%)`}</title>
                      </circle>
                    );
                    offset += len;
                    return seg;
                  })}
                  <text x="100" y="94" textAnchor="middle" className="donut-c-n" fill="var(--fe-fg-strong)">
                    {(total/1000).toFixed(0)}
                  </text>
                  <text x="100" y="116" textAnchor="middle" className="donut-c-u" fill="var(--fe-fg-muted)">
                    tCO₂e
                  </text>
                </svg>
              );
            })()}
            <div className="donut-legend">
              {byScope.map(b => (
                <button
                  key={b.scope}
                  type="button"
                  className="donut-leg-row"
                  onClick={() => onJumpTo("calcs", { deepDive: { scope: b.scope } })}
                  title={`Deep dive: Scope ${b.scope}`}
                >
                  <span className="donut-leg-dot" style={{background: b.color}}/>
                  <div className="donut-leg-text">
                    <div className="donut-leg-k">Scope {b.scope}</div>
                    <div className="donut-leg-v">
                      <span className="donut-leg-n">{(b.kg/1000).toFixed(2)}</span>
                      <span className="donut-leg-u">tCO₂e</span>
                      <span className="donut-leg-pct">{Math.round(b.pct*100)}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div style={{fontSize:12, color:"var(--fe-fg-muted)", marginTop: 16, borderTop:"1px solid var(--fe-border-subtle)", paddingTop:12}}>
            Scope 3 includes upstream (WTT) calculations auto-generated from Scope 1 fuel entries.
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Top contributors</h3>
              <div className="card-sub">By category · this period</div>
            </div>
            <button className="deep-dive" title="Deep dive" onClick={() => onJumpTo("calcs", { deepDive: {} })}>
              <Icon name="search" size={14}/><span className="dd-label">Deep dive</span>
            </button>
          </div>
          {(() => {
            const byCat = {};
            calcs.forEach(c => { byCat[c.category] = (byCat[c.category] || 0) + c.kgCO2e; });
            const arr = Object.entries(byCat).sort((a,b) => b[1]-a[1]);
            const max = arr[0][1];
            return (
              <div className="scope-bar" style={{marginTop: 16}}>
                {arr.map(([cat, kg]) => (
                  <div className="row clickable" key={cat} onClick={() => onJumpTo("calcs", { deepDive: { category: cat } })} title="Deep dive">
                    <span className="label" style={{width:120}}><CatLabel cat={cat}/></span>
                    <span className="track"><span className="fill" style={{width: (kg/max*100)+"%", background: "var(--fe-accent-primary)"}}/></span>
                    <span className="val">{(kg/1000).toFixed(2)} t</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Scope 3 emissions by category — collapsible */}
      {(() => {
        // Sum kg by scope-3 subcategory key
        const byS3 = {};
        calcs.forEach(c => {
          if (c.scope !== 3) return;
          let key = null;
          if (c.category === "purchased_goods") key = "purchased_goods";
          else if (c.category === "flight") key = "flight";
          else if (c.category === "natural_gas" || c.category === "diesel" || c.category === "electricity") key = "wtt";
          if (key) byS3[key] = (byS3[key] || 0) + c.kgCO2e;
        });
        const rows = SCOPE3_CATS.map(([num, name, key]) => ({
          num, name, kg: key ? (byS3[key] || 0) : 0,
        }));
        const max = Math.max(...rows.map(r => r.kg), 1);
        const totalS3 = rows.reduce((s, r) => s + r.kg, 0);
        return (
          <div className="card" style={{marginTop: 20}}>
            <div className="s3-head-wrap">
              <button
                type="button"
                className="s3-head"
                onClick={() => { const n = !s3Open; setS3Open(n); localStorage.setItem("fe-s3-open", n ? "1" : "0"); }}
              >
                <div>
                  <h3 className="card-title">Scope 3 emissions by category</h3>
                  <div className="card-sub">GHG Protocol · 15 categories · {(totalS3/1000).toFixed(2)} tCO₂e calculated</div>
                </div>
                <span className={"s3-chev " + (s3Open ? "open" : "")} aria-hidden>▾</span>
              </button>
              <button className="deep-dive" title="Deep dive" onClick={(e) => { e.stopPropagation(); onJumpTo("calcs", { deepDive: { scope: 3 } }); }}>
                <Icon name="search" size={14}/><span className="dd-label">Deep dive</span>
              </button>
            </div>
            {s3Open && (
              <div className="s3-rows">
                {rows.map(r => {
                  const catKey = SCOPE3_CATS.find(x => x[0] === r.num)?.[2];
                  // Map S3 subcategory key back to a Calculations category filter (only if it's a real category)
                  const calcCat = catKey === "purchased_goods" ? "purchased_goods"
                                : catKey === "flight" ? "flight"
                                : null;
                  const go = () => {
                    if (r.kg <= 0) return;
                    onJumpTo("calcs", { deepDive: calcCat ? { category: calcCat } : { scope: 3 } });
                  };
                  return (
                    <div className={"s3-row " + (r.kg > 0 ? "clickable" : "")} key={r.num} onClick={go} title={r.kg > 0 ? "Deep dive" : ""}>
                      <span className="s3-label"><span className="s3-num">{r.num}</span> {r.name}</span>
                      <span className="s3-track">
                        <span className="s3-fill" style={{width: (r.kg/max*100)+"%"}}/>
                      </span>
                      <span className="s3-val">{r.kg > 0 ? (r.kg/1000).toFixed(2)+" t" : <span className="s3-zero">—</span>}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Top 5 tables */}
      <div className="grid-3" style={{marginTop: 20, marginBottom: 20}}>
        <TopCard title="Top 5 Suppliers" rows={topSuppliers} color="var(--fe-primary-200)"
          onDeepDive={() => onJumpTo("calcs", { deepDive: {} })}
          onRowDeepDive={(row) => onJumpTo("calcs", { deepDive: { query: row.k } })}
        />
        <TopCard title="Top 5 Materials" rows={topMaterials.map(r => ({...r, _raw: r.k, k: window.CAT_LABEL?.(r.k) || r.k}))} color="var(--fe-accent-primary)"
          onDeepDive={() => onJumpTo("calcs", { deepDive: {} })}
          onRowDeepDive={(row) => onJumpTo("calcs", { deepDive: { category: row._raw } })}
        />
        <TopCard title="Top 5 Locations" rows={topLocations} color="#F87171"
          onDeepDive={() => onJumpTo("calcs", { deepDive: {} })}
          onRowDeepDive={(row) => onJumpTo("calcs", { deepDive: { bu: row.k } })}
        />
      </div>

      {/* Heatmap cards — full-width, collapsible */}
      <Heatmap
        title="Scope 1 & 2 Heatmap"
        subtitle="Site × month · Q1 2026 · tCO₂e"
        open={hm12Open}
        onToggle={() => { const n = !hm12Open; setHm12Open(n); localStorage.setItem("fe-hm12-open", n ? "1" : "0"); }}
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

      <Heatmap
        title="Scope 3 Heatmap"
        subtitle="Category × month · Q1 2026 · tCO₂e"
        open={hm3Open}
        onToggle={() => { const n = !hm3Open; setHm3Open(n); localStorage.setItem("fe-hm3-open", n ? "1" : "0"); }}
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
    </>
  );
}

// Data quality breakdown block — stacked bar + bucket rows
function DqBucketBlock({ title, subtitle, buckets }) {
  const totalPct = buckets.reduce((s, b) => s + b.pct, 0) || 1;
  return (
    <div className="dq-bb">
      <div className="dq-bb-head">
        <div className="dq-bb-title">{title}</div>
        {subtitle && <div className="dq-bb-sub">{subtitle}</div>}
      </div>
      <div className="dq-stack" role="img" aria-label={`${title} breakdown`}>
        {buckets.map(b => b.pct > 0 && (
          <div key={b.key} className={`dq-stack-seg tone-${b.tone}`}
               style={{flex: b.pct}}
               title={`${b.label}: ${b.n} (${b.pct}%)`}/>
        ))}
      </div>
      <div className="dq-bb-rows">
        {buckets.map(b => (
          <div key={b.key} className="dq-bb-row">
            <span className={`dq-dot tone-${b.tone}`} aria-hidden="true"/>
            <span className="dq-bb-k">{b.label}</span>
            <span className="dq-bb-n">{b.n.toLocaleString()}</span>
            <span className={`dq-bb-pct tone-${b.tone}`}>{b.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple horizontal-bar "Top N" card
function TopCard({ title, rows, color, onDeepDive, onRowDeepDive }) {
  const max = rows[0]?.pct || 1;
  const totalPct = rows.reduce((s, r) => s + r.pct, 0);
  return (
    <div className="card top-card">
      <div className="card-head" style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
        <div style={{display:"flex", alignItems:"baseline", gap:10}}>
          <h3 className="card-title" style={{fontSize:14}}>{title}</h3>
          <div className="top-total"><span className="top-total-n">{Math.round(totalPct*100)}%</span><span className="top-total-d"> of total</span></div>
        </div>
        {onDeepDive && (
          <button className="deep-dive" onClick={onDeepDive} title="Deep dive"><Icon name="search" size={14}/><span className="dd-label">Deep dive</span></button>
        )}
      </div>
      <div className="top-rows">
        {rows.map((r, i) => (
          <div className={"top-row " + (onRowDeepDive ? "clickable" : "")} key={i}
               onClick={onRowDeepDive ? () => onRowDeepDive(r) : undefined}
               title={onRowDeepDive ? "Deep dive" : ""}>
            <div className="top-label">{r.k}</div>
            <div className="top-track">
              <div className="top-fill" style={{width: (r.pct/max*100)+"%", background: color}}/>
            </div>
            <div className="top-pct">{Math.round(r.pct*100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.Overview = Overview;

// Full-width collapsible heatmap card — rows × months grid
function Heatmap({ title, subtitle, open, onToggle, onDeepDive, rows, cols, accent }) {
  const allKg = rows.flatMap(r => r.cells.map(c => c.kg));
  const max = Math.max(...allKg, 1);
  const colTotals = cols.map((_, ci) => rows.reduce((s, r) => s + (r.cells[ci]?.kg || 0), 0));
  const grand = colTotals.reduce((s, v) => s + v, 0);
  return (
    <div className="card hm-card" style={{marginTop: 20}}>
      <div className="s3-head-wrap">
        <button type="button" className="s3-head" onClick={onToggle}>
          <div>
            <h3 className="card-title">{title}</h3>
            <div className="card-sub">{subtitle} · {(grand/1000).toFixed(2)} tCO₂e</div>
          </div>
          <span className={"s3-chev " + (open ? "open" : "")} aria-hidden>▾</span>
        </button>
        {onDeepDive && (
          <button className="deep-dive" title="Deep dive" onClick={(e) => { e.stopPropagation(); onDeepDive(); }}>
            <Icon name="search" size={14}/><span className="dd-label">Deep dive</span>
          </button>
        )}
      </div>
      {open && (
        <div className="hm-grid" style={{"--hm-cols": cols.length, "--hm-accent": accent}}>
          <div className="hm-corner"/>
          {cols.map((c, i) => (
            <div className="hm-col-h" key={i}>
              <div className="hm-col-label">{c.label}</div>
              <div className="hm-col-total">{(colTotals[i]/1000).toFixed(2)} t</div>
            </div>
          ))}
          {rows.map((r, ri) => {
            const rowTotal = r.cells.reduce((s, c) => s + c.kg, 0);
            return (
              <React.Fragment key={ri}>
                <div className="hm-row-h">
                  <div className="hm-row-label" title={r.label}>{r.label}</div>
                  <div className="hm-row-total">{(rowTotal/1000).toFixed(2)} t</div>
                </div>
                {r.cells.map((c, ci) => {
                  const intensity = c.kg / max;
                  return (
                    <button
                      key={ci}
                      type="button"
                      className={"hm-cell " + (c.kg > 0 ? "filled" : "empty") + (c.onClick && c.kg > 0 ? " clickable" : "")}
                      onClick={c.onClick && c.kg > 0 ? c.onClick : undefined}
                      style={c.kg > 0 ? { "--hm-i": intensity } : undefined}
                      title={c.kg > 0 ? `${(c.kg/1000).toFixed(2)} tCO₂e` : "—"}
                    >
                      <span className="hm-cell-v">
                        {c.kg > 0 ? (c.kg/1000).toFixed(c.kg/1000 < 1 ? 2 : 1) : "—"}
                      </span>
                    </button>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
window.Heatmap = Heatmap;
