import { TrendingUp } from "lucide-react";

/**
 * Caseta "Cât poți câștiga".
 *
 * Apare identic pe pagina de înregistrare și pe cea de conectare. Stă într-un
 * singur fișier ca cele două pagini să nu ajungă niciodată să afișeze sume
 * diferite — dacă se schimbă un preț, se schimbă o singură dată, aici.
 *
 * `prominent` o face mai vizibilă (folosită pe pagina de conectare, unde e
 * primul lucru pe care trebuie să-l vadă afiliatul).
 */
export default function AffiliateEarnings({ prominent = false }: { prominent?: boolean }) {
  return (
    <div
      className={
        "bg-[#f0fdf4] rounded-lg text-sm text-left " +
        (prominent
          ? "border-2 border-green-300 p-4 mt-3 shadow-sm"
          : "border border-green-200 p-3 mt-2")
      }
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-[#15803d] shrink-0" />
        <p className={"font-bold text-[#15803d] " + (prominent ? "text-base" : "")}>Cât poți câștiga</p>
      </div>

      <p className="text-[#334155] mt-2">
        50% comision din fiecare vânzare: <strong>minim 33,50 lei</strong> per client și până la{" "}
        <strong>≈140 lei per client</strong> dacă același client cumpără mai multe produse.
      </p>

      <p className="text-[#334155] mt-2">
        + încă <strong>48,50 lei sau 73,50 lei în fiecare lună, la nesfârșit</strong> — dacă clientul
        rămâne abonat la Susținere Personală, comisionul se plătește lunar, cât timp rămâne abonat,
        fără limită.
      </p>

      <p className="text-[#334155] mt-2">
        + <strong>chiar dacă nu cumpără imediat, primești tot 50% din tot ce cumpără ulterior</strong>{" "}
        lead-urile pe care le-ai adus, din campaniile de emailuri și de conținut, timp de{" "}
        <strong>60 de zile</strong> de la click.
      </p>
    </div>
  );
}
