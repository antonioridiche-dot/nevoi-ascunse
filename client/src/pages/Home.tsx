export const WOMEN_FUNNEL_URL = "/femei/opreste-durerea";
export default function Home() {
 return <main className="simple-home">
 <a className="simple-test" href="/test-vindecare"><small>TEST GRATUIT</small><strong>Cât de mult ai trecut peste despărțire?</strong><span>Începe testul →</span></a>
 <section className="simple-choices">
 <a href={WOMEN_FUNNEL_URL}><img src="/img/femei-biblia/vindecare-femei-v2.png" alt="Un nou început pentru femei"/><div><small>PENTRU FEMEI</small><strong>Oprește durerea<br/>despărțirii</strong><span>Apasă aici →</span></div></a>
 <a href="/barbati/opreste-durerea"><img src="/img/barbati-biblia/vindecare-barbati-v2.png" alt="Un nou început pentru bărbați"/><div><small>PENTRU BĂRBAȚI</small><strong>Oprește durerea<br/>despărțirii</strong><span>Apasă aici →</span></div></a>
 </section></main>;
}
