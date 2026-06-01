// Overview page — totals, scope breakdown, sparkline, review queue
// Scope 3 categories — each row has its emission key (where data lives) and
// an `intent` flag indicating whether the category is in scope for Acme:
//   "planned"  → material / will report, but no data this period
//   "excluded" → not material for this business, will not report
const SCOPE3_CATS = [
  ["3.1",  "Purchased Goods and Services",                                       "purchased_goods", "planned"],
  ["3.2",  "Capital Goods",                                                       null,             "planned"],
  ["3.3",  "Fuel- and Energy-Related Activities Not Included in Scope 1 or 2",    "wtt",            "planned"],
  ["3.4",  "Upstream Transportation and Distribution",                            null,             "planned"],
  ["3.5",  "Waste Generated in Operations",                                       null,             "planned"],
  ["3.6",  "Business Travel",                                                     "flight",         "planned"],
  ["3.7",  "Employee Commuting",                                                  null,             "planned"],
  ["3.8",  "Upstream Leased Assets",                                              null,             "excluded"],
  ["3.9",  "Downstream Transportation and Distribution",                          null,             "excluded"],
  ["3.10", "Processing of Sold Products",                                         null,             "excluded"],
  ["3.11", "Use of Sold Products",                                                null,             "excluded"],
  ["3.12", "End-of-Life Treatment of Sold Products",                              null,             "excluded"],
  ["3.13", "Downstream Leased Assets",                                            null,             "excluded"],
  ["3.14", "Franchises",                                                          null,             "excluded"],
  ["3.15", "Investments",                                                         null,             "excluded"],
];

const CAT_LABEL_MAP = {
  electricity:     "Electricity",
  natural_gas:     "Natural gas",
  diesel:          "Diesel / fleet",
  flight:          "Business travel — air",
  purchased_goods: "Purchased goods",
};

// --- Combined Home suggestions (chat chips on the Home page) --------------
// Includes both "high-level footprint" questions and the hotspot/trend
// questions that previously lived on Trends.
function buildHomeSuggestions({ calcs, entries, total, byScope, topByEntry, topCategories }) {
  const totalT = (total/1000).toFixed(1);
  const HB = window.HorizBarChart;
  const DB = window.DeltaBarChart;

  return [
    {
      key: "full-footprint",
      q: "Give me a summary of my Q1 2026 footprint",
      text: () => (
        <>
          <p>
            Acme Industries' Q1 2026 footprint is <strong>{totalT} tCO₂e</strong>, up roughly
            <strong> 9.7%</strong> vs Q4 2025 ({(128400/1000).toFixed(1)} t).
          </p>
          <p>
            <strong>Where it's coming from:</strong> ~50% from Scope 3 (purchased goods + business travel),
            ~25% from Scope 2 electricity, and ~25% from Scope 1 stationary &amp; mobile combustion.
            Travel and purchased goods are your biggest levers.
          </p>
        </>
      ),
      chart: () => (
        <>
          <div className="fai-slide-chart-title">Split across scopes · tCO₂e</div>
          <HB rows={byScope.map(b => ({
            label: `Scope ${b.scope}`,
            value: b.kg/1000,
            display: `${(b.kg/1000).toFixed(1)} t · ${Math.round(b.pct*100)}%`,
            color: b.color,
          }))}/>
        </>
      ),
    },
    {
      key: "biggest-driver",
      q: "What's driving my emissions the most?",
      text: () => {
        const byCat = {};
        calcs.forEach(c => { byCat[c.category] = (byCat[c.category]||0) + c.kgCO2e; });
        const sorted = Object.entries(byCat).sort((a,b) => b[1]-a[1]).slice(0,4);
        const topLabel = CAT_LABEL_MAP[sorted[0][0]] || sorted[0][0];
        return (
          <>
            <p>
              The top 4 categories drive <strong>{Math.round(sorted.reduce((s,[,v])=>s+v,0)/total*100)}%</strong> of Q1 emissions —
              <strong> {topLabel}</strong> leads at <strong>{Math.round(sorted[0][1]/total*100)}%</strong>.
            </p>
            <p style={{marginTop: 10, fontSize: 12, color: "var(--fe-fg-muted)"}}>
              Open <strong>Trends</strong> for hotspots and YoY changes, or save this chart to a board.
            </p>
          </>
        );
      },
      chart: () => {
        const byCat = {};
        calcs.forEach(c => { byCat[c.category] = (byCat[c.category]||0) + c.kgCO2e; });
        const sorted = Object.entries(byCat).sort((a,b) => b[1]-a[1]).slice(0,5);
        return (
          <>
            <div className="fai-slide-chart-title">Top categories · tCO₂e</div>
            <HB rows={sorted.map(([k, v], i) => ({
              label: CAT_LABEL_MAP[k] || k,
              value: v/1000,
              display: `${(v/1000).toFixed(1)} t · ${Math.round(v/total*100)}%`,
              highlight: i === 0,
            }))}/>
          </>
        );
      }
    },
    {
      key: "biggest-contributors",
      q: "What's the biggest individual emission contributor?",
      text: () => {
        const top = topByEntry[0];
        const e = entries.find(x => x.id === top.id);
        return (
          <>
            <p>
              The single biggest contributor is <strong>{e?.summary || top.id}</strong>,
              accounting for <strong>{(top.kg/1000).toFixed(2)} t CO₂e</strong> — about{" "}
              <strong>{Math.round(top.pct*100)}%</strong> of your total inventory.
            </p>
            <p style={{marginTop: 8}}>
              The top 5 individual entries combined represent{" "}
              <strong>{Math.round(topByEntry.reduce((s,t)=>s+t.pct,0)*100)}%</strong> of Q1 — a classic Pareto pattern.
            </p>
          </>
        );
      },
      chart: () => (
        <>
          <div className="fai-slide-chart-title">Top 5 individual entries · tCO₂e</div>
          <HB rows={topByEntry.map((t, i) => ({
            label: t.summary,
            value: t.kg/1000,
            display: `${(t.kg/1000).toFixed(2)} t · ${Math.round(t.pct*100)}%`,
            highlight: i === 0,
          }))}/>
        </>
      ),
    },
    {
      key: "flying-share",
      q: "How much of my footprint comes from flying?",
      text: () => {
        const flightKg = calcs.filter(c => c.category === "flight").reduce((s,c)=>s+c.kgCO2e, 0);
        const flightPct = flightKg/total;
        const flights = entries.filter(e => e.category === "flight");
        return (
          <>
            <p>
              Business travel by air drives <strong>{(flightKg/1000).toFixed(2)} t CO₂e</strong> —{" "}
              <strong>{Math.round(flightPct*100)}%</strong> of Q1 emissions across {flights.length} flights.
            </p>
            <p style={{marginTop: 10, fontSize: 12.5, color: "var(--fe-fg-muted)"}}>
              Two long-haul business-class trips (CDG→SIN, FRA→NRT) alone account for over a third of all travel
              emissions. A policy default of economy on long-haul would meaningfully cut this category.
            </p>
          </>
        );
      },
      chart: () => (
        <>
          <div className="fai-slide-chart-title">Share of Q1 travel emissions · by pattern</div>
          <HB rows={[
            { label: "Business-class long-haul", value: 60, display: "~60%", highlight: true },
            { label: "Long-haul economy",        value: 25, display: "~25%" },
            { label: "Short-haul (<1,500 km)",   value: 15, display: "~15%" },
          ]} unit="%"/>
        </>
      ),
    },
    {
      key: "yoy",
      q: "How has my footprint changed from Q4 2025?",
      text: () => (
        <>
          <p>
            Q1 2026 totalled <strong>{(total/1000).toFixed(1)} t CO₂e</strong>, up{" "}
            <strong>+{((total - 128400)/1000).toFixed(1)} t (+{((total-128400)/128400*100).toFixed(1)}%)</strong>{" "}
            vs Q4 2025 ({(128400/1000).toFixed(1)} t).
          </p>
          <p>
            The increase is driven by business travel ramping after the holiday slowdown
            plus a one-off steel racking purchase; fleet diesel fell after route optimisation.
          </p>
        </>
      ),
      chart: () => (
        <>
          <div className="fai-slide-chart-title">Δ vs Q4 2025 · tCO₂e</div>
          <DB rows={[
            { label: "Business travel ramp",      value:  8.4, display: "+8.4 t" },
            { label: "Steel racking (Rotterdam)", value:  4.7, display: "+4.7 t" },
            { label: "Heating gas (cold Feb)",    value:  2.1, display: "+2.1 t" },
            { label: "Fleet diesel (route opt.)", value: -1.3, display: "−1.3 t" },
          ]}/>
        </>
      ),
    },
    {
      key: "review-ready",
      q: "Is my Q1 inventory ready to report?",
      text: () => {
        const needsReview = calcs.filter(c => c.status === "pending" || c.status === "suggested").length;
        return (
          <>
            <p>
              Q1 is <strong>almost ready</strong> for reporting. The highlights:
            </p>
            <ul className="fai-msg-list">
              <li><strong>{calcs.length}</strong> calculations, <strong>{calcs.filter(c=>c.status==="confirmed").length}</strong> confirmed.</li>
              <li><strong>{needsReview}</strong> low-confidence calculations still need review.</li>
              <li>Scope 3 coverage: <strong>3 of 15</strong> categories — methodology still partial.</li>
            </ul>
            <p style={{marginTop: 8}}>
              For internal reporting you're <strong>good to close</strong>. For CSRD-grade assurance,
              document the materiality assessment and resolve the {needsReview} low-confidence calcs first.
            </p>
          </>
        );
      },
      chart: () => {
        const needsReview = calcs.filter(c => c.status === "pending" || c.status === "suggested").length;
        const confirmed   = calcs.filter(c => c.status === "confirmed").length;
        const high        = calcs.length - needsReview - confirmed;
        return (
          <>
            <div className="fai-slide-chart-title">Calculation status · {calcs.length} total</div>
            <HB rows={[
              { label: "Confirmed",        value: confirmed,   display: `${confirmed}`,   highlight: true },
              { label: "High-confidence",  value: high,        display: `${high}` },
              { label: "Needs review",     value: needsReview, display: `${needsReview}` },
            ]} unit=""/>
          </>
        );
      }
    },
  ];
}

