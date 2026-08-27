import { Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import "./liniste-checkout.css";

export default function LinisteOriginalRecovery() {
  const [email, setEmail] = useState(""); const [submitted, setSubmitted] = useState(false); const [deliveryReady, setDeliveryReady] = useState(false); const request = trpc.liniste.recovery.request.useMutation({ onSuccess: data => { setDeliveryReady(data.deliveryReady); setSubmitted(true); } });
  const submit = (event: FormEvent) => { event.preventDefault(); request.mutate({ email }); };
  return <main className="liniste-offer-result"><Link href="/liniste-audio">Înapoi la început</Link><p className="mt-12">ACCES PE UN DISPOZITIV NOU</p><h1>Recuperează audio-urile tale.</h1><p>Introdu adresa folosită la cumpărare. Linkurile de acces, când sunt disponibile, sunt unice și temporare. Nu trimitem linkuri prin e-mail cât timp expeditorul nu este verificat.</p>{submitted ? <div><strong>Solicitarea a fost înregistrată.</strong><p>{deliveryReady ? "Dacă există o comandă asociată, solicitarea de acces a fost procesată." : "Trimiterea automată prin e-mail nu este disponibilă. Accesul rămâne protejat până la verificarea expeditorului."}</p></div> : <form className="liniste-card-form mx-auto max-w-md" onSubmit={submit}><label>Adresa de email<span className="liniste-card-shell"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></span></label>{request.error && <p className="liniste-payment-error">{request.error.message}</p>}<button disabled={request.isPending}>{request.isPending ? "Verificăm…" : "Înregistrează solicitarea"}</button></form>}<small className="mt-7 block"><ShieldCheck className="mr-1 inline h-4 w-4" />Pentru siguranța contului, răspunsul nu confirmă dacă există o comandă asociată acestei adrese.</small></main>;
}
