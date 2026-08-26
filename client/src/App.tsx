import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import React from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";
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
import PbcLegalUnavailable from "./pages/PbcLegalUnavailable";
import VrajiOriginalPost from "./pages/VrajiOriginalPost";
import VrajiOriginalHome from "./pages/VrajiOriginalHome";
import VrajiOriginalThankYou from "./pages/VrajiOriginalThankYou";
import VrajiOriginalLibrary from "./pages/VrajiOriginalLibrary";
import WeightlossOriginalSales from "./pages/WeightlossOriginalSales";
import WeightlossOriginalCheckout from "./pages/WeightlossOriginalCheckout";
import WeightlossOriginalUpsell from "./pages/WeightlossOriginalUpsell";
import WeightlossOriginalThankYou from "./pages/WeightlossOriginalThankYou";
import WeightlossOriginalLegal from "./pages/WeightlossOriginalLegal";
import WeightlossOriginalAffiliate from "./pages/WeightlossOriginalAffiliate";
import WeightlossOriginalAdmin from "./pages/WeightlossOriginalAdmin";
import RelatiiOriginalHome from "./pages/RelatiiOriginalHome";
import RelatiiOriginalProduct from "./pages/RelatiiOriginalProduct";
import RelatiiOriginalOffer from "./pages/RelatiiOriginalOffer";
import RelatiiOriginalThankYou from "./pages/RelatiiOriginalThankYou";
import RelatiiOriginalLibrary from "./pages/RelatiiOriginalLibrary";
import RelatiiOriginalAffiliate from "./pages/RelatiiOriginalAffiliate";
import RelatiiOriginalAdmin from "./pages/RelatiiOriginalAdmin";
import RelatiiOriginalLegal from "./pages/RelatiiOriginalLegal";
import RelatiiOriginalFunnelMap from "./pages/RelatiiOriginalFunnelMap";
import CalendarLuckyAdmin from "./pages/CalendarLuckyAdmin";
import CalendarLuckyPreview from "./pages/CalendarLuckyPreview";
import { IubireLibrary, IubireThankYou } from "./pages/IubireOriginalAccess";
import { IubireOriginalCheckout, IubireOriginalHome } from "./pages/IubireOriginalFunnel";
import ArmoniiOriginalHome from "./pages/ArmoniiOriginalHome";
import ArmoniiOriginalConfirmation from "./pages/ArmoniiOriginalConfirmation";
import LinisteOriginalHome from "./pages/LinisteOriginalHome";
import LinisteOriginalQuiz from "./pages/LinisteOriginalQuiz";
import LinisteOriginalTheme from "./pages/LinisteOriginalTheme";
import LinisteOriginalCheckout, { LinisteOriginalOffer, LinisteOriginalThankYou } from "./pages/LinisteOriginalCheckout";
import LinisteOriginalRecovery from "./pages/LinisteOriginalRecovery";
import { AffiliateHubAdmin, AffiliateHubDashboard, AffiliateHubPublic, AffiliateReferral } from "./pages/AffiliateHub";

export const CATALOG_ROUTE = "/oferte";
export function directPathFromLegacyOffer(location: string) { return location.replace(/^\/oferte/, "") || CATALOG_ROUTE; }
export function usesDirectOfferFallback(location: string) { return /^\/[a-z0-9-]+$/.test(location) && location !== CATALOG_ROUTE; }

function LegacyOfferRedirect() {
  const [location] = useLocation();
  return <Redirect to={directPathFromLegacyOffer(location)} replace />;
}

export function AppRouter() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={CATALOG_ROUTE} component={Home} />
      <Route path={"/afiliere"}>{() => <AffiliateHubPublic section="home" />}</Route>
      <Route path={"/afiliere/materiale"}>{() => <AffiliateHubPublic section="materials" />}</Route>
      <Route path={"/afiliere/reguli"}>{() => <AffiliateHubPublic section="rules" />}</Route>
      <Route path={"/afiliere/dashboard"} component={AffiliateHubDashboard} />
      <Route path={"/afiliere/admin"} component={AffiliateHubAdmin} />
      <Route path={"/afiliere/:offer/:code"} component={AffiliateReferral} />
      <Route path={"/tarot"} component={TarotOriginalHome} />
      <Route path={"/tarot/citire"} component={TarotOriginalCheckout} />
      <Route path={"/tarot/asteapta"}>{() => <TarotOriginalPostPurchase productCode="numerology" />}</Route>
      <Route path={"/tarot/aproapegata"}>{() => <TarotOriginalPostPurchase productCode="portrait" />}</Route>
      <Route path={"/tarot/stai"}>{() => <TarotOriginalPostPurchase productCode="palm" />}</Route>
      <Route path={"/tarot/multumesc"} component={TarotOriginalThankYou} />
      <Route path={"/tarot/acces"} component={TarotAccess} />
      <Route path={"/tarot/dashboard"} component={TarotOriginalDashboard} />
      <Route path={"/familieprotejata"} component={FamilyOriginalHome} />
      <Route path={"/familieprotejata/oto1"}>{() => <FamilyOfferPage step="oto1" />}</Route>
      <Route path={"/familieprotejata/ds1"}>{() => <FamilyOfferPage step="ds1" />}</Route>
      <Route path={"/familieprotejata/ds2"}>{() => <FamilyOfferPage step="ds2" />}</Route>
      <Route path={"/familieprotejata/thank-you"} component={FamilyThankYouPage} />
      <Route path={"/familieprotejata/dashboard"} component={FamilyOriginalDashboard} />
      <Route path={"/prieteni-cu-beneficii"} component={PbcHome} />
      <Route path={"/prieteni-cu-beneficii/oferta-speciala"}>{() => <PbcOffer stage="upsellOne" />}</Route>
      <Route path={"/prieteni-cu-beneficii/oferta-redusa"}>{() => <PbcOffer stage="downsell" />}</Route>
      <Route path={"/prieteni-cu-beneficii/program-avansat"}>{() => <PbcOffer stage="upsellTwo" />}</Route>
      <Route path={"/prieteni-cu-beneficii/checkout"} component={PbcCheckout} />
      <Route path={"/prieteni-cu-beneficii/multumim"} component={PbcThankYou} />
      <Route path={"/prieteni-cu-beneficii/termeni"} component={PbcLegalUnavailable} />
      <Route path={"/prieteni-cu-beneficii/retur"} component={PbcLegalUnavailable} />
      <Route path={"/prieteni-cu-beneficii/confidentialitate"} component={PbcLegalUnavailable} />
      <Route path={"/vraji/pas/1"} component={VrajiOriginalPost} />
      <Route path={"/vraji/stai"} component={VrajiOriginalPost} />
      <Route path={"/vraji/pas/2"} component={VrajiOriginalPost} />
      <Route path={"/vraji/multumim"} component={VrajiOriginalThankYou} />
      <Route path={"/vraji/biblioteca"} component={VrajiOriginalLibrary} />
      <Route path={"/vraji"} component={VrajiOriginalHome} />
      <Route path={"/weightloss"} component={WeightlossOriginalSales} />
      <Route path={"/weightloss/comanda"} component={WeightlossOriginalCheckout} />
      <Route path={"/weightloss/oferta/retete"}>{() => <WeightlossOriginalUpsell slug="retete" />}</Route>
      <Route path={"/weightloss/oferta/miscare"}>{() => <WeightlossOriginalUpsell slug="miscare" />}</Route>
      <Route path={"/weightloss/oferta/longevitate"}>{() => <WeightlossOriginalUpsell slug="longevitate" />}</Route>
      <Route path={"/weightloss/multumim"} component={WeightlossOriginalThankYou} />
      <Route path={"/weightloss/confidentialitate"}>{() => <WeightlossOriginalLegal page="confidentialitate" />}</Route>
      <Route path={"/weightloss/termeni"}>{() => <WeightlossOriginalLegal page="termeni" />}</Route>
      <Route path={"/weightloss/declaratie"}>{() => <WeightlossOriginalLegal page="declaratie" />}</Route>
      <Route path={"/weightloss/afiliati"} component={WeightlossOriginalAffiliate} />
      <Route path={"/weightloss/admin"} component={WeightlossOriginalAdmin} />
      <Route path={"/relatii"} component={RelatiiOriginalHome} />
      <Route path={"/relatii/pentru-el"}>{() => <RelatiiOriginalProduct audience="barbati" />}</Route>
      <Route path={"/relatii/pentru-ea"}>{() => <RelatiiOriginalProduct audience="femei" />}</Route>
      <Route path={"/relatii/oferta/conversatii-jucause"}>{() => <RelatiiOriginalOffer offerId="conversatii-jucause" />}</Route>
      <Route path={"/relatii/oferta/downsell-conversatii"}>{() => <RelatiiOriginalOffer offerId="downsell-conversatii" />}</Route>
      <Route path={"/relatii/oferta/downsell-claritate"}>{() => <RelatiiOriginalOffer offerId="downsell-claritate" />}</Route>
      <Route path={"/relatii/oferta/downsell-mesaj"}>{() => <RelatiiOriginalOffer offerId="downsell-mesaj" />}</Route>
      <Route path={"/relatii/oferta/friendzone"}>{() => <RelatiiOriginalOffer offerId="friendzone" />}</Route>
      <Route path={"/relatii/oferta/downsell-friendzone"}>{() => <RelatiiOriginalOffer offerId="downsell-friendzone" />}</Route>
      <Route path={"/relatii/oferta/conexiune-incredere"}>{() => <RelatiiOriginalOffer offerId="conexiune-incredere" />}</Route>
      <Route path={"/relatii/multumesc"} component={RelatiiOriginalThankYou} />
      <Route path={"/relatii/biblioteca"} component={RelatiiOriginalLibrary} />
      <Route path={"/relatii/afiliere"} component={RelatiiOriginalAffiliate} />
      <Route path={"/relatii/admin"} component={RelatiiOriginalAdmin} />
      <Route path={"/relatii/legal/confidentialitate"}>{() => <RelatiiOriginalLegal page="confidentialitate" />}</Route>
      <Route path={"/relatii/legal/termeni"}>{() => <RelatiiOriginalLegal page="termeni" />}</Route>
      <Route path={"/relatii/legal/rambursari"}>{() => <RelatiiOriginalLegal page="rambursari" />}</Route>
      <Route path={"/relatii/legal/contact"}>{() => <RelatiiOriginalLegal page="contact" />}</Route>
      <Route path={"/relatii/funnel-dictionarul-barbatilor"} component={RelatiiOriginalFunnelMap} />
      <Route path={"/calendarul-norocului/admin"} component={CalendarLuckyAdmin} />
      <Route path={"/calendarul-norocului"} component={CalendarLuckyPreview} />
      <Route path={"/armonii-bine"} component={ArmoniiOriginalHome} />
      <Route path={"/armonii-bine/multumim"} component={ArmoniiOriginalConfirmation} />
      <Route path={"/liniste-audio"} component={LinisteOriginalHome} />
      <Route path={"/liniste-audio/quiz"} component={LinisteOriginalQuiz} />
      <Route path={"/liniste-audio/bani"}>{() => <LinisteOriginalTheme theme="bani" />}</Route>
      <Route path={"/liniste-audio/sanatate"}>{() => <LinisteOriginalTheme theme="sanatate" />}</Route>
      <Route path={"/liniste-audio/anxietate"}>{() => <LinisteOriginalTheme theme="anxietate" />}</Route>
      <Route path={"/liniste-audio/eliberare"}>{() => <LinisteOriginalTheme theme="eliberare" />}</Route>
      <Route path={"/liniste-audio/iubire"}>{() => <LinisteOriginalTheme theme="iubire" />}</Route>
      <Route path={"/liniste-audio/comanda"} component={LinisteOriginalCheckout} />
      <Route path={"/liniste-audio/oferta"} component={LinisteOriginalOffer} />
      <Route path={"/liniste-audio/multumesc"} component={LinisteOriginalThankYou} />
      <Route path={"/liniste-audio/recuperare"} component={LinisteOriginalRecovery} />
      <Route path={"/iubire"} component={IubireOriginalHome} />
      <Route path={"/iubire/checkout"} component={IubireOriginalCheckout} />
      <Route path={"/iubire/multumesc"} component={IubireThankYou} />
      <Route path={"/iubire/biblioteca"} component={IubireLibrary} />
      <Route path={"/oferte/*"} component={LegacyOfferRedirect} />
      <Route path={"/oferte/:brand"} component={LegacyOfferRedirect} />
      <Route path={"/:slug"} component={OfferMigrating} />
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
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
