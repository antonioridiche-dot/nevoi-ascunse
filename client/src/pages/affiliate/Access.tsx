import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { getAffiliateToken, saveAffiliateSession } from "@/lib/affiliateSession";

/**
 * Pagina pe care ajunge afiliatul când apasă butonul din emailul de acces
 * (/affiliate/access?t=...). Confirmă linkul, salvează sesiunea în browser
 * (90 de zile) și îl duce direct în panou.
 *
 * Linkul se poate folosi O SINGURĂ dată. Dacă afiliatul are deja o sesiune
 * validă în browser, îl ducem direct în panou, ca să nu consumăm linkul degeaba.
 */
export default function AffiliateAccess() {
  const [, navigate] = useLocation();
  const [stare, setStare] = useState<"se-verifica" | "gata" | "eroare">("se-verifica");
  const [mesaj, setMesaj] = useState("");
  const pornit = useRef(false);

  const verify = trpc.affiliates.verifyLink.useMutation({
    onSuccess: (data: { token: string; affiliate: { name: string | null } }) => {
      saveAffiliateSession(data.token, data.affiliate?.name || "");
      setStare("gata");
      setTimeout(() => navigate("/affiliate/dashboard", { replace: true }), 800);
    },
    onError: (err: { message: string }) => {
      setMesaj(err.message || "Linkul nu a putut fi verificat.");
      setStare("eroare");
    },
  });

  useEffect(() => {
    if (pornit.current) return;
    pornit.current = true;

    // Dacă e deja conectat, nu mai consumăm linkul.
    if (getAffiliateToken()) {
      setStare("gata");
      navigate("/affiliate/dashboard", { replace: true });
      return;
    }

    const t = new URLSearchParams(window.location.search).get("t") || "";
    if (!t) {
      setMesaj("Linkul nu conține codul de acces. Cere un link nou din pagina de intrare.");
      setStare("eroare");
      return;
    }
    verify.mutate({ t });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f3f8] p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {stare === "se-verifica" && (
          <>
            <Loader2 className="w-10 h-10 mx-auto text-[#1b2d4f] animate-spin" />
            <p className="mt-4 font-bold text-[#1b2d4f]">Se verifică linkul tău…</p>
            <p className="mt-1 text-sm text-[#64748b]">O secundă — te bag în panoul de afiliat.</p>
          </>
        )}

        {stare === "gata" && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
            <p className="mt-4 font-bold text-[#1b2d4f] text-lg">Gata, ești conectat(ă)!</p>
            <p className="mt-1 text-sm text-[#64748b]">
              Te duc în panoul tău. De acum rămâi conectat(ă) pe acest dispozitiv <strong>90 de zile</strong> — nu mai e nevoie de link.
            </p>
          </>
        )}

        {stare === "eroare" && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-red-500" />
            <p className="mt-4 font-bold text-[#1b2d4f] text-lg">Linkul nu a funcționat</p>
            <p className="mt-1 text-sm text-[#64748b]">{mesaj}</p>
            <a
              href="/affiliate/login"
              className="mt-5 inline-block bg-[#1b2d4f] text-white font-bold py-3 px-6 rounded-full text-sm"
            >
              Cere un link nou →
            </a>
          </>
        )}
      </div>
    </div>
  );
}
