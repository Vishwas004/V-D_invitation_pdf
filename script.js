let pdfTemplateBytes = null;
let gujaratiFontBytes = null;

// ✅ Load PDF template
fetch("demo copy.pdf")
  .then(res => res.arrayBuffer())
  .then(bytes => {
    pdfTemplateBytes = bytes;
    console.log("✅ Default PDF template loaded.");
  })
  .catch(err => console.error("❌ Failed to load default PDF:", err));

// ✅ Load Gujarati font
fetch("NotoSansGujarati-Regular.ttf")
  .then(res => res.arrayBuffer())
  .then(bytes => {
    gujaratiFontBytes = bytes;
    console.log("✅ Gujarati font loaded");
  })
  .catch(err => console.error("❌ Failed to load Gujarati font:", err));

async function generateManualPDF() {
  const name = document.getElementById("nameInput").value;

  if (!name || !pdfTemplateBytes || !gujaratiFontBytes) {
    return alert("Please enter name and ensure PDF and font are loaded.");
  }

  const pdfDoc = await PDFLib.PDFDocument.load(pdfTemplateBytes);
  pdfDoc.registerFontkit(fontkit);  // 🧠 Required for custom fonts

  const customFont = await pdfDoc.embedFont(gujaratiFontBytes);  // ✅ Use Gujarati font
  const page = pdfDoc.getPages()[0];

  page.drawText(name, {
    x: 204,
    y: 885,
    size: 23,
    font: customFont,
    color: PDFLib.rgb(1, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  await sharePDF(pdfBytes, `Invitation_${name}.pdf`);
}

async function sharePDF(pdfBytes, fileName = "invitation.pdf") {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const file = new File([blob], fileName, { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: "Gujarati Invitation",
        text: "તમારું આમંત્રણ PDF જુઓ.",
        files: [file],
      });
      console.log("✅ Shared successfully");
    } catch (error) {
      console.error("❌ Share failed:", error);
    }
  } else {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    alert("Sharing not supported. PDF opened in new tab.");
  }
}

async function generateFromExcel() {
  const excelFile = document.getElementById("excelUpload").files[0];
  if (!excelFile || !pdfTemplateBytes || !gujaratiFontBytes) {
    return alert("Please upload Excel and ensure PDF & font are loaded.");
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
        pdfDoc.registerFontkit(fontkit);
        const font = await pdfDoc.embedFont(gujaratiFontBytes);

        const page = pdfDoc.getPages()[0];
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

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "All_Invitations.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (err) {
      alert("Something went wrong while generating PDFs.");
      console.error("❌ Error:", err);
    }
  };

  reader.readAsArrayBuffer(excelFile);
}
