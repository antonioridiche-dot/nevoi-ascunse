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
import FamilyOriginalHome from "./pages/FamilyOriginalHome";
import { FamilyOfferPage } from "./pages/FamilyOriginalPost";
import { FamilyThankYouPage } from "./pages/FamilyOriginalPost";
import FamilyOriginalDashboard from "./pages/FamilyOriginalDashboard";
import { PbcHome, PbcOffer } from "./pages/PbcOriginalPages";
import { PbcCheckout, PbcThankYou } from "./pages/PbcOriginalCheckout";
import VrajiOriginalPost from "./pages/VrajiOriginalPost";
import VrajiOriginalHome from "./pages/VrajiOriginalHome";
import WeightlossOriginalSales from "./pages/WeightlossOriginalSales";
import WeightlossOriginalCheckout from "./pages/WeightlossOriginalCheckout";
import RelatiiOriginalHome from "./pages/RelatiiOriginalHome";
import RelatiiOriginalProduct from "./pages/RelatiiOriginalProduct";
import RelatiiOriginalOffer from "./pages/RelatiiOriginalOffer";
import RelatiiOriginalThankYou from "./pages/RelatiiOriginalThankYou";
import RelatiiOriginalLibrary from "./pages/RelatiiOriginalLibrary";
import RelatiiOriginalAffiliate from "./pages/RelatiiOriginalAffiliate";
import RelatiiOriginalAdmin from "./pages/RelatiiOriginalAdmin";
import RelatiiOriginalLegal from "./pages/RelatiiOriginalLegal";
import RelatiiOriginalFunnelMap from "./pages/RelatiiOriginalFunnelMap";

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
      <Route path={"/oferte/familieprotejata"} component={FamilyOriginalHome} />
      <Route path={"/oferte/familieprotejata/oto1"}>{() => <FamilyOfferPage step="oto1" />}</Route>
      <Route path={"/oferte/familieprotejata/ds1"}>{() => <FamilyOfferPage step="ds1" />}</Route>
      <Route path={"/oferte/familieprotejata/ds2"}>{() => <FamilyOfferPage step="ds2" />}</Route>
      <Route path={"/oferte/familieprotejata/thank-you"} component={FamilyThankYouPage} />
      <Route path={"/oferte/familieprotejata/dashboard"} component={FamilyOriginalDashboard} />
      <Route path={"/oferte/prieteni-cu-beneficii"} component={PbcHome} />
      <Route path={"/oferte/prieteni-cu-beneficii/oferta-speciala"}>{() => <PbcOffer stage="upsellOne" />}</Route>
      <Route path={"/oferte/prieteni-cu-beneficii/oferta-redusa"}>{() => <PbcOffer stage="downsell" />}</Route>
      <Route path={"/oferte/prieteni-cu-beneficii/program-avansat"}>{() => <PbcOffer stage="upsellTwo" />}</Route>
      <Route path={"/oferte/prieteni-cu-beneficii/checkout"} component={PbcCheckout} />
      <Route path={"/oferte/prieteni-cu-beneficii/multumim"} component={PbcThankYou} />
      <Route path={"/oferte/vraji/pas/1"} component={VrajiOriginalPost} />
      <Route path={"/oferte/vraji"} component={VrajiOriginalHome} />
      <Route path={"/oferte/weightloss"} component={WeightlossOriginalSales} />
      <Route path={"/oferte/weightloss/comanda"} component={WeightlossOriginalCheckout} />
      <Route path={"/oferte/relatii"} component={RelatiiOriginalHome} />
      <Route path={"/oferte/relatii/pentru-el"}>{() => <RelatiiOriginalProduct audience="barbati" />}</Route>
      <Route path={"/oferte/relatii/pentru-ea"}>{() => <RelatiiOriginalProduct audience="femei" />}</Route>
      <Route path={"/oferte/relatii/oferta/conversatii-jucause"}>{() => <RelatiiOriginalOffer offerId="conversatii-jucause" />}</Route>
      <Route path={"/oferte/relatii/oferta/downsell-conversatii"}>{() => <RelatiiOriginalOffer offerId="downsell-conversatii" />}</Route>
      <Route path={"/oferte/relatii/oferta/downsell-claritate"}>{() => <RelatiiOriginalOffer offerId="downsell-claritate" />}</Route>
      <Route path={"/oferte/relatii/oferta/downsell-mesaj"}>{() => <RelatiiOriginalOffer offerId="downsell-mesaj" />}</Route>
      <Route path={"/oferte/relatii/oferta/friendzone"}>{() => <RelatiiOriginalOffer offerId="friendzone" />}</Route>
      <Route path={"/oferte/relatii/oferta/downsell-friendzone"}>{() => <RelatiiOriginalOffer offerId="downsell-friendzone" />}</Route>
      <Route path={"/oferte/relatii/oferta/conexiune-incredere"}>{() => <RelatiiOriginalOffer offerId="conexiune-incredere" />}</Route>
      <Route path={"/oferte/relatii/multumesc"} component={RelatiiOriginalThankYou} />
      <Route path={"/oferte/relatii/biblioteca"} component={RelatiiOriginalLibrary} />
      <Route path={"/oferte/relatii/afiliere"} component={RelatiiOriginalAffiliate} />
      <Route path={"/oferte/relatii/admin"} component={RelatiiOriginalAdmin} />
      <Route path={"/oferte/relatii/legal/confidentialitate"}>{() => <RelatiiOriginalLegal page="confidentialitate" />}</Route>
      <Route path={"/oferte/relatii/legal/termeni"}>{() => <RelatiiOriginalLegal page="termeni" />}</Route>
      <Route path={"/oferte/relatii/legal/rambursari"}>{() => <RelatiiOriginalLegal page="rambursari" />}</Route>
      <Route path={"/oferte/relatii/legal/contact"}>{() => <RelatiiOriginalLegal page="contact" />}</Route>
      <Route path={"/oferte/relatii/funnel-dictionarul-barbatilor"} component={RelatiiOriginalFunnelMap} />
      <Route path={"/oferte/vraji/stai"} component={VrajiOriginalPost} />
      <Route path={"/oferte/vraji/pas/2"} component={VrajiOriginalPost} />
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
