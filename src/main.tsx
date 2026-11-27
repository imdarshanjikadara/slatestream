import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import "./styles.css";
import { Layout } from "./components/Layout";
import { Loading } from "./components/common";
import { ReplayProvider } from "./lib/replay";

const Overview = lazy(() => import("./pages/Overview"));
const Watch = lazy(() => import("./pages/Watch"));
const Race = lazy(() => import("./pages/Race"));
const Taste = lazy(() => import("./pages/Taste"));
const Findings = lazy(() => import("./pages/Findings"));
const Comparisons = lazy(() => import("./pages/Comparisons"));
const Guide = lazy(() => import("./pages/Guide"));
const NotFound = lazy(() => import("./pages/NotFound"));

const Page = ({ children }: { children: React.ReactNode }) => <Suspense fallback={<Loading />}>{children}</Suspense>;

function App() {
  return (
    <ReplayProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Page><Overview /></Page>} />
          <Route path="/watch" element={<Page><Watch /></Page>} />
          <Route path="/race" element={<Page><Race /></Page>} />
          <Route path="/taste" element={<Page><Taste /></Page>} />
          <Route path="/findings/:id?" element={<Page><Findings /></Page>} />
          <Route path="/comparisons" element={<Page><Comparisons /></Page>} />
          <Route path="/guide" element={<Page><Guide /></Page>} />
          <Route path="*" element={<Page><NotFound /></Page>} />
        </Route>
      </Routes>
    </ReplayProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
