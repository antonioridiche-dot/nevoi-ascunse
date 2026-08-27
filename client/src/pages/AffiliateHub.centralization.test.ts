import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("portalul central de afiliere", () => {
  it("nu solicită un nume la înscriere și păstrează toate ofertele într-un singur dashboard", () => {
    const page = fs.readFileSync(path.join(import.meta.dirname, "AffiliateHub.tsx"), "utf8");
    const styles = fs.readFileSync(path.join(import.meta.dirname, "affiliate-hub.css"), "utf8");
    expect(page).toContain("register.mutateAsync({ email, acceptedTerms: accepted as true })");
    expect(page).not.toContain("Nume<input");
    expect(page).not.toContain("const [name, setName]");
    expect(page).toContain("Înscrierea este deschisă cu e-mail și acord.");
    expect(page).toContain("Codul nu poate fi expediat până când expeditorul domeniului nu este verificat.");
    expect(styles).not.toContain(".affiliate-access form:first-child > label:first-of-type");
    expect(page).toContain('id="affiliate-offer-selector"');
    expect(page).toContain("const selectedOffer = data.offers.find");
    expect(page).toContain('href="/afiliere/dashboard"');
    expect(page).toContain("trpc.affiliateHub.adminSession.useMutation");
    expect(page).toContain('auth.user?.role === "admin"');
    expect(page).toContain("requestLoginCode");
    expect(page).toContain('id="affiliate-destination-selector"');
    expect(page).toContain("selectedOffer.destinations");
    expect(page).toContain("Linkurile au formatul direct");
    const service = fs.readFileSync(path.join(import.meta.dirname, "../../../server/commerce/affiliateHubService.ts"), "utf8");
    expect(service).toContain("link: `/${offer.key}/${account.affiliateCode}`");
    expect(service).toContain("affiliateDestinationOptions");
  });

  it("expune programul de afiliere ca acțiune în dreapta footerului catalogului", () => {
    const home = fs.readFileSync(path.join(import.meta.dirname, "Home.tsx"), "utf8");
    expect(home).toContain('href="/afiliere"');
    expect(home).toContain("PROGRAM DE AFILIERE");
    expect(home).toContain("self-end sm:ml-auto");
  });
});
