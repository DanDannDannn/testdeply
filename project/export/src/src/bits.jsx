// Small shared components

function ScopeBadge({ scope }) {
  return <span className={`scope-badge scope-${scope}`}><span className="dot"></span>Scope {scope}</span>;
}

// Calculation lifecycle: pending → suggested → confirmed
// Entry lifecycle: draft → ready → processing → calculated (or failed)
const STATUS_LABELS = {
  // Calculations
  pending:    "Pending",
  suggested:  "Suggested",
  confirmed:  "Confirmed",
  // Entries
  draft:      "Draft",
  ready:      "Ready",
  processing: "Processing",
  calculated: "Calculated",
  failed:     "Failed",
};
const STATUS_ICONS = {
  pending:    "clock",
  suggested:  "sparkle",
  confirmed:  "check",
  draft:      "pencil",
  ready:      "arrowDown",
  processing: "clock",
  calculated: "check",
  failed:     "warn",
};
function StatusChip({ status }) {
  const icon = STATUS_ICONS[status];
  return (
    <span className={`status-chip st-${status}`}>
      {icon ? <Icon name={icon} size={12} className="ic"/> : <span className="dot"></span>}
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function Confidence({ value, showLabel = true, inline = true }) {
  const pct = Math.round(value * 100);
  const level = value < 0.6 ? "low" : value < 0.8 ? "med" : "";
  if (inline) {
    return (
      <span className={`conf-inline ${level}`}>
        {showLabel && <span>{pct}%</span>}
        <span className="m"><div style={{width: pct + "%"}} /></span>
      </span>
    );
  }
  return (
    <div className="ai-bar-track"><div className={`ai-bar-fill ${level}`} style={{width: pct + "%"}} /></div>
  );
}

function fmtKg(kg) {
  if (kg == null) return "—";
  if (kg >= 1000) return (kg/1000).toFixed(2) + " t";
  if (kg >= 100)  return kg.toFixed(0);
  if (kg >= 10)   return kg.toFixed(1);
  return kg.toFixed(2);
}
function fmtKgSmart(kg) {
  if (kg == null) return "—";
  return kg.toLocaleString(undefined, {maximumFractionDigits: kg < 10 ? 2 : kg < 100 ? 1 : 0});
}

function CatLabel({ cat }) {
  const m = {
    electricity: "Electricity",
    natural_gas: "Natural gas",
    diesel: "Diesel (fleet)",
    flight: "Business flight",
    purchased_goods: "Purchased goods",
  };
  return <span>{m[cat] || cat}</span>;
}

// Tri-state checkbox used in table header
function HeaderCheckbox({ checked, indeterminate, onChange }) {
  const ref = React.useRef(null);
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return <input ref={ref} type="checkbox" className="fe-cb" checked={!!checked} onChange={onChange}/>;
}

// Contextual toolbar shown when rows are selected
function BulkToolbar({ count, onClear, onStatus, onAssign, onCategory, onDelete, onExport, kind="entries" }) {
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [assignOpen, setAssignOpen] = React.useState(false);

  const STATUSES = kind === "calcs"
    ? [["confirmed","Confirm"], ["suggested","Send for review"], ["pending","Re-queue for AI match"]]
    : [["ready","Mark ready"], ["processing","Resubmit for calculation"], ["failed","Mark failed"]];

  return (
    <div className="bulk-toolbar" role="toolbar" aria-label="Bulk actions">
      <span className="count"><span className="n">{count}</span> selected</span>
      <span className="divider"/>

      <div className="popover-wrap">
        <button onClick={() => { setStatusOpen(v => !v); setAssignOpen(false); }}>
          <Icon name="check" size={16}/>Change status<Icon name="arrowDown" size={14}/>
        </button>
        {statusOpen && (
          <>
            <div style={{position:"fixed", inset:0, zIndex:30}} onClick={() => setStatusOpen(false)}/>
            <div className="popover">
              <div className="p-head">Set status for {count} rows</div>
              {STATUSES.map(([k, label]) => (
                <div key={k} className="p-item" onClick={() => { onStatus?.(k); setStatusOpen(false); }}>
                  <Icon name="check" size={14} style={{color:"var(--fe-fg-muted)"}}/>{label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="popover-wrap">
        <button onClick={() => { setAssignOpen(v => !v); setStatusOpen(false); }}>
          <Icon name="users" size={16}/>Reassign<Icon name="arrowDown" size={14}/>
        </button>
        {assignOpen && (
          <>
            <div style={{position:"fixed", inset:0, zIndex:30}} onClick={() => setAssignOpen(false)}/>
            <div className="popover">
              <div className="p-head">Assign {count} rows to</div>
              {(window.USERS || []).map(u => (
                <div key={u} className="p-item" onClick={() => { onAssign?.(u); setAssignOpen(false); }}>
                  <Icon name="users" size={14} style={{color:"var(--fe-fg-muted)"}}/>{u}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {onCategory && (
        <button onClick={onCategory}><Icon name="filter" size={16}/>Edit category</button>
      )}
      <button onClick={onExport}><Icon name="arrowDown" size={16}/>Export</button>
      <span className="divider"/>
      <button className="danger" onClick={onDelete}><Icon name="close" size={16}/>Delete</button>

      <button className="clear" onClick={onClear} title="Clear selection" aria-label="Clear selection"><Icon name="close" size={16}/></button>
    </div>
  );
}

Object.assign(window, { ScopeBadge, StatusChip, Confidence, STATUS_LABELS, fmtKg, fmtKgSmart, CatLabel, HeaderCheckbox, BulkToolbar });
