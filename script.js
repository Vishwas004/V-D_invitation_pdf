let pdfTemplateBytes = null;
let gujaratiFontBytes = null;

// ✅ Load default PDF template
fetch("demo copy.pdf")
  .then(res => res.arrayBuffer())
  .then(bytes => {
    pdfTemplateBytes = bytes;
    console.log("✅ Default PDF template loaded.");
  })
  .catch(err => console.error("❌ Failed to load default PDF:", err));

// ✅ Restore name log from localStorage on page load
window.addEventListener("DOMContentLoaded", () => {
  const savedLog = localStorage.getItem("nameLog");
  if (savedLog) {
    document.getElementById("nameLog").value = savedLog;
  }
});

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
    color: PDFLib.rgb(1, 0, 0), // red
  });

  const pdfBytes = await pdfDoc.save();
  await sharePDF(pdfBytes, `Invitation_${name}.pdf`);

  // ✅ Add name to log
  appendToNameLog(name);
}

async function sharePDF(pdfBytes, fileName = "invitation.pdf") {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const file = new File([blob], fileName, { type: "application/pdf" });

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

  document.getElementById("nameLog").value = "";
  localStorage.removeItem("nameLog");

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

        // ✅ Add name to log
        appendToNameLog(name);
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
      console.error("❌ Error generating from Excel:", err);
    }
  };

  reader.readAsArrayBuffer(excelFile);
}

// ✅ Append name to log + save in localStorage
function appendToNameLog(name) {
  const log = document.getElementById("nameLog");

  const now = new Date();
  const timestamp = now.toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: true,
  });

  const entry = `✔️ ${name} - ${timestamp}`;
  log.value += entry + "\n";

  localStorage.setItem("nameLog", log.value);
}


function toggleLog() {
  const logSection = document.getElementById("nameLogSection");
  logSection.style.display = logSection.style.display === "none" ? "block" : "none";
}


// ✅ Clear name log manually
function clearLog() {
  document.getElementById("nameLog").value = "";
  localStorage.removeItem("nameLog");
}
