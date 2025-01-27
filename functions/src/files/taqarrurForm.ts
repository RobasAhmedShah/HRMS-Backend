import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as puppeteer from "puppeteer";
const chromium = require("@sparticuz/chromium");
import { db } from "..";


export const generateTaqarrurFormPDF = functions.https.onRequest(
  async (req, res) => {
    try {
        const employeeCode = req.body.empCode;
        const employeeDoc = await db
          .collection("employees")
          .doc(employeeCode)
          .get();
  
          const employeeData = await employeeDoc.data();
  
          
  
          if (!employeeData) {
            throw new Error("Employee data not found");
          }

      // Generate the HTML dynamically with placeholders replaced by the API data
      const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ur">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تقرر نامہ - آرٹسٹک فلیور پرائیوٹ لیمیٹڈ</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap');
      
              body {
                  font-family: 'Noto Nastaliq Urdu', Arial, sans-serif;
                  line-height: 1.8;
                  margin: 0;
                  padding: 0;
                  background-color: #f0f0f0;
              }
      
              .document {
                  max-width: 800px;
                  margin: 20px auto;
                  background-color: #fff;
                  padding: 40px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                  border: 1px solid #ccc;
              }
      
              .header {
                  text-align: center;
                  margin-bottom: 30px;
                  border-bottom: 2px solid #333;
                  padding-bottom: 20px;
              }
      
              .company-name {
                  font-size: 28px;
                  font-weight: bold;
                  margin-bottom: 10px;
              }
      
              .address {
                  font-size: 16px;
                  margin-bottom: 15px;
              }
      
              .form-title {
                  font-size: 24px;
                  font-weight: bold;
                  border: 2px solid #333;
                  display: inline-block;
                  padding: 5px 20px;
                  margin-top: 10px;
              }
      
              .form-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 30px;
              }
      
              .form-row {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 15px;
              }
      
              input[type="text"] {
                  border: none;
                  border-bottom: 1px solid #333;
                  padding: 5px;
                  font-size: 16px;
                  text-align: right;
                  background-color: transparent;
                  font-family: 'Noto Nastaliq Urdu', Arial, sans-serif;
                  width: 60%;
              }
      
              .address-section {
                  margin-bottom: 30px;
              }
      
              .operator-section {
                  border-bottom: 1px solid #ccc;
                  margin-bottom: 30px;
                  padding-bottom: 15px;
              }
      
              .numbered-list {
                  padding-right: 20px;
                  counter-reset: item;
                  list-style-type: none;
              }
      
              .numbered-list li {
                  margin-bottom: 15px;
                  line-height: 1.8;
                  text-align: right;
                  position: relative;
                  padding-right: 30px;
              }
      
              .numbered-list li::before {
                  content: counter(item) ".";
                  counter-increment: item;
                  position: absolute;
                  right: 0;
                  top: 0;
              }
      
              .sub-section {
                  margin-top: 20px;
              }
      
              .sub-list {
                  padding-right: 30px;
                  list-style-type: lower-alpha;
              }
      
              .signature-section {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 50px;
              }
      
              .signature-block {
                  text-align: center;
                  width: 45%;
              }
      
              .signature-line {
                  border-bottom: 1px solid #333;
                  margin: 20px 0;
              }
      
              .footer {
                  margin-top: 50px;
                  text-align: center;
                  font-style: italic;
              }
          </style>
      </head>
      <body>
          <div class="document">
              <header class="header">
                  <h1 class="company-name">بٹسول وینچرز</h1>
                  <p class="address">پلاٹ نمبر 06، سیکٹر 25، کراچی انڈسٹریل ایریا، کراچی</p>
                  <div class="form-title">تقرر نامہ</div>
              </header>
      
              <div class="form-grid">
                  <div class="form-row">
                      <span>نمبر:</span>
                      <input type="text" value=${employeeData.EmployeeName}>
                  </div>
                  <div class="form-row">
                      <span>تاریخ اجراء:</span>
                      <input type="text" value=${employeeData.DateOfJoining}>
                  </div>
                  <div class="form-row">
                      <span>تاریخ بحالی:</span>
                      <input type="text" value=${employeeData.ToDate}>
                  </div>
                  <div class="form-row">
                      <span>والد/شوہر:</span>
                      <input type="text" value=${employeeData.Personal.FatherName}>
                  </div>
              </div>
      
              <div class="address-section">
                  <div class="form-row">
                      <span>موجودہ پتہ:</span>
                      <input type="text" value=${employeeData.Address}>
                  </div>
                  <div class="form-row">
                      <span>مستقل پتہ:</span>
                      <input type="text" value=${employeeData.Address}>
                  </div>
              </div>
      
              <div class="operator-section">
                  <div>عہدہ</div>
                  <input type="text" value=${employeeData.Job.Designation}>
              </div>
      
              <ol class="numbered-list">
                  <li> تنخواہ معہوری:${employeeData.Financial.Salary}روپے</li>
                  <li>کنٹریبیوٹری پینشن اسکیم کے تحت یہ رقم اس مدد کے دوران فرائل کی کارکردگی غیر معینہ بخش ہونے کے کچھ دوسرے تحفظ کے لیۓ جاتی ہے۔</li>
                  <li>پینشن اور کارکردگی بنان آفیسر کے دوران اگر آپ کی حاضر کا شاف ہونا شروع ہو جاۓ اور شفاعیت کی مدت ختم ہونے سے پہلے آفیسر آپ کی مدد کے لیۓ تحریری بات نہ کرے تو آپ اپنی ملازمت میں رہیں گے۔ بصورت دیگر پینشن اسکیم کے تحت نکالے جانے کی درخواست دی جاسکتی ہے۔</li>
                  <li>دوران کام نہ آنے والے حالات اور اوقات میں آپ اس بات کا خیال رکھیں کہ کسی بھی میٹنگ یا معمولات کے حوالے سے آپ کا کوئی اثر نہ ہو۔</li>
                  <li>ہر شخص دن 08:30 بجے صبح سے شام 05:30 بجے تک اپنی ڈیوٹی مکمل کرے گا۔ دن کے درمیان 12 بجے سے 14 بجے تک وقفہ دیا جاۓ گا۔</li>
                  <li>کسی ملازم کے کام کی چوری کی صورت میں شکایت درج کرنے کا عمل فوری ہوگا۔</li>
                  <li>اکثر ملازم کام پر توجہ نہ دینے اور کمپنی کی ساکھ کو نقصان پہنچانے کے خلاف ہوں۔</li>
                  <li>کمپنی کی طرف سے کام کا دباو وقت کی پابندی اور نظم و ضبط کی خلاف ورزی کرنے پر تنبیہ کی جائے گی۔</li>
                  <li>ایک مہینہ کی عدم حاضر کو غیر معینہ کیا جائے گا۔</li>
                  <li>پینشن اسکیم کی معاونت میں حصوں کو کم کرنا یا معینہ وقت میں میٹنگ پر حاضری نہ دینا۔</li>
                  <li>زیادہ عمر کے ملازمین کے لیۓ صحت مند اور محفوظ رہنے کی تدابیر کرنا۔</li>
                  <li>ہر وقت وقتاً فوقتاً ملازمت کے دوران مشکلات کا ازالہ کرنے کی ضرورت ہوگی۔</li>
                  <li>مرد و عورت کی عمریں حد مقرر 60 سال اور خواتین دیگر کو ریٹائرمنٹ کی عمر 55 سال ہوگی۔</li>
                  
                  <li class="sub-section">
                      <h3>مزید ہدایات</h3>
                      <ol class="sub-list">
                          <li>اگر آپ کو مندرجہ ذیل کسی بھی خلاف ورزی میں ملوث پایا گیا تو:</li>
                          <li>کمپنی آپ کے خلاف قوانین کے مطابق کارروائی کر سکتی ہے۔</li>
                          <li>چوری یا مالک کی اشیاء یا رقوم کا ناجائز فائدہ اٹھانا۔</li>
                          <li>مقررہ وقت پر اپنی ڈیوٹی پر حاضر نہ ہونا۔</li>
                          <li>حاضری کا وقت 10 دن سے زیادہ گزارنا۔</li>
                          <li>قوانین کی خلاف ورزی۔</li>
                          <li>کمپنی کے اعلیٰ افسران یا انتظامیہ کو غلط معلومات فراہم کرنا۔</li>
                          <li>اپنی نوکری کو چھوڑ کر کام کو نقصان پہنچانا۔</li>
                      </ol>
                  </li>
                  
                  <li class="sub-section">
                      <h3>چھانٹی (Retrenchment)</h3>
                      <ol class="sub-list">
                          <li>کام کی کمی کے نتیجے میں آپ کو وقتاً فوقتاً کمپنی کی طرف سے نکال دیا جائے گا۔</li>
                          <li>لاسٹ ان فرسٹ آوٹ کا اصول لاگو ہوگا۔</li>
                      </ol>
                  </li>
              </ol>
      
              <div class="signature-section">
                  <div class="signature-block">
                      <p>برائے کمپنی:</p>
                      <div class="signature-line"></div>
                      <p>دستخط/مہر</p>
                  </div>
                  <div class="signature-block">
                      <p>میں مندرجہ بالا شرائط کو قبول کرتا/کرتی ہوں۔</p>
                      <div class="signature-line"></div>
                      <p>دستخط</p>
                  </div>
              </div>
      
              <footer class="footer">
                  <p>برائے کفایت: تنخواہ معہوری</p>
                  <p>میں ملازمت پانا اور اسکو محفوظ کرنا ضروری ہے۔</p>
              </footer>
          </div>
      </body>
      </html>
      `;
  // Launch Puppeteer to generate PDF
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
  const fileName = `taqarrurNama-${employeeData.Personal.EmployeeCode}.pdf`;
  const file = bucket.file(fileName);
  await file.save(pdfBuffer, { predefinedAcl: "publicRead" });

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