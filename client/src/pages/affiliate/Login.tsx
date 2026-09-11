import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import AffiliateEarnings from "@/components/AffiliateEarnings";

/**
 * SINGURA pagină de intrare pentru afiliați.
 *
 * Nu mai există login separat de înregistrare și nici cod de 6 cifre: scrii
 * emailul, primești un link de acces pe email și apeși pe el. Dacă emailul nu
 * are încă cont, contul se creează automat la prima intrare.
 */
export default function AffiliateLogin() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const requestLink = trpc.affiliates.requestLink.useMutation({
    onSuccess: () => {
      setSent(true);
      setError("");
      toast.success("Ți-am trimis linkul de acces pe email.");
    },
    onError: (err: { message: string }) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const emailOk = /.+@.+\..+/.test(email);

  const trimite = () => {
    if (!emailOk) { setError("Scrie o adresă de email validă."); return; }
    setError("");
    requestLink.mutate({ email, origin: window.location.origin });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f3f8] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-3xl font-bold text-[#c9a44a] mb-2">&#9829;</div>
          <CardTitle className="text-2xl font-['Playfair_Display'] text-[#1b2d4f]">Panoul tău de afiliat</CardTitle>

          <AffiliateEarnings prominent />

          <details className="bg-[#f8f5ec] border border-[#c9a44a]/25 rounded-lg p-4 text-sm mt-3 text-left">
            <summary className="cursor-pointer font-bold text-[#1b2d4f]">De ce să promovezi Peste Despărțire</summary>
            <ul className="space-y-1.5 text-[#64748b] mt-2">
              <li>✔ Funnel de vânzare optimizat constant</li>
              <li>✔ Versiuni separate pentru bărbați și femei = conversie mai mare</li>
              <li>✔ Upsell-uri 1-click, unul recurent = <strong className="text-[#1b2d4f]">comision lunar, nelimitat</strong></li>
              <li>✔ Site curat, profesionist și optimizat pentru mobil</li>
              <li>✔ Produs de calitate + suport dedicat = puține rambursări</li>
            </ul>
          </details>
        </CardHeader>

        <CardContent className="space-y-4">
          {!sent ? (
            <>
              <p className="text-sm text-[#64748b]">
                Scrie emailul tău și îți trimit un <strong>link de acces</strong>. Fără parolă și fără cont nou de făcut —
                dacă emailul nu are cont încă, îl creez automat când intri.
              </p>
              <div>
                <label className="text-sm font-medium text-[#1b2d4f]">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="email@exemplu.ro"
                  className="mt-1"
                  onKeyDown={(e) => e.key === "Enter" && trimite()}
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button
                className="w-full bg-[#1b2d4f] hover:bg-[#0f1d35]"
                onClick={trimite}
                disabled={requestLink.isPending || !emailOk}
              >
                {requestLink.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                Trimite-mi linkul de acces
              </Button>
              <p className="text-xs text-[#94a3b8]">
                Primești un email cu un buton. Apeși o singură dată pe el și intri direct în panou — rămâi conectat(ă) 90 de zile.
              </p>
            </>
          ) : (
            <>
              <div className="text-center">
                <MailCheck className="w-10 h-10 text-green-600 mx-auto" />
                <p className="text-sm text-[#334155] mt-2">
                  Ți-am trimis linkul de acces la <strong>{email}</strong>
                </p>
                <p className="text-xs text-[#94a3b8] mt-1">
                  Deschide emailul și apasă butonul „Deschide panoul meu de afiliat”. Verifică și folderul Spam.
                </p>
              </div>
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 text-xs text-[#64748b]">
                Linkul e valabil <strong>60 de minute</strong> și poate fi folosit o singură dată. Dacă a expirat, cere unul nou.
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => requestLink.mutate({ email, origin: window.location.origin })}
                disabled={requestLink.isPending}
              >
                {requestLink.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                Trimite linkul din nou
              </Button>
              <button
                type="button"
                onClick={() => { setSent(false); setError(""); }}
                className="w-full text-sm text-[#64748b] hover:text-[#1b2d4f]"
              >
                Schimbă adresa de email
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
