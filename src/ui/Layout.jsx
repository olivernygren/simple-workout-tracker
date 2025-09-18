import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useStorage } from "../utils/storageContext.jsx";
import Button from "./components/Button";
import { ChevronLeft } from "lucide-react";

export default function Layout() {
  const { data } = useStorage();
  const nav = useNavigate();
  const loc = useLocation();

  const pageTitle = React.useMemo(() => {
    if (loc.pathname === "/") return "Programs";
    const parts = loc.pathname.split("/").filter(Boolean);
    if (parts[0] === "program" && parts[1]) {
      const p = data.programs.find((x) => x.id === parts[1]);
      return p?.name || "Program";
    }
    if (parts[0] === "workout" && parts[1]) {
      const w = data.workouts[parts[1]];
      return w?.name || "Workout";
    }
    return "";
  }, [loc.pathname, data]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-actions">
          {loc.pathname !== "/" && (
            <Button
              variant="icon"
              aria-label="Back"
              onClick={() => nav(-1)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                padding: 4,
              }}
            >
              <ChevronLeft size={18} />
            </Button>
          )}
          <div className="page-title">{pageTitle}</div>
          {loc.pathname !== "/" && <div style={{ width: 26 }} />}
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