// --- Combined Home AI insights (proactive cards) --------------------------
// Pulls from both the Overview and the Trends insight sets so Home is the
// single place users explore newly-surfaced findings.
function buildHomeInsights({ calcs, entries, total, byScope, onJumpTo }) {
  const insights = [];

  // ---- Overview insights ----
  const biggestCalc = [...calcs].sort((a,b) => b.kgCO2e - a.kgCO2e)[0];
  const biggestPct  = biggestCalc ? Math.round(biggestCalc.kgCO2e/total*100) : 0;
  const top5Calcs   = [...calcs].sort((a,b) => b.kgCO2e - a.kgCO2e).slice(0, 5);

  const byCat = {};
  calcs.forEach(c => { byCat[c.category] = (byCat[c.category]||0) + c.kgCO2e; });
  const sortedCats = Object.entries(byCat).sort((a,b) => b[1]-a[1]);
  const [topCatKey, topCatKg] = sortedCats[0] || [];
  const topCatPct = topCatKg ? Math.round(topCatKg/total*100) : 0;
  const topCatLabel = (window.CAT_LABEL && window.CAT_LABEL(topCatKey)) || topCatKey;

  const bySite = {};
  calcs.forEach(c => { if (c.site && c.site !== "—") bySite[c.site] = (bySite[c.site]||0) + c.kgCO2e; });
  const sortedSites = Object.entries(bySite).sort((a,b) => b[1]-a[1]);
  const [topSite, topSiteKg] = sortedSites[0] || [];
  const topSitePct = topSiteKg ? Math.round(topSiteKg/total*100) : 0;

  if (biggestCalc) {
    insights.push({
      key: "purchased-goods-leverage",
      tag: "Highest-leverage engagement · high confidence",
      isNew: true,
      title: <>Purchased goods &amp; services = 72% of your Scope 3 footprint</>,
      body: (
        <>
          Within Scope 3, purchased goods drives <strong>72%</strong> of emissions. Inside that,{" "}
          <strong>5 suppliers</strong> account for <strong>55%</strong> of category emissions.
          These are your highest-leverage engagement targets before the next reporting cycle.
        </>
      ),
      details: (
        <p style={{fontSize:12, color:"var(--fe-fg-muted)"}}>
          Engaging the top 5 on activity-based data, PCFs or supplier-specific factors shifts the precision
          of the largest single block of your inventory — a much bigger lever than chasing the long tail.
        </p>
      ),
      chart: (
        <>
          <div className="ai-modal__chart-title">Top 5 suppliers · % of purchased goods category</div>
          <HorizBarChart rows={[
            { label: "Van Doorn Staal",        value: 18, display: "18%", highlight: true },
            { label: "Henkel Adhesives",       value: 13, display: "13%" },
            { label: "Schiphol Logistics",     value: 10, display: "10%" },
            { label: "ABB Power Components",   value:  8, display:  "8%" },
            { label: "Tata Steel UK",          value:  6, display:  "6%" },
          ]} unit="%"/>
        </>
      ),
      link: "Open supplier engagement targets",
      onLink: () => onJumpTo("calcs", {
        deepDive: { category: "purchased_goods" },
        chartSpec: {
          kind: "auto", by: "spend-supplier", topN: 5,
          title: "Top 5 suppliers · purchased goods category",
          tag: "Highest-leverage engagement",
        },
      }),
    });
  }
  if (topCatKey) {
    insights.push({
      key: "supplier-intensity-outlier",
      tag: "Outlier · investigate before finalising",
      isNew: true,
      title: <>Van Doorn Staal: 880 tCO₂e per €M spend — 3.2× category average</>,
      body: (
        <>
          One supplier has an emissions intensity of <strong>880 tCO₂e per €M spend</strong> —{" "}
          <strong>3.2×</strong> your category average. This is either a data-quality flag (wrong factor
          or unit basis) or a genuine high-priority engagement target. Either way, it should be
          investigated before you finalise Q1 results.
        </>
      ),
      details: (
        <p style={{fontSize:12, color:"var(--fe-fg-muted)"}}>
          Category average is ~275 tCO₂e per €M for industrial purchased goods. Outliers this far above the mean
          typically point to a unit-of-measure error, a misapplied spend-based factor, or a genuinely
          high-intensity material like virgin steel.
        </p>
      ),
      chart: (
        <>
          <div className="ai-modal__chart-title">Emissions intensity · suppliers vs category avg (tCO₂e per €M)</div>
          <HorizBarChart rows={[
            { label: "Van Doorn Staal",       value: 880, display:  "880", highlight: true },
            { label: "Tata Steel UK",         value: 410, display:  "410" },
            { label: "ABB Power Components",  value: 295, display:  "295" },
            { label: "Category average",      value: 275, display:  "275" },
            { label: "Henkel Adhesives",      value: 240, display:  "240" },
            { label: "Schiphol Logistics",    value: 180, display:  "180" },
          ]}/>
        </>
      ),
      link: "Investigate supplier",
      onLink: () => onJumpTo("calcs", {
        deepDive: { query: "Van Doorn" },
        chartSpec: {
          kind: "auto", by: "spend-supplier", topN: 6,
          title: "Emissions intensity · top suppliers (tCO₂e per €M)",
          tag: "Outlier",
        },
      }),
    });
  }
  insights.push({
    key: "scope3-1-yoy-methodology-drift",
    tag: "Audit risk · methodology drift",
    isNew: true,
    title: <>Scope 3.1 is +23% YoY — but only +5% is real activity change</>,
    body: (
      <>
        Your purchased-goods emissions rose <strong>23% YoY</strong>. <strong>18 percentage points</strong>{" "}
        of that change come from an <strong>EF version update</strong>, not real activity change.
        Real activity increase: <strong>+5%</strong>. Reporting the full 23% without flagging this
        creates <strong>audit risk</strong> at year-end review.
      </>
    ),
    details: (
      <p style={{fontSize:12, color:"var(--fe-fg-muted)"}}>
        Background: DEFRA 2025 raised industrial-spend factors ~15–20% versus DEFRA 2024 for several
        purchased-goods categories. The standard disclosure pattern is to restate the prior year on
        the new factor basis, or split the YoY change into "methodology" vs "activity" in the narrative.
      </p>
    ),
    chart: (
      <>
        <div className="ai-modal__chart-title">Scope 3.1 YoY change · decomposition (percentage points)</div>
        <HorizBarChart rows={[
          { label: "EF version update (DEFRA 2024 → 2025)", value: 18, display: "+18 pp", highlight: true },
          { label: "Real activity change",                  value:  5, display:  "+5 pp" },
          { label: "Reported YoY change (total)",           value: 23, display: "+23 pp" },
        ]} unit="pp"/>
      </>
    ),
    link: "Open Trends · YoY decomposition",
    onLink: () => onJumpTo("trends"),
  });
  if (topSite) {
    const secondSite = sortedSites[1];
    const siteRatio = secondSite ? (topSiteKg/secondSite[1]).toFixed(1) : null;
    const siteCalcCount = calcs.filter(c => c.site === topSite).length;
    insights.push({
      key: "heaviest-site",
      tag: "Heaviest site",
      title: (
        <>
          {(topSiteKg/1000).toFixed(1)} tCO₂e from {topSite}
          {secondSite ? <> — {siteRatio}× the next site</> : ""}
        </>
      ),
      body: (
        <>
          <strong>{topSite}</strong> accounts for <strong>{topSitePct}%</strong> of in-scope emissions across{" "}
          <strong>{siteCalcCount}</strong> calculations
          {secondSite ? <>, vs <strong>{secondSite[0]}</strong> next at <strong>{(secondSite[1]/1000).toFixed(1)} t</strong></> : ""}.
        </>
      ),
      details: (
        <p>
          Across {sortedSites.length} sites with activity in Q1, {topSite} leads on both electricity and on-site combustion.
        </p>
      ),
      chart: (
        <>
          <div className="ai-modal__chart-title">Emissions by site · tCO₂e</div>
          <HorizBarChart rows={sortedSites.map(([k, v]) => ({
            label: k,
            value: v/1000,
            display: (v/1000).toFixed(1) + " t",
            highlight: k === topSite,
          }))}/>
        </>
      ),
      link: "View detailed data",
      onLink: () => onJumpTo("calcs", {
        deepDive: { bu: topSite },
        chartSpec: {
          kind: "auto", by: "site", topN: 8,
          title: "Emissions by site · tCO₂e",
          tag: "Heaviest site",
          highlightKey: topSite,
        },
      }),
    });
  }

  // ---- Trends-style insights (period change, travel hotspot) ----
  const byEntry = {};
  calcs.forEach(c => { byEntry[c.entryId] = (byEntry[c.entryId]||0) + c.kgCO2e; });
  const topByEntry = Object.entries(byEntry).sort((a,b) => b[1]-a[1]).slice(0, 5).map(([eid, kg]) => {
    const e = entries.find(x => x.id === eid);
    return { id: eid, summary: e?.summary || eid, kg, pct: kg/total, category: e?.category };
  });
  const pareto5Kg  = topByEntry.reduce((s,t) => s + t.kg, 0);
  const pareto5Pct = Math.round(pareto5Kg / total * 100);
  const deltaKg    = total - 128400;
  const deltaPct   = (deltaKg / 128400) * 100;
  const flightKg   = calcs.filter(c => c.category === "flight").reduce((s,c) => s + c.kgCO2e, 0);
  const flightPct  = Math.round(flightKg / total * 100);
  const fleetKg    = calcs.filter(c => c.category === "diesel").reduce((s,c) => s + c.kgCO2e, 0);

  insights.push({
    key: "pareto",
    tag: "Pareto insight",
    title: <>{(pareto5Kg/1000).toFixed(1)} tCO₂e from 5 entries — {pareto5Pct}% of Q1 inventory</>,
    body: (
      <>
        Concentration is high — across <strong>{entries.length}</strong> entries this period, just 5 line items
        make up over a third of total emissions. The largest single entry is{" "}
        <strong>{topByEntry[0]?.summary}</strong> at <strong>{(topByEntry[0]?.kg/1000).toFixed(2)} t</strong>.
      </>
    ),
    chart: (
      <>
        <div className="ai-modal__chart-title">Top 5 individual entries · tCO₂e</div>
        <HorizBarChart rows={topByEntry.map((t, i) => ({
          label: t.summary,
          value: t.kg/1000,
          display: (t.kg/1000).toFixed(2) + " t",
          highlight: i === 0,
        }))}/>
      </>
    ),
    link: "View detailed data",
    onLink: () => onJumpTo("calcs", {
      deepDive: {},
      chartSpec: {
        kind: "auto", by: "entry", topN: 5,
        title: "Top 5 individual entries · tCO₂e",
        tag: "Pareto insight",
      },
    }),
  });
  insights.push({
    key: "period-change",
    tag: "Period change",
    isNew: true,
    title: <>Up {(deltaKg/1000).toFixed(1)} t vs Q4 2025 — +{deltaPct.toFixed(1)}%</>,
    body: (
      <>
        Q1 totalled <strong>{(total/1000).toFixed(1)} t</strong> vs <strong>{(128400/1000).toFixed(1)} t</strong> in Q4.
        Business travel ramping after the holiday slowdown and a one-off steel racking purchase drive most of the rise;
        fleet diesel fell after route optimisation.
      </>
    ),
    details: (
      <p style={{fontSize:12, color:"var(--fe-fg-muted)"}}>
        Quarter-over-quarter drivers, in order of impact — net change{" "}
        <strong style={{color:"var(--fe-fg)"}}>+{(deltaKg/1000).toFixed(1)} t</strong>.
      </p>
    ),
    chart: (
      <>
        <div className="ai-modal__chart-title">Δ vs Q4 2025 · tCO₂e</div>
        <DeltaBarChart rows={[
          { label: "Business travel ramp",   value:  8.4, display: "+8.4 t" },
          { label: "Steel racking (Rotterdam)", value: 4.7, display: "+4.7 t" },
          { label: "Heating gas (cold Feb)", value:  2.1, display: "+2.1 t" },
          { label: "Fleet diesel (route opt.)", value: -1.3, display: "−1.3 t" },
        ]}/>
      </>
    ),
    link: "View detailed data",
    onLink: () => onJumpTo("calcs", {
      deepDive: {},
      chartSpec: {
        kind: "static-delta",
        title: "Δ vs Q4 2025 · tCO₂e",
        tag: "Period change",
        rows: [
          { label: "Business travel ramp",        value:  8.4, display: "+8.4 t" },
          { label: "Steel racking (Rotterdam)",   value:  4.7, display: "+4.7 t" },
          { label: "Heating gas (cold Feb)",      value:  2.1, display: "+2.1 t" },
          { label: "Fleet diesel (route opt.)",   value: -1.3, display: "−1.3 t" },
        ],
      },
    }),
  });
  insights.push({
    key: "travel-hotspot",
    tag: "Travel hotspot",
    title: <>Two long-haul business flights ≈ 33% of Q1 travel emissions</>,
    body: (
      <>
        <strong>CDG→SIN</strong> and <strong>FRA→NRT</strong> in business class together emit more than your entire
        diesel fleet for Q1 ({(fleetKg/1000).toFixed(1)} t). Business travel as a whole drives{" "}
        <strong>{(flightKg/1000).toFixed(1)} t</strong> — <strong>{flightPct}%</strong> of Q1.
      </>
    ),
    details: (
      <p style={{fontSize:12, color:"var(--fe-fg-muted)"}}>
        Pattern breakdown across {entries.filter(e => e.category === "flight").length} Q1 flights — business-class
        long-haul is the dominant pattern by a wide margin.
      </p>
    ),
    chart: (
      <>
        <div className="ai-modal__chart-title">Share of Q1 travel emissions · by pattern</div>
        <HorizBarChart rows={[
          { label: "Business-class long-haul", value: 60, display: "~60%", highlight: true },
          { label: "Long-haul economy",        value: 25, display: "~25%" },
          { label: "Short-haul (<1,500 km)",   value: 15, display: "~15%" },
        ]} unit="%"/>
      </>
    ),
    link: "View flight breakdown",
    onLink: () => onJumpTo("calcs", {
      deepDive: { category: "flight" },
      chartSpec: {
        kind: "static-bar",
        title: "Share of Q1 travel emissions · by pattern",
        tag: "Travel hotspot",
        unit: "%",
        rows: [
          { label: "Business-class long-haul", value: 60, display: "~60%", highlight: true },
          { label: "Long-haul economy",        value: 25, display: "~25%" },
          { label: "Short-haul (<1,500 km)",   value: 15, display: "~15%" },
        ],
      },
    }),
  });
  return insights;
}

