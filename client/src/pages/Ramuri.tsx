import { useLocation } from "wouter";
import { useEffect } from "react";

/**
 * Ramura „peste despărțire": alege pentru cine cumperi.
 *
 * Jurnalul are două ediții (femei și bărbați), cu fișiere diferite, deci pagina
 * nu poate duce direct la o singură ofertă. Restul funnelului merge exact ca
 * înainte — pagina asta doar alege ediția.
 */
const OPTIONS = [
  {
    href: "/femei/zero-despartiri",
    label: "Pentru femei",
    title: "Zero Despărțiri",
    image: "/img/peste-zero.svg",
    alt: "Zero Despărțiri — ediția pentru femei",
  },
  {
    href: "/barbati/zero-despartiri",
    label: "Pentru bărbați",
    title: "Zero Despărțiri",
    image: "/img/peste-zero.svg",
    alt: "Zero Despărțiri — ediția pentru bărbați",
  },
];

export default function Ramuri({ family }: { family?: string }) {
  const [, navigate] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [family]);

  return (
    <main className="simple-home">
      <div className="branch-head">
        <small>Peste despărțire</small>
        <h1>Zero Despărțiri</h1>
        <p>
          Un jurnal pentru cine a ales să nu se mai piardă într-o relație: 47 de
          lei, o singură plată, PDF-ul ajunge pe email imediat după plată.
        </p>
      </div>
      <a className="simple-test" href="/test-vindecare">
        <small>TEST GRATUIT</small>
        <strong>Cât de mult ai trecut peste despărțire?</strong>
        <span>Începe testul →</span>
      </a>
      <section className="simple-choices">
        {OPTIONS.map(option => (
          <a
            key={option.href}
            href={option.href}
            onClick={event => {
              event.preventDefault();
              navigate(option.href);
            }}
          >
            <img src={option.image} alt={option.alt} />
            <div>
              <small>{option.label.toUpperCase()}</small>
              <strong>{option.title}</strong>
              <span>Apasă aici →</span>
            </div>
          </a>
        ))}
      </section>
    </main>
  );
}
