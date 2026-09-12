const WOMEN_CARD_IMAGE = "/img/selector-femei-final_d3e6ae77.png";
const MEN_CARD_IMAGE = "/img/selector-barbati-final_85ef6ea2.png";
export const WOMEN_FUNNEL_URL = "/femei/biblie";

function AudienceCard({ href, heading, image, className }: { href: string; heading: string; image: string; className: string }) {
  return <article className={"audience-choice-card " + className}>
    <a href={href} className="audience-choice-heading">{heading} <span className="audience-choice-arrow" aria-hidden="true">↓</span></a>
    <a href={href} className="audience-choice-image" aria-label={heading}>
      <img src={image} alt={heading} />
    </a>
  </article>;
}

export default function Home() {
  return <main className="audience-choice-page">
    <div className="audience-choice-container">
      <div className="quiz-banner-wrap">
      {/* Îndemn deasupra bannerului, cu săgeată în jos */}
      <p className="quiz-banner-intro">
        Începe cu testul gratuit de vindecare după despărțire
        <span className="quiz-banner-intro-arrow" aria-hidden="true">↓</span>
      </p>
      <a href="/test-impacare" className="quiz-banner" aria-label="Test de vindecare">
        <span className="quiz-banner-badge">📊 TEST GRATUIT | DUREAZĂ 1 MINUT</span>
        <span className="quiz-banner-title">VEZI UNDE EȘTI ÎN PROCESUL DE VINDECARE</span>
        <span className="quiz-banner-text"><u>TEST DE VINDECARE:</u> Află ce te ține blocat{`ă`} și care poate fi următorul pas pentru tine.</span>
        <span className="quiz-banner-arrow">→</span>
        <span className="quiz-banner-chips">
          <span>🔒 100% confidențial</span>
          <span>⚡ Rezultat imediat</span>
          <span>❤️ Recomandare personalizată</span>
        </span>
      </a>
      </div>
      <section className="audience-choice-grid" aria-label="Alege experiența potrivită pentru tine">
        <AudienceCard href={WOMEN_FUNNEL_URL} heading="Sunt femeie" image={WOMEN_CARD_IMAGE} className="audience-choice-women" />
        <AudienceCard href="/barbati/biblie" heading="Sunt bărbat" image={MEN_CARD_IMAGE} className="audience-choice-men" />
      </section>
    </div>
  </main>;
}
