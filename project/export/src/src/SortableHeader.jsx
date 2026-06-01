// Shared sortable + filterable column header for tables.
// Used by Data entries, Calculations, and the Bulk import log.
//
// Props:
//   label        string — header text
//   colKey       string — stable key for this column (matches sort.key)
//   sort         {key, dir} — current active sort
//   onSort       (key, dir) => void
//   align        "left" | "right" (default "left")
//   filterValue  current per-column filter value (string or "all")
//   onFilter     (value) => void
//   filterOptions  [{k, l}] — if provided, filter is a dropdown select
//   placeholder  string — text-input filter placeholder (only when no options)
//   disableFilter  bool — no filter affordance for this column
//   disableSort    bool — no sort affordance for this column

function SortableHeader({
  label, colKey, sort, onSort,
  align = "left",
  filterValue, onFilter, filterOptions, placeholder,
  disableFilter, disableSort,
}) {
  const [open, setOpen] = React.useState(false);
  const active = sort?.key === colKey;
  const dir = active ? sort.dir : null;
  const filtered = filterValue && filterValue !== "all" && filterValue !== "";

  const toggleSort = (e) => {
    if (disableSort) return;
    e.stopPropagation();
    if (!active) onSort(colKey, "asc");
    else if (dir === "asc") onSort(colKey, "desc");
    else onSort(null, null);
  };

  return (
    <div className={"sh " + (align === "right" ? "right " : "") + (active ? "active " : "") + (filtered ? "filtered " : "")}
         onClick={toggleSort}
         title={disableSort ? label : `Click to sort ${label}`}>
      <span className="sh-label">{label}</span>
      {!disableSort && (
        <span className="sh-sort-ind">
          {active
            ? <Icon name={dir === "asc" ? "arrowUp" : "arrowDown"} size={11}/>
            : <span className="sh-sort-idle">
                <Icon name="arrowUp" size={9}/>
                <Icon name="arrowDown" size={9}/>
              </span>}
        </span>
      )}
      {(!disableFilter || !disableSort) && (
        <button className={"sh-menu " + (filtered ? "on" : "")}
                onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
                title="Sort & filter"
                aria-label={`Sort and filter ${label}`}>
          <Icon name="filter" size={11}/>
        </button>
      )}
      {open && (
        <>
          <div className="sh-overlay" onClick={(e) => { e.stopPropagation(); setOpen(false); }}/>
          <div className="sh-pop" onClick={(e) => e.stopPropagation()}>
            {!disableSort && (
              <>
                <div className="sh-pop-sect">Sort</div>
                <div className={"sh-pop-item " + (active && dir === "asc" ? "active" : "")}
                     onClick={() => { onSort(colKey, "asc"); setOpen(false); }}>
                  <Icon name="arrowUp" size={12}/>
                  <span>Sort ascending</span>
                </div>
                <div className={"sh-pop-item " + (active && dir === "desc" ? "active" : "")}
                     onClick={() => { onSort(colKey, "desc"); setOpen(false); }}>
                  <Icon name="arrowDown" size={12}/>
                  <span>Sort descending</span>
                </div>
                {active && (
                  <div className="sh-pop-item muted"
                       onClick={() => { onSort(null, null); setOpen(false); }}>
                    <Icon name="close" size={12}/>
                    <span>Clear sort</span>
                  </div>
                )}
              </>
            )}
            {!disableFilter && (
              <>
                {!disableSort && <div className="sh-pop-div"/>}
                <div className="sh-pop-sect">Filter</div>
                {filterOptions ? (
                  <div className="sh-pop-scroll">
                    <div className={"sh-pop-item " + ((!filterValue || filterValue === "all") ? "active" : "")}
                         onClick={() => { onFilter("all"); setOpen(false); }}>
                      <span>All</span>
                      {(!filterValue || filterValue === "all") && <Icon name="check" size={12}/>}
                    </div>
                    {filterOptions.map(o => (
                      <div key={o.k}
                           className={"sh-pop-item " + (filterValue === o.k ? "active" : "")}
                           onClick={() => { onFilter(o.k); setOpen(false); }}>
                        <span>{o.l}</span>
                        {filterValue === o.k && <Icon name="check" size={12}/>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sh-pop-input">
                    <Icon name="search" size={12}/>
                    <input
                      autoFocus
                      type="text"
                      placeholder={placeholder || `Filter ${label.toLowerCase()}…`}
                      value={filterValue || ""}
                      onChange={(e) => onFilter(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setOpen(false); }}
                    />
                    {filterValue && (
                      <button className="sh-pop-clear"
                              onClick={() => onFilter("")}
                              title="Clear">
                        <Icon name="close" size={11}/>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Shared comparator used by tables — handles strings, numbers, null-ish.
function cmpBy(a, b, getter, dir) {
  const av = getter(a); const bv = getter(b);
  const aEmpty = av === null || av === undefined || av === "" || av === "—";
  const bEmpty = bv === null || bv === undefined || bv === "" || bv === "—";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;  // empties always last
  if (bEmpty) return -1;
  let r;
  if (typeof av === "number" && typeof bv === "number") r = av - bv;
  else r = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
  return dir === "desc" ? -r : r;
}

Object.assign(window, { SortableHeader, cmpBy });
