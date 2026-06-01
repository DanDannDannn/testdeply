// Sidebar for the prototype: Analyse / Calculate / Collect / Manage
function Sidebar({ route, setRoute, needsReviewCount }) {
  const NAV = [
    { section: "Analyse", items: [
      { key: "overview", label: "Overview", icon: "home" },
      { key: "trends",   label: "Trends",   icon: "trends" },
    ]},
    { section: "Calculate", items: [
      { key: "calcs",    label: "Calculations", icon: "chart", count: needsReviewCount, alert: true },
      { key: "factors",  label: "Emission Factors", icon: "filter" },
    ]},
    { section: "Collect", items: [
      { key: "entries",  label: "Data entries", icon: "collect" },
      { key: "import",   label: "Bulk imports\n",  icon: "upload" },
    ]},
    { section: "Manage", items: [
      { key: "org",      label: "Organization", icon: "users" },
      { key: "settings", label: "Settings",     icon: "settings" },
    ]},
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <LogoMark size={22} />
        <LogoWordmark height={14} color="#181615" />
      </div>

      <div className="nav-item" onClick={() => setRoute("getting-started")}>
        <Icon name="sparkle" size={18} />
        <span>Getting started</span>
        <span className="count">2/4</span>
      </div>

      {NAV.map(group => (
        <React.Fragment key={group.section}>
          <div className="sidebar-section-label">{group.section}</div>
          {group.items.map(it => (
            <div
              key={it.key}
              className={`nav-item ${route === it.key ? "active" : ""}`}
              onClick={() => setRoute(it.key)}
            >
              <Icon name={it.icon} size={18} />
              <span>{it.label}</span>
              {it.count ? <span className={`count ${it.alert ? "alert" : ""}`}>{it.count}</span> : null}
            </div>
          ))}
        </React.Fragment>
      ))}
    </aside>
  );
}

function Topbar({ title }) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Acme Industries GmbH</span>
        <Icon name="chevRight" size={12} />
        <span className="active">{title}</span>
      </div>
      <div className="topbar-search">
        <Icon name="search" size={16} />
        <input placeholder="Search entries, sites, factors…" />
      </div>
      <div className="topbar-icon"><Icon name="bell" size={18} /><span className="pip" /></div>
      <div className="topbar-icon"><Icon name="settings" size={18} /></div>
      <div className="topbar-avatar" title="Johannes Weber">JW</div>
    </header>
  );
}

Object.assign(window, { Sidebar, Topbar });
