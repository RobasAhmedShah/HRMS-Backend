import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db } from "..";


/**
 * POST API: Log Time-In
 * Request Body: { employeeCode, timeIn }
 */
export const logTimeIn = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const { employeeCode, timeIn } = req.body;

    if (!employeeCode || !timeIn) {
      res.status(400).send("Missing required fields: employeeCode or timeIn");
      return;
    }

    const timeInDate = new Date(timeIn);
    const dateKey = timeInDate.toISOString().split("T")[0];
    const attendanceRef = db.collection("attendance").doc(employeeCode);
    const attendanceDoc = await attendanceRef.get();

    if (attendanceDoc.exists) {
      const dailyAttendance = attendanceDoc.data()?.dailyAttendance || [];

      // Check for existing time-in for the same date
      const existingEntry = dailyAttendance.find((entry: any) => entry.date === dateKey);

      if (existingEntry && existingEntry.timeIn) {
        res.status(400).send("Time-In already logged for this date");
        return;
      }

      // Append new time-in entry
      const newEntry = {
        date: dateKey,
        timeIn,
        timeOut: null, // To be updated later
      };

      await attendanceRef.update({
        dailyAttendance: admin.firestore.FieldValue.arrayUnion(newEntry),
      });
    } else {
      // Create a new document with the first time-in entry
      const newEntry = {
        date: dateKey,
        timeIn,
        timeOut: null, // To be updated later
      };

      await attendanceRef.set({ dailyAttendance: [newEntry] });
    }

    res.status(200).send("Time-In logged successfully");
  } catch (error) {
    console.error("Error logging time-in:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * POST API: Log Time-Out
 * Request Body: { employeeCode, timeOut }
 */
export const logTimeOut = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const { employeeCode, timeOut } = req.body;

    if (!employeeCode || !timeOut) {
      res.status(400).send("Missing required fields: employeeCode or timeOut");
      return;
    }

    const timeOutDate = new Date(timeOut);
    const dateKey = timeOutDate.toISOString().split("T")[0];
    const attendanceRef = db.collection("attendance").doc(employeeCode);
    const attendanceDoc = await attendanceRef.get();

    if (!attendanceDoc.exists) {
      res.status(404).send("No Time-In record found for this employee");
      return;
    }

    const dailyAttendance = attendanceDoc.data()?.dailyAttendance || [];
    const existingEntryIndex = dailyAttendance.findIndex((entry: any) => entry.date === dateKey);

    if (existingEntryIndex === -1 || !dailyAttendance[existingEntryIndex].timeIn) {
      res.status(400).send("No corresponding Time-In record found for this date");
      return;
    }

    if (dailyAttendance[existingEntryIndex].timeOut) {
      res.status(400).send("Time-Out already logged for this date");
      return;
    }

    // Calculate metrics
    const timeInDate = new Date(dailyAttendance[existingEntryIndex].timeIn);
    if (timeOutDate <= timeInDate) {
      res.status(400).send("Time-Out cannot be before or equal to Time-In");
      return;
    }

    const workingMinutes = Math.floor((timeOutDate.getTime() - timeInDate.getTime()) / (1000 * 60));
    const workingHours = `${Math.floor(workingMinutes / 60)}:${workingMinutes % 60}`.padStart(5, "0");

    const latecomings = timeInDate.getHours() > 8 || (timeInDate.getHours() === 8 && timeInDate.getMinutes() > 15)
      ? `${timeInDate.getHours() - 8}:${timeInDate.getMinutes() - 15}`.padStart(5, "0")
      : "0:00";

    const earlyLeavings = timeOutDate.getHours() < 17
      ? `${17 - timeOutDate.getHours()}:${60 - timeOutDate.getMinutes()}`.padStart(5, "0")
      : "0:00";

    let overtimeMinutes = 0;
    if (timeOutDate.getHours() > 17 || (timeOutDate.getHours() === 17 && timeOutDate.getMinutes() > 0)) {
      const overtimeEnd = new Date(timeOutDate);
      overtimeEnd.setHours(17, 0, 0, 0);
      overtimeMinutes = Math.floor((timeOutDate.getTime() - overtimeEnd.getTime()) / (1000 * 60));
      overtimeMinutes = Math.floor(overtimeMinutes / 30) * 30; // Round down to the nearest 30 minutes
    }
    const overtime = `${Math.floor(overtimeMinutes / 60)}:${(overtimeMinutes % 60).toString().padStart(2, "0")}`;

    // Update the existing entry
    dailyAttendance[existingEntryIndex] = {
      ...dailyAttendance[existingEntryIndex],
      timeOut,
      workingHours,
      latecomings,
      earlyLeavings,
      overtime,
    };

    await attendanceRef.update({ dailyAttendance });

    res.status(200).send("Time-Out logged successfully");
  } catch (error) {
    console.error("Error logging time-out:", error);
    res.status(500).send("Internal Server Error");
  }
});

