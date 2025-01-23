const bwipjs = require("bwip-js");

// Generate barcode
export async function generateBarcode(trialNumber: string): Promise<string> {
    return new Promise((resolve, reject) => {
      bwipjs.toBuffer(
        {
          bcid: "code128", // Barcode type
          text: trialNumber, // Text to encode
          scale: 3, // 3x scaling factor
          height: 10, // Bar height in mm
          includetext: true, // Show human-readable text
          textxalign: "center", // Align text to the center
        },
        (err: Error, png: Buffer) => {
          if (err) {
            reject(err);
          } else {
            resolve(`data:image/png;base64,${png.toString("base64")}`);
          }
        }
      );
    });
  }