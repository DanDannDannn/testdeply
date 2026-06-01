// Hotspot analysis — default board under Emission overview.
// Four "what's driving the footprint" charts: top locations, top suppliers,
// top spend-based factors, top activity-based factors. Each top-N chart has
// a "show all / show fewer" toggle and a Deep dive jump into Data.

const HOTSPOT_COLORS = {
  spend:        "#5B5BF0",
  activity:     "#F7B26B",
  precalc:      "#C9B5F2",
  spendOnly:    "#5B5BF0",
  activityOnly: "#F7B26B",
};

// Choose a "nice" axis max (round up to next 20).
function niceMax(max) {
  if (max <= 0) return 20;
  const step = max > 200 ? 50 : max > 100 ? 20 : 10;
  return Math.ceil(max / step) * step;
}
function ticksFor(max) {
  const step = max >= 200 ? 20 : max >= 100 ? 10 : 10;
  const out = [];
  for (let v = 0; v <= max; v += step) out.push(v);
  return out;
}

// Stacked horizontal bar chart card (spend / activity / pre-calculated).
function HotspotStackedCard({
  title,
  subtitle,
  rows,                  // [{ label, spend, activity, precalc, total }]
  unit = "tCO₂e",
  toggleMoreLabel,       // e.g. "Show all locations"
  toggleFewerLabel,      // e.g. "Show top 10 locations"
  initialN = 10,
  onDeepDive,
}) {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? rows : rows.slice(0, initialN);
  const max = niceMax(Math.max(...rows.map(r => r.total)));
  const ticks = ticksFor(max);

  return (
    <div className="card" style={{marginTop: 20}}>
      <div className="card-head">
        <div>
          <h3 className="card-title">{title}</h3>
          <div className="card-sub">{subtitle}</div>
        </div>
        {onDeepDive && (
          <button className="deep-dive" title="Deep dive" onClick={onDeepDive}>
            <Icon name="search" size={14}/><span className="dd-label">Deep dive</span>
          </button>
        )}
      </div>

      <div className="hotspot-chart">
        <div className="hotspot-grid">
          {visible.map((r, i) => {
            const spendPct    = (r.spend    / max) * 100;
            const activityPct = (r.activity / max) * 100;
            const precalcPct  = (r.precalc  / max) * 100;
            const totalPct    = (r.total    / max) * 100;
            return (
              <React.Fragment key={i}>
                <div className="hotspot-label" title={r.label}>{r.label}</div>
                <div className="hotspot-track">
                  <div className="hotspot-ticks" aria-hidden>
                    {ticks.slice(1).map(t => (
                      <span key={t} className="hotspot-tick-line" style={{left: (t/max*100)+"%"}}/>
                    ))}
                  </div>
                  {r.spend > 0 && (
                    <div
                      className="hotspot-seg hotspot-seg--spend"
                      style={{left: 0, width: spendPct + "%", background: HOTSPOT_COLORS.spend}}
                    />
                  )}
                  {r.activity > 0 && (
                    <div
                      className="hotspot-seg hotspot-seg--activity"
                      style={{left: spendPct + "%", width: activityPct + "%", background: HOTSPOT_COLORS.activity}}
                    />
                  )}
                  {r.precalc > 0 && (
                    <div
                      className="hotspot-seg hotspot-seg--precalc"
                      style={{left: (spendPct + activityPct) + "%", width: precalcPct + "%", background: HOTSPOT_COLORS.precalc}}
                    />
                  )}
                  <div className="hotspot-val" style={{left: "calc(" + totalPct + "% + 8px)"}}>
                    {r.total.toFixed(2)}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          {/* expand / collapse */}
          <div className="hotspot-label" aria-hidden/>
          <div className="hotspot-axis-row">
            {rows.length > initialN && (
              <button className="hotspot-show-more" onClick={() => setExpanded(v => !v)}>
                {expanded ? toggleFewerLabel : toggleMoreLabel} <Icon name="chev" size={12}/>
              </button>
            )}
          </div>
          {/* axis */}
          <div className="hotspot-label" aria-hidden/>
          <div className="hotspot-axis">
            {ticks.map(t => (
              <span key={t} className="hotspot-axis-tick" style={{left: (t/max*100)+"%"}}>{t}</span>
            ))}
          </div>
        </div>
        <div className="hotspot-footer">
          <div className="hotspot-legend">
            <span className="hotspot-leg-item">
              <span className="hotspot-leg-dot" style={{background: HOTSPOT_COLORS.spend}}/>Spend based
            </span>
            <span className="hotspot-leg-item">
              <span className="hotspot-leg-dot" style={{background: HOTSPOT_COLORS.activity}}/>Activity based
            </span>
            <span className="hotspot-leg-item">
              <span className="hotspot-leg-dot" style={{background: HOTSPOT_COLORS.precalc}}/>Pre-calculated
            </span>
          </div>
          <div className="hotspot-axis-unit">{unit}</div>
        </div>
      </div>
    </div>
  );
}

// Single-series horizontal bar chart card (for emission-factor comparisons).
function HotspotSingleCard({
  title,
  subtitle,
  rows,             // [{ label, value }]
  color,
  unit = "tCO₂e",
  toggleMoreLabel,
  toggleFewerLabel,
  initialN = 10,
  onDeepDive,
}) {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? rows : rows.slice(0, initialN);
  const max = niceMax(Math.max(...rows.map(r => r.value)));
  const ticks = ticksFor(max);

  return (
    <div className="card" style={{marginTop: 20}}>
      <div className="card-head">
        <div>
          <h3 className="card-title">{title}</h3>
          <div className="card-sub">{subtitle}</div>
        </div>
        {onDeepDive && (
          <button className="deep-dive" title="Deep dive" onClick={onDeepDive}>
            <Icon name="search" size={14}/><span className="dd-label">Deep dive</span>
          </button>
        )}
      </div>

      <div className="hotspot-chart">
        <div className="hotspot-grid">
          {visible.map((r, i) => {
            const pct = (r.value / max) * 100;
            return (
              <React.Fragment key={i}>
                <div className="hotspot-label" title={r.label}>{r.label}</div>
                <div className="hotspot-track">
                  <div className="hotspot-ticks" aria-hidden>
                    {ticks.slice(1).map(t => (
                      <span key={t} className="hotspot-tick-line" style={{left: (t/max*100)+"%"}}/>
                    ))}
                  </div>
                  <div
                    className="hotspot-seg hotspot-seg--single"
                    style={{left: 0, width: pct + "%", background: color}}
                  />
                  <div className="hotspot-val" style={{left: "calc(" + pct + "% + 8px)"}}>
                    {r.value.toFixed(2)}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div className="hotspot-label" aria-hidden/>
          <div className="hotspot-axis-row">
            {rows.length > initialN && (
              <button className="hotspot-show-more" onClick={() => setExpanded(v => !v)}>
                {expanded ? toggleFewerLabel : toggleMoreLabel} <Icon name="chev" size={12}/>
              </button>
            )}
          </div>
          <div className="hotspot-label" aria-hidden/>
          <div className="hotspot-axis">
            {ticks.map(t => (
              <span key={t} className="hotspot-axis-tick" style={{left: (t/max*100)+"%"}}>{t}</span>
            ))}
          </div>
        </div>
        <div className="hotspot-footer hotspot-footer--right">
          <div className="hotspot-axis-unit">{unit}</div>
        </div>
      </div>
    </div>
  );
}

// --- Demo data (matches the look-and-feel from the design spec; numbers
// are illustrative for the prototype — not derived from calcs[]). ---

const LOCATION_ROWS = [
  { label: "Wolfsburg Plant",          spend: 158, activity: 42, precalc: 0   },
  { label: "Berlin HQ",                spend: 142, activity: 32, precalc: 18  },
  { label: "Linz Manufacturing",       spend: 96,  activity: 42, precalc: 0   },
  { label: "Rotterdam DC",             spend: 98,  activity: 14, precalc: 0   },
  { label: "Stuttgart Engineering",    spend: 72,  activity: 5,  precalc: 0   },
  { label: "Eindhoven Lab",            spend: 20,  activity: 46, precalc: 0   },
  { label: "Madrid Office",            spend: 56,  activity: 0,  precalc: 0   },
  { label: "Hamburg Logistics",        spend: 21,  activity: 19, precalc: 0   },
  { label: "Lyon Service Centre",      spend: 27,  activity: 6,  precalc: 0   },
  { label: "Manchester Warehouse",     spend: 8,   activity: 10, precalc: 0   },
  { label: "Warsaw Branch",            spend: 6,   activity: 4,  precalc: 0   },
  { label: "Milan Sales Office",       spend: 4,   activity: 3,  precalc: 0   },
].map(r => ({ ...r, total: r.spend + r.activity + r.precalc }));

const SUPPLIER_ROWS = [
  { label: "Van Doorn Staal BV",                       spend: 158, activity: 42, precalc: 0   },
  { label: "Henkel Adhesives Iberica",                 spend: 142, activity: 32, precalc: 0   },
  { label: "Schiphol Logistics & Forwarding GmbH",     spend: 96,  activity: 42, precalc: 0   },
  { label: "ABB Power Components Europe AG",           spend: 98,  activity: 14, precalc: 0   },
  { label: "Tata Steel UK Limited",                    spend: 72,  activity: 6,  precalc: 8   },
  { label: "Mondi AG",                                 spend: 20,  activity: 46, precalc: 56  },
  { label: "BASF Coatings GmbH",                       spend: 56,  activity: 0,  precalc: 0   },
  { label: "DHL Supply Chain BV",                      spend: 21,  activity: 19, precalc: 0   },
  { label: "Salzgitter Flachstahl",                    spend: 27,  activity: 6,  precalc: 0   },
  { label: "Lyondellbasell Industries",                spend: 8,   activity: 10, precalc: 0   },
  { label: "Continental Tires Deutschland",            spend: 6,   activity: 3,  precalc: 0   },
  { label: "Siemens Energy AG",                        spend: 4,   activity: 2,  precalc: 0   },
].map(r => ({ ...r, total: r.spend + r.activity + r.precalc }));

const SPEND_FACTOR_ROWS = [
  { label: "Iron and steel (spend, DEFRA 2025)",                                   value: 158 },
  { label: "Industrial chemicals (spend, DEFRA 2025)",                             value: 142 },
  { label: "Freight transport (spend, DEFRA 2025)",                                value: 115 },
  { label: "Office furniture and fittings (spend, DEFRA 2025)",                    value: 99  },
  { label: "Electrical equipment (spend, DEFRA 2025)",                             value: 72  },
  { label: "IT services and software (spend, exiobase 3.8)",                       value: 58  },
  { label: "Paper and board (spend, ecoinvent 3.10)",                              value: 56  },
  { label: "Construction services (spend, DEFRA 2025)",                            value: 36  },
  { label: "Professional, scientific and technical services (spend, exiobase)",    value: 26  },
  { label: "Wholesale and retail trade services (spend, DEFRA 2025)",              value: 8   },
  { label: "Repair and maintenance services (spend, DEFRA 2025)",                  value: 5   },
];

const ACTIVITY_FACTOR_ROWS = [
  { label: "Natural gas, stationary combustion (kg CO₂e/kWh, DEFRA 2025)",         value: 158 },
  { label: "Diesel, mobile combustion — HGV >7.5t (km, DEFRA 2025)",               value: 142 },
  { label: "Steel, primary hot-rolled (kg CO₂e/kg, worldsteel 2024)",               value: 122 },
  { label: "Electricity, grid mix Germany (kg CO₂e/kWh, AIB 2024)",                value: 98  },
  { label: "Refrigerant R-410A — fugitive losses (kg CO₂e/kg, AR6)",               value: 72  },
  { label: "LPG, stationary combustion (kg CO₂e/kg, DEFRA 2025)",                  value: 58  },
  { label: "Air freight, long-haul belly cargo (tkm, DEFRA 2025)",                 value: 56  },
  { label: "Sea freight, container vessel (tkm, GLEC v3.1)",                       value: 36  },
  { label: "District heating, Berlin (kg CO₂e/kWh, AIB 2024)",                     value: 26  },
  { label: "Waste, incineration with energy recovery (kg CO₂e/kg, DEFRA 2025)",    value: 8   },
];

// --- Top-of-page AI insights specific to hotspot analysis ---------------------
function buildHotspotInsights({ onJumpTo }) {
  const HB = window.HorizBarChart;
  return [
    {
      key: "hot-loc-concentration",
      tag: "Location concentration · high confidence",
      title: <>Top 10 locations contribute 55% of total emissions</>,
      body: (
        <>
          Just <strong>10 of your 42 sites</strong> account for <strong>55%</strong> of Q1 emissions.
          Wolfsburg, Berlin HQ and Linz alone make up <strong>32%</strong> — these are the highest-leverage
          sites to engage on activity data, on-site energy mix, or operational efficiency.
        </>
      ),
      details: (
        <p style={{fontSize:12, color:"var(--fe-fg-muted)"}}>
          Site concentration this steep usually means a small action list goes a long way:
          a single site improvement on the top 3 typically moves the inventory total
          measurably, whereas tail-site work rarely shows up at the corporate level.
        </p>
      ),
      chart: HB && (
        <>
          <div className="ai-modal__chart-title">Top 5 sites · % of Q1 footprint</div>
          <HB rows={[
            { label: "Wolfsburg Plant",        value: 14, display: "14%", highlight: true },
            { label: "Berlin HQ",              value: 11, display: "11%" },
            { label: "Linz Manufacturing",     value:  7, display:  "7%" },
            { label: "Rotterdam DC",           value:  6, display:  "6%" },
            { label: "Stuttgart Engineering",  value:  5, display:  "5%" },
          ]} unit="%"/>
        </>
      ),
      link: "Open top sites in Data",
      onLink: () => onJumpTo("calcs", {}),
    },
    {
      key: "hot-supplier-concentration",
      tag: "Supplier concentration · high confidence",
      title: <>Top 10 suppliers contribute 85% of total emissions</>,
      body: (
        <>
          <strong>10 suppliers</strong> drive <strong>85%</strong> of your inventory. This is the
          set of relationships where activity-data engagement, PCFs, or supplier-specific factors
          will move the needle — the long tail can stay on spend-based factors without distorting results.
        </>
      ),
      details: (
        <p style={{fontSize:12, color:"var(--fe-fg-muted)"}}>
          Mondi AG already provides a pre-calculated PCF (light purple) — that's the gold-standard
          data quality you'd want from each top-10 supplier. The next quickest win is moving
          spend-only suppliers onto mass-based or activity-based factors.
        </p>
      ),
      chart: HB && (
        <>
          <div className="ai-modal__chart-title">Top 5 suppliers · % of Q1 footprint</div>
          <HB rows={[
            { label: "Van Doorn Staal BV",                value: 14, display: "14%", highlight: true },
            { label: "Henkel Adhesives Iberica",          value: 12, display: "12%" },
            { label: "Schiphol Logistics & Forwarding",   value: 10, display: "10%" },
            { label: "ABB Power Components Europe",       value:  8, display:  "8%" },
            { label: "Tata Steel UK",                     value:  6, display:  "6%" },
          ]} unit="%"/>
        </>
      ),
      link: "Open supplier engagement queue",
      onLink: () => onJumpTo("calcs", {}),
    },
    {
      key: "hot-spend-fallback",
      tag: "Methodology upgrade",
      title: <>10 spend-based factors drive 55% of total — start here for activity data</>,
      body: (
        <>
          The top <strong>10 spend-based emission factors</strong> alone account for{" "}
          <strong>55%</strong> of your footprint. Swapping these to activity-based methods
          (mass, kWh, tkm) reduces category-level uncertainty by 25-40% and is the single
          biggest precision lever available.
        </>
      ),
      details: (
        <p style={{fontSize:12, color:"var(--fe-fg-muted)"}}>
          Iron &amp; steel, industrial chemicals and freight transport top the list. All three
          have widely-available activity-based factors (worldsteel, ecoinvent, GLEC) so the
          methodology upgrade is straightforward if you can pull mass/distance from SAP.
        </p>
      ),
      link: "Open factor coverage",
      onLink: () => onJumpTo("calcs", {}),
    },
  ];
}

// --- Page shell ---------------------------------------------------------------
function HotspotAnalysis({ calcs, entries, onJumpTo }) {
  const [editLayout, setEditLayout] = React.useState(false);
  const total = (calcs || []).reduce((s, c) => s + c.kgCO2e, 0);

  const insights = buildHotspotInsights({ onJumpTo });

  return (
    <>
      <div className="page-head">
        <div className="page-head__main">
          <div className="page-head__titlerow">
            <h1 className="page-title">Hotspot analysis</h1>
            {window.BoardActionsMenu && (
              <window.BoardActionsMenu
                editLayoutActive={editLayout}
                onToggleEditLayout={() => setEditLayout(v => !v)}
              />
            )}
          </div>
          <div className="page-subtitle">
            Where the footprint concentrates · {(total/1000).toFixed(1)} tCO₂e total
          </div>
        </div>
      </div>

      <BoardFilters boardKey="hotspot" />

      {/* Pinned AI insights — only shows if the user has explicitly pinned
          something here from the Forward AI chat on Home. Proactive
          suggestion cards live under the AI chat, not on individual boards. */}
      <PinnedBoardInsights
        boardKey="hotspot"
        boardLabel="Hotspot analysis"
        allInsights={insights}
        onJumpHome={() => onJumpTo("overview")}
      />

      <PageSections pageKey="hotspot" editMode={editLayout}>
        <PageSection id="hot-locations" label="Total emission comparison · by location">
          <HotspotStackedCard
            title="Total emission comparison"
            subtitle="Top 10 locations contribute 55% of total emissions"
            rows={LOCATION_ROWS}
            toggleMoreLabel="Show all locations"
            toggleFewerLabel="Show top 10 locations"
            onDeepDive={() => onJumpTo("calcs", { deepDive: { kind: "by-site" } })}
          />
        </PageSection>

        <PageSection id="hot-suppliers" label="Supplier emission comparison">
          <HotspotStackedCard
            title="Supplier emission comparison"
            subtitle="Top 10 suppliers contribute 85% of total emissions"
            rows={SUPPLIER_ROWS}
            toggleMoreLabel="Show top 30 suppliers"
            toggleFewerLabel="Show top 10 suppliers"
            onDeepDive={() => onJumpTo("calcs", { deepDive: { kind: "by-supplier" } })}
          />
        </PageSection>

        <PageSection id="hot-spend-factors" label="Spend-based emission factor comparison">
          <HotspotSingleCard
            title="Spend based emission factor comparison"
            subtitle="Top 10 spend based emission factors contribute 55% of total emissions"
            rows={SPEND_FACTOR_ROWS}
            color={HOTSPOT_COLORS.spendOnly}
            toggleMoreLabel="Show all emission factors"
            toggleFewerLabel="Show top 10 emission factors"
            onDeepDive={() => onJumpTo("calcs", { deepDive: { kind: "by-factor", method: "spend" } })}
          />
        </PageSection>

        <PageSection id="hot-activity-factors" label="Activity-based emission factor comparison">
          <HotspotSingleCard
            title="Activity based emission factor comparison"
            subtitle="Top 10 activity based emission factors contribute 55% of total emissions"
            rows={ACTIVITY_FACTOR_ROWS}
            color={HOTSPOT_COLORS.activityOnly}
            toggleMoreLabel="Show all emission factors"
            toggleFewerLabel="Show top 10 emission factors"
            onDeepDive={() => onJumpTo("calcs", { deepDive: { kind: "by-factor", method: "activity" } })}
          />
        </PageSection>
      </PageSections>
    </>
  );
}

Object.assign(window, { HotspotAnalysis, buildHotspotInsights });
