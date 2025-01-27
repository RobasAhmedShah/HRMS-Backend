import * as functions from "firebase-functions";
import { db } from "..";


export const approveLeave = functions.https.onRequest(async (req, res) => {
    try {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }
  
      const { employeeCode, leaveDate, status } = req.body;
  
      if (!employeeCode || !leaveDate || !status) {
        res.status(400).send("Missing required fields");
        return;
      }
  
      const leaveRef = db.collection("leaves").doc(`${employeeCode}_${leaveDate}`);
      await leaveRef.set({ employeeCode, leaveDate, status }, { merge: true });
  
      res.status(200).send("Leave status updated successfully");
    } catch (error) {
      console.error("Error approving leave:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  