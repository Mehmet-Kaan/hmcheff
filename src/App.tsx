import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { AdminPanel } from "./pages/AdminPanel";
import { HomePage } from "./pages/HomePage";
import { ProductDetail } from "./pages/ProductDetail";
import { Storefront } from "./pages/Storefront";
import "./App.css";

const scrollStoragePrefix = "hm-cheff-scroll:";

function getScrollStorageKey(path: string) {
  return `${scrollStoragePrefix}${path}`;
}

type ProductsScrollState = {
  hmCheffProductsScroll?: number;
  resetProductsScroll?: boolean;
  restoreProductsScroll?: boolean;
};

type HeaderActive = "home" | "corporate" | "products" | "contact";

function readStoredScroll(path: string) {
  const storedValue = window.sessionStorage.getItem(getScrollStorageKey(path));
  if (!storedValue) return undefined;

  const scrollY = Number(storedValue);
  return Number.isFinite(scrollY) ? scrollY : undefined;
}

function App() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollPositions = useRef(new Map<string, number>());
  const [homeActiveSection, setHomeActiveSection] = useState<HeaderActive>("home");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isProductDetail = location.pathname.startsWith("/urun/");
  const headerActive = location.pathname.startsWith("/urun")
    ? "products"
    : homeActiveSection;

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (location.pathname !== "/") {
      return undefined;
    }

    let animationFrame = 0;

    const updateActiveSection = () => {
      animationFrame = 0;

      const headerHeight =
        document.querySelector(".topbar")?.getBoundingClientRect().height ?? 0;
      const marker = headerHeight + 90;
      const contactSection = document.getElementById("iletisim");
      const corporateSection = document.getElementById("hakkimizda");

      if (contactSection && contactSection.getBoundingClientRect().top <= marker) {
        setHomeActiveSection("contact");
        return;
      }

      if (corporateSection && corporateSection.getBoundingClientRect().top <= marker) {
        setHomeActiveSection("corporate");
        return;
      }

      setHomeActiveSection("home");
    };

    const requestUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateActiveSection);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [location.hash, location.pathname]);

  useEffect(() => {
    const scrollKey = `${location.pathname}${location.search}`;
    let animationFrame = 0;

    const saveCurrentScroll = () => {
      animationFrame = 0;
      const scrollY = window.scrollY;
      scrollPositions.current.set(scrollKey, scrollY);
      window.sessionStorage.setItem(getScrollStorageKey(scrollKey), String(scrollY));
    };

    const handleScroll = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(saveCurrentScroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pagehide", saveCurrentScroll);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      saveCurrentScroll();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pagehide", saveCurrentScroll);
    };
  }, [location.pathname, location.search]);

  useLayoutEffect(() => {
    const scrollKey = `${location.pathname}${location.search}`;
    const positions = scrollPositions.current;
    const locationState = location.state as ProductsScrollState | null;
    const shouldResetProductsScroll =
      location.pathname === "/urunler" &&
      navigationType !== "POP" &&
      Boolean(locationState?.resetProductsScroll);
    const shouldRestoreProductsScroll =
      location.pathname === "/urunler" &&
      !shouldResetProductsScroll &&
      (Boolean(locationState?.restoreProductsScroll) ||
        typeof locationState?.hmCheffProductsScroll === "number");
    const saveScroll = () => {
      const scrollY = window.scrollY;
      positions.set(scrollKey, scrollY);
      window.sessionStorage.setItem(getScrollStorageKey(scrollKey), String(scrollY));
    };

    if (location.hash) {
      window.setTimeout(() => {
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ block: "start", behavior: "smooth" });
      }, 0);
      return saveScroll;
    }

    if (shouldResetProductsScroll) {
      positions.delete(scrollKey);
      window.sessionStorage.removeItem(getScrollStorageKey(scrollKey));
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      return saveScroll;
    }

    if (shouldRestoreProductsScroll) {
      const savedScroll =
        shouldRestoreProductsScroll && typeof locationState?.hmCheffProductsScroll === "number"
          ? locationState.hmCheffProductsScroll
          : positions.get(scrollKey) ?? readStoredScroll(scrollKey);

      if (typeof savedScroll === "number") {
        let attempts = 0;
        const restoreScroll = () => {
          window.scrollTo({ top: savedScroll, left: 0, behavior: "auto" });
          attempts += 1;

          if (attempts < 20 && Math.abs(window.scrollY - savedScroll) > 2) {
            window.requestAnimationFrame(restoreScroll);
          }
        };

        window.requestAnimationFrame(restoreScroll);

        return saveScroll;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    return saveScroll;
  }, [location.hash, location.pathname, location.search, location.state, navigationType]);

  if (isAdminRoute) {
    return (
      <Routes location={location}>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <SiteHeader active={headerActive} productDetail={isProductDetail} />
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/urunler" element={<Storefront />} />
        <Route path="/urun/:productId" element={<ProductDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SiteFooter />
    </div>
  );
}

export default App;
