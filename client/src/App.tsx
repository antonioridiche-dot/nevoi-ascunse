import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import OfferMigrating from "./pages/OfferMigrating";
import { TarotAccess } from "./pages/TarotJourney";
import TarotOriginalHome from "./pages/TarotOriginalHome";
import TarotOriginalCheckout from "./pages/TarotOriginalCheckout";
import { TarotOriginalPostPurchase, TarotOriginalThankYou } from "./pages/TarotOriginalPost";
import TarotOriginalDashboard from "./pages/TarotOriginalDashboard";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/oferte/tarot"} component={TarotOriginalHome} />
      <Route path={"/oferte/tarot/citire"} component={TarotOriginalCheckout} />
      <Route path={"/oferte/tarot/asteapta"}>{() => <TarotOriginalPostPurchase productCode="numerology" />}</Route>
      <Route path={"/oferte/tarot/aproapegata"}>{() => <TarotOriginalPostPurchase productCode="portrait" />}</Route>
      <Route path={"/oferte/tarot/stai"}>{() => <TarotOriginalPostPurchase productCode="palm" />}</Route>
      <Route path={"/oferte/tarot/multumesc"} component={TarotOriginalThankYou} />
      <Route path={"/oferte/tarot/acces"} component={TarotAccess} />
      <Route path={"/oferte/tarot/dashboard"} component={TarotOriginalDashboard} />
      <Route path={"/oferte/:slug"} component={OfferMigrating} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
