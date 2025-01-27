import * as functions from "firebase-functions";
import { PDFDocument } from "pdf-lib";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized

export const generateAllPDFs = functions.https.onRequest(async (req, res): Promise<void> => {
  try {
    const { empCode } = req.body;

    if (!empCode) {
      res.status(400).json({ success: false, error: "Missing empCode in request body." });
      return;
    }

    const endpoints = [
      "https://us-central1-hrms-1613d.cloudfunctions.net/personalFileSlip",
      "https://us-central1-hrms-1613d.cloudfunctions.net/orientFile",
      "https://us-central1-hrms-1613d.cloudfunctions.net/employementForm",
      "https://us-central1-hrms-1613d.cloudfunctions.net/fitnessForm",
      "https://us-central1-hrms-1613d.cloudfunctions.net/ageVerifyForm",
      "https://us-central1-hrms-1613d.cloudfunctions.net/jobDescriptionForm",
      "https://us-central1-hrms-1613d.cloudfunctions.net/taqarrurForm",
    ];

    // Fetch PDFs from all endpoints
    const fetchPromises = endpoints.map((url) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empCode }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Request failed with status ${response.status}: ${error}`);
          }
          const data = await response.json();
          const pdfResponse = await fetch(data.pdfUrl);
          if (!pdfResponse.ok) {
            throw new Error(`Failed to fetch PDF from ${data.pdfUrl}`);
          }
          const pdfBuffer = await pdfResponse.arrayBuffer();
          return { url, pdfBuffer };
        })
        .catch((error) => {
          return { url, error: (error as Error).message };
        })
    );

    const results = await Promise.all(fetchPromises);

    // Filter successful and failed results
    const successful = results.filter(
      (result): result is { url: string; pdfBuffer: ArrayBuffer } => "pdfBuffer" in result
    );
    const failed = results.filter((result): result is { url: string; error: string } => "error" in result);

    if (successful.length === 0) {
      res.status(500).json({ success: false, error: "All PDF fetches failed.", failed });
      return;
    }

    // Combine PDFs using pdf-lib
    const mergedPdf = await PDFDocument.create();
    for (const { pdfBuffer } of successful) {
      const pdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();

    // Store merged PDF in Firebase Storage
    const bucket = admin.storage().bucket();
    const fileName = `employee_files/${empCode}_combined.pdf`;
    const file = bucket.file(fileName);

    await file.save(Buffer.from(mergedPdfBytes), {
      contentType: "application/pdf",
    });

    // Make the file publicly accessible and get its URL
    await file.makePublic();
    const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        // Store the download URL in Firestore
        const firestore = admin.firestore();
        await firestore
          .collection("employees")
          .doc(empCode)
          .update({
            PersonalFile: downloadUrl,
          });

    // Return the download URL
    res.status(200).json({
      success: true,
      downloadUrl,
      failed,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    res.status(500).json({ success: false, error: errorMessage });
  }
});