export const getAttendanceSummary = functions.https.onRequest(async (req, res) => {
  try {``
    if (req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const { employeeCode, fromDate, toDate } = req.body;

    if (!employeeCode || !fromDate || !toDate) {
      res.status(400).send("Missing required query parameters: employeeCode, fromDate, or toDate");
      return;
    }

    const from = new Date(fromDate as string);
    const to = new Date(toDate as string);

    if (from > to) {
      res.status(400).send("FromDate cannot be greater than ToDate");
      return;
    }

    const attendanceRef = db.collection("attendance").doc(employeeCode as string);
    const attendanceDoc = await attendanceRef.get();

    if (!attendanceDoc.exists) {
      res.status(404).send("Attendance record not found for this employee");
      return;
    }

    const leaveRef = db.collection("leaves")
      .where("employeeCode", "==", employeeCode as string)
      .where("status", "==", "approved");

    const leaveDocs = await leaveRef.get();
    const leaveDates = leaveDocs.docs.map(doc => doc.data().leaveDate);

    const dailyAttendance = attendanceDoc.data()?.dailyAttendance || [];

    // Filter attendance data between fromDate and toDate
    const filteredAttendance = dailyAttendance.filter((entry: any) => {
      const entryDate = new Date(entry.date);
      const isLeaveDay = leaveDates.includes(entry.date); // Check if leave is approved for this date
      return entryDate >= from && entryDate <= to && !isLeaveDay;
    });

    let presents = 0;
    let absents = 0;
    let totalWorkingHours = 0;
    let totalOvertime = 0;
    let totalLatecomings = 0;
    let totalEarlyLeavings = 0;

    // Calculate summaries based on filtered attendance
    filteredAttendance.forEach((entry: any) => {
      const isLeaveDay = leaveDates.includes(entry.date);

      if (!isLeaveDay) {
        if (entry.timeIn && entry.timeOut) {
          presents += 1;

          const workingMinutes = (new Date(entry.timeOut).getTime() - new Date(entry.timeIn).getTime()) / (1000 * 60);
          const workingHours = Math.floor(workingMinutes / 60);
          const overtime = entry.overtime ? parseTimeToMinutes(entry.overtime) : 0;
          const latecomings = entry.latecomings ? parseTimeToMinutes(entry.latecomings) : 0;
          const earlyLeavings = entry.earlyLeavings ? parseTimeToMinutes(entry.earlyLeavings) : 0;

          totalWorkingHours += workingHours;
          totalOvertime += overtime;
          totalLatecomings += latecomings;
          totalEarlyLeavings += earlyLeavings;
        } else {
          absents += 1;
        }
      }
    });

    // Return the summary data
    const summary = {
      presents,
      absents,
      totalWorkingHours: formatMinutesToHours(totalWorkingHours),
      totalOvertime: formatMinutesToHours(totalOvertime),
      totalLatecomings: formatMinutesToHours(totalLatecomings),
      totalEarlyLeavings: formatMinutesToHours(totalEarlyLeavings),
    };

    res.status(200).send(summary);
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    res.status(500).send("Internal Server Error");
  }
});

export const getAllAttendanceSummary = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate) {
      res.status(400).send("Missing required query parameters: fromDate or toDate");
      return;
    }

    const from = new Date(fromDate as string);
    const to = new Date(toDate as string);

    if (from > to) {
      res.status(400).send("FromDate cannot be greater than ToDate");
      return;
    }

    const attendanceRef = db.collection("attendance");
    const attendanceDocs = await attendanceRef.get();

    const allAttendanceSummary: any[] = [];

    for (const attendanceDoc of attendanceDocs.docs) {
      const employeeCode = attendanceDoc.id;
      const dailyAttendance = attendanceDoc.data().dailyAttendance || [];

      const filteredAttendance = dailyAttendance.filter((entry: any) => {
        const entryDate = new Date(entry.date);
        return entryDate >= from && entryDate <= to;
      });

      let presents = 0;
      let absents = 0;
      let totalWorkingHours = 0;
      let totalOvertime = 0;
      let totalLatecomings = 0;
      let totalEarlyLeavings = 0;

      filteredAttendance.forEach((entry: any) => {
        if (entry.timeIn && entry.timeOut) {
          presents += 1;

          const workingMinutes = (new Date(entry.timeOut).getTime() - new Date(entry.timeIn).getTime()) / (1000 * 60);
          const workingHours = Math.floor(workingMinutes / 60);
          const overtime = entry.overtime ? parseTimeToMinutes(entry.overtime) : 0;
          const latecomings = entry.latecomings ? parseTimeToMinutes(entry.latecomings) : 0;
          const earlyLeavings = entry.earlyLeavings ? parseTimeToMinutes(entry.earlyLeavings) : 0;

          totalWorkingHours += workingHours;
          totalOvertime += overtime;
          totalLatecomings += latecomings;
          totalEarlyLeavings += earlyLeavings;
        } else {
          absents += 1;
        }
      });

      const summary = {
        employeeCode,
        presents,
        absents,
        totalWorkingHours: formatMinutesToHours(totalWorkingHours),
        totalOvertime: formatMinutesToHours(totalOvertime),
        totalLatecomings: formatMinutesToHours(totalLatecomings),
        totalEarlyLeavings: formatMinutesToHours(totalEarlyLeavings),
      };

      allAttendanceSummary.push(summary);
    }

    res.status(200).send(allAttendanceSummary);
  } catch (error) {
    console.error("Error fetching all attendance summary:", error);
    res.status(500).send("Internal Server Error");
  }
});



  
  /**
   * Helper function to parse time (e.g., "1:30") to minutes
   */
  function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map((unit: string) => parseInt(unit));
    return hours * 60 + minutes;
  }
  
  /**
   * Helper function to format minutes to hours (e.g., 90 minutes -> "1:30")
   */
  function formatMinutesToHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  }

