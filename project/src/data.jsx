// Seed data — Forward Earth carbon accounting prototype
// Three linked entities: upload_batch -> data_entry -> calculation (1:M:M)

const BATCHES = [
  { id: "B-2026-03",  label: "March 2026 manual",     source: "manual",  date: "2026-03-31", uploadedBy: "Johannes Weber" },
  { id: "B-2026-02",  label: "Feb 2026 utility bills",  source: "pdf",     date: "2026-03-04", uploadedBy: "Johannes Weber", fileName: "utility-bills-feb-2026.pdf" },
  { id: "B-2026-Q1",  label: "Q1 travel (SAP Concur)", source: "erp",     date: "2026-04-05", uploadedBy: "System · Concur" },
  { id: "B-2026-FUEL","label": "Q1 fleet — WEX",        "source": "erp",   "date": "2026-04-02", "uploadedBy": "System · WEX" },
  { id: "B-2026-PG",  label: "Q1 purchased goods",     source: "csv",     date: "2026-04-10", uploadedBy: "Amelia Schroeder", fileName: "spend_q1_finance.csv" },
];

// Emission factors (simplified). Each has source + vintage + gas breakdown.
const FACTORS = {
  "ef-grid-uk":       { id:"ef-grid-uk",     name:"UK grid electricity — location-based", source:"BEIS/DEFRA 2025", vintage:"2025", unit:"kWh", kg_per_unit: 0.2075, gases:{ CO2: 0.198, CH4: 0.0004, N2O: 0.0091 } },
  "ef-grid-de":       { id:"ef-grid-de",     name:"DE grid electricity — location-based", source:"AIB/UBA 2025",    vintage:"2025", unit:"kWh", kg_per_unit: 0.380, gases:{ CO2: 0.370, CH4: 0.0012, N2O: 0.0088 } },
  "ef-grid-fr":       { id:"ef-grid-fr",     name:"FR grid electricity — location-based", source:"ADEME 2025",      vintage:"2025", unit:"kWh", kg_per_unit: 0.052 },
  "ef-gas-uk":        { id:"ef-gas-uk",      name:"Natural gas — gross CV",             source:"BEIS/DEFRA 2025", vintage:"2025", unit:"kWh", kg_per_unit: 0.1831 },
  "ef-gas-wtt":       { id:"ef-gas-wtt",     name:"Natural gas — WTT (upstream)",       source:"BEIS/DEFRA 2025", vintage:"2025", unit:"kWh", kg_per_unit: 0.0273 },
  "ef-diesel":        { id:"ef-diesel",      name:"Diesel (average biofuel blend)",      source:"BEIS/DEFRA 2025", vintage:"2025", unit:"L",   kg_per_unit: 2.512 },
  "ef-diesel-ch4":    { id:"ef-diesel-ch4",  name:"Diesel — CH₄",                       source:"BEIS/DEFRA 2025", vintage:"2025", unit:"L",   kg_per_unit: 0.00012 },
  "ef-diesel-n2o":    { id:"ef-diesel-n2o",  name:"Diesel — N₂O",                       source:"BEIS/DEFRA 2025", vintage:"2025", unit:"L",   kg_per_unit: 0.0158 },
  "ef-diesel-wtt":    { id:"ef-diesel-wtt",  name:"Diesel — WTT (upstream)",            source:"BEIS/DEFRA 2025", vintage:"2025", unit:"L",   kg_per_unit: 0.607 },
  "ef-flight-short":  { id:"ef-flight-short",name:"Air travel — short-haul economy",    source:"DEFRA 2025",      vintage:"2025", unit:"pax·km", kg_per_unit: 0.1558 },
  "ef-flight-long":   { id:"ef-flight-long", name:"Air travel — long-haul economy",     source:"DEFRA 2025",      vintage:"2025", unit:"pax·km", kg_per_unit: 0.1956 },
  "ef-flight-biz":    { id:"ef-flight-biz",  name:"Air travel — long-haul business",    source:"DEFRA 2025",      vintage:"2025", unit:"pax·km", kg_per_unit: 0.5671 },
  "ef-spend-steel":   { id:"ef-spend-steel", name:"Purchased goods — steel (spend)",    source:"EXIOBASE 2024",   vintage:"2024", unit:"€",   kg_per_unit: 0.412 },
  "ef-spend-it":      { id:"ef-spend-it",    name:"Purchased goods — IT services (spend)", source:"EXIOBASE 2024", vintage:"2024", unit:"€", kg_per_unit: 0.062 },
  "ef-spend-pack":    { id:"ef-spend-pack",  name:"Purchased goods — paper packaging",  source:"EXIOBASE 2024",   vintage:"2024", unit:"kg",  kg_per_unit: 0.941 },
  "ef-spend-office":  { id:"ef-spend-office",name:"Purchased goods — office supplies (spend)", source:"EXIOBASE 2024", vintage:"2024", unit:"€", kg_per_unit: 0.285 },
};

// Data entries — 36 rows across categories
// Each entry: category-specific fields live in .details
const ENTRIES = [
  // --- Electricity ---
  { id:"E-001", batchId:"B-2026-02", category:"electricity", date:"2026-02-14", site:"London HQ",
    summary:"12,450 kWh · UK grid · Half-hourly",
    details:{ kWh: 12450, grid_region:"UK (GB)", supplier:"EDF Energy", meter_id:"MPAN-19-6273-0044", tariff:"Half-hourly", renewable_share:"28% (residual mix)" } },
  { id:"E-002", batchId:"B-2026-02", category:"electricity", date:"2026-02-14", site:"Berlin HQ",
    summary:"24,980 kWh · DE grid",
    details:{ kWh: 24980, grid_region:"DE", supplier:"Vattenfall", meter_id:"OBIS-1.8.0", tariff:"Flat", renewable_share:"0% (location-based)"} },
  { id:"E-003", batchId:"B-2026-02", category:"electricity", date:"2026-02-14", site:"Paris Office",
    summary:"4,120 kWh · FR grid",
    details:{ kWh: 4120, grid_region:"FR", supplier:"Enedis", meter_id:"PRM-09223...", tariff:"Base"} },
  { id:"E-004", batchId:"B-2026-02", category:"electricity", date:"2026-01-31", site:"London HQ",
    summary:"11,860 kWh · UK grid",
    details:{ kWh: 11860, grid_region:"UK (GB)", supplier:"EDF Energy", meter_id:"MPAN-19-6273-0044"} },
  { id:"E-005", batchId:"B-2026-02", category:"electricity", date:"2026-01-31", site:"Berlin HQ",
    summary:"26,110 kWh · DE grid",
    details:{ kWh: 26110, grid_region:"DE", supplier:"Vattenfall", meter_id:"OBIS-1.8.0"} },
  { id:"E-006", batchId:"B-2026-02", category:"electricity", date:"2026-01-15", site:"Munich Warehouse",
    summary:"8,640 kWh · DE grid",
    details:{ kWh: 8640, grid_region:"DE", supplier:"SWM", meter_id:"OBIS-1.8.0"} },
  { id:"E-007", batchId:"B-2026-03", category:"electricity", date:"2026-03-28", site:"Rotterdam DC",
    summary:"18,900 kWh · NL grid",
    details:{ kWh: 18900, grid_region:"NL", supplier:"Eneco", meter_id:"NL-EAN-8716..."} },

  // --- Natural gas ---
  { id:"E-008", batchId:"B-2026-02", category:"natural_gas", date:"2026-02-14", site:"London HQ",
    summary:"38,400 kWh · heating gas",
    details:{ kWh: 38400, supplier:"British Gas", meter_id:"MPRN-1234-7788", cv:"gross", end_use:"Space heating"} },
  { id:"E-009", batchId:"B-2026-02", category:"natural_gas", date:"2026-01-31", site:"London HQ",
    summary:"42,900 kWh · heating gas",
    details:{ kWh: 42900, supplier:"British Gas", meter_id:"MPRN-1234-7788", cv:"gross"} },
  { id:"E-010", batchId:"B-2026-02", category:"natural_gas", date:"2026-02-14", site:"Berlin HQ",
    summary:"58,200 kWh · district gas",
    details:{ kWh: 58200, supplier:"GASAG", meter_id:"BE-1149...", cv:"gross"} },
  { id:"E-011", batchId:"B-2026-03", category:"natural_gas", date:"2026-03-28", site:"Munich Warehouse",
    summary:"12,800 kWh · heating gas",
    details:{ kWh: 12800, supplier:"SWM", meter_id:"MU-8812...", cv:"gross"} },

  // --- Diesel / fleet ---
  { id:"E-012", batchId:"B-2026-FUEL", category:"diesel", date:"2026-02-10", site:"UK Fleet",
    summary:"1,840 L · diesel · 4 vehicles",
    details:{ liters: 1840, vehicle_count: 4, avg_mpg: 42.1, card_issuer:"WEX", fuel_grade:"EN590 B7"} },
  { id:"E-013", batchId:"B-2026-FUEL", category:"diesel", date:"2026-02-10", site:"DE Fleet",
    summary:"3,260 L · diesel · 7 vehicles",
    details:{ liters: 3260, vehicle_count: 7, avg_mpg: 38.4, card_issuer:"WEX", fuel_grade:"EN590 B7"} },
  { id:"E-014", batchId:"B-2026-FUEL", category:"diesel", date:"2026-03-10", site:"DE Fleet",
    summary:"2,980 L · diesel · 7 vehicles",
    details:{ liters: 2980, vehicle_count: 7, avg_mpg: 39.0, card_issuer:"WEX"} },
  { id:"E-015", batchId:"B-2026-FUEL", category:"diesel", date:"2026-03-10", site:"UK Fleet",
    summary:"1,620 L · diesel · 4 vehicles",
    details:{ liters: 1620, vehicle_count: 4, avg_mpg: 43.0, card_issuer:"WEX"} },
  { id:"E-016", batchId:"B-2026-FUEL", category:"diesel", date:"2026-01-28", site:"Rotterdam DC",
    summary:"5,740 L · diesel · forklifts",
    details:{ liters: 5740, equipment:"6 forklifts", card_issuer:"Shell Fleet"} },

  // --- Flights ---
  { id:"E-017", batchId:"B-2026-Q1", category:"flight", date:"2026-02-03", site:"—",
    summary:"LHR → JFK · business · 2 pax",
    details:{ origin:"LHR", destination:"JFK", class:"Business", pax:2, distance_km: 5541, traveller:"A. Schroeder, J. Weber", ticket:"BA-114"} },
  { id:"E-018", batchId:"B-2026-Q1", category:"flight", date:"2026-02-18", site:"—",
    summary:"LHR → BER · economy · 1 pax",
    details:{ origin:"LHR", destination:"BER", class:"Economy", pax:1, distance_km: 932, traveller:"J. Weber", ticket:"BA-986"} },
  { id:"E-019", batchId:"B-2026-Q1", category:"flight", date:"2026-03-04", site:"—",
    summary:"CDG → SIN · business · 1 pax",
    details:{ origin:"CDG", destination:"SIN", class:"Business", pax:1, distance_km: 10739, traveller:"M. Dupont", ticket:"AF-254"} },
  { id:"E-020", batchId:"B-2026-Q1", category:"flight", date:"2026-03-14", site:"—",
    summary:"BER → MAD · economy · 3 pax",
    details:{ origin:"BER", destination:"MAD", class:"Economy", pax:3, distance_km: 1872, traveller:"Marketing team", ticket:"IB-3173"} },
  { id:"E-021", batchId:"B-2026-Q1", category:"flight", date:"2026-03-22", site:"—",
    summary:"LHR → DXB · economy · 2 pax",
    details:{ origin:"LHR", destination:"DXB", class:"Economy", pax:2, distance_km: 5495, traveller:"Sales", ticket:"EK-008"} },
  { id:"E-022", batchId:"B-2026-Q1", category:"flight", date:"2026-01-19", site:"—",
    summary:"LHR → EDI · economy · 4 pax",
    details:{ origin:"LHR", destination:"EDI", class:"Economy", pax:4, distance_km: 534, traveller:"Eng team", ticket:"BA-1440"} },
  { id:"E-023", batchId:"B-2026-Q1", category:"flight", date:"2026-03-29", site:"—",
    summary:"FRA → NRT · business · 1 pax",
    details:{ origin:"FRA", destination:"NRT", class:"Business", pax:1, distance_km: 9370, traveller:"CFO", ticket:"LH-710"} },

  // --- Purchased goods ---
  { id:"E-024", batchId:"B-2026-PG", category:"purchased_goods", date:"2026-01-20", site:"London HQ",
    summary:"Laptop refresh · €42,800 IT spend",
    details:{ supplier:"Apple Business", spend_eur: 42800, sku_count: 24, category_code:"IT hardware"} },
  { id:"E-025", batchId:"B-2026-PG", category:"purchased_goods", date:"2026-02-08", site:"Rotterdam DC",
    summary:"Steel racking · 8,420 kg",
    details:{ supplier:"Van Doorn Staal", spend_eur: 19600, mass_kg: 8420, category_code:"Steel - hot rolled"} },
  { id:"E-026", batchId:"B-2026-PG", category:"purchased_goods", date:"2026-02-26", site:"Berlin HQ",
    summary:"Paper packaging · 1,240 kg",
    details:{ supplier:"Mondi AG", spend_eur: 3140, mass_kg: 1240, category_code:"Paper and board"} },
  { id:"E-027", batchId:"B-2026-PG", category:"purchased_goods", date:"2026-03-12", site:"London HQ",
    summary:"Office supplies · €2,180",
    details:{ supplier:"Viking Direct", spend_eur: 2180, category_code:"Office supplies - mixed"} },
  { id:"E-028", batchId:"B-2026-PG", category:"purchased_goods", date:"2026-03-19", site:"Munich Warehouse",
    summary:"SaaS & cloud · €18,400",
    details:{ supplier:"AWS / Atlassian / Figma", spend_eur: 18400, category_code:"IT services - cloud"} },

  // --- More electricity / gas variety ---
  { id:"E-029", batchId:"B-2026-02", category:"electricity", date:"2026-03-14", site:"Paris Office",
    summary:"3,980 kWh · FR grid",
    details:{ kWh: 3980, grid_region:"FR", supplier:"Enedis"} },
  { id:"E-030", batchId:"B-2026-02", category:"electricity", date:"2026-03-14", site:"Rotterdam DC",
    summary:"19,640 kWh · NL grid",
    details:{ kWh: 19640, grid_region:"NL", supplier:"Eneco"} },
  { id:"E-031", batchId:"B-2026-02", category:"natural_gas", date:"2026-03-14", site:"Berlin HQ",
    summary:"44,100 kWh · district gas",
    details:{ kWh: 44100, supplier:"GASAG"} },
  { id:"E-032", batchId:"B-2026-03", category:"electricity", date:"2026-03-28", site:"Munich Warehouse",
    summary:"9,220 kWh · DE grid",
    details:{ kWh: 9220, grid_region:"DE", supplier:"SWM"} },
  { id:"E-033", batchId:"B-2026-FUEL", category:"diesel", date:"2026-02-24", site:"UK Fleet",
    summary:"1,790 L · diesel · 4 vehicles",
    details:{ liters: 1790, vehicle_count:4, card_issuer:"WEX"} },
  { id:"E-034", batchId:"B-2026-Q1", category:"flight", date:"2026-02-27", site:"—",
    summary:"BER → LHR · economy · 2 pax",
    details:{ origin:"BER", destination:"LHR", class:"Economy", pax:2, distance_km: 932, traveller:"Sales"} },
  { id:"E-035", batchId:"B-2026-PG", category:"purchased_goods", date:"2026-03-03", site:"Berlin HQ",
    summary:"Paper packaging · 880 kg",
    details:{ supplier:"Mondi AG", spend_eur: 2230, mass_kg: 880, category_code:"Paper and board"} },
  { id:"E-036", batchId:"B-2026-PG", category:"purchased_goods", date:"2026-02-15", site:"Rotterdam DC",
    summary:"Steel racking · 3,180 kg",
    details:{ supplier:"Van Doorn Staal", spend_eur: 7400, mass_kg: 3180, category_code:"Steel - hot rolled"} },
];

// --- Calculation helpers --------------------------------------------------
const scopeForCategory = { electricity: 2, natural_gas: 1, diesel: 1, flight: 3, purchased_goods: 3 };

// Build calculations. Some entries have multiple calcs (gas breakdowns, WTT).
function buildCalcs() {
  const calcs = [];
  let n = 1;
  const add = (entry, partial) => {
    const id = `C-${String(n).padStart(4,"0")}`; n++;
    calcs.push({
      id, entryId: entry.id, date: entry.date, site: entry.site,
      category: entry.category, scope: partial.scope ?? scopeForCategory[entry.category],
      ...partial,
    });
  };
  ENTRIES.forEach(e => {
    if (e.category === "electricity") {
      const ef = e.details.grid_region?.startsWith("UK") ? FACTORS["ef-grid-uk"]
               : e.details.grid_region === "DE" ? FACTORS["ef-grid-de"]
               : e.details.grid_region === "FR" ? FACTORS["ef-grid-fr"]
               : FACTORS["ef-grid-de"];
      add(e, {
        activity: `${e.details.kWh.toLocaleString()} kWh · ${e.details.grid_region||"grid"}`,
        gas:"CO₂e", method:"Location-based", factor: ef,
        quantity: e.details.kWh, unit:"kWh",
        kgCO2e: +(e.details.kWh * ef.kg_per_unit).toFixed(1),
        status: "verified",
        confidence: 0.97, reason:`Matched to ${ef.name} based on site country (${e.details.grid_region}) and meter type.`,
      });
    } else if (e.category === "natural_gas") {
      const combust = FACTORS["ef-gas-uk"];
      const wtt = FACTORS["ef-gas-wtt"];
      add(e, {
        activity: `${e.details.kWh.toLocaleString()} kWh · combustion`,
        gas:"CO₂e", method:"Activity-based", factor: combust,
        quantity: e.details.kWh, unit:"kWh",
        kgCO2e: +(e.details.kWh * combust.kg_per_unit).toFixed(1),
        status:"verified", confidence: 0.95,
        reason:"Matched on fuel type (natural gas) and gross calorific value convention."
      });
      add(e, {
        activity: `${e.details.kWh.toLocaleString()} kWh · WTT (upstream)`,
        scope:3, gas:"CO₂e", method:"Activity-based", factor: wtt,
        quantity: e.details.kWh, unit:"kWh",
        kgCO2e: +(e.details.kWh * wtt.kg_per_unit).toFixed(1),
        status:"verified", confidence: 0.88,
        reason:"Upstream well-to-tank auto-generated from parent combustion entry."
      });
    } else if (e.category === "diesel") {
      const co2 = FACTORS["ef-diesel"];
      add(e, {
        activity: `${e.details.liters.toLocaleString()} L · combustion CO₂`,
        gas:"CO₂", method:"Activity-based", factor: co2,
        quantity: e.details.liters, unit:"L",
        kgCO2e: +(e.details.liters * co2.kg_per_unit).toFixed(1),
        status: "verified", confidence: 0.96,
        reason:"Matched on fuel grade EN590 B7 and UK/DEFRA diesel factor."
      });
      add(e, {
        activity: `${e.details.liters.toLocaleString()} L · CH₄`,
        gas:"CH₄", method:"Activity-based", factor: FACTORS["ef-diesel-ch4"],
        quantity: e.details.liters, unit:"L",
        kgCO2e: +(e.details.liters * FACTORS["ef-diesel-ch4"].kg_per_unit).toFixed(3),
        status:"verified", confidence: 0.90,
        reason:"CH₄ co-emission from diesel combustion (small)."
      });
      add(e, {
        activity: `${e.details.liters.toLocaleString()} L · N₂O`,
        gas:"N₂O", method:"Activity-based", factor: FACTORS["ef-diesel-n2o"],
        quantity: e.details.liters, unit:"L",
        kgCO2e: +(e.details.liters * FACTORS["ef-diesel-n2o"].kg_per_unit).toFixed(1),
        status:"verified", confidence: 0.90,
        reason:"N₂O co-emission from diesel combustion."
      });
      add(e, {
        activity: `${e.details.liters.toLocaleString()} L · WTT (upstream)`,
        scope:3, gas:"CO₂e", method:"Activity-based", factor: FACTORS["ef-diesel-wtt"],
        quantity: e.details.liters, unit:"L",
        kgCO2e: +(e.details.liters * FACTORS["ef-diesel-wtt"].kg_per_unit).toFixed(1),
        status:"ai_matched", confidence: 0.82,
        reason:"Upstream fuel production & distribution (well-to-tank)."
      });
    } else if (e.category === "flight") {
      const dist = e.details.distance_km * e.details.pax;
      const isLong = e.details.distance_km > 3700;
      const isBiz = e.details.class === "Business";
      const ef = isBiz && isLong ? FACTORS["ef-flight-biz"]
               : isLong ? FACTORS["ef-flight-long"]
               : FACTORS["ef-flight-short"];
      add(e, {
        activity: `${dist.toLocaleString()} pax·km · ${e.details.class}`,
        gas:"CO₂e", method:"Distance-based", factor: ef,
        quantity: dist, unit:"pax·km",
        kgCO2e: +(dist * ef.kg_per_unit).toFixed(1),
        status: isBiz ? "ai_matched" : "under_review",
        confidence: isBiz ? 0.93 : 0.71,
        reason: isBiz
          ? `Matched to business long-haul factor based on class=${e.details.class}, distance=${e.details.distance_km}km.`
          : `Class could not be confirmed from itinerary — defaulted to economy. Please verify.`,
      });
    } else if (e.category === "purchased_goods") {
      const cat = e.details.category_code || "";
      let ef, act, unit, qty, conf, reason, status;
      if (cat.startsWith("Steel")) {
        ef = FACTORS["ef-spend-steel"]; qty = e.details.mass_kg; unit = "kg";
        act = `${qty.toLocaleString()} kg steel`;
        conf = 0.68; status="under_review";
        reason = "Spend-based fallback — supplier-specific PCF not available. Consider swapping for EPD once received.";
        // For steel, factor is spend-based; recompute as per-spend for realism:
        ef = { ...FACTORS["ef-spend-steel"], unit:"kg", name:"Steel (hot-rolled) — mass basis"};
      } else if (cat.startsWith("Paper")) {
        ef = FACTORS["ef-spend-pack"]; qty = e.details.mass_kg; unit = "kg";
        act = `${qty.toLocaleString()} kg paper packaging`;
        conf = 0.84; status="ai_matched";
        reason = "Matched on category 'Paper and board' with mass-based factor.";
      } else if (cat.includes("IT services")) {
        ef = FACTORS["ef-spend-it"]; qty = e.details.spend_eur; unit = "€";
        act = `€${qty.toLocaleString()} IT services`;
        conf = 0.58; status="pending_match";
        reason = "Low confidence — SaaS category is very heterogeneous. Reviewer input needed to pick the right sub-factor.";
      } else if (cat.includes("IT hardware")) {
        ef = FACTORS["ef-spend-it"]; qty = e.details.spend_eur; unit = "€";
        act = `€${qty.toLocaleString()} IT hardware`;
        conf = 0.49; status="pending_match";
        reason = "Spend-based IT services factor applied to hardware — mismatch likely. Suggested swap: Laptop LCA factor (Apple PCF).";
      } else {
        ef = FACTORS["ef-spend-office"]; qty = e.details.spend_eur; unit = "€";
        act = `€${qty.toLocaleString()} office supplies`;
        conf = 0.72; status="ai_matched";
        reason = "Matched on category 'Office supplies'.";
      }
      add(e, {
        activity: act, gas:"CO₂e", method:"Spend-based", factor: ef,
        quantity: qty, unit, kgCO2e: +(qty * ef.kg_per_unit).toFixed(1),
        status, confidence: conf, reason
      });
    }
  });

  // Migrate to new 3-state calculation taxonomy: pending | suggested | confirmed
  const CALC_MIGRATE = {
    pending_match: "pending",
    ai_matched:    "suggested",
    under_review:  "suggested",
    verified:      "confirmed",
    locked:        "confirmed",
  };
  calcs.forEach(c => { c.status = CALC_MIGRATE[c.status] || c.status; });

  // A few remain "pending" to show the queued state realistically
  calcs.forEach((c, i) => {
    if (c.status === "suggested" && c.confidence < 0.55 && i % 7 === 0) {
      c.status = "pending";
      c.confidence = null; // no AI suggestion yet
    }
  });

  return calcs;
}

const CALCS = buildCalcs();

// Enrich entries + calcs with columns seen in the screenshot (deterministic, seeded by id hash)
const BUSINESS_UNITS = ["Operations","Commercial","Finance","R&D","Supply chain"];
const USERS = ["Johannes Weber","Amelia Schroeder","Marc Dupont","Priya Rao","Lena Becker","System · Auto"];
const INPUT_TYPES = { manual:"Manual", csv:"Bulk import (CSV)", erp:"Integration (ERP)" };
function hash(s){ let h=0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i))|0; return Math.abs(h); }
function addDays(d, n){ const dt = new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10);}
ENTRIES.forEach(e => {
  const h = hash(e.id);
  e.business_unit = BUSINESS_UNITS[h % BUSINESS_UNITS.length];
  const cat = e.category;
  e.business_activity =
    cat==="electricity"   ? "Purchased electricity" :
    cat==="natural_gas"   ? "Stationary combustion — gas" :
    cat==="diesel"        ? "Mobile combustion — diesel" :
    cat==="flight"        ? "Business travel — air" :
                            "Upstream purchased goods";
  e.user_assigned = USERS[h % USERS.length];
  const b = BATCHES.find(x => x.id === e.batchId);
  e.data_input_type = INPUT_TYPES[b?.source || "manual"];
  e.start_date = e.date;
  e.end_date = addDays(e.date, 13 + (h%14));
  e.created_on = addDays(e.date, -2 - (h%5));
  e.last_updated = addDays(e.date, (h%9));
  e.files_count = (h % 3);
  e.notes = [
    "Reading reconciled with supplier invoice.",
    "Pending renewable certificate attachment.",
    "Unit converted from therms to kWh (×29.3001).",
    "",
    "Flagged anomaly — awaiting site confirmation.",
    "",
  ][h % 6];
  e.bulk_import_ref = (b?.source === "csv" || b?.source === "pdf") ? b.fileName : (b?.source === "erp" ? b.id : "—");
  e.custom_factor = (h % 7 === 0) ? "Supplier PCF v2.1" : "—";

  // Extra metadata captured during bulk import (optional columns the user mapped)
  // Only populated when the entry came from a bulk upload (csv/xlsx/erp).
  if (b && b.source !== "manual") {
    const COST_CENTERS = ["CC-4401 Operations","CC-2102 Facilities","CC-7330 Fleet","CC-9090 Travel","CC-3115 Commercial"];
    const VENDORS_BY_CAT = {
      electricity: ["EDF Energy","Vattenfall","Enedis","Eneco","SWM","Octopus Energy"],
      natural_gas: ["British Gas","GASAG","SWM","Total Energies","Engie"],
      diesel: ["WEX","Shell Fleet","BP Plus","Circle K Routex"],
      flight: ["American Express GBT","BCD Travel","FCM Travel","CWT"],
      goods: ["Siemens AG","3M Europe","BASF","Henkel","Bosch"],
    };
    const PAYMENT = ["Invoice (NET30)","Invoice (NET60)","Corporate card","Direct debit"];
    const APPROVERS = ["M. Hartmann","S. Okafor","L. Becker","J. Weber","A. Schroeder"];
    const REGIONS = { "London HQ":"UK","Berlin HQ":"DE","Paris Office":"FR","Munich Warehouse":"DE","Rotterdam DC":"NL","UK Fleet":"UK","DE Fleet":"DE","—":"—" };
    const vendorList = VENDORS_BY_CAT[e.category] || VENDORS_BY_CAT.goods;
    const invoiceSerial = String(10000 + (h % 89999));
    e.extra_meta = {
      "Supplier / vendor": e.details?.supplier || e.details?.card_issuer || vendorList[h % vendorList.length],
      "Invoice / reference #": (e.category === "flight" ? "TKT-" : "INV-") + invoiceSerial,
      "PO number": "PO-" + (2026000 + (h % 9999)),
      "Cost center": COST_CENTERS[h % COST_CENTERS.length],
      "GL account": "60" + (100 + (h % 899)) + " · " +
        (e.category === "electricity" ? "Utilities — electricity" :
         e.category === "natural_gas" ? "Utilities — gas" :
         e.category === "diesel" ? "Fleet fuel" :
         e.category === "flight" ? "Travel — air" : "COGS — purchased goods"),
      "Payment terms": PAYMENT[h % PAYMENT.length],
      "Approver": APPROVERS[h % APPROVERS.length],
      "Region code": REGIONS[e.site] || "—",
      "Currency": e.category === "flight" ? (h % 2 ? "EUR" : "GBP") : (e.site?.includes("London") ? "GBP" : e.site?.includes("Paris") ? "EUR" : "EUR"),
      "Amount (gross)": (e.category === "flight" ? "€" + (800 + (h % 4500)).toLocaleString() :
                        e.category === "diesel" ? "€" + (1800 + (h % 6000)).toLocaleString() :
                        "€" + (420 + (h % 8400)).toLocaleString()),
      "Source row": "Row " + (12 + (h % 820)),
      "Original filename": b.fileName || b.id,
    };
  }
});

// Propagate onto calcs for table rendering
CALCS.forEach(c => {
  const e = ENTRIES.find(x => x.id === c.entryId);
  if (!e) return;
  c.business_unit = e.business_unit;
  c.business_activity = e.business_activity;
  c.user_assigned = e.user_assigned;
  c.start_date = e.start_date;
  c.end_date = e.end_date;
  c.data_input_type = e.data_input_type;
  c.created_on = e.created_on;
  c.last_updated = e.last_updated;
  c.files_count = e.files_count;
  c.notes = e.notes;
  c.bulk_import_ref = e.bulk_import_ref;
  c.custom_factor = e.custom_factor;
});

// Derive entry lifecycle status from child calcs + field completeness
// draft     → mandatory fields missing (synthetic: a handful of entries with blank notes + missing meter/supplier)
// ready     → validations passed, no calcs yet
// processing→ submitted, some calcs in pending/suggested, none confirmed
// calculated→ at least one confirmed calc
// failed    → pipeline error (synthetic: a couple of entries)
ENTRIES.forEach(e => {
  const h = hash(e.id);
  const mine = CALCS.filter(c => c.entryId === e.id);
  const anyConfirmed = mine.some(c => c.status === "confirmed");
  const anyPending   = mine.some(c => c.status === "pending");
  const anySuggested = mine.some(c => c.status === "suggested");

  // Synthetic failed (rare — pipeline error)
  if (h % 37 === 0) { e.entry_status = "failed"; return; }
  // Synthetic draft (~1/8 — mandatory fields missing). Strip any calcs.
  if (h % 8 === 0) {
    e.entry_status = "draft";
    e.missing_fields = ["Supplier", "Meter / account #"].filter((_,i) => (h >> i) & 1);
    if (e.missing_fields.length === 0) e.missing_fields = ["Supplier"];
    e._strip_calcs = true;
    return;
  }
  // Synthetic ready (~1/9 — validated, not submitted). Strip any calcs.
  if (h % 9 === 0) {
    e.entry_status = "ready";
    e._strip_calcs = true;
    return;
  }

  if (anyConfirmed) { e.entry_status = "calculated"; return; }
  if (anyPending || anySuggested) { e.entry_status = "processing"; return; }
  if (mine.length === 0) { e.entry_status = "ready"; return; }
  e.entry_status = "processing";
});

// Strip calcs from draft/ready synthetic entries
const _stripIds = new Set(ENTRIES.filter(e => e._strip_calcs).map(e => e.id));
for (let i = CALCS.length - 1; i >= 0; i--) {
  if (_stripIds.has(CALCS[i].entryId)) CALCS.splice(i, 1);
}
ENTRIES.forEach(e => { delete e._strip_calcs; });

// Expose
Object.assign(window, { BATCHES, FACTORS, ENTRIES, CALCS, scopeForCategory, BUSINESS_UNITS, USERS });