// Expose so Trends / Emission overview can render pinned cards by key.
window.buildHomeInsights = buildHomeInsights;
window.CAT_LABEL_MAP = CAT_LABEL_MAP;

// Public helper: compute the Home AI suggestions catalog from raw calcs +
// entries. Used by the Forward AI tab (which lives at the app shell level
// and needs the same suggestions Home shows, without mounting Overview).
window.computeHomeSuggestions = function(calcs, entries) {
  const total = (calcs || []).reduce((a, c) => a + c.kgCO2e, 0);
  const byScope = [1, 2, 3].map(s => ({
    scope: s,
    kg: (calcs || []).filter(c => c.scope === s).reduce((a, c) => a + c.kgCO2e, 0),
    color: s === 1 ? "#F35151" : s === 2 ? "#AD6EFF" : "#00BBA7",
  }));
  byScope.forEach(b => b.pct = total ? b.kg / total : 0);
  const byEntryKg = {};
  (calcs || []).forEach(c => { byEntryKg[c.entryId] = (byEntryKg[c.entryId]||0) + c.kgCO2e; });
  const topByEntry = Object.entries(byEntryKg)
    .sort((a,b) => b[1] - a[1]).slice(0, 5)
    .map(([eid, kg]) => {
      const e = (entries || []).find(x => x.id === eid);
      return { id: eid, summary: e?.summary || eid, kg, pct: total ? kg/total : 0, category: e?.category };
    });
  const catMap = {};
  (calcs || []).forEach(c => { catMap[c.category] = (catMap[c.category]||0) + c.kgCO2e; });
  const topCategories = Object.entries(catMap)
    .sort((a,b) => b[1] - a[1]).slice(0, 6)
    .map(([k, v]) => ({
      k, label: (window.CAT_LABEL_MAP && window.CAT_LABEL_MAP[k]) || k,
      kg: v, pct: total ? v/total : 0,
    }));
  return buildHomeSuggestions({ calcs, entries, total, byScope, topByEntry, topCategories });
};

