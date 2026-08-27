import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("pagina principală Liniște Audio", () => {
  it("păstrează contractul sursă pentru probe, checkout direct și siguranță", () => {
    const source = fs.readFileSync(path.join(import.meta.dirname, "LinisteOriginalHome.tsx"), "utf8");
    const styles = fs.readFileSync(path.join(import.meta.dirname, "liniste-original.css"), "utf8");
    expect(source).toContain("Ascultă o probă de 30 secunde înainte de alegere.");
    expect(source).toContain("linisteCheckoutUrl(product.key, { currency: \"ron\" })");
    expect(source).toContain("Telefonul Speranței: 0800 801 200.");
    expect(styles).toContain("liniste-hero-abstract_3bcc1c3e.png");
    expect(source).toContain("pachet-insotire-proba_97ecbf9a.wav");
    expect(source).toContain('href="/liniste-audio/recuperare"');
    expect(source).toContain('price: "67 lei"');
    expect(source).toContain('price: "69 lei"');
    expect(source).not.toContain("-full.wav");
  });
});
