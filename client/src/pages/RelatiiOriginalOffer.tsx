import { OFFERS } from "@/flows/relatiiFunnelSource";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { SiteFooter } from "./RelatiiSiteFooter";
import "./relatii-original.css";

export default function RelatiiOriginalOffer({ offerId }: { offerId: string }) {
  const offer = OFFERS[offerId];
  const [, navigate] = useLocation();
  const rawOrderId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("orderId") : null;
  const orderId = rawOrderId ? Number(rawOrderId) : 0;
  const orderQuery = trpc.relatii.order.get.useQuery({ orderId }, { enabled: Number.isInteger(orderId) && orderId > 0 });
  const offerDecision = trpc.relatii.offers.decide.useMutation();
  const affiliateDecision = trpc.relatii.offers.affiliateDecision.useMutation();
  if (!offer) return null;
  const orderReady = Boolean(orderQuery.data) && orderQuery.data?.status !== "revoked" && orderQuery.data?.status !== "refunded";
  const withOrder = (route: string) => `${route}?orderId=${orderId}`;
  const continueOffer = async (route: string, decision: "accepted" | "declined") => {
    if (!orderReady) return;
    await offerDecision.mutateAsync({ orderId, offerId, decision });
    const affiliateCode = window.localStorage.getItem("affiliate-code");
    if (affiliateCode) {
      const amountCents = Math.round(Number(offer.price.replace(/[^0-9,]/g, "").replace(",", ".")) * 100);
      await affiliateDecision.mutateAsync({ affiliateCode, orderId, offerId, amountCents, decision });
    }
    navigate(withOrder(route));
  };

  return (
    <main className="offer-page">
      <header className="site-header"><Link href="/relatii" className="brand-lockup"><span className="brand-mark" /><span>Dicționarul<br />Relațiilor</span></Link><span className="offer-progress">Pasul următor</span></header>
      <section className="offer-shell"><div className="offer-symbol"><Sparkles size={26} /></div><p className="eyebrow">{offer.eyebrow}</p><h1>{offer.title}</h1><p className="lead-copy">{offer.subtitle}</p><p className="offer-price">{offer.price}</p><div className="offer-details">{offer.details.map(detail => <p key={detail}><Check size={18} />{detail}</p>)}</div><div className="offer-actions">{offer.acceptTo && <button className="primary-button" onClick={() => continueOffer(offer.acceptTo!, "accepted")} disabled={!orderReady || offerDecision.isPending || affiliateDecision.isPending}>Da, aleg acest pas — {offer.price} <ArrowRight size={18} /></button>}{offer.declineTo && <button className="text-link" onClick={() => continueOffer(offer.declineTo!, "declined")} disabled={!orderReady || offerDecision.isPending || affiliateDecision.isPending}>Nu acum — merg la următorul pas</button>}</div><p className="offer-note">{orderQuery.isLoading ? "Verificăm comanda…" : orderReady ? `Comanda #${orderQuery.data?.id} este activă. Poți alege acum una dintre cele două direcții.` : "Această etapă este disponibilă după o comandă internă validă."}</p></section><SiteFooter />
    </main>
  );
}
