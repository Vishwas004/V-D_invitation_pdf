
let pdfTemplateBytes = null;

// ✅ Load default PDF template at startup
fetch("demo copy.pdf")
  .then(res => res.arrayBuffer())
  .then(bytes => {
    pdfTemplateBytes = bytes;
    console.log("✅ Default PDF template loaded.");
  })
  .catch(err => console.error("❌ Failed to load default PDF:", err));



// Load PDF template
// document.getElementById("pdfUpload").addEventListener("change", async (e) => {
//   const file = e.target.files[0];
//   if (file) {
//     pdfTemplateBytes = await file.arrayBuffer();
//     alert("PDF Template uploaded!");
//   }
// });

async function generateManualPDF() {
  const name = document.getElementById("nameInput").value;
  const number = document.getElementById("whatsappInput").value;
  if (!name || !number || !pdfTemplateBytes) return alert("Fill all fields and upload PDF.");

  const pdfDoc = await PDFLib.PDFDocument.load(pdfTemplateBytes);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  page.drawText(name, { x: 204, y: 885, size: 23,color: PDFLib.rgb(1, 0, 0) });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const fileName = `Invitation_${name}.pdf`;
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();

  window.open(`https://wa.me/${number}?text=Please%20see%20your%20invitation`, "_blank");
}

async function generateFromExcel() {
  const excelFile = document.getElementById("excelUpload").files[0];
  if (!excelFile || !pdfTemplateBytes) return alert("Upload Excel and PDF first.");

  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    for (let i = 1; i < rows.length; i++) {
      const [name, number] = rows[i];
      const pdfDoc = await PDFLib.PDFDocument.load(pdfTemplateBytes);
      const page = pdfDoc.getPages()[0];
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      page.drawText(name, { x: 204, y: 885, size: 23,color: PDFLib.rgb(1, 0, 0) });
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
