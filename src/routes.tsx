import type { ReactNode } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ActiveJourneyPage from "./pages/ActiveJourneyPage";
import AgentHubPage from "./pages/AgentHubPage";
import RiskMapPage from "./pages/RiskMapPage";
import IncidentHistoryPage from "./pages/IncidentHistoryPage";
import SettingsPage from "./pages/SettingsPage";

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  { name: "Landing", path: "/", element: <LandingPage />, public: true },
  { name: "Login", path: "/login", element: <LoginPage />, public: true },
  { name: "Dashboard", path: "/dashboard", element: <DashboardPage /> },
  { name: "Active Journey", path: "/journey", element: <ActiveJourneyPage /> },
  { name: "Agent Hub", path: "/agents", element: <AgentHubPage /> },
  { name: "Risk Map", path: "/risk-map", element: <RiskMapPage /> },
  { name: "Incidents", path: "/incidents", element: <IncidentHistoryPage /> },
  { name: "Settings", path: "/settings", element: <SettingsPage /> },
];
