import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as puppeteer from "puppeteer";
const chromium = require("@sparticuz/chromium");
import { db } from "..";

export const generateJobDescFormPDF = functions.https.onRequest(
  async (req, res) => {
    try {
        const employeeCode = req.body.empCode;
        const employeeDoc = await db
          .collection("employees")
          .doc(employeeCode)
          .get();
  
          const employeeData = employeeDoc.data();

          if(!employeeData)
            {
                console.log("Employee Not Found");
                return;
            }
  
          
       
      // Generate the HTML dynamically with placeholders replaced by the API data
      const htmlContent = `
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Description Form</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: normal;
        }

        .header p {
            margin: 5px 0;
            font-size: 14px;
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        .form-group {
            display: flex;
            align-items: center;
        }

        .form-group label {
            min-width: 100px;
            font-size: 14px;
        }

        .form-group input {
            flex: 1;
            border: none;
            border-bottom: 1px solid #000;
            padding: 5px 0;
            font-size: 14px;
        }

        .job-description {
            margin-bottom: 30px;
        }

        .job-description-header {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            margin-bottom: 20px;
        }

        .tasks {
            list-style-position: inside;
            padding-left: 0;
        }

        .tasks li {
            margin-bottom: 10px;
            font-size: 14px;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 200px;
        }

        .signature {
            width: 200px;
            text-align: center;
        }

        .signature-line {
            border-top: 1px solid #000;
            margin-bottom: 5px;
        }

        .signature-title {
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Artistic Milliners - 4C</h1>
        <p>Working & Garment</p>
    </div>


    <div class="form-grid">
        <div class="form-group">
            <label>Employee Code:</label>
            <input type="text" value=${employeeData?.Personal.EmployeeCode}>
        </div>
        <div class="form-group">
            <label>Department:</label>
            <input type="text" value=${employeeData?.Job.Department}>
        </div>
        <div class="form-group">
            <label>Name:</label>
            <input type="text" value=${employeeData?.EmployeeName}>
        </div>
        <div class="form-group">
            <label>Section:</label>
            <input type="text" value=${employeeData?.Job.Section}>
        </div>
        <div class="form-group">
            <label>Date of Joining:</label>
            <input type="text" value="${employeeData?.DateOfJoining}">
        </div>
        <div class="form-group">
            <label>Designation:</label>
            <input type="text" value=${employeeData?.Job.Designation}>
        </div>
    </div>

    <div class="job-description">
        <div class="job-description-header">
            Job Description
        </div>
        <ol class="tasks">
            <li>Ensure that work will start on time.</li>
            <li>Clean the machine before starting and completion of work.</li>
            <li>Stitch the garment as per the specification given by the Supervisor.</li>
            <li>Ensure that the production targets are achieved.</li>
        </ol>
    </div>

    <div class="signatures">
        <div class="signature">
            <div class="signature-line"></div>
            <div class="signature-title">Employee</div>
        </div>
        <div class="signature">
            <div class="signature-line"></div>
            <div class="signature-title">HR Manager</div>
        </div>
    </div>
</body>
</html>
      `;
  // Launch Puppeteer to generate PDF
  const browser = await puppeteer.launch({
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });
  await browser.close();

  // Save PDF to Firebase Storage
  const bucket = admin.storage().bucket();
  const fileName = `JobDescriptionForm-${employeeData?.Personal.EmployeeCode}.pdf`;
  const file = bucket.file(fileName);
  await file.save(pdfBuffer, { predefinedAcl: "publicRead" });

  // Generate a signed URL for the PDF
  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  res
    .status(200)
    .send({ message: "PDF generated and stored successfully", pdfUrl: downloadUrl });

} catch (error) {
      console.error("Error generating PDF:", error); // Log the error for debugging
      res.status(500).send(`An error occurred: ${error}`);
}
}
);