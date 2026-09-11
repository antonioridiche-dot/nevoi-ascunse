import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import CookieConsent from "./components/CookieConsent";
import { ThemeProvider } from "./contexts/ThemeContext";
import { hasAffiliateSession } from "./lib/affiliateSession";
import { lazy, Suspense, useEffect } from "react";

const Home = lazy(() => import("./pages/Home"));
const Quiz = lazy(() => import("./pages/Quiz"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const FemeiBiblia = lazy(() => import("./pages/sales/FemeiBiblia"));
const BarbatiBiblia = lazy(() => import("./pages/sales/BarbatiBiblia"));
const Coaching = lazy(() => import("./pages/sales/Coaching"));
const JurnalNegru = lazy(() => import("./pages/sales/JurnalNegru"));
const Asteapta = lazy(() => import("./pages/sales/Asteapta"));
const DoarJurnal = lazy(() => import("./pages/sales/DoarJurnal"));
const JurnalRedus = lazy(() => import("./pages/sales/JurnalRedus"));
const MesajeExtra = lazy(() => import("./pages/MesajeExtra"));
const Biblioteca = lazy(() => import("./pages/Biblioteca"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Downsell = lazy(() => import("./pages/Downsell"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));

const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminContacts = lazy(() => import("./pages/admin/Contacts"));
const AdminEmails = lazy(() => import("./pages/admin/Emails"));
const AdminAffiliates = lazy(() => import("./pages/admin/Affiliates"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminPipeline = lazy(() => import("./pages/admin/Pipeline"));
const AdminAbTests = lazy(() => import("./pages/admin/AbTests"));
const AdminFinance = lazy(() => import("./pages/admin/Finance"));

const AffiliateLogin = lazy(() => import("./pages/affiliate/Login"));
const AffiliateDashboard = lazy(() => import("./pages/affiliate/Dashboard"));
const AffiliateAccess = lazy(() => import("./pages/affiliate/Access"));
const AffiliateTerms = lazy(() => import("./pages/affiliate/Terms"));

const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Refund = lazy(() => import("./pages/legal/Refund"));
const Contact = lazy(() => import("./pages/legal/Contact"));

/** Redirect SPA: du vizitatorul la o alta ruta. */
function Go({ to }: { to: string }) {
  const [, navigate] = useLocation();
  useEffect(() => { navigate(to, { replace: true }); }, [to, navigate]);
  return null;
}

/** ORICE adresa care nu exista (404) duce la prima pagina, nu la o pagina de eroare. */
function GoHome() {
  return <Go to="/" />;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f3f8]">
      <div className="qz-spinner" style={{ width: 40, height: 40, border: "3px solid #dde3ef", borderTop: "3px solid #1b2d4f", borderRadius: "50%", animation: "qzSpin 0.8s linear infinite" }} />
    </div>
  );
}

/** /afliere — poarta catre portalul de afiliati. */
function AffiliateGate() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate(hasAffiliateSession() ? "/affiliate/dashboard" : "/affiliate/login", { replace: true });
  }, [navigate]);
  return null;
}

function Router() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);

  // Captura codului de afiliat (?ref=...) pe ORICE pagina, nu doar pe quiz:
  // linkul de afiliat duce pe homepage, iar vizitatorul poate naviga oriunde
  // inainte de checkout. Codul se pastreaza in localStorage si este trimis
  // la comanda (contact.affiliateId + comisionul afiliatului).
  useEffect(() => {
    try {
      const query = location.includes("?") ? location.slice(location.indexOf("?") + 1) : "";
      const ref = new URLSearchParams(query).get("ref")
        || new URLSearchParams(window.location.search).get("ref");
      if (ref && ref.trim()) {
        const code = ref.trim();
        localStorage.setItem("tvii_affiliate", code);
        // Inregistram click-ul O SINGURA data per cod, per sesiune de browser.
        // Altfel, fiecare navigare care pastreaza ?ref= in URL adauga un click
        // in plus si umfla statisticile (conversie si EPC ies mai mici).
        let dejaInregistrat = false;
        try { dejaInregistrat = sessionStorage.getItem("tvii_ref_tracked") === code; } catch { /* ignoram */ }
        if (!dejaInregistrat) {
          try { sessionStorage.setItem("tvii_ref_tracked", code); } catch { /* ignoram */ }
          fetch("/api/trpc/affiliates.trackClick", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ json: { referralCode: code, path: window.location.pathname + window.location.search } }),
          }).catch(() => { /* optional tracking */ });
        }
      }
    } catch { /* localStorage indisponibil — ignoram */ }
  }, [location]);
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* ===== Pagina principala + quiz ===== */}
        <Route path="/" component={Home} />
        <Route path="/test-impacare" component={Quiz} />

        {/* ===== Biblia (pagini de vanzare) ===== */}
        <Route path="/barbati/biblie" component={BarbatiBiblia} />
        <Route path="/femei/biblie" component={FemeiBiblia} />
        {/* Aliasuri vechi (linkuri din emailuri si afiliati) — nu dispar */}
        <Route path="/barbati" component={BarbatiBiblia} />
        <Route path="/femei" component={FemeiBiblia} />
        <Route path="/barbati/oprestedurerea" component={BarbatiBiblia} />
        <Route path="/femei/oprestedurerea" component={FemeiBiblia} />

        {/* ===== Checkout ===== */}
        <Route path="/barbati/checkout" component={Checkout} />
        <Route path="/femei/checkout" component={Checkout} />

        {/* ===== Zero Despărțiri ===== */}
        <Route path="/barbati/jurnal" component={JurnalNegru} />
        <Route path="/femei/jurnal" component={JurnalNegru} />

        {/* ===== Coaching / sfaturi personalizate ===== */}
        <Route path="/barbati/sfaturipersonalizate" component={Coaching} />
        <Route path="/femei/sfaturipersonalizate" component={Coaching} />
        <Route path="/sfaturipersonalizate" component={Coaching} />
        <Route path="/coaching-onboarding" component={Coaching} />

        {/* ===== Mesajele EXTRA de Împăcare (achiziție separată) ===== */}
        <Route path="/barbati/mesaje-extra" component={MesajeExtra} />
        <Route path="/femei/mesaje-extra" component={MesajeExtra} />
        <Route path="/barbati/mesaje" component={MesajeExtra} />
        <Route path="/femei/mesaje" component={MesajeExtra} />

        {/* ===== Upsell-uri 1-click ===== */}
        <Route path="/barbati/asteapta" component={Asteapta} />
        <Route path="/femei/asteapta" component={Asteapta} />
        <Route path="/barbati/doarjurnal" component={DoarJurnal} />
        <Route path="/femei/doarjurnal" component={DoarJurnal} />
        <Route path="/barbati/jurnalredus" component={JurnalRedus} />
        <Route path="/femei/jurnalredus" component={JurnalRedus} />
        <Route path="/barbati/ultimaoferta" component={JurnalRedus} />
        {/* Lipsea: butonul de refuz de pe /femei/doarjurnal trimite aici.
            Fara ruta asta, refuzul ducea la pagina 404 (acum, la prima pagina). */}
        <Route path="/femei/ultimaoferta" component={JurnalRedus} />

        {/* ===== Multumesc / Materiale Cumparate ===== */}
        <Route path="/multumesc" component={ThankYou} />
        <Route path="/barbati/multumesc" component={ThankYou} />
        <Route path="/femei/multumesc" component={ThankYou} />
        <Route path="/dashboard" component={Biblioteca} />
        <Route path="/barbati/achizitii" component={Biblioteca} />
        <Route path="/femei/achizitii" component={Biblioteca} />
        <Route path="/barbati/biblioteca" component={Biblioteca} />
        <Route path="/femei/biblioteca" component={Biblioteca} />

        {/* ===== Admin ===== */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/contacts" component={AdminContacts} />
        <Route path="/admin/emails" component={AdminEmails} />
        <Route path="/admin/affiliates" component={AdminAffiliates} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/pipeline" component={AdminPipeline} />
        <Route path="/admin/ab-tests" component={AdminAbTests} />
        <Route path="/admin/finante" component={AdminFinance} />

        {/* ===== Afiliati ===== */}
        <Route path="/afliere" component={AffiliateGate} />
        <Route path="/afliere/dashboard" component={AffiliateDashboard} />
        <Route path="/affiliate/login" component={AffiliateLogin} />
        {/* Fosta pagina de inregistrare: aceeasi intrare, cu link pe email */}
        <Route path="/affiliate/register" component={AffiliateLogin} />
        {/* Pagina pe care ajunge linkul de acces din email */}
        <Route path="/affiliate/access" component={AffiliateAccess} />
        <Route path="/affiliate/dashboard" component={AffiliateDashboard} />
        <Route path="/affiliate/termeni" component={AffiliateTerms} />

        {/* ===== Pagini legale ===== */}
        <Route path="/termeni" component={Terms} />
        <Route path="/confidentialitate" component={Privacy} />
        <Route path="/rambursari" component={Refund} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/rambursare" component={Refund} />
        <Route path="/contact" component={Contact} />

        {/* ===== Diverse ===== */}
        <Route path="/downsell" component={Downsell} />
        <Route path="/unsubscribe" component={Unsubscribe} />

        {/* ===== Orice adresa care nu exista duce la prima pagina ===== */}
        <Route path="/404" component={GoHome} />
        <Route path="/404/" component={GoHome} />
        <Route component={GoHome} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <CookieConsent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;