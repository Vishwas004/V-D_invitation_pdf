let pdfTemplateBytes = null;

// ✅ Load default PDF template at startup
fetch("demo copy.pdf")
  .then(res => res.arrayBuffer())
  .then(bytes => {
    pdfTemplateBytes = bytes;
    console.log("✅ Default PDF template loaded.");
  })
  .catch(err => console.error("❌ Failed to load default PDF:", err));

async function generateManualPDF() {
  const name = document.getElementById("nameInput").value;

  if (!name || !pdfTemplateBytes) {
    return alert("Please enter a name.");
  }

  const pdfDoc = await PDFLib.PDFDocument.load(pdfTemplateBytes);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  page.drawText(name, {
    x: 204,
    y: 885,
    size: 23,
    font,
    color: PDFLib.rgb(1, 0, 0) // 🔴 red text
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  // ✅ Open PDF in new tab
  window.open(url, "_blank");
}

async function generateFromExcel() {
  const excelFile = document.getElementById("excelUpload").files[0];
  if (!excelFile || !pdfTemplateBytes) {
    return alert("Please upload Excel file first.");
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    for (let i = 1; i < rows.length; i++) {
      const [name] = rows[i];  // Only name is used now

      const pdfDoc = await PDFLib.PDFDocument.load(pdfTemplateBytes);
      const page = pdfDoc.getPages()[0];
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

      page.drawText(name, {
        x: 204,
        y: 885,
        size: 23,
        font,
        color: PDFLib.rgb(1, 0, 0)
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Invitation_${name}.pdf`;
      a.click();
    }
  };

  reader.readAsArrayBuffer(excelFile);
}
