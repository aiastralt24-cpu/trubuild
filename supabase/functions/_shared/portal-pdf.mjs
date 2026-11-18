import { logo } from "./portal-logo.mjs";
// Dependency-free PDF 1.4 renderer shared by browser previews and the Deno worker.
// Text uses embedded PDF standard Helvetica. Non-Latin input is rejected rather than silently corrupted.
const ascii = (s) =>
  String(s ?? "")
    .replace(/§/g, "section ")
    .replace(/²/g, "2")
    .replace(/×/g, "x")
    .replace(/[–—]/g, "-")
    .replace(/₹/g, "INR ")
    .replace(/°/g, " deg")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
const esc = (s) =>
  ascii(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
export function quotePdf(snapshot) {
  const all = ascii(JSON.stringify(snapshot));
  if (/[^\x00-\x7f]/.test(all))
    throw new Error(
      "This pilot PDF template supports Latin text. Use Latin text or configure an embedded Unicode-font renderer.",
    );
  const pages = [];
  let commands = [],
    y = 730;
  const ref = snapshot.number || "PREVIEW";
  const text = (s, x = 44, size = 10, bold = false) => {
    commands.push(
      `BT /${bold ? "B" : "F"} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${esc(s)}) Tj ET`,
    );
  };
  const header = () => {
    commands = ["0.13 0.16 0.14 rg"];
    y = 790;
    commands.push("q 110 0 0 35 44 778 cm /Logo Do Q");
    y = 766;
    text(snapshot.type || "USAGE ESTIMATE", 44, 10, true);
    text(`${ref} / Revision ${snapshot.revision || 1}`, 320, 10);
    y = 742;
  };
  const next = () => {
    pages.push(commands);
    header();
  };
  const line = (s, { bold = false, size = 10 } = {}) => {
    const words = ascii(s).split(/\s+/);
    let row = "";
    const max = Math.floor((90 * 10) / size);
    for (const w of words) {
      if ((row + " " + w).length > max && row) {
        if (y < 65) next();
        text(row, 44, size, bold);
        y -= 16;
        row = "";
      }
      if (w.length > max) {
        if (row) {
          text(row);
          y -= 16;
          row = "";
        }
        for (let i = 0; i < w.length; i += max) {
          if (y < 65) next();
          text(w.slice(i, i + max), 44, size, bold);
          y -= 16;
        }
      } else row += (row ? " " : "") + w;
    }
    if (row) {
      if (y < 65) next();
      text(row, 44, size, bold);
      y -= 16;
    }
    return y;
  };
  header();
  line(
    snapshot.seller?.legalName ||
      "Demonstration estimate - not a commercial offer",
    { bold: true },
  );
  line(
    snapshot.seller?.address ||
      "Seller must be configured before official issue.",
  );
  line(
    `Issued: ${snapshot.issuedAt?.slice(0, 10) || snapshot.createdAt?.slice(0, 10) || "Draft"} | Valid until: ${snapshot.expiresAt?.slice(0, 10) || "Not applicable"}`,
  );
  line(
    `Customer: ${snapshot.customer?.name || "Sample project"} | Project: ${snapshot.project || "Project estimate"}`,
  );
  line(`Delivery location: ${snapshot.customer?.pincode || "To be confirmed"}`);
  y -= 12;
  const tableHeader = () => {
    commands.push(
      `0.94 0.94 0.91 rg 40 ${y - 6} 515 24 re f 0.13 0.16 0.14 rg`,
    );
    text("PRODUCT / PACK", 46, 9, true);
    text("QTY", 300, 9, true);
    text("UNIT", 350, 9, true);
    text("LINE TOTAL", 450, 9, true);
    y -= 28;
  };
  tableHeader();
  const money = (n) => `${snapshot.currency || "INR"} ${(n / 100).toFixed(2)}`;
  const rows =
    snapshot.items ||
    snapshot.estimate.components.flatMap((c) =>
      c.purchase.packs.map((p) => ({
        description: c.name,
        pack: `${p.size} ${c.unit}`,
        count: p.count,
      })),
    );
  for (const item of rows) {
    const label = ascii(`${item.description} / ${item.pack}`);
    const chunks = [];
    let row = "";
    for (const word of label.split(/\s+/)) {
      if ((row + " " + word).length > 43 && row) {
        chunks.push(row);
        row = "";
      }
      if (word.length > 43) {
        if (row) {
          chunks.push(row);
          row = "";
        }
        chunks.push(...(word.match(/.{1,43}/g) || []));
      } else row += (row ? " " : "") + word;
    }
    if (row) chunks.push(row);
    if (y < 95 + Math.min(chunks.length * 15 + 10, 600)) {
      next();
      tableHeader();
    }
    for (let i = 0; i < chunks.length; i++) {
      if (y < 95) {
        next();
        tableHeader();
      }
      text(chunks[i], 46, 9);
      if (i === 0) {
        text(item.count, 302, 9);
        text(item.unitMinor == null ? "Review" : money(item.unitMinor), 350, 8);
        text(
          item.totalMinor == null ? "Review" : money(item.totalMinor),
          450,
          8,
        );
      }
      y -= 15;
    }
    y -= 10;
  }
  y -= 8;
  if (snapshot.totalMinor != null) {
    line(
      `Discount applied: ${(snapshot.discountBps || 0) / 100}% | Taxes shown separately below.`,
    );
    line(
      `Net materials: ${money(snapshot.subtotalMinor)} | Tax: ${money(snapshot.taxMinor)}`,
    );
    line(`Other charges: ${money(snapshot.chargesMinor || 0)}`);
    line(`TOTAL: ${money(snapshot.totalMinor)}`, { bold: true, size: 13 });
  } else
    line("Pricing unavailable - commercial review required.", { bold: true });
  y -= 12;
  line("CALCULATION & ASSUMPTIONS", { bold: true });
  if (snapshot.estimate) {
    line(
      `Calculation rule ${snapshot.estimate.ruleId} v${snapshot.estimate.ruleVersion}; area ${snapshot.estimate.measurement.areaM2.toFixed(3)} m2.`,
    );
    for (const c of snapshot.estimate.components)
      line(
        `${c.name}: theoretical ${c.theoretical.toFixed(3)} ${c.unit}; allowance ${c.waste}%; adjusted ${c.adjusted.toFixed(3)}; purchase ${c.purchase.purchased.toFixed(3)}; surplus ${c.purchase.surplus.toFixed(3)}. Objective: ${c.purchase.objective}.`,
      );
    for (const a of snapshot.estimate.assumptions) line(a);
  }
  y -= 10;
  line("TERMS & EXCLUSIONS", { bold: true });
  line(
    snapshot.terms ||
      "Technical and commercial review required. Quantities exclude labour, freight and unlisted system components.",
  );
  if (snapshot.demo)
    line(
      "DEMONSTRATION ONLY. Figures are illustrative and this document cannot be used for an order.",
      { bold: true },
    );
  pages.push(commands);
  // Assemble indirect objects with accurate byte offsets. All stream text is ASCII.
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${logo.hex.length + 1} >>\nstream\n${logo.hex}>\nendstream`,
  ];
  const ids = [];
  pages.forEach((cmd, i) => {
    const pageId = objects.length + 1,
      streamId = pageId + 1;
    ids.push(pageId);
    cmd.push(
      `BT /F 8 Tf 1 0 0 1 44 32 Tm (${esc(ref)} | Page ${i + 1} of ${pages.length}) Tj ET`,
    );
    const stream = cmd.join("\n");
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F 3 0 R /B 4 0 R >> /XObject << /Logo 5 0 R >> >> /Contents ${streamId} 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
  });
  objects[1] = `<< /Type /Pages /Count ${pages.length} /Kids [${ids.map((n) => n + " 0 R").join(" ")}] >>`;
  let out = "%PDF-1.4\n",
    offsets = [0];
  objects.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const start = out.length;
  out +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets
      .slice(1)
      .map((n) => String(n).padStart(10, "0") + " 00000 n \n")
      .join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new TextEncoder().encode(out);
}
