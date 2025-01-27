import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as puppeteer from "puppeteer";
const chromium = require("@sparticuz/chromium");
import { db } from "..";


export const generateEmploymentFormPDF = functions.https.onRequest(
  async (req, res) => {
    const employeeCode = req.body.empCode;
      const employeeDoc = await db
        .collection("employees")
        .doc(employeeCode)
        .get();

        const employeeData = employeeDoc.data();

        

        
    

    // Ensure employee data exists
    if (!employeeData) {
      throw new Error("Employee data not found.");
    }

    const currentDate = new Date();


      // Generate the HTML dynamically with placeholders replaced by the API data
      const htmlContent = `
      <html lang="en"><head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Employment Form</title>
      <style>
          * {
      font-family: Arial, sans-serif;
      font-size: 10px; /* Reduced from 12px */
      margin: 0;
      padding: 0px; /* Reduced from 10px */
          }
  
          body {
              padding: 15px;
              background-color: #fff;
          }
  
          .form-container {
              width: 100%;
              max-width: 700px;
              margin: 0 auto;
              border: 1px solid #000;
              padding: 5px;
          }
          table th, table td {
      padding: 2px; /* Reduced from 3px */
  }
  
  
           .form-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          align-items: start;
          gap: 20px;
      }
  
      .photo-placeholder {
          border: 1px solid #000;
          width: 50px;
          height: 50px;
          flex-shrink: 0;
      }
  
          .company-info {
              display: flex;
              flex-direction: column;
              gap: 3px;
          }
  
          .form-title {
              font-weight: bold;
          }
  
          .form-number {
              font-weight: bold;
          }
  
          .code-date-container {
              display: flex;
              gap: 20px;
              margin-bottom: 15px;
          }
  
          .code-box {
              border: 1px solid #000;
              padding: 8px;
              width: 200px;
          }
  
          .date-box {
              border: 1px solid #000;
              padding: 8px;
              flex-grow: 1;
          }
  
          .date-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin-top: 5px;
          }
  
          .date-grid input {
              width: 100%;
              border: 1px solid #000;
              padding: 2px 5px;
          }
  
          .form-row {
              display: flex;
              margin-bottom: 12px;
              align-items: center;
          }
  
          .form-row label {
              min-width: 140px;
          }
  
          .form-row input[type="text"],
          .form-row input[type="tel"] {
              flex-grow: 1;
              border: none;
              border-bottom: 1px solid #000;
              padding: 2px 0;
              outline: none;
          }
  
          .reference-box {
              border: 1px solid #000;
              padding: 10px;
              margin: 15px 0;
          }
  
          .criminal-record {
              margin: 15px 0;
          }
  
          .attachments {
              margin: 15px 0;
          }
  
          .checkbox-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 10px;
              margin-top: 10px;
          }
  
          .checkbox-item {
              display: flex;
              align-items: center;
              gap: 5px;
          }
  
          .signature-section {
              border-top: 1px dashed #000;
              margin-top: 20px;
              padding-top: 15px;
          }
  
          .approval-section {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin: 15px 0;
          }
  
          .approval-item {
              display: flex;
              align-items: center;
              gap: 10px;
          }
  
          .department-section {
              border-top: 1px solid #000;
              margin-top: 20px;
              padding-top: 15px;
          }
  
          .authorized-signature {
              text-align: right;
              margin-top: 10px;
              font-size: 5px;
          }
  
          .checkbox-custom {
              width: 12px;
              height: 12px;
          }
          
  .section-heading {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
      }
      h1 {
      font-size: 14px; /* Reduced from 16px */
  }
  h2, h3 {
      font-size: 10px; /* Reduced from 12px */
  }
  
      .experience-grid {
          margin: 15px 0;
          width: 100%;
          gap:2px;
      }
  .experience-input {
      min-height: 15px; /* Reduced from 20px */
  }
      .exp-row {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 0.8fr 0.8fr;
          gap: 15px;
          margin-bottom: 15px;
      }
  
      .exp-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
      }
  
      .exp-field label {
          font-size: 11px;
          color: #000;
      }
  
      .exp-field input {
          border: 1px solid #000;
          padding: 3px 8px;
          width: 100%;
          height: 28px;
      }
  
      .reference-section {
          margin: 20px 0;
          width: 100%;
      }
  
      .ref-row {
          display: grid;
          grid-template-columns: 250px 1fr 200px;
          gap: 20px;
          margin-bottom: 15px;
      }
  
      .ref-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
      }
  
      .ref-field label {
          font-size: 11px;
          color: #000;
      }
  
      .ref-field input {
          border: 1px solid #000;
          padding: 3px 8px;
          height: 28px;
      }
      .criminal-history {
          margin: 15px 0;
      }
  
      .criminal-box {
          border: 1px solid #000;
          padding: 5px;
          margin-top: 5px;
          display: grid;
          grid-template-columns: 1fr 2fr;
      }
  
      .criminal-box input {
          border: none;
          width: 100%;
          padding: 2px;
      }
  
      .attachments-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 8px;
      }
  
      .attachment-item {
          display: flex;
          align-items: center;
          gap: 5px;
      }
  
      .attachment-item input[type="checkbox"] {
          width: 12px;
          height: 12px;
      }
      .confirmation-section {
          margin: 20px 0;
      }
  
      .confirmation-text {
          font-weight: normal;
          margin-bottom: 10px;
      }
  
      .signature-row {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 20px;
          margin: 10px 0;
      }
  
      .signature-field {
          border-bottom: 1px solid #000;
          min-height: 25px;
      }
  
      .office-section {
          margin: 20px 0;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 15px 0;
      }
  
      .office-header {
          text-align: center;
          font-weight: bold;
          margin-bottom: 15px;
      }
  
      .appointment-row {
          display: grid;
          grid-template-columns: auto auto 1fr;
          gap: 20px;
          align-items: center;
          margin-bottom: 15px;
      }
  
      .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
      }
  
      .wef-field {
          display: flex;
          align-items: center;
          gap: 10px;
      }
  
      .salary-row {
          display: grid;
          grid-template-columns: auto auto 1fr;
          gap: 20px;
          align-items: center;
          margin-bottom: 15px;
      }
  
      .department-grid {
          display: grid;
          grid-template-columns: 100px 1fr 100px 1fr;
          gap: 15px;
          margin-bottom: 10px;
      }
  
      .remarks-row {
          margin: 15px 0;
      }
  
      .remarks-input {
          width: 100%;
          border: none;
          border-bottom: 1px solid #000;
          margin-top: 5px;
      }
  
      .bottom-section {
          margin-top: 20px;
      }
  
      .data-entry-row {
          display: grid;
          grid-template-columns: auto 1fr auto 1fr;
          gap: 15px;
          align-items: center;
          margin: 10px 0;
      }
  
      .authorized-signature {
          text-align: right;
          font-size: 11px;
          margin-top: 5px;
      }
      
  
          /*.experience-grid > div {*/
          /*    border: 1px solid #000;*/
          /*    padding: 5px;*/
          /*    min-height: 50px;*/
          /*}*/
  
          /*.experience-grid > div:first-child {*/
          /*    grid-column: span 2;*/
          /*}*/
  
          /*.reference-grid {*/
          /*    display: grid;*/
          /*    grid-template-columns: repeat(3, 1fr);*/
          /*    border: 1px solid #000;*/
          /*    margin: 15px 0;*/
          /*}*/
  
          /*.reference-grid > div {*/
          /*    border: 1px solid #000;*/
          /*    padding: 5px;*/
          /*    min-height: 50px;*/
          /*}*/
      </style>
  </head>
  <body>
      <div class="form-container">
          <div class="form-header">
              <div class="company-info">
                  <div class="form-title">EMPLOYMENT FORM</div>
                  <div>Employee of</div>
                  <div>Company:Bitsol Ventures</div>
              </div>
              <div class="form-number">FORM 3-01</div>
               <div class="photo-placeholder">
          <img src="" alt="Photo" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
          </div>
  
          <div class="code-date-container">
              <div class="code-box">
                  Code: ${employeeData.EmployeeCode}
              </div>
              <div class="date-box">
                  <div>DATE</div>
                  <div class="date-grid">
                      <input type="text" placeholder="Day" value="${employeeData.DateOfJoining}">
                      <input type="text" placeholder="Month" value="${employeeData.DateOfJoining}">
                      <input type="text" placeholder="2021" value="${employeeData.DateOfJoining}">
                  </div>
              </div>
          </div>
  
          <div class="form-row">
              <label>Name:</label>
              <input type="text" value="${employeeData.Personal.EmployeeName}">
          </div>
  
          <div class="form-row">
              <label>Father's/Husband Name:</label>
              <input type="text" value="${employeeData.Personal.FatherName}">
          </div>
  
          <div class="form-row">
              <label>Marital Status:</label>
              <input type="text" value="${employeeData.Personal.MaritalStatus}">
              <label style="margin-left: 20px">No. of Children:</label>
              <input type="text" value="">
          </div>
  
          <div class="form-row">
              <label>Address:</label>
              <input type="text" value="${employeeData.Personal.Address}">
          </div>
  
          <div class="form-row">
              <label>Contact No:</label>
              <input type="tel" value="${employeeData.Personal.Mobile}">
              <label style="margin-left: 20px">Cell no:</label>
              <input type="tel" value="0346-2234591">
          </div>
  
          <div class="form-row">
              <label>Gender:</label>
              <input type="text" value="${employeeData.Personal.Gender}">
              <label style="margin-left: 20px">Date of Birth:</label>
              <input type="text" value="03 DEC جولائی">
          </div>
  
          <div class="form-row">
              <label>N.I.C No:</label>
              <input type="text" value="${employeeData.Personal.CNIC}">
          </div>
          
          <div class="form-row">
              <label>Religion:</label>
              <input type="text" value="${employeeData.Personal.Religion}">
          </div>

          <div class="form-row">
              <label>Qualification:</label>
              <input type="text" value="${employeeData.Personal.Qualification}">
          </div>
          
  
    
  <!-- Experience Section -->
  <div class="experience-grid">
      <h3 class="section-heading">Experience</h3>
      <div class="exp-row">
          <div class="exp-field">
              <label>Comp.</label>
              <input type="text" value="">
          </div>
          <div class="exp-field">
              <label>Desig.</label>
              <input type="text" value="">
          </div>
          <div class="exp-field">
              <label>Dept.</label>
              <input type="text" value="">
          </div>
          <div class="exp-field">
              <label>Duration:</label>
              <input type="text" value="">
          </div>
          <div class="exp-field">
              <label>Location:</label>
              <input type="text" value="">
          </div>
      </div>
      <div class="exp-row">
          <div class="exp-field">
              <label>Comp.</label>
              <input type="text" value="">
          </div>
          <div class="exp-field">
              <label>Desig.</label>
              <input type="text" value="">
          </div>
          <div class="exp-field">
              <label>Dept.</label>
              <input type="text">
          </div>
          <div class="exp-field">
              <label>Duration:</label>
              <input type="text">
          </div>
          <div class="exp-field">
              <label>Location:</label>
              <input type="text">
          </div>
      </div>
  </div>
  
  <!-- Reference Section -->
  <div class="reference-section">
      <h3 class="section-heading">Reference</h3>
      <div class="ref-row">
          <div class="ref-field">
              <label>Name:</label>
              <input type="text" value="">
          </div>
          <div class="ref-field">
              <label>How Known:</label>
              <input type="text" value="">
          </div>
          <div class="ref-field">
              <label>Relationship:</label>
              <input type="text" value="">
          </div>
      </div>

      <div class="ref-row">
          <div class="ref-field">
              <label>When you Know:</label>
              <input type="text">
          </div>
          <div class="ref-field">
              <label>Address:</label>
              <input type="text">
          </div>
      </div>
  </div>
  
  
  <!-- Criminal History Section -->
  <div class="criminal-history">
      <div>Any Criminal History</div>
      <div class="criminal-box">
          <div style="border-right: 1px solid #000; padding-right: 5px;">
              <label>If yes, which case &amp;</label>
              <input type="text">
          </div>
          <div style="padding-left: 5px;">
              <label>how long custody:</label>
              <input type="text">
          </div>
      </div>
  </div>
  
  <!-- Attachments Section -->
  <div class="attachments">
      <div>TICK THE ATTACHMENT AS APPROPRIATE:</div>
      <div class="attachments-grid">
          <div class="attachment-item">
              <input type="checkbox">
              <label>N.I.C Card</label>
          </div>
          <div class="attachment-item">
              <input type="checkbox">
              <label>B. Form</label>
          </div>
          <div class="attachment-item">
              <input type="checkbox">
              <label>Photograph</label>
          </div>
          <div class="attachment-item">
              <input type="checkbox">
              <label>Nikah Nama</label>
          </div>
          <div class="attachment-item">
              <input type="checkbox">
              <label>Birth Certificate</label>
          </div>
          <div class="attachment-item">
              <input type="checkbox">
              <label>School leaving certificate</label>
          </div>
          <div class="attachment-item">
              <input type="checkbox">
              <label>Government Doctor's certificate</label>
          </div>
      </div>
  </div>
  <div class="office-header">FOR OFFICE USE ONLY</div>
  
          <div class="signature-section">
              <div class="form-row">
                  
                  <label>Date:</label>
               <input type="text"
                    value="${currentDate.getDate()} ${currentDate.toLocaleString('default', {
                      month: 'long',
                    })} ${currentDate.getFullYear()}">
               
                  <input type="text">
                  <label style="margin-left: 20px">Signature of applicant:</label>
                  <input type="text">
              </div>
          </div>
  
          <div class="approval-section">
              <div class="approval-item">
                  <span>Appointed:</span>
                  <input type="checkbox" class="checkbox-custom">
                  <span>Yes</span>
                  <input type="checkbox" class="checkbox-custom">
                  <span>No</span>
              </div>
              <div class="approval-item">
                  <span>Salary/Wage:</span>
                  <input type="text" style="width: 100px; border-bottom: 1px solid #000">
              </div>
          </div>
  
          <div class="department-section">
              <div class="form-row">
                  <label>Department:</label>
                  <input type="text" value="${employeeData.Job.Department}">
                  <label style="margin-left: 20px">Section:</label>
                  <input type="text" value="${employeeData.Personal.Section}">
              </div>
  
              <div class="form-row">
                  <label>Date:</label>
                    <input type="text" value="${currentDate.getDate()} ${currentDate.toLocaleString(
                      'default',
                      { month: 'long' }
                    )} ${currentDate.getFullYear()}">
                    
              </div>
  
              <div class="form-row">
                  <label>Remarks (if any):</label>
                  <input type="text">
              </div>
  
              <div class="form-row">
                  <label>Bitsol Venture's Identification No:</label>
                  <input type="text" value="1101800257">
              </div>
          </div>
  
          <div class="authorized-signature">
              Approved by
          </div>
      </div>
  
  </body></html>
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
  const fileName = `employementForm-${employeeData.EmployeeCode}.pdf`;
  const file = bucket.file(fileName);
  await file.save(pdfBuffer, { predefinedAcl: 'publicRead' });

  // Generate a signed URL for the PDF
  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      res.status(200).send({ message: "PDF generated and stored successfully", pdfUrl: downloadUrl });
    } 
);
