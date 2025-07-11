let pdfTemplateBytes = null;

// ✅ Load default PDF template on page load
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

  // ✅ Load and edit PDF
  const pdfDoc = await PDFLib.PDFDocument.load(pdfTemplateBytes);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  page.drawText(name, {
    x: 204,
    y: 885,
    size: 23,
    font,
    color: PDFLib.rgb(1, 0, 0) // 🔴 Red
  });

  const pdfBytes = await pdfDoc.save();
  await sharePDF(pdfBytes, `Invitation_${name}.pdf`);
}

async function sharePDF(pdfBytes, fileName = "invitation.pdf") {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const file = new File([blob], fileName, { type: "application/pdf" });

  // ✅ Use Web Share API if supported
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: "Invitation PDF",
        text: "તમારું આમંત્રણ PDF જુઓ.",
        files: [file],
      });
      console.log("✅ Shared successfully");
    } catch (error) {
      console.error("❌ Share failed:", error);
    }
  } else {
    // ❌ Fallback: Just open the PDF in browser
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    alert("Sharing not supported. PDF opened in new tab.");
  }
}

async function generateFromExcel() {
  const excelFile = document.getElementById("excelUpload").files[0];
  if (!excelFile || !pdfTemplateBytes) {
    return alert("Please upload Excel file first.");
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const zip = new JSZip();

      for (let i = 1; i < rows.length; i++) {
        const [name] = rows[i];
        if (!name) continue;

        const pdfDoc = await PDFLib.PDFDocument.load(pdfTemplateBytes);
        const page = pdfDoc.getPages()[0];
        const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

        page.drawText(name, {
          x: 204,
          y: 885,
          size: 23,
          font,
          color: PDFLib.rgb(1, 0, 0),
        });

        const pdfBytes = await pdfDoc.save();
        zip.file(`Invitation_${name}.pdf`, pdfBytes);
      }

      // ✅ Generate and trigger download of ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "All_Invitations.zip";
      document.body.appendChild(a); // ⬅ required on some mobile browsers
      a.click();
      document.body.removeChild(a);

    } catch (err) {
      alert("Something went wrong while generating PDFs.");
      console.error("❌ Error generating from Excel:", err);
    }
  };

  reader.readAsArrayBuffer(excelFile);
}