// AI copilot suggestions for the Emission Overview page (legacy — kept for
// any deep links).
function overviewSuggestions({ calcs, entries, total, byScope }) {
  const fmt = (kg) => (kg/1000).toFixed(2);
  const totalT = (total/1000).toFixed(1);

  return [
    {
      key: "full-footprint",
      q: "Give me a summary of my Q1 2026 footprint",
      answer: () => (
        <>
          <p>
            Acme Industries' Q1 2026 footprint is <strong>{totalT} tCO₂e</strong>, up roughly
            <strong> 9.7%</strong> vs Q4 2025 ({(128400/1000).toFixed(1)} t).
          </p>
          <p>The split across scopes:</p>
          <div className="mini-bar-list">
            {byScope.map(b => (
              <div key={b.scope} className="mini-bar-row">
                <div className="label">Scope {b.scope}</div>
                <div className="track"><div className="fill" style={{width: (b.pct*100) + "%", background: b.color}}/></div>
                <div className="val">{fmt(b.kg)} t · {Math.round(b.pct*100)}%</div>
              </div>
            ))}
          </div>
          <p style={{marginTop: 10}}>
            <strong>Where it's coming from:</strong> ~50% from Scope 3 (purchased goods + business travel),
            ~25% from Scope 2 electricity, and ~25% from Scope 1 stationary &amp; mobile combustion.
            Travel and purchased goods are your biggest levers.
          </p>
        </>
      )
    },
    {
      key: "biggest-driver",
      q: "What's driving my emissions the most?",
      answer: () => {
        // Categorize calcs
        const byCat = {};
        calcs.forEach(c => { byCat[c.category] = (byCat[c.category]||0) + c.kgCO2e; });
        const sorted = Object.entries(byCat).sort((a,b) => b[1]-a[1]).slice(0,4);
        const LBL = { electricity:"Electricity", natural_gas:"Natural gas", diesel:"Diesel / fleet", flight:"Business travel", purchased_goods:"Purchased goods"};
        return (
          <>
            <p>
              The top 4 categories drive <strong>{Math.round(sorted.reduce((s,[,v])=>s+v,0)/total*100)}%</strong> of Q1 emissions:
            </p>
            <div className="mini-bar-list">
              {sorted.map(([k, v]) => (
                <div key={k} className="mini-bar-row">
                  <div className="label">{LBL[k] || k}</div>
                  <div className="track"><div className="fill" style={{width: (v/sorted[0][1]*100) + "%"}}/></div>
                  <div className="val">{(v/1000).toFixed(1)} t · {Math.round(v/total*100)}%</div>
                </div>
              ))}
            </div>
            <p style={{marginTop: 10, fontSize: 12, color: "var(--fe-fg-muted)"}}>
              The Trends page has a deeper view including individual hotspots and YoY changes.
            </p>
          </>
        );
      }
    },
    {
      key: "scope-split",
      q: "How are emissions split across the three scopes?",
      answer: () => (
        <>
          <p>
            Your inventory of <strong>{totalT} tCO₂e</strong> splits like this:
          </p>
          <table className="fai-mini-table">
            <thead>
              <tr><th>Scope</th><th>What's included</th><th className="right">tCO₂e</th><th className="right">Share</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Scope 1</td>
                <td>Stationary combustion (gas) + mobile combustion (diesel fleet)</td>
                <td className="right">{fmt(byScope[0].kg)}</td>
                <td className="right">{Math.round(byScope[0].pct*100)}%</td>
              </tr>
              <tr>
                <td>Scope 2</td>
                <td>Purchased electricity at 5 sites (UK, DE, FR, NL) · location-based</td>
                <td className="right">{fmt(byScope[1].kg)}</td>
                <td className="right">{Math.round(byScope[1].pct*100)}%</td>
              </tr>
              <tr>
                <td>Scope 3</td>
                <td>Purchased goods (3.1), business travel (3.6), and fuel WTT (3.3)</td>
                <td className="right">{fmt(byScope[2].kg)}</td>
                <td className="right">{Math.round(byScope[2].pct*100)}%</td>
              </tr>
            </tbody>
          </table>
          <p style={{marginTop: 10, fontSize: 12, color: "var(--fe-fg-muted)"}}>
            Scope 3 is partially covered — 3 of 15 categories are reported. The Calculation quality page shows the full coverage matrix.
          </p>
        </>
      )
    },
    {
      key: "review-ready",
      q: "Is my Q1 inventory ready to report?",
      answer: () => {
        const needsReview = calcs.filter(c => c.status === "pending" || c.status === "suggested").length;
        return (
          <>
            <p>
              Q1 is <strong>almost ready</strong> for reporting. Here's what I'd address first:
            </p>
            <table className="fai-mini-table">
              <tbody>
                <tr><td>Calculations completed</td><td className="right"><span className="tag ok">{calcs.length}</span></td></tr>
                <tr><td>Confirmed EF matches</td><td className="right"><span className="tag ok">{calcs.filter(c=>c.status==="confirmed").length}</span></td></tr>
                <tr><td>Pending review</td><td className="right"><span className="tag warn">{needsReview}</span></td></tr>
                <tr><td>Scope 3 categories covered</td><td className="right"><span className="tag warn">3 of 15</span></td></tr>
                <tr><td>Methodology documented</td><td className="right"><span className="tag warn">partial</span></td></tr>
              </tbody>
            </table>
            <p style={{marginTop: 10}}>
              For internal reporting you're <strong>good to close</strong>. For CSRD-grade assurance, document the
              materiality assessment and resolve the {needsReview} low-confidence calculations first.
            </p>
          </>
        );
      }
    },
  ];
}

