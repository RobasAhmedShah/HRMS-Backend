// Suggested code may be subject to a license. Learn more: ~LicenseLog:3000757631.
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as puppeteer from "puppeteer-core";
const chromium = require("@sparticuz/chromium");
import { generateBarcode } from "../components/barcode";



function getDatesInRange(startDate: Date, endDate: Date) {
  const date = new Date(startDate.getTime());
  const dates = [];

  while (date <= endDate) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return dates;
}

function formatDate(date: Date) {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const dayOfWeek = daysOfWeek[date.getDay()];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${dayOfWeek}, ${day} ${month}, ${year}`;
}

// Define the cloud function
export const generateTrialSlip = functions.https.onRequest(async (req, res) => {
    try {

      // Parse request body
      const { startDate, endDate, section, department, name, designation, cnic, employeeImage } =
        req.body;

      // Generate trial number and current date
      const generatedTrialNumber = generateTrialNumber();
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const barcodeImg = await generateBarcode(generatedTrialNumber);
      const datesInRange = getDatesInRange(startDateObj, endDateObj);
      const formattedDates = datesInRange.map(date => formatDate(date));

      const issueDate = new Date().toLocaleDateString();
      const currentDate = startDate;
      
      // Create the HTML for the trial slip
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Trial Slip</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  max-width: 800px;
                  margin: 20px auto;
                  padding: 20px;
              }
      
              .header {
                  text-align: center;
                  margin-bottom: 20px;
              }
      
              .header h1 {
                  color: #2c3e50;
                  margin: 5px 0;
              }
      
              .form-container {
                  border: 1px solid #ccc;
                  padding: 20px;
                  position: relative;
              }
      
              .employee-image {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 120px;
                height: 140px;
                border: 1px solid #ccc;
                overflow: hidden;
                background-color: #f8f9fa;
            }
            .employee-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: center;
            }            
      
              .form-row {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 15px;
              }
      
              .form-group {
                  margin-bottom: 10px;
              }
      
              .form-group label {
                  display: block;
                  margin-bottom: 5px;
                  color: #666;
              }
      
              .form-group input {
                  width: 100%;
                  padding: 8px;
                  border: 1px solid #ddd;
                  border-radius: 4px;
              }
      
              .attendance-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
              }
      
              .attendance-table th,
              .attendance-table td {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
              }
      
              .attendance-table th {
                  background-color: #f8f9fa;
              }
      
              .signatures {
                  display: grid;
                  grid-template-columns: repeat(5, 1fr);
                  gap: 10px;
                  margin-top: 40px;
              }
      
              .signature {
                  text-align: center;
              }
      
              .signature-line {
                  width: 100%;
                  border-top: 1px solid #000;
                  margin-bottom: 5px;
              }
      
              .barcode {
                  text-align: center;
                  margin: 20px 0;
              }
      
              .reference-number {
                  font-family: monospace;
                  margin-bottom: 20px;
              }
      
              @media (max-width: 768px) {
                  .form-row {
                      grid-template-columns: 1fr;
                  }
      
                  .signatures {
                      grid-template-columns: 1fr;
                  }
              }
          </style>
      </head>
      <body>
          <div class="form-container">
              <div class="header">
                  <h1>Bitsol Ventures</h1>
                  <h2>Trial Slip</h2>
              </div>
      
              <div class="employee-image">
                  <img src="${employeeImage}" alt="Employee Image">
              </div>
      
              <div class="form-row">
                  <div class="form-group">
                      <label>Trial #:</label>
                      <input type="text" value="${generateTrialNumber()}" readonly>
                  </div>
                  <div class="form-group">
                      <label>Issue Date:</label>
                      <input type="text" value="${issueDate}" readonly>
                  </div>
              </div>
      
              <div class="form-row">
                  <div class="form-group">
                      <label>Date:</label>
                      <input type="text" value="${currentDate}" readonly>
                  </div>
                  <div class="form-group">
                      <label>Name:</label>
                      <input type="text" value="${name}" readonly>
                  </div>
              </div>
      
              <div class="form-row">
                  <div class="form-group">
                      <label>Department:</label>
                      <input type="text" value=${department} readonly>
                  </div>
                  <div class="form-group">
                      <label>Section:</label>
                      <input type="text" value=${section} readonly>
                  </div>
              </div>
      
              <div class="form-row">
                  <div class="form-group">
                      <label>Designation:</label>
                      <input type="text" value=${designation} readonly>
                  </div>
                  <div class="form-group">
                      <label>CNIC:</label>
                      <input type="text" value=${cnic} readonly>
                  </div>
              </div>
      
              <h3>Attendance</h3>
              <table class="attendance-table">
                  <thead>
                      <tr>
                          <th>Days</th>
                          <th>Date</th>
                          <th>Time In</th>
                          <th>Time Out</th>
                          <th>Gate Sign</th>
                      </tr>
                  </thead>
                  <tbody>
                   ${formattedDates.map((date, index) => `
                      <tr>
                            <td>${index + 1}</td>
                            <td>${date}</td>
                          <td></td>
                          <td></td>
                          <td></td>
                      </tr>
                    `).join('')}

                          <td></td>
                          <td></td>
                          <td></td>
                      </tr>
                  </tbody>
              </table>
      
              <div class="reference-number">
                  <p>Reference Number: ${generatedTrialNumber}</p>
              </div>
      
              <div class="barcode">
                  <img src="${barcodeImg}" alt="Barcode">
              </div>
      
              <div class="signatures">
                  <div class="signature">
                      <div class="signature-line"></div>
                      <div>H.O.D</div>
                  </div>
                  <div class="signature">
                      <div class="signature-line"></div>
                      <div>Manager H.R</div>
                  </div>
                  <div class="signature">
                      <div class="signature-line"></div>
                      <div>H.R Officer</div>
                  </div>
                  <div class="signature">
                      <div class="signature-line"></div>
                      <div>Admin Manager</div>
                  </div>
                  <div class="signature">
                      <div class="signature-line"></div>
                      <div>Factory Manager</div>
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
      const fileName = `trialSlip-${generatedTrialNumber}.pdf`;
      const file = bucket.file(fileName);
      await file.save(pdfBuffer, { predefinedAcl: 'publicRead' });

      // Save Employee Image to Firebase Storage
      const employeeImageBuffer = Buffer.from(employeeImage.split(',')[1], 'base64'); // Assuming base64 encoded image
      const employeeImageFileName = `employeeImages/employee-${generatedTrialNumber}.jpg`; // You can change extension if necessary
      const employeeImageFile = bucket.file(employeeImageFileName);
      await employeeImageFile.save(employeeImageBuffer, { contentType: 'image/jpeg', predefinedAcl: 'publicRead' }); // Adjust contentType if it's not jpeg

      const employeeImageDownloadUrl = `https://storage.googleapis.com/${bucket.name}/${employeeImageFileName}`;

      // Generate a signed URL for the PDF
      const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      
      const data = {
        EmployeeID: generatedTrialNumber,
        EmployeeCode: generatedTrialNumber,
        EmployeeName: name,
        Gender:null,
        DOB:null,
        Mobile:null,
        DateOfJoining:null,
        MaritalStatus:null,
        MType:null,
        sYear:null,
        PayMode:null,
        AccountNo:null,
        OTType:null,
        pdfUrl:downloadUrl,
        Type: "Trial",
        employeeImageUrl: employeeImageDownloadUrl,
        Personal: {
          EmployeeID: generatedTrialNumber,
          EmployeeCode: generatedTrialNumber,
          EmployeeName: name,
          CNIC: cnic,
        },
        Job: {
          Department: department,
          Section: section,
          Designation: designation,
          DateOfJoining: startDate,
          LeftDate: endDate,
        },
        FromDate: startDate,
        ToDate: endDate,
      };
      
      // Save data to Firestore without calling an API
      try {
        const db = admin.firestore();
        await db.collection('employees').doc(generatedTrialNumber).set(data);
        console.log("Data saved successfully to Firestore!");
      } catch (dbError) {
        console.error("Error saving data to Firestore:", dbError);
        res.status(500).json({
          message: "Failed to save data to Firestore",
        });
      }

      // Send response with the PDF download link
      res.status(200).json({
        message: "Trial slip generated successfully",
        pdfUrl: downloadUrl,
      });
    } catch (error) {
      console.error("Error generating trial slip:", error);
      res.status(500).json({
        message: "Failed to generate trial slip",
      });
    }
});

// Utility function to generate a unique trial number
function generateTrialNumber(): string {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}${("0" + (date.getMonth() + 1)).slice(-2)}${("0" + date.getDate()).slice(-2)}${("0" + date.getHours()).slice(-2)}${("0" + date.getMinutes()).slice(-2)}`;
  return `TRL-${formattedDate}`;
}
