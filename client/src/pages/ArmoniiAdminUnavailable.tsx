import { Link } from "wouter";

export default function ArmoniiAdminUnavailable() {
  return <main className="min-h-screen bg-[#f6f2e9] px-5 py-24 text-center text-[#29251f]"><p className="text-xs font-semibold tracking-[.17em] text-[#946c40]">PAGINĂ SURSĂ INDISPONIBILĂ</p><h1 className="mx-auto mt-3 max-w-2xl font-serif text-5xl">Administrare</h1><p className="mx-auto mt-5 max-w-xl leading-7 text-[#6e6456]">Această rută este legată din pagina Armonii &amp; Bine disponibilă, însă markupul administrării nu se află în repository-ul sursă local.</p><Link href="/armonii-bine" className="mt-8 inline-flex rounded-full bg-[#8a6946] px-6 py-3 text-sm font-bold text-white">Înapoi la pagină</Link></main>;
}
