// Data page — saved views store.
//
// Schema (localStorage key: fe-data-views-v1):
//   [
//     {
//       id: "v_xxx",
//       name: "Steel suppliers Q1",
//       icon: "search",
//       filter: "all" | "pending" | "suggested" | "confirmed",
//       chartSpec: {...} | null,
//       deepDive: { scope, category, bu, query } | null,
//       createdAt: ISO,
//     }
//   ]

const FE_DATA_VIEWS_KEY = "fe-data-views-v1";
const FE_DATA_VIEWS_EVT = "fe-data-views-changed";

function loadDataViews() {
  try {
    const v = JSON.parse(localStorage.getItem(FE_DATA_VIEWS_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}
function saveDataViews(arr) {
  localStorage.setItem(FE_DATA_VIEWS_KEY, JSON.stringify(arr));
  window.dispatchEvent(new CustomEvent(FE_DATA_VIEWS_EVT));
}
function rid() { return "v_" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); }

function createDataView({ name, filter, chartSpec, deepDive, icon = "search" }) {
  const v = {
    id: rid(),
    name: name && name.trim() ? name.trim() : "Untitled view",
    icon,
    filter: filter || "all",
    chartSpec: chartSpec || null,
    deepDive: deepDive || null,
    createdAt: new Date().toISOString(),
  };
  saveDataViews([...loadDataViews(), v]);
  return v;
}
function deleteDataView(id) {
  saveDataViews(loadDataViews().filter(v => v.id !== id));
}
function renameDataView(id, name) {
  saveDataViews(loadDataViews().map(v => v.id === id ? { ...v, name: (name && name.trim()) || v.name } : v));
}

function useDataViews() {
  const [views, setViews] = React.useState(loadDataViews);
  React.useEffect(() => {
    const h = () => setViews(loadDataViews());
    window.addEventListener(FE_DATA_VIEWS_EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(FE_DATA_VIEWS_EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return views;
}

Object.assign(window, {
  loadDataViews, saveDataViews, createDataView, deleteDataView, renameDataView, useDataViews,
});
