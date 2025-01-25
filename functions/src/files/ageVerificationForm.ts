// Suggested code may be subject to a license. Learn more: ~LicenseLog:647782417.
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as puppeteer from "puppeteer";
const chromium = require("@sparticuz/chromium");



export const generateAgeVerificationFormPDF = functions.https.onRequest(
  async (req, res) => {
    
       // Month is 0-indexed
       try {
        const employeeCode = req.body.empCode;
        let employeeData;
  
        // Fetch employee data if employee code is provided
        if (employeeCode) {
          const response = await fetch(
            "https://us-central1-hrms-1613d.cloudfunctions.net/getAllEmployees"
          );
  
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
  
          const employees = await response.json();
  
          // Filter employee data by code
          employeeData = employees.find(
            (employee: any) => employee.EmployeeCode === employeeCode
          );
  
          if (!employeeData) {
            throw new Error("Employee data not found");
          }
      // Example API response (replace with your actual API call)
      
      // Generate the HTML dynamically with placeholders replaced by the API data
      const htmlContent = ` 
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Age Verification Evidence Record</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }

        body {
            padding: 20px;
            background-color: #fff;
        }

        .form-container {
            width: 100%;
            max-width: 750px;
            margin: 0 auto;
            padding: 30px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }

        .company-info {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .company-name {
            font-size: 16px;
            font-weight: bold;
        }

        .department {
            font-size: 12px;
            color: #000;
        }

        .form-number {
            font-size: 12px;
        }

        .form-title {
            text-align: center;
            font-size: 14px;
            margin: 20px 0;
        }

        .main-content {
            position: relative;
            margin-bottom: 20px;
        }

        .code-box {
            position: absolute;
            top: -70px;
            right: 0;
            border: 0.5px solid #000;
            padding: 2px;
            font-size: 12px;
        }

        .form-row {
            display: flex;
            margin-bottom: 15px;
            align-items: center;
        }

        .form-row label {
            width: 80px;
            font-size: 12px;
        }

        .form-row input[type="text"] {
            flex: 1;
            border: none;
            border-bottom: 1px solid #000;
            padding: 2px 0;
            font-size: 12px;
            outline: none;
        }

        .document-section {
            margin: 20px 0;
        }

        .instruction-text {
            font-size: 12px;
            margin-bottom: 10px;
        }

        .checkbox-grid {
            display: grid;
            grid-template-columns: repeat(4, auto);
            gap: 10px;
            margin-bottom: 15px;
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .checkbox-item input[type="checkbox"] {
            width: 12px;
            height: 12px;
        }

        .checkbox-item label {
            font-size: 12px;
        }

        .document-box {
            border: 1px solid #000;
            height: 300px;
            margin: 20px 0;
        }

        .verification-section {
            margin-top: 20px;
        }

        .verification-title {
            text-align: center;
            font-size: 12px;
            margin-bottom: 10px;
        }

        .verification-text {
            font-size: 12px;
            margin: 10px 0;
        }

        .verified-by {
            text-align: right;
            margin-top: 20px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <div class="header">
            <div class="company-info">
                <div class="company-name">Bitsol Ventures</div>
                <div class="department">Washing & Garment</div>
            </div>
            <div class="form-number">FORM 3-07</div>
        </div>

        <div class="form-title">Age Verification Evidence Record</div>

        <div class="main-content">
            <div class="code-box">
                Code: ${employeeData.Personal.EmployeeCode}
            </div>

            <div class="form-row">
                <label>Name</label>
                <input type="text" value=${employeeData.EmployeeName}">
            </div>

            <div class="form-row">
                <label>Employee of</label>
                <input type="text" value="Company ▼">
            </div>

            <div class="document-section">
                <div class="instruction-text">Attach here the photocopy of Age Verification or (in Case of Short Scale attach it)</div>
                
                <div class="checkbox-grid">
                    <div class="checkbox-item">
                        <input type="checkbox" id="nic1">
                        <label for="nic1">N.I.C Card</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="bform1">
                        <label for="bform1">B. Form</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="photo1">
                        <label for="photo1">Photograph</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="nikah1">
                        <label for="nikah1">Nikah Nama</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="birth1">
                        <label for="birth1">Birth Certificate</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="school1">
                        <label for="school1">School leaving certificate</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="doctor1">
                        <label for="doctor1">Government Doctor's certificate</label>
                    </div>
                </div>

                <div class="document-box"></div>
            </div>

            <div class="verification-section">
                <div class="verification-title">Verification Evidence</div>
                
                <div class="verification-text">The photocopy of Age Verification Through</div>
                
                <div class="checkbox-grid">
                    <div class="checkbox-item">
                        <input type="checkbox" id="nic2">
                        <label for="nic2">N.I.C Card</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="bform2">
                        <label for="bform2">B. Form</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="photo2">
                        <label for="photo2">Photograph</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="nikah2">
                        <label for="nikah2">Nikah Nama</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="birth2">
                        <label for="birth2">Birth Certificate</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="school2">
                        <label for="school2">School leaving certificate</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="doctor2">
                        <label for="doctor2">Government Doctor's certificate</label>
                    </div>
                </div>

                <div class="verification-text">has been verified by seeing the original Document</div>

                <div class="verified-by">Verified By</div>
            </div>
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
  const fileName = `ageVerificationForm-${employeeData.Personal.EmployeeCode}.pdf`;
  const file = bucket.file(fileName);
  await file.save(pdfBuffer, { predefinedAcl: "publicRead" });

  // Generate a signed URL for the PDF
  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  res
    .status(200)
    .send({ message: "PDF generated and stored successfully", url: downloadUrl });
}
} catch (error) {
res.status(500).send(`An error occurred:`);
}
}
);