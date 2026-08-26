import { Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import "./liniste-checkout.css";

export default function LinisteOriginalRecovery() {
  const [email, setEmail] = useState(""); const [submitted, setSubmitted] = useState(false); const request = trpc.liniste.recovery.request.useMutation({ onSuccess: () => setSubmitted(true) });
  const submit = (event: FormEvent) => { event.preventDefault(); request.mutate({ email }); };
  return <main className="liniste-offer-result"><Link href="/liniste-audio">Înapoi la început</Link><p className="mt-12">ACCES PE UN DISPOZITIV NOU</p><h1>Recuperează audio-urile tale.</h1><p>Introdu adresa folosită la cumpărare. Când trimiterea emailurilor este activată, vei primi linkuri unice și temporare pentru a redeschide accesul securizat.</p>{submitted ? <div><strong>Solicitarea a fost înregistrată.</strong><p>Trimiterea automată prin email este în curs de activare. După configurarea expeditorului verificat, aceeași pagină va livra linkurile temporare.</p></div> : <form className="liniste-card-form mx-auto max-w-md" onSubmit={submit}><label>Adresa de email<span className="liniste-card-shell"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></span></label>{request.error && <p className="liniste-payment-error">{request.error.message}</p>}<button disabled={request.isPending}>{request.isPending ? "Verificăm…" : "Solicită linkul de acces"}</button></form>}<small className="mt-7 block"><ShieldCheck className="mr-1 inline h-4 w-4" />Pentru siguranța contului, răspunsul nu confirmă dacă există o comandă asociată acestei adrese.</small></main>;
}
