// Data page — wraps All data + Calculations + dynamic saved views.
// Two built-in tabs ("All data", "Calculations"); then an EPHEMERAL
// "Chart deepdive" tab that appears whenever a chart deep-dive is active;
// then any number of user-saved views (Notion-style — rename, close, save).

const {
  useDataViews: _useDataViews,
  createDataView: _createDataView,
  deleteDataView: _deleteDataView,
  renameDataView: _renameDataView,
} = window;

// Inline-editable tab label. Double-click to rename; Enter / blur commits.
function EditableTabLabel({ value, onCommit, editable }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => { setDraft(value); }, [value]);
  if (!editable) return <span>{value}</span>;
  if (!editing) {
    return (
      <span
        onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
        title="Double-click to rename"
      >{value}</span>
    );
  }
  const commit = () => {
    const next = (draft || "").trim();
    if (next && next !== value) onCommit(next);
    setEditing(false);
  };
  return (
    <input
      autoFocus
      className="segment-rename"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); commit(); }
        if (e.key === "Escape") { setEditing(false); setDraft(value); }
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function DataPage(props) {
  const {
    calcPreset, calcs, entries, selCalcId, setSelCalcId,
    calcFilter, setCalcFilter,
    exploreFilter, setExploreFilter,
    onViewEntry, calcsBulk,
    selEntryId, setSelEntryId, preselectEntry,
    onViewCalc, onViewImport,
    entriesBatchFilter, onClearBatchFilter, entriesBulk,
    tab, setTab,
    onCloseDeepdive,        // () => void — clears chartSpec + sends user back to "all"
    onApplySavedView,       // (view) => void — restores chart/filter from a saved view
  } = props;

  const views = _useDataViews ? _useDataViews() : [];
  const [deepdiveName, setDeepdiveName] = React.useState("Chart deepdive");
  React.useEffect(() => {
    // Reset the name whenever a NEW chartSpec arrives (preset.tick bumps)
    setDeepdiveName("Chart deepdive");
  }, [calcPreset?.tick]);

  const needsReview = calcs.filter(c => c.status === "pending" || c.status === "suggested").length;
  const [headerEl, setHeaderEl] = React.useState(null);
  const headerRightRef = React.useCallback((el) => setHeaderEl(el), []);

  // Is the ephemeral deepdive tab live right now? — only when a chart context
  // is active. Suppress when the user is currently on a saved view tab (the
  // saved view "owns" that chart context, no need to show a redundant
  // ephemeral tab next to it).
  const onSavedViewTab = !!(tab && tab.startsWith("view:"));
  const hasChartContext = !!(calcPreset && (calcPreset.chartSpec || calcPreset.bu || calcPreset.scope || calcPreset.category || (calcPreset.query && calcPreset.query.length > 0)));
  const deepdiveActive = hasChartContext && !onSavedViewTab;

  // If the user is on a saved-view or deepdive tab that no longer exists, fall back.
  React.useEffect(() => {
    if (tab === "deepdive" && !deepdiveActive) {
      setTab("all");
    } else if (tab && tab.startsWith("view:")) {
      const id = tab.slice(5);
      if (!views.find(v => v.id === id)) setTab("all");
    }
  }, [tab, deepdiveActive, views.length]);

  // Active view object (if tab matches a saved view)
  const activeView = tab && tab.startsWith("view:") ? views.find(v => v.id === tab.slice(5)) : null;

  // Saved view "Save as new view" from the deepdive tab
  const saveCurrentAsView = () => {
    if (!_createDataView) return;
    const v = _createDataView({
      name: deepdiveName === "Chart deepdive" ? "Untitled view" : deepdiveName,
      filter: exploreFilter,
      chartSpec: calcPreset?.chartSpec || null,
      deepDive: {
        bu: calcPreset?.bu || null,
        scope: calcPreset?.scope || null,
        category: calcPreset?.category || null,
        query: calcPreset?.query || "",
      },
    });
    // Switch into the saved view — the ephemeral tab disappears because
    // `onSavedViewTab` is now true. The chart keeps rendering because
    // calcPreset still holds the same chart spec / deep-dive values, which
    // are conceptually now owned by the saved view.
    setTab("view:" + v.id);
    window.dispatchEvent(new CustomEvent("fe-toast", {
      detail: `Saved view "${v.name}" — rename anytime with double-click`,
    }));
  };

  const subtitle = tab === "all"
    ? <>Activity records and their calculated emissions · <b>{entries.length}</b> records · <b>{calcs.length}</b> calculations · Q1 2026</>
    : tab === "calcs"
    ? <>One row per emission calculation · <b>{calcs.length}</b> results in Q1 2026</>
    : tab === "deepdive"
    ? <>Chart-driven exploration · double-click the tab to rename, click <b>Save view</b> to keep it</>
    : activeView
    ? <>Saved view · independent filters and chart context</>
    : <>Data</>;

  return (
    <>
      <div className="page-head data-page-head">
        <div className="data-page-head-title">
          <h1 className="page-title">Data</h1>
          <div className="page-subtitle">{subtitle}</div>
        </div>
        <div className="data-header-right" ref={headerRightRef}/>
      </div>

      <div className="segments" role="tablist" aria-label="Data segments">
        <button
          role="tab"
          aria-selected={tab === "all"}
          className={`segment ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          <Icon name="home" size={14}/>
          <span>All data</span>
          <span className="segment-count">{entries.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === "calcs"}
          className={`segment ${tab === "calcs" ? "active" : ""}`}
          onClick={() => setTab("calcs")}
        >
          <Icon name="chart" size={14}/>
          <span>Calculations</span>
          <span className="segment-count">{calcs.length}</span>
          {needsReview > 0 && <span className="segment-pip alert" title={`${needsReview} need review`}/>}
        </button>

        {/* Ephemeral deepdive tab — only appears when chart context is active */}
        {deepdiveActive && (
          <div
            role="tab"
            aria-selected={tab === "deepdive"}
            className={`segment segment--ephemeral ${tab === "deepdive" ? "active" : ""}`}
            onClick={() => setTab("deepdive")}
          >
            <Icon name="search" size={14}/>
            <EditableTabLabel
              value={deepdiveName}
              onCommit={setDeepdiveName}
              editable={tab === "deepdive"}
            />
            {tab === "deepdive" && (
              <>
                <button
                  type="button"
                  className="segment-action"
                  onClick={(e) => { e.stopPropagation(); saveCurrentAsView(); }}
                  title="Save as view"
                  aria-label="Save as view"
                >
                  <Icon name="pin" size={12}/>
                </button>
                <button
                  type="button"
                  className="segment-close"
                  onClick={(e) => { e.stopPropagation(); onCloseDeepdive && onCloseDeepdive(); }}
                  title="Close (discard)"
                  aria-label="Close"
                >
                  <Icon name="close" size={12}/>
                </button>
              </>
            )}
          </div>
        )}

        {/* Saved views — one tab per view */}
        {views.map(v => (
          <div
            key={v.id}
            role="tab"
            aria-selected={tab === "view:" + v.id}
            className={`segment segment--saved ${tab === "view:" + v.id ? "active" : ""}`}
            onClick={() => {
              setTab("view:" + v.id);
              onApplySavedView && onApplySavedView(v);
            }}
          >
            <Icon name={v.icon || "search"} size={14}/>
            <EditableTabLabel
              value={v.name}
              onCommit={(next) => _renameDataView && _renameDataView(v.id, next)}
              editable={tab === "view:" + v.id}
            />
            {tab === "view:" + v.id && (
              <button
                type="button"
                className="segment-close"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete view "${v.name}"?`)) {
                    _deleteDataView && _deleteDataView(v.id);
                    // When the active saved view is deleted, also clear its
                    // chart context so we don't immediately resurrect it as an
                    // ephemeral "Chart deepdive" tab.
                    onCloseDeepdive && onCloseDeepdive();
                  }
                }}
                title="Delete view"
                aria-label="Delete view"
              >
                <Icon name="close" size={12}/>
              </button>
            )}
          </div>
        ))}
      </div>

      {tab === "all" && (
        <AllData
          entries={entries}
          calcs={calcs}
          headerPortal={headerEl}
          onViewEntry={(eid) => { setTab("all"); setSelEntryId(eid); }}
          onViewCalc={(cid) => { setTab("calcs"); onViewCalc(cid); }}
        />
      )}
      {tab === "calcs" && (
        <Calculations
          embedded
          headerPortal={headerEl}
          preset={null}
          calcs={calcs}
          entries={entries}
          selectedId={selCalcId}
          setSelectedId={setSelCalcId}
          filter={calcFilter}
          setFilter={setCalcFilter}
          onViewEntry={(eid) => { setTab("all"); onViewEntry(eid); }}
          bulk={calcsBulk}
        />
      )}
      {(tab === "deepdive" || (tab && tab.startsWith("view:"))) && (
        <Calculations
          embedded
          headerPortal={headerEl}
          preset={calcPreset}
          calcs={calcs}
          entries={entries}
          selectedId={selCalcId}
          setSelectedId={setSelCalcId}
          filter={exploreFilter}
          setFilter={setExploreFilter}
          onViewEntry={(eid) => { setTab("all"); onViewEntry(eid); }}
          bulk={calcsBulk}
        />
      )}
    </>
  );
}

Object.assign(window, { DataPage });
