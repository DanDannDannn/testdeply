// Sidebar for the prototype: Analyse / Collect / Manage
function Sidebar({ route, setRoute, needsReviewCount, onCreateReport, reports = [] }) {
  // `stub: true` items aren't wired into routes — clicking fires a toast
  // so the rest of the nav feels real without us actually building those pages.
  const NAV = [
    { section: "Analyse", items: [
      { key: "overview",          label: "Home",              icon: "home" },
      { key: "emission-overview", label: "Emission overview", icon: "chart" },
      { key: "hotspot",           label: "Hotspot analysis",  icon: "chart" },
      { key: "trends",            label: "Trends",            icon: "trends" },
    ]},
    { section: "Collect", items: [
      { key: "data",   label: "Data",        icon: "collect" },
      { key: "import", label: "Bulk import", icon: "upload", stub: true },
    ]},
    { section: "Manage", items: [
      { key: "settings", label: "Company settings", icon: "settings", stub: true },
      { key: "users",    label: "Users",            icon: "users",    stub: true },
    ]},
  ];

  const stubClick = (label) => {
    window.dispatchEvent(new CustomEvent("fe-toast", {
      detail: `${label} — not built in this prototype`,
    }));
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <LogoFull height={22} color="#181615" />
      </div>

      <div
        className={`nav-item nav-forward-ai ${route === "forward-ai" ? "active" : ""}`}
        onClick={() => setRoute("forward-ai")}
        title="Forward AI — your saved conversations"
      >
        <Icon name="sparkle" size={18} />
        <span>Forward AI</span>
      </div>

      <div className="sidebar-nav">
        {NAV.map(group => (
          <React.Fragment key={group.section}>
            <div className="sidebar-section-label">{group.section}</div>
            {group.items.map(it => (
              <div
                key={it.key}
                className={`nav-item ${route === it.key ? "active" : ""} ${it.stub ? "nav-stub" : ""}`}
                onClick={() => it.stub ? stubClick(it.label) : setRoute(it.key)}
                title={it.stub ? `${it.label} — not built in this prototype` : it.label}
              >
                <Icon name={it.icon} size={18} />
                <span>{it.label}</span>
                {it.stub && <span className="stub-dot" aria-hidden="true" />}
                {it.count ? <span className={`count ${it.alert ? "alert" : ""}`}>{it.count}</span> : null}
              </div>
            ))}
            {group.section === "Analyse" && (
              <>
                {reports.map(r => (
                  <div
                    key={r.id}
                    className={`nav-item nav-report ${route === `report:${r.id}` ? "active" : ""}`}
                    onClick={() => setRoute(`report:${r.id}`)}
                    title={r.name}
                  >
                    <Icon name="document" size={18} />
                    <span style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{r.name}</span>
                    {r.standard && <span className="count" title={r.standard}>{r.standard.split(" ")[0]}</span>}
                  </div>
                ))}
                <div
                  className="nav-item nav-action"
                  onClick={onCreateReport}
                  title="Create a custom report board"
                >
                  <Icon name="plus" size={18} />
                  <span>New board</span>
                </div>
              </>
            )}
          </React.Fragment>
        ))}
      </div>

      <SidebarAccount />
    </aside>
  );
}

// Sticky account pill at the bottom of the sidebar — replaces the topbar
// account chrome (avatar + bell + settings gear).
function SidebarAccount() {
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

  const stub = (label) => {
    window.dispatchEvent(new CustomEvent("fe-toast", {
      detail: `${label} — not built in this prototype`,
    }));
    setOpen(false);
  };

  return (
    <div className="sidebar-account" ref={ref}>
      <button
        type="button"
        className={"sidebar-account__pill" + (open ? " is-open" : "")}
        onClick={() => setOpen(o => !o)}
      >
        <span className="sidebar-account__avatar" aria-hidden>JW</span>
        <span className="sidebar-account__who">
          <span className="sidebar-account__name">Johannes Weber</span>
          <span className="sidebar-account__role">Acme Industries · Admin</span>
        </span>
        <span className="sidebar-account__chev" aria-hidden>
          <Icon name="chev" size={14}/>
        </span>
      </button>
      {open && (
        <div className="sidebar-account__menu" role="menu">
          <button type="button" className="sidebar-account__item" onClick={() => stub("Notifications")}>
            <Icon name="bell" size={14}/><span>Notifications</span>
            <span className="sidebar-account__pip" aria-hidden/>
          </button>
          <button type="button" className="sidebar-account__item" onClick={() => stub("Account settings")}>
            <Icon name="settings" size={14}/><span>Account settings</span>
          </button>
          <button type="button" className="sidebar-account__item" onClick={() => stub("Help & support")}>
            <Icon name="info" size={14}/><span>Help &amp; support</span>
          </button>
          <div className="sidebar-account__sep"/>
          <button type="button" className="sidebar-account__item sidebar-account__item--danger" onClick={() => stub("Sign out")}>
            <Icon name="arrowRight" size={14}/><span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Topbar() { return null; }

Object.assign(window, { Sidebar, Topbar });
