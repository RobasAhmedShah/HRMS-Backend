import * as functions from "firebase-functions";
import * as puppeteer from "puppeteer-core";
import admin from "firebase-admin";
const chromium = require("@sparticuz/chromium");


export const generateOrientationChecklist = functions.https.onRequest(
    {memory:"512MiB"},
  async (req, res) => {
    try {
        const employeeData=req.body;
      // Example API response (Replace this with actual API call)
    //   const employeeData = {
    //     id: "1103800257",
    //     name: "Saima",
    //     checklist: [
    //       { id: 1, topic: "LEAVES", training: "Yes", evaluation: "Yes", remarks: "Un-Satisfactory" },
    //       { id: 2, topic: "Salary Payment Policy", training: "Yes", evaluation: "Yes", remarks: "Satisfactory" },
    //       { id: 3, topic: "Hours of work (Timing)", training: "Yes", evaluation: "Yes", remarks: "Un-Satisfactory" },
    //       { id: 4, topic: "Fire Safety", training: "Yes", evaluation: "Yes", remarks: "Satisfactory" },
    //       { id: 5, topic: "OBI / CSDAT", training: "Yes", evaluation: "No", remarks: "Un-Satisfactory" },
    //       { id: 6, topic: "CPR", training: "No", evaluation: "No", remarks: "Satisfactory" },
    //       { id: 7, topic: "Fire Extinguisher", training: "Yes", evaluation: "Yes", remarks: "Satisfactory" },
    //       { id: 8, topic: "Employee of Other PPEs", training: "Yes", evaluation: "Yes", remarks: "Satisfactory" },
    //       { id: 9, topic: "Handling of Chemicals", training: "No", evaluation: "No", remarks: "Un-Satisfactory" },
    //       { id: 10, topic: "Evacuation Drill", training: "Yes", evaluation: "Yes", remarks: "Satisfactory" },
    //     ],
    //     trainingDate: "01:04:2021",
    //   };

      // Generate the HTML dynamically
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orientation Checklist</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 40px;
            font-size: 12px;
        }
        h1 {
            font-size: 24px;
            margin: 0;
            padding: 0;
            text-align: left;
        }
        h2 {
            font-size: 18px;
            margin: 0;
            padding: 0;
            text-align: left;
        }
        .header {
            display: flex;
            justify-content: space-between;
        }
        .header p {
            margin: 0;
        }
        .file-number {
            text-align: right;
            font-weight: bold;
        }
        .checklist-title {
            text-align: center;
            font-weight: bold;
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
        }
        .footer div {
            text-align: center;
            width: 30%;
        }
        .footer div hr {
            width: 80%;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>Artistic Milliners - 4C</h1>
            <h2>Washing & Garment</h2>
        </div>
        <div class="file-number">
            <p><strong>FORM 3-12</strong></p>
        </div>
    </div>

    <p class="checklist-title">ORIENTATION CHECKLIST OF COMPANY'S MATTER / FACILITIES</p>
    <p>Employee ID: ${employeeData.id} &nbsp; Employee Name: ${employeeData.name}</p>
    
    <table>
        <thead>
            <tr>
                <th>S. No.</th>
                <th>Orientation To Be Given On</th>
                <th>Training Given</th>
                <th>Follow Up Evaluation</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            ${employeeData.checklist
              .map(
                (item: { id: any; topic: any; training: any; evaluation: any; remarks: any; }) => `
            <tr>
                <td>${item.id}</td>
                <td>${item.topic}</td>
                <td>${item.training}</td>
                <td>${item.evaluation}</td>
                <td>${item.remarks}</td>
            </tr>`
              )
              .join("")}
        </tbody>
    </table>

    <p>Training Attended On: <strong>${employeeData.trainingDate}</strong></p>
    <p>Employee Signature: ______________________</p>

    <div class="footer">
        <div>
            <hr>
            <p>Prepared By</p>
        </div>
        <div>
            <hr>
            <p>Check By</p>
        </div>
        <div>
            <hr>
            <p>Reviewed By</p>
        </div>
    </div>
</body>
</html>
`;
const browser = await puppeteer.launch({
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent);

  // Generate PDF
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  // Save PDF to Firebase Storage
  const bucket = admin.storage().bucket();
  const fileName = `orientationFile-${employeeData.id}.pdf`;
  const file = bucket.file(fileName);

  await file.save(pdfBuffer, {
    predefinedAcl: "publicRead",
  });

  // Generate a signed URL for the PDF
  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

  res.status(200).json({
    message: "Orientation file slip generated successfully",
    pdfUrl: downloadUrl,
  });
} catch (error) {
  console.error("Error generating personal file slip:", error);
  res.status(500).json({
    message: "Failed to generate personal file slip",
  });
}
}
);
