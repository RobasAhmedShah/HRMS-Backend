import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as puppeteer from "puppeteer";
const chromium = require("@sparticuz/chromium");
import { db } from "..";

export const generateFitnessFormPDF = functions.https.onRequest(async (req, res) => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed

  try {
    if (req.body.empCode) {
      const employeeCode = req.body.empCode;

      // Fetch employee data
      const employeeDoc = await db.collection("employees").doc(employeeCode).get();
      const employeeData = employeeDoc.data();

      if (!employeeData) {
        res.status(404).send({ error: "Employee not found" });
        return;
      }


          // Generate the HTML dynamically with placeholders replaced by the API data
          const htmlContent = `
        
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fitness Evaluation Form</title>
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
                  margin-bottom: 30px;
              }
      
              .company-info {
                  display: flex;
                  flex-direction: column;
                  gap: 5px;
              }
      
              .company-name {
                  font-size: 16px;
                  font-weight: bold;
              }
      
              .department {
                  font-size: 14px;
              }
      
              .form-number {
                  font-size: 12px;
              }
      
              .form-title {
                  text-align: center;
                  font-size: 16px;
                  font-weight: bold;
                  margin: 20px 0;
              }
      
              .date-code-section {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 30px;
              }
      
              .date-container {
                  display: flex;
                  align-items: center;
                  gap: 10px;
              }
      
              .date-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 60px);
                  gap: 5px;
                  border: 1px solid #000;
                  padding: 5px;
              }
      
              .date-grid-header {
                  display: grid;
                  grid-template-columns: repeat(3, 60px);
                  gap: 5px;
                  font-size: 12px;
                  margin-bottom: 2px;
              }
      
              .date-input {
                  width: 100%;
                  padding: 2px;
                  border: 1px solid #000;
                  text-align: center;
              }
      
              .code-box {
                  border: 1px solid #000;
                  padding: 8px;
                  font-size: 12px;
              }
      
              .main-content {
                  display: flex;
                  gap: 30px;
                  margin-bottom: 30px;
              }
      
              .form-fields {
                  flex: 1;
              }
      
              .photo-placeholder {
                  width: 120px;
                  height: 140px;
                  border: 1px solid #000;
              }
      
              .form-row {
                  display: flex;
                  margin-bottom: 15px;
                  align-items: center;
              }
      
              .form-row label {
                  width: 150px;
                  font-size: 14px;
              }
      
              .form-row input {
                  flex: 1;
                  border: none;
                  border-bottom: 1px solid #000;
                  padding: 5px 0;
                  font-size: 14px;
                  outline: none;
              }
      
              .signatures {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 20px;
                  margin-top: 100px;
              }
      
              .signature-field {
                  text-align: center;
                  border-top: 1px solid #000;
                  padding-top: 5px;
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
                  <div class="form-number">FORM 3-01</div>
              </div>
      
              <div class="form-title">FITNESS EVALUATION FORM</div>
      
              <div class="date-code-section">
                  <div class="date-container">
                      <label>DATE</label>
                      <div>
                          <div class="date-grid-header">
                              <div>Day</div>
                              <div>Month</div>
                              <div>Year</div>
                          </div>
                          <div class="date-grid">
                              <input type="text" class="date-input" value="${day}">
                              <input type="text" class="date-input" value="${month}">
                              <input type="text" class="date-input" value="${today.getFullYear()}">
                          </div>
                      </div>
                  </div>
                  <div class="code-box">
                      Code: ${employeeData.code}
                  </div>
              </div>
      
              <div class="main-content">
                  <div class="form-fields">
                      <div class="form-row">
                          <label>Employee of</label>
                          <input type="text" value="Company ▼">
                      </div>
                      <div class="form-row">
                          <label>Mr./Ms./Mrs.</label>
                          <input type="text" value=${employeeData.EmployeeName}>
                      </div>
                      <div class="form-row">
                          <label>Father's/Husband Name</label>
                          <input type="text" value=${employeeData.Personal.FatherName}>
                      </div>
                      <div class="form-row">
                          <label>Department</label>
                          <input type="text" value=${employeeData.Job.Department}>
                      </div>
                      <div class="form-row">
                          <label>Salary/Wages</label>
                          <input type="text" value="${employeeData.Financial.Salary}">
                      </div>
                      <div class="form-row">
                          <label>Special Allowance</label>
                          <input type="text" value=${employeeData.Financial.TotalAllowance}>
                      </div>
                      <div class="form-row">
                          <label>The personnel is fit for</label>
                          <input type="text" value=${employeeData.Job.Designation}>
                      </div>
                  </div>
                  <div class="photo-placeholder">
                      <img src="/placeholder.svg?height=140&width=120" alt="Employee Photo" style="width: 100%; height: 100%; object-fit: cover;">
                  </div>
              </div>
      
              <div class="signatures">
                  <div class="signature-field">Employee Signature</div>
                  <div class="signature-field">HR Manager Signature</div>
                  <div class="signature-field">General Manager Sign.</div>
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
      const fileName = `fitnessForm-${employeeData.EmployeeCode}.pdf`;
      const file = bucket.file(fileName);
      await file.save(pdfBuffer, { predefinedAcl: "publicRead" });

      // Generate a public URL for the PDF
      const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      res.status(200).send({
        message: "PDF generated and stored successfully",
        pdfUrl: downloadUrl,
      });
    } else {
      res.status(400).send({ error: "Employee code is required" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Unexpected error occurred" });
  }
});