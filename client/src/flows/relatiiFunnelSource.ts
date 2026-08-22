export type Audience = "barbati" | "femei";

export type BookPath = {
  audience: Audience;
  route: string;
  handle: string;
  title: string;
  eyebrow: string;
  strapline: string;
  subtitle: string;
  accent: "petrol" | "terracotta";
  image: string;
  chapters: Array<{ number: string; title: string; text: string }>;
  outcomes: string[];
  signal: string;
};

export const BOOKS: Record<Audience, BookPath> = {
  barbati: {
    audience: "barbati",
    route: "/oferte/relatii/pentru-el",
    handle: "dictionarul-femeilor",
    title: "Dicționarul Femeilor",
    eyebrow: "Pentru bărbații care vor să înțeleagă femeile",
    strapline: "Nu mai traduce fiecare mesaj.",
    subtitle:
      "Un ghid digital de claritate pentru conversațiile, diferențele și momentele în care presupunerile ocupă locul întrebărilor bune.",
    accent: "petrol",
    image: "/manus-storage/dictionarul-femeilor-cover_b99f1b5c.png",
    signal: "Când nu știi ce să înțelegi, întreabă mai bine — nu ghici mai tare.",
    outcomes: [
      "Un cadru simplu pentru a distinge interesul, ezitarea și limitele.",
      "Formulări mai clare pentru conversațiile care de obicei se blochează.",
      "Repere pentru a ieși din scenarii și a rămâne prezent în dialog.",
    ],
    chapters: [
      { number: "01", title: "Ce comunică dincolo de cuvinte", text: "Un mod mai atent de a observa ritmul, contextul și nevoile fără să le transformi în presupuneri." },
      { number: "02", title: "Interes, spațiu și limite", text: "Cum citești un răspuns cu respect și cum răspunzi fără presiune sau jocuri de putere." },
      { number: "03", title: "Conversații care apropie", text: "Întrebări și inițieri de discuție care creează claritate, nu interogatorii." },
      { number: "04", title: "Când apare confuzia", text: "Un protocol practic pentru tăceri, mesaje ambigue și schimbări de energie." },
      { number: "05", title: "Atracție fără performanță", text: "Cum păstrezi individualitatea și atenția fără să joci un rol." },
      { number: "06", title: "Alegerea reciprocă", text: "Cum recunoști diferența dintre a convinge și a construi o potrivire reală." },
    ],
  },
  femei: {
    audience: "femei",
    route: "/oferte/relatii/pentru-ea",
    handle: "dictionarul-barbatilor",
    title: "Dicționarul Bărbaților",
    eyebrow: "Pentru femeile care vor să înțeleagă bărbații",
    strapline: "Nu mai construi scenarii din tăcerile lui.",
    subtitle:
      "Un ghid digital de claritate pentru conversațiile, diferențele și momentele în care semnalele neclare pot deveni întrebări curate.",
    accent: "terracotta",
    image: "/manus-storage/dictionarul-barbatilor-cover_29d021b7.png",
    signal: "Claritatea nu cere să intuiești totul. Cere să faci loc unei conversații reale.",
    outcomes: [
      "Un cadru simplu pentru a observa inițiativa, disponibilitatea și consecvența.",
      "Formulări mai clare pentru conversațiile care de obicei rămân nespuse.",
      "Repere pentru a rămâne conectată la ce ai nevoie, nu doar la ce speri.",
    ],
    chapters: [
      { number: "01", title: "Ce spune ritmul lui", text: "Un mod mai atent de a privi inițiativa, consistența și contextul înainte de a trage concluzii." },
      { number: "02", title: "Interes, spațiu și limite", text: "Cum citești un răspuns cu respect și cum exprimi ce vrei fără să te pierzi în ambiguitate." },
      { number: "03", title: "Conversații care apropie", text: "Întrebări și inițieri de dialog care creează conexiune, nu apărare." },
      { number: "04", title: "Când apare confuzia", text: "Un protocol practic pentru tăceri, mesaje nehotărâte și schimbări de energie." },
      { number: "05", title: "Atracție fără performanță", text: "Cum păstrezi autenticitatea fără să transformi relația într-un test continuu." },
      { number: "06", title: "Alegerea reciprocă", text: "Cum recunoști diferența dintre validare temporară și o potrivire construită în doi." },
    ],
  },
};

/** All successful main-product payments begin at the same preserved first step. */
export const MAIN_PRODUCT_POST_PAYMENT_ROUTE = "/oferte/relatii/oferta/conversatii-jucause";

export type Offer = {
  route: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  price: string;
  details: string[];
  acceptTo?: string;
  declineTo?: string;
};

export const OFFERS: Record<string, Offer> = {
  "conversatii-jucause": {
    route: "conversatii-jucause",
    eyebrow: "Pasul 1 · Atracție și vizibilitate",
    title: "Fii văzută ca o persoană atractivă, nu ca un rol de jucat.",
    subtitle: "Un ghid despre prezență, stil conversațional și semnale de interes care pot face apropierea mai naturală, fără jocuri și fără presiune.",
    price: "97 RON",
    details: ["Cum transmiți interes și disponibilitate fără să forțezi apropierea.", "Repere pentru prezență, conversație și reciprocitate.", "Cum lași atracția să crească fără să construiești o mască."],
    acceptTo: "/oferte/relatii/oferta/friendzone",
    declineTo: "/oferte/relatii/oferta/downsell-conversatii",
  },
  "downsell-conversatii": {
    route: "downsell-conversatii",
    eyebrow: "Variantă alternativă · Esențialul conversației",
    title: "Nu ai nevoie de mai multe replici. Ai nevoie de câteva repere pe care să le poți folosi firesc.",
    subtitle: "O variantă concentrată pentru cei care vor să înceapă cu ritmul, reciprocitatea și limitele unei conversații jucăușe.",
    price: "37 RON",
    details: ["Un format scurt, bun de parcurs într-o singură sesiune.", "Trei repere pentru tachinare atentă și răspunsuri naturale.", "O trecere simplă către următoarea conversație care contează."],
    acceptTo: "/oferte/relatii/oferta/friendzone",
    declineTo: "/oferte/relatii/oferta/downsell-claritate",
  },
  "downsell-claritate": {
    route: "downsell-claritate",
    eyebrow: "Variantă alternativă · Claritate în 3 pași",
    title: "Când nu știi ce să spui, începe cu o structură care te ține aproape de ce contează.",
    subtitle: "Un ghid scurt de orientare pentru momentele în care apropierea devine ambiguă și ai nevoie de o întrebare mai bună.",
    price: "49 RON",
    details: ["Trei întrebări de verificare înainte de orice mesaj.", "O structură calmă pentru conversații incomode.", "Repere pentru a evita presiunea și presupunerile."],
    acceptTo: "/oferte/relatii/oferta/conexiune-incredere",
    declineTo: "/oferte/relatii/oferta/downsell-mesaj",
  },
  "downsell-mesaj": {
    route: "downsell-mesaj",
    eyebrow: "Variantă alternativă · Mesajul pe care îl amâni",
    title: "Un mic exercițiu de curaj pentru mesajele pe care le rescrii de prea multe ori.",
    subtitle: "Un material compact care te ajută să formulezi o invitație, o clarificare sau o limită cu mai multă sinceritate.",
    price: "27 RON",
    details: ["Un cadru simplu pentru formularea intenției.", "Exemple de mesaje fără jocuri sau presiune.", "Un ultim pas de verificare înainte să apeși trimite."],
    acceptTo: "/oferte/relatii/oferta/conexiune-incredere",
    declineTo: "/oferte/relatii/multumesc",
  },
  friendzone: {
    route: "friendzone",
    eyebrow: "Pasul 2 · Direcție și intimitate",
    title: "Nu rata o șansă doar pentru că nu ai clarificat direcția.",
    subtitle: "Un ghid despre cum exprimi atracția, cum vorbești despre sex cu acord explicit și cum clarifici dacă vă doriți o relație, prietenie sau o relație cu beneficii.",
    price: "67 RON",
    details: ["Cum treci de la presupuneri la o conversație sinceră despre dorință.", "Cum ceri și verifici acordul înainte de apropiere fizică.", "Cum primești un da, un nu sau un nu acum fără presiune."],
    acceptTo: "/oferte/relatii/oferta/conexiune-incredere",
    declineTo: "/oferte/relatii/oferta/downsell-friendzone",
  },
  "downsell-friendzone": {
    route: "downsell-friendzone",
    eyebrow: "Variantă alternativă · Clarificarea direcției",
    title: "Începe cu o conversație curată despre ce este posibil între voi.",
    subtitle: "O variantă esențială pentru a exprima interesul și a primi un răspuns fără scenarii, ultimatumuri sau presiune.",
    price: "37 RON",
    details: ["Cum formulezi intenția în câteva fraze simple.", "Cum lași loc pentru un răspuns sincer.", "Cum păstrezi demnitatea și respectul indiferent de direcție."],
    acceptTo: "/oferte/relatii/oferta/conexiune-incredere",
    declineTo: "/oferte/relatii/oferta/conexiune-incredere",
  },
  "conexiune-incredere": {
    route: "conexiune-incredere",
    eyebrow: "Pasul 3 · Intimitate memorabilă",
    title: "Creează intimitate memorabilă prin prezență, acord și atenție.",
    subtitle: "Un ghid pentru sex mai conectat și mai plăcut, cu comunicare înainte, în timpul apropierii și după — fără promisiuni nerealiste și fără performanță forțată.",
    price: "29,95 RON",
    details: ["Cum vorbiți despre dorințe, limite și protecție înainte de sex.", "Cum observi reacțiile și ajustezi ritmul fără să presupui.", "Cum păstrați conexiunea și respectul și după apropiere."],
    acceptTo: "/oferte/relatii/multumesc",
    declineTo: "/oferte/relatii/multumesc",
  },
};

export const formatRon = (amount: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 }).format(amount);
