const canvas = document.getElementById("signature-pad");
const ctx = canvas.getContext("2d");
let drawing = false;

canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("touchmove", drawTouch);

function draw(e) {
  if (!drawing) return;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}

function drawTouch(e) {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

document.getElementById("clear").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
});

document.getElementById("submitBtn").addEventListener("click", async () => {
  const form = document.getElementById("signatureForm");
  const formData = new FormData(form);
  const timestamp = new Date().toISOString();

  document.getElementById("status").textContent = "Generating PDF...";

  const canvasImage = canvas.toDataURL("image/png");

  const formClone = document.getElementById("form-container").cloneNode(true);
  formClone.querySelector("canvas").replaceWith(document.createElement("img"));
  formClone.querySelector("img").src = canvasImage;
  formClone.querySelector("img").style.border = "1px solid #000";
  formClone.querySelector("img").style.width = "400px";

  const tempDiv = document.createElement("div");
  tempDiv.style.width = "800px";
  tempDiv.style.padding = "20px";
  tempDiv.appendChild(formClone);
  document.body.appendChild(tempDiv);

  const canvasCapture = await html2canvas(tempDiv);
  const imgData = canvasCapture.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
  pdf.text(`Signed on: ${timestamp}`, 10, 280);

  const pdfBlob = pdf.output("blob");
  const reader = new FileReader();
  reader.onload = function () {
    const base64 = reader.result.split(',')[1];

    fetch("YOUR_WEB_APP_URL", { // Replace with Google Apps Script URL
      method: "POST",
      body: JSON.stringify({
        pdfBase64: base64,
        filename: `Athlete_Conduct_${timestamp}.pdf`
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(res => res.text())
    .then(text => {
      document.getElementById("status").textContent = "Submitted successfully.";
    })
    .catch(err => {
      document.getElementById("status").textContent = "Upload failed: " + err;
    });
  };
  reader.readAsDataURL(pdfBlob);

  document.body.removeChild(tempDiv);
});