function Overview({ calcs, entries, onJumpTo, view = "home" }) {
  const [s3Open, setS3Open] = React.useState(() => localStorage.getItem("fe-s3-open") === "1");
  const [hm12Open, setHm12Open] = React.useState(() => localStorage.getItem("fe-hm12-open") === "1");
  const [hm3Open, setHm3Open] = React.useState(() => localStorage.getItem("fe-hm3-open") === "1");
  const [showEmptyS3, setShowEmptyS3] = React.useState(() => localStorage.getItem("fe-s3-show-empty") === "1");
  const [qbOpen, setQbOpen] = React.useState(() => localStorage.getItem("fe-ov-qb-open") !== "0");
  React.useEffect(() => { localStorage.setItem("fe-ov-qb-open", qbOpen ? "1" : "0"); }, [qbOpen]);
  const [editLayout, setEditLayout] = React.useState(false);

  const total = calcs.reduce((s, c) => s + c.kgCO2e, 0);
  // Q4 2025 comparison (mock prior-period total in kg)
  const priorTotal = 128400; // 128.4 t — prior period reference
  const deltaKg = total - priorTotal;
  const deltaPct = priorTotal ? (deltaKg / priorTotal) * 100 : 0;
  const byScope = [1, 2, 3].map(s => ({
    scope: s,
    kg: calcs.filter(c => c.scope === s).reduce((a, c) => a + c.kgCO2e, 0),
    color: s === 1 ? "#F35151" : s === 2 ? "#AD6EFF" : "#00BBA7",
  }));
  byScope.forEach(b => b.pct = total ? b.kg / total : 0);

  // Used by suggestions (combined home suggestions)
  const byEntryKg = React.useMemo(() => {
    const m = {};
    calcs.forEach(c => { m[c.entryId] = (m[c.entryId]||0) + c.kgCO2e; });
    return m;
  }, [calcs]);
  const topByEntry = React.useMemo(() => {
    return Object.entries(byEntryKg).sort((a,b) => b[1]-a[1]).slice(0, 5).map(([eid, kg]) => {
      const e = entries.find(x => x.id === eid);
      return { id: eid, summary: e?.summary || eid, kg, pct: total ? kg/total : 0, category: e?.category };
    });
  }, [byEntryKg, entries, total]);
  const topCategories = React.useMemo(() => {
    const m = {};
    calcs.forEach(c => { m[c.category] = (m[c.category]||0) + c.kgCO2e; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0, 6).map(([k, v]) => ({
      k, label: CAT_LABEL_MAP[k] || k, kg: v, pct: total ? v/total : 0,
    }));
  }, [calcs, total]);

  // Combined AI suggestions + insights for Home (Home is the AI workspace).
  const homeSuggestions = React.useMemo(
    () => buildHomeSuggestions({ calcs, entries, total, byScope, topByEntry, topCategories }),
    [calcs, entries, total, byScope, topByEntry, topCategories]
  );
  const homeInsights = React.useMemo(
    () => buildHomeInsights({ calcs, entries, total, byScope, onJumpTo }),
    [calcs, entries, total, byScope, onJumpTo]
  );

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

  // ---- Quality-tile metrics ----
  const efMatchedShare    = pctOf(ef_confirmed + ef_high);
  const activityShare     = pctOf(dq_activity + dq_distance);
  const primaryDataShare  = pctOf(calcs.filter(c => /activity/i.test(c.method || "") && c.confidence >= 0.85).length);
  const verifiedShareDQ   = pctOf(ef_confirmed);
  const qualityLabelDQ    = verifiedShareDQ > 85 ? "Good" : verifiedShareDQ > 60 ? "Fair" : "Poor";

  // ---- Scope 3 coverage matrix ----
  const s3Coverage = SCOPE3_CATS.map(([num, name, key]) => {
    let covered = false;
    if (key === "purchased_goods") covered = calcs.some(c => c.category === "purchased_goods");
    else if (key === "flight")     covered = calcs.some(c => c.category === "flight");
    else if (key === "wtt")        covered = calcs.some(c => /WTT/i.test(c.activity || ""));
    return { num, name, covered };
  });
  const coveredCount = s3Coverage.filter(r => r.covered).length;

  // Combined Data Quality Score card — used on both Home and Emission overview.
  // Includes the header pill, the 3 coverage stats, an inline row of 4 quality
  // tiles, and the collapsible bucket breakdown.
  const dqCombinedCard = (
    <div className={`dq-card dq-combined dq-with-tiles ${qbOpen ? "open" : "closed"}`} style={{marginBottom: 24}}>
      <div className="dq-head">
        <div className="dq-title">Data Quality Score</div>
        <span className={`dq-pill ${qualityLabelDQ.toLowerCase()}`}>{qualityLabelDQ}</span>
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
        <div className="dq-coverage-stat">
          <div className="dq-coverage-n">{efMatchedShare}<span className="dq-coverage-u">%</span></div>
          <div className="dq-coverage-k">EF matching · {ef_confirmed + ef_high} of {total_n} confirmed</div>
        </div>
      </div>
      {qbOpen && (
        <div className="dq-breakdown">
          <DqBucketBlock title="Emission factor matching" subtitle={`${total_n} calculations`} buckets={efBuckets}/>
          <DqBucketBlock title="Calculation method" subtitle="Higher-quality methods at top" buckets={dqBuckets}/>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="page-head">
        <div className="page-head__main">
          <div className="page-head__titlerow">
            <h1 className="page-title">{view === "emission" ? "Emission overview" : "Home"}</h1>
            {view === "emission" && window.BoardActionsMenu && (
              <window.BoardActionsMenu
                editLayoutActive={editLayout}
                onToggleEditLayout={() => setEditLayout(v => !v)}
              />
            )}
          </div>
          <div className="page-subtitle">
            {view === "emission"
              ? <>GHG emissions · Reporting period Q1 2026</>
              : <>Acme Industries · What's new today · {new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short" })}</>}
          </div>
        </div>
      </div>

      <BoardFilters boardKey={view === "emission" ? "emission-overview" : "overview"} hidden={view !== "emission"} />

      {/* Pinned AI insights on default boards — appear at top of Emission overview */}
      {view === "emission" && (
        <PinnedBoardInsights
          boardKey="emission-overview"
          boardLabel="Emission overview"
          allInsights={buildHomeInsights({ calcs, entries, total, byScope, onJumpTo })}
          onJumpHome={() => onJumpTo("overview")}
        />
      )}

      <PageSections pageKey={view === "emission" ? "emission-overview" : "overview"} editMode={editLayout}>
      {view !== "emission" && (<>
      <PageSection id="activity-feed" label="Today's snapshot" noAddToReport>
        <div className="home-snapshot-row">
          <div className="home-snapshot-left">
            <ActivityFeed onJumpTo={onJumpTo}/>
          </div>
          <div className="home-snapshot-right">
            {dqCombinedCard}
          </div>
        </div>
      </PageSection>
      </>)}

      {view === "emission" && (<>
      <PageSection id="totals" label="Totals & scope donut">
      <div className="grid-2 ov-totals-row" style={{marginBottom: 20}}>
        <div className="calc-scale-hero">
          <div className="csh-metrics">
            <div className="csh-m">
              <div className="n">{(total/1000).toFixed(0)}<span className="u">t</span></div>
              <div className="d">CO₂e emissions calculated in Q1 2026</div>
            </div>
          </div>
          <div className={"csh-delta-block " + (deltaKg > 0 ? "up" : "down")}>
            <div className="csh-delta-row">
              <span className="csh-delta-arrow" aria-hidden>{deltaKg > 0 ? "▲" : "▼"}</span>
              <span className="csh-delta-abs">{deltaKg > 0 ? "+" : "−"}{Math.abs(deltaKg/1000).toFixed(1)} t</span>
              <span className="csh-delta-pct">{deltaKg > 0 ? "+" : "−"}{Math.abs(deltaPct).toFixed(1)}%</span>
            </div>
            <div className="csh-delta-base">vs Q4 2025 · {(priorTotal/1000).toFixed(1)} t</div>
          </div>
        </div>

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
                <svg className="donut-svg" viewBox="0 0 200 200" width="140" height="140" aria-label="Emissions by scope donut chart">
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
        </div>
      </div>
      </PageSection>

      <PageSection id="dq-score" label="Data Quality Score">
      {dqCombinedCard}
      </PageSection>

      <PageSection id="scope-1-2-sources" label="Scope 1 & 2 breakdown by source">
      {(() => {
        const C1 = "#F35151";  // matches donut Scope 1
        const C2 = "#AD6EFF";  // matches donut Scope 2
        const rows = [
          { scope: 1, label: "Stationary combustion",       value: 45,  color: C1 },
          { scope: 1, label: "Mobile combustion",           value: 33,  color: C1 },
          { scope: 1, label: "Fugitive and process emissions", value: 33, color: C1 },
          { scope: 2, label: "Purchased electricity",       value: 150, color: C2 },
          { scope: 2, label: "Electricity — mobile",        value: 150, color: C2 },
          { scope: 2, label: "Purchased heat and steam",    value: 130, color: C2 },
        ];
        const max = 150;
        const niceMax = 150;
        const ticks = [0, 30, 60, 90, 120, 150];
        return (
          <div className="card" style={{marginTop: 20}}>
            <div className="card-head">
              <div>
                <h3 className="card-title">Scope 1 &amp; 2 breakdown by source</h3>
                <div className="card-sub">Q1 2026 · tCO₂e by source category</div>
              </div>
              <button className="deep-dive" title="Deep dive" onClick={() => onJumpTo("calcs", { deepDive: { scope: 1 } })}>
                <Icon name="search" size={14}/><span className="dd-label">Deep dive</span>
              </button>
            </div>
            <div className="s12-chart" style={{marginTop: 16}}>
              <div className="s12-grid">
                {rows.map((r, i) => (
                  <React.Fragment key={i}>
                    <div className="s12-label">{r.label}</div>
                    <div className="s12-track">
                      <div className="s12-ticks" aria-hidden>
                        {ticks.slice(1).map(t => (
                          <span key={t} className="s12-tick-line" style={{left: (t/niceMax*100)+"%"}}/>
                        ))}
                      </div>
                      <div
                        className="s12-fill"
                        style={{width: (r.value/niceMax*100)+"%", background: r.color}}
                      />
                      <div className="s12-val" style={{left: "calc(" + (r.value/niceMax*100) + "% + 8px)"}}>
                        {r.value}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                {/* x-axis row */}
                <div className="s12-label" aria-hidden/>
                <div className="s12-axis">
                  {ticks.map(t => (
                    <span key={t} className="s12-axis-tick" style={{left: (t/niceMax*100)+"%"}}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="s12-footer">
                <div className="s12-legend">
                  <span className="s12-leg-item">
                    <span className="s12-leg-dot" style={{background: C1}}/>Scope 1
                  </span>
                  <span className="s12-leg-item">
                    <span className="s12-leg-dot" style={{background: C2}}/>Scope 2
                  </span>
                </div>
                <div className="s12-axis-unit">tCO₂e</div>
              </div>
            </div>
          </div>
        );
      })()}
      </PageSection>

      <PageSection id="scope-3" label="Scope 3 by category">
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
        const rowsAll = SCOPE3_CATS.map(([num, name, key, intent]) => ({
          num, name, intent: intent || "planned",
          kg: key ? (byS3[key] || 0) : 0,
        }));
        const reportedRows = rowsAll.filter(r => r.kg > 0);
        const plannedRows  = rowsAll.filter(r => r.kg <= 0 && r.intent === "planned");
        const excludedRows = rowsAll.filter(r => r.kg <= 0 && r.intent === "excluded");
        const max = Math.max(...rowsAll.map(r => r.kg), 1);
        const totalS3 = rowsAll.reduce((s, r) => s + r.kg, 0);
        const renderRow = (r) => {
          const catKey = SCOPE3_CATS.find(x => x[0] === r.num)?.[2];
          const calcCat = catKey === "purchased_goods" ? "purchased_goods"
                        : catKey === "flight" ? "flight"
                        : null;
          const go = () => {
            if (r.kg <= 0) return;
            onJumpTo("calcs", { deepDive: calcCat ? { category: calcCat } : { scope: 3 } });
          };
          return (
            <div className={"s3-row s3-row-" + r.intent + (r.kg > 0 ? " clickable" : "")} key={r.num} onClick={go} title={r.kg > 0 ? "Deep dive" : ""}>
              <span className="s3-label"><span className="s3-num">{r.num}</span> {r.name}</span>
              <span className="s3-track">
                {r.kg > 0 ? (
                  <span className="s3-fill" style={{width: (r.kg/max*100)+"%"}}/>
                ) : (
                  <span className={"s3-tag s3-tag-" + r.intent}>
                    {r.intent === "planned" ? "Planned · no data this period" : "Not material · excluded"}
                  </span>
                )}
              </span>
              <span className="s3-val">{r.kg > 0 ? (r.kg/1000).toFixed(2)+" t" : <span className="s3-zero">—</span>}</span>
            </div>
          );
        };
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
                  <div className="card-sub">
                    GHG Protocol · {reportedRows.length} reported, {plannedRows.length} planned, {excludedRows.length} excluded · {(totalS3/1000).toFixed(2)} tCO₂e
                  </div>
                </div>
                <span className={"s3-chev " + (s3Open ? "open" : "")} aria-hidden>▾</span>
              </button>
              <button className="deep-dive" title="Deep dive" onClick={(e) => { e.stopPropagation(); onJumpTo("calcs", { deepDive: { scope: 3 } }); }}>
                <Icon name="search" size={14}/><span className="dd-label">Deep dive</span>
              </button>
            </div>
            {s3Open && (
              <div className="s3-rows">
                {reportedRows.length > 0 && (
                  <>
                    <div className="s3-group-label">Reported · {reportedRows.length} categor{reportedRows.length === 1 ? "y" : "ies"} with data this period</div>
                    {reportedRows.map(renderRow)}
                  </>
                )}
                {plannedRows.length > 0 && (
                  <>
                    <div className="s3-group-label s3-group-planned">
                      In scope · awaiting data · {plannedRows.length} categor{plannedRows.length === 1 ? "y" : "ies"}
                    </div>
                    {plannedRows.map(renderRow)}
                  </>
                )}
                {excludedRows.length > 0 && (
                  <>
                    <button
                      type="button"
                      className="s3-empty-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        const n = !showEmptyS3;
                        setShowEmptyS3(n);
                        localStorage.setItem("fe-s3-show-empty", n ? "1" : "0");
                      }}
                    >
                      {showEmptyS3
                        ? `Hide ${excludedRows.length} excluded categories`
                        : `Show ${excludedRows.length} excluded categories — not material for our business`}
                    </button>
                    {showEmptyS3 && excludedRows.map(renderRow)}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })()}
      </PageSection>
      </>)}

      {view !== "emission" && (<>
      <PageSection id="ai-copilot" label="Forward AI chat" noAddToReport>
      {/* Forward AI copilot — Home is the single AI workspace */}
      <AICopilot
        page="overview"
        suggestions={homeSuggestions}
        placeholder="Ask Forward AI about your footprint, hotspots, trends, or what just changed…"
        onOpenForwardAI={(threadId) => {
          if (threadId && window.setActiveThreadId) window.setActiveThreadId(threadId);
          onJumpTo("forward-ai");
        }}
      />

      <PinnedAnswers page="overview" suggestions={homeSuggestions}/>
      </PageSection>

      <PageSection id="ai-insights" label="Forward AI insights" noAddToReport>
        <div className="home-insights-eyebrow">
          <Icon name="sparkle" size={12}/>
          <span>New prompts from your latest data</span>
          <span className="home-insights-meta">· tap a card to explore, then save it to a board</span>
        </div>
        <AIInsightsBoard
          pageKey="overview"
          insights={homeInsights}
          boardTargets={[
            { key: "emission-overview", label: "Emission overview" },
            { key: "trends",            label: "Trends" },
          ]}
        />
      </PageSection>
      </>)}
            </PageSections>
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
function TopCard({ title, rows, color, onDeepDive, onRowDeepDive, showRawTooltip }) {
  const max = rows[0]?.pct || 1;
  const totalPct = rows.reduce((s, r) => s + r.pct, 0);
  return (
    <div className="card top-card">
      <div className="card-head" style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
        <div style={{display:"flex", alignItems:"baseline", gap:10}}>
          <h3 className="card-title" style={{fontSize:14}}>{title}</h3>
          <div
            className="top-total"
            title="Sum of these 5 contributors as a share of this category's total emissions"
          >
            <span className="top-total-n">{Math.round(totalPct*100)}%</span>
            <span className="top-total-d"> share of category total</span>
          </div>
        </div>
        {onDeepDive && (
          <button className="deep-dive" onClick={onDeepDive} title="Deep dive"><Icon name="search" size={14}/><span className="dd-label">Deep dive</span></button>
        )}
      </div>
      <div className="top-rows">
        {rows.map((r, i) => {
          const tip = showRawTooltip && r._raw ? `${r.k} (${r._raw})` : r.k;
          return (
            <div className={"top-row " + (onRowDeepDive ? "clickable" : "")} key={i}
                 onClick={onRowDeepDive ? () => onRowDeepDive(r) : undefined}
                 title={onRowDeepDive ? `Deep dive — ${tip}` : tip}>
              <div className="top-label" title={tip}>{r.k}</div>
              <div className="top-track">
                <div className="top-fill" style={{width: (r.pct/max*100)+"%", background: color}}/>
              </div>
              <div className="top-pct">{Math.round(r.pct*100)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.Overview = Overview;
window.DqBucketBlock = DqBucketBlock;

// --- ActivityFeed --------------------------------------------------------
// Home page's "What's new today" feed: imports in flight, calc queue
// progress, and recent uploads. Activities are mocked but feel live (animated
// progress for in-flight items).
function ActivityFeed({ onJumpTo }) {
  // Animated progress for in-flight items (purely cosmetic — gives the feed
  // a "this is alive" pulse). Persists tick in localStorage so refreshes look
  // continuous rather than resetting.
  const [tick, setTick] = React.useState(() => {
    const t = parseFloat(localStorage.getItem("fe-home-feed-tick"));
    return Number.isFinite(t) ? t : 0;
  });
  React.useEffect(() => {
    const id = setInterval(() => {
      setTick(t => {
        const next = (t + 0.4) % 100;
        localStorage.setItem("fe-home-feed-tick", String(next));
        return next;
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);

  // Active jobs (in flight)
  const importProgress = Math.min(98, 62 + (tick * 0.6) % 30);
  const calcProgress   = Math.min(99, 71 + (tick * 0.4) % 25);

  return (
    <div className="home-feed">
      <div className="home-feed-eyebrow">
        <span className="home-feed-dot pulse"/>
        <span>Recent update</span>
      </div>

      <button type="button" className="home-feed-job" onClick={() => onJumpTo("data")}>
        <div className="home-feed-job-icon import"><Icon name="upload" size={14}/></div>
        <div className="home-feed-job-body">
          <div className="home-feed-job-title">Importing Q1 purchased goods</div>
          <div className="home-feed-job-meta">
            <span>spend_q1_finance.csv</span><span>·</span>
            <span>247 rows · {Math.round(importProgress)}% processed</span><span>·</span>
            <span>ETA ~2 min</span>
          </div>
          <div className="home-feed-progress">
            <div className="home-feed-progress-fill" style={{width: importProgress + "%"}}/>
          </div>
        </div>
        <Icon name="arrowRight" size={14} className="home-feed-job-arrow"/>
      </button>

      <button type="button" className="home-feed-job" onClick={() => onJumpTo("data", { filter: "needs_review" })}>
        <div className="home-feed-job-icon calc"><Icon name="sparkle" size={14}/></div>
        <div className="home-feed-job-body">
          <div className="home-feed-job-title">AI matching emission factors</div>
          <div className="home-feed-job-meta">
            <span>184 of 247 calculations matched</span><span>·</span>
            <span>{Math.round(calcProgress)}% complete</span><span>·</span>
            <span className="home-feed-meta-warn">12 low-confidence — needs review</span>
          </div>
          <div className="home-feed-progress">
            <div className="home-feed-progress-fill" style={{width: calcProgress + "%"}}/>
          </div>
        </div>
        <Icon name="arrowRight" size={14} className="home-feed-job-arrow"/>
      </button>
    </div>
  );
}
window.ActivityFeed = ActivityFeed;

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
