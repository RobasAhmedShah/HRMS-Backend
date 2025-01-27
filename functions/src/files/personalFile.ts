import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as puppeteer from "puppeteer-core";
const chromium = require("@sparticuz/chromium");
import { db } from ".."; 
export const generatePersonalFileSlip = functions.https.onRequest(
  {
    memory: "512MiB", // Allocate 512MB of memory
  },
  async (req, res) => {
    try {
      // Parse request body

      const employeeCode = req.body.empCode;
      const FileNo=Math.random();
      const employeeDoc = await db
        .collection("employees")
        .doc(employeeCode)
        .get();
      const EmployeeName = employeeDoc.data()?.EmployeeName;


      // Generate slip number and current date
      const generatedSlipNumber = generateSlipNumber();

      // Generate HTML dynamically for checklist
      const checklistHTML = Object.keys(getDocumentNames())
        .map((key) => {
          return `
          <tr>
              <td>${key}</td>
              <td>${getDocumentName(key)}</td>
              <td>
                  <input type="checkbox" > Yes
                  <input type="checkbox" > No
                  <input type="checkbox"  > N/A
              </td>
          </tr>`;
        })
        
        .join("");

      // Create the HTML for the personal file slip
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Personal File Check List</title>
          <style>
              body {
                  font-family: 'Arial', sans-serif;
                  margin: 40px; /* Increased margin for more space */
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
                  align-items: center;
              }
              .header p {
                  margin: 0;
              }
              .file-number {
                  text-align: right;
                  font-weight: bold; /* Make the file number bold */
              }
              .checklist-title {
                  text-align: center; /* Center the title */
                  font-weight: bold; /* Bold the title */
                  margin: 20px 0; /* Add space above and below */
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
                  <h1>Bitsol Ventures</h1>
                  <h2>Powered by AI</h2>
              </div>
              <div class="file-number">
                  <p><strong>${FileNo}</strong></p>
              </div>
          </div>
      
          <p class="checklist-title">PERSONAL FILE CHECK LIST</p>
          <p>Ensure that the accurate and correct information is in the file as per given points:</p>
          <p>Employee ID: ${employeeCode} &nbsp; Employee Name: ${EmployeeName}</p>
          
          <table>
              <thead>
                  <tr>
                      <th>#</th>
                      <th>Document</th>
                      <th>Attached/Done</th>
                  </tr>
              </thead>
              <tbody>
                  ${checklistHTML}
              </tbody>
          </table>
      
          <div class="footer">
              <div>
                  <hr>
                  <p>Prepared By</p>
              </div>
              <div>
                  <hr>
                  <p>Checked By</p>
              </div>
              <div>
                  <hr>
                  <p>Reviewed By</p>
              </div>
          </div>
      </body>
      </html>
      `;

      // Launch Puppeteer
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
      const fileName = `personalFileSlip-${generatedSlipNumber}.pdf`;
      const file = bucket.file(fileName);

      await file.save(pdfBuffer, {
        predefinedAcl: "publicRead",
      });

      // Generate a signed URL for the PDF
      const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      res.status(200).json({
        message: "Personal file slip generated successfully",
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

// Utility function to generate a unique slip number
function generateSlipNumber(): string {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}${(
    "0" +
    (date.getMonth() + 1)
  ).slice(-2)}${("0" + date.getDate()).slice(-2)}${(
    "0" + date.getHours()
  ).slice(-2)}${("0" + date.getMinutes()).slice(-2)}`;
  return `PFS-${formattedDate}`;
}

// Utility function to map serial numbers to document names
function getDocumentNames(): Record<string, string> {
  const documentNames: Record<string, string> = {
    "1": "Separate Employee file with File No.",
    "2": "Application / CV of Employee for Job, if any",
    "3": "Educational Certificates, if any - Verified Copy",
    "4": "Experience Certificates, if any - Vertified Copy",
    "5": "Employment Form in Urdu or English with data filled",
    "6": "National Identity Card Attached",
    "7": "File age Verification form and verify worker's age by anyone of the following",
    "7a": "National Identity Card - NIC", 
    "7b":"Birth Certificate",
    "7c":"Form B",
    "7d":"Government Doctor's Certificate Verifying age",
    "7e": "School Leaving Certificate",
    "8": "Certification of Verification of Age as above with original",
    "9": "3 or 4 Photos of Employee in 1 x 1 Size for ID Card & File",
    "10": "Fitness evaluation confirming worker's ability to work",
    "11": "Letter of Appointment in urdu",
    "12": "Letter of Appointment in English",
    "13": "Orientation Checklist of Company's Matters / Facilities",
    "14": "Letter of Confirmation in Urdu",
    "15": "Letter of Confirmation in English",
    "16": "Employee's Rights Benefits (English or Urdu)",
    "17": "Hygiene Card (Health verification by Doctor)",
    "18": "Leave Forms",
    "19": "Increment Sheets",
    "20": "Loan Application",
    "22": "Evaluation",
    
  };
  return documentNames;
}
function getDocumentName(serialNumber: string): string {
  const documentNames=getDocumentNames()
  return documentNames[serialNumber] || "Unknown Document";
}
