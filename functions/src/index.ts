// Employee Management APIs
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Request, Response } from "express";
import cors from "cors";
import calculatePayroll from "./calculateSalary";
import { mockEmployees } from "./mock";
import validateEmployeeData from "./validateEmployee";
import generateMockAttendance, { generateMockLeaves } from "./generateMock";
import { generateTrialSlip } from "./files/TrialSlip";
import { generatePersonalFileSlip } from "./files/personalFile";
import { generateOrientationChecklist } from "./files/orientationFile";
import { generateEmploymentFormPDF } from "./files/employmentForm";
import { generateFitnessFormPDF } from "./files/fitness-form";
import { generateAgeVerificationFormPDF } from "./files/ageVerificationForm";
import { generateJobDescFormPDF } from "./files/jobDesc";
import { generateTaqarrurFormPDF } from "./files/taqarrurForm";
import { generateAllPDFs } from "./files/PersonalForm";
import { logTimeIn } from "./Attendance/attendance";
import { logTimeOut } from "./Attendance/attendance";
import { getAttendanceSummary } from "./Attendance/attendance";
import { getAllAttendanceSummary } from "./Attendance/attendance";
import { approveLeave } from "./Attendance/leaveApprove";
import { generateAllAttendanceReportPDF, generateAttendanceReportPDF } from "./Attendance/report";
admin.initializeApp();

export const db = admin.firestore();

const corsHandler = cors({
  origin: true
});



/**
 * Function to Generate Mock Data
 */
export const generateMockData = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      for (const employee of mockEmployees) {
        // Add employee to Firestore
        // Create a document with the employee's name as the ID
        const employeeDoc = db.collection("employees").doc(employee.name);
        await employeeDoc.set({
          
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          designation: employee.designation,
          department: employee.department,
          status: employee.status,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Add salary breakdown to the Payroll subcollection (using the employee's name as the ID)
        await db.collection(`employees/${employeeDoc.id}/payroll`).add({
          baseSalary: employee.baseSalary,
          allowances: employee.allowances,
          deductions: employee.deductions,
          overtime: employee.overtime,
          netSalary:
            employee.baseSalary +
            employee.allowances.attendance +
            employee.allowances.housing -
            (employee.deductions.tax + employee.deductions.lateDeductions) +
            employee.overtime,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Add attendance mock data
        const attendanceData = generateMockAttendance();
        for (const record of attendanceData) {
          await db
            .collection(`employees/${employee.name}/attendance`)
            .add(record);
        }

        // Add leave mock data
        const leaveData = generateMockLeaves();
        for (const record of leaveData) {
          await db
            .collection(`employees/${employeeDoc.id}/leaves`)
            .doc(employee.name).set(record);
        }
      }

      res
        .status(200)
        .send("Mock data for employees, payroll, attendance, and leaves generated successfully.");
    } catch (error) {
      console.error("Error generating mock data:", error);
      res.status(500).send("Error generating mock data.");
    }
  });
});





/**
 * Helper function to handle Firestore document references
 */
function addReferencesToEmployee(employeeId: string) {
  
  return {
    payrollRef: db.collection(`employees/${employeeId}/payroll`),
    attendanceRef: db.collection(`employees/${employeeId}/attendance`),
    leavesRef: db.collection(`employees/${employeeId}/leaves`),
  };
}


// Add a New Employee
export const addEmployee = functions.https.onRequest((req: Request, res: Response) => {
  corsHandler(req, res, async () => {
    const employeeData = req.body;

    // Validate employee data
    const validation = validateEmployeeData(employeeData);
    if (!validation.valid) {
      res.status(400).send(validation.message);
      return;
    }

    try {
      const docRef = await db.collection("employees").add({
        ...employeeData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Add references for subcollections
      const references = addReferencesToEmployee(docRef.id);
      await docRef.update(references);

      res.status(201).send({ message: "Employee added successfully", id: docRef.id });

    } catch (error) {
      console.error("Error adding employee:", error);
      res.status(500).send("Error adding employee");
    }
  });
});


// Edit an Existing Employee
export const editEmployee = functions.https.onRequest((req: Request, res: Response) => {
  corsHandler(req, res, async () => {
    const { id } = req.query;
    const updates = req.body;

    if (!id || typeof id !== "string") {
      res.status(400).send("Employee ID is required.");
      return;
    }

    try {
      const docRef = db.collection("employees").doc(id);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        res.status(404).send("Employee not found.");
        return;
      }

      await docRef.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).send({ message: "Employee updated successfully" });
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).send("Error updating employee");
    }
  });
});

// Delete an Employee
export const deleteEmployee = functions.https.onRequest((req: Request, res: Response) => {
  corsHandler(req, res, async () => {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      res.status(400).send("Employee ID is required.");
      return;
    }

    try {
      const docRef = db.collection("employees").doc(id);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        res.status(404).send("Employee not found.");
        return;
      }

      // Delete subcollections
      const batch = db.batch();
      const subcollections = ["payroll", "attendance", "leaves"];
      for (const sub of subcollections) {
        const subcollectionRef = db.collection(`employees/${id}/${sub}`);
        const subDocs = await subcollectionRef.get();
        subDocs.forEach((doc) => batch.delete(doc.ref));
      }

      // Delete the employee document
      batch.delete(docRef);
      await batch.commit();

      res.status(200).send({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).send("Error deleting employee");
    }
  });
});

// Get All Employees
export const getAllEmployees = functions.https.onRequest((req: Request, res: Response) => {
  corsHandler(req, res, async () => {
    try {
      const employeesSnapshot = await db.collection("employees").get();
      if (employeesSnapshot.empty) {
        res.status(404).send("No employees found.");
        return;
      }

      const employees = employeesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).send("Error fetching employees");
    }
  });
});


// Search Employees by Any Field
export const searchEmployees = functions.https.onRequest((req: Request,res: Response) => {
  corsHandler(req, res, async () => {
    const { field, value } = req.query;

    if (!field || !value || typeof field !== "string" || typeof value !== "string") {
      res.status(400).send("Both 'field' and 'value' query parameters are required.");
      return;
    }

    try {
      const employeesSnapshot = await db
        .collection("employees")
        .where(field, "==", value)
        .get();

      if (employeesSnapshot.empty) {
        res.status(404).send("No matching employees found.");
        return;
      }

      const employees = employeesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json(employees);
    } catch (error) {
      console.error("Error searching employees:", error);
      res.status(500).send("Error searching employees");
    }
  });
});



// Endpoint to calculate payroll for an employee
export const calculateEmployeePayroll = functions.https.onRequest((req: Request, res: Response) => {
  corsHandler(req, res, async () => {
    const employeeData = req.body; //Incoming employee data

    // Validate input data
    if (!employeeData.monthlySalary || !employeeData.workingDaysInMonth || !employeeData.dailyWorkingHours) {
      res.status(400).send("Missing required fields: monthlySalary, workingDaysInMonth, or dailyWorkingHours.");
      return;
    }

    try {
      // Calculate payroll
      const payrollData = calculatePayroll(employeeData);

      // Store the payroll details in Firestore
      const payrollRef = db.collection("employees").doc(employeeData.employeeName).collection("payroll").doc();
      await payrollRef.set({ // You need to use doc().set() to create a document
        ...payrollData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      await payrollRef.update({
        id:payrollRef.id
      });

      res.status(200).send({
        message: "Payroll calculated successfully",
        payroll: payrollData
      });
    } catch (error) {
      console.error("Error calculating payroll:", error);
      res.status(500).send("Error calculating payroll.");
    }
  });
});

// Example of adding an employee with payroll calculation
export const addEmployeeWithPayroll = functions.https.onRequest((req: Request, res: Response) => {
  corsHandler(req, res, async () => {
    const employeeData = req.body;

    if (!employeeData.name || !employeeData.email || !employeeData.baseSalary) {
      res.status(400).send("Missing required fields: name, email, or baseSalary.");
      return;
    }

    try {
      // Add employee to Firestore
      const docRef = await db.collection("employees").add({
        ...employeeData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Calculate payroll
      const payrollData = calculatePayroll(employeeData);

      // Add payroll to the subcollection
      await db.collection(`employees/${employeeData.name}/payroll`).doc(employeeData.employeeName).set({
        ...payrollData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(201).send({ message: "Employee added with payroll", employeeId: docRef.id });
    } catch (error) {
      console.error("Error adding employee with payroll:", error);
      res.status(500).send("Error adding employee with payroll.");
    }
  });
  
});

// Endpoint to get payroll history by employee name
export const getEmployeePayrolls = functions.https.onRequest(
  async (req: Request, res: Response) => {
    corsHandler(req, res, async () => {
      const { employeeName } = req.query;

      if (!employeeName) {
        res.status(400).send({
          message: "Missing required query parameter: employeeName",
        });
        return;
      }

      try {
        // Get the employee document by name
        const employeeSnapshot = await db
          .collection("employees")
          .where("name", "==", employeeName)
          .get();

        if (employeeSnapshot.empty) {
          res.status(404).send({
            message: `No employee found with the name: ${employeeName}`,
          });
          return;
        }

        // Assume only one employee document with the name
        const employeeDoc = employeeSnapshot.docs[0];

        // Get all payroll documents for the employee, sorted by createdAt
        const payrollSnapshot = await db
          .collection("employees")
          .doc(employeeDoc.id)
          .collection("payroll")
          .orderBy("createdAt", "desc")
          .get();

        if (payrollSnapshot.empty) {
          res.status(404).send({
            message: `No payroll records found for the employee: ${employeeName}`,
          });
          return;
        }

        // Extract payroll data
        const payrollHistory = payrollSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        res.status(200).send({
          message: "Payroll history retrieved successfully",
          payrollHistory,
        });
      } catch (error) {
        console.error("Error fetching payroll history:", error);
        res.status(500).send({
          message: "An error occurred while fetching payroll history"
        });
      }
    });
  }
);
export const saveEmployeeData = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const employeeData = req.body; // Incoming employee data

    // Validate required fields
    if (
      !employeeData.Personal?.EmployeeID ||
      !employeeData.Personal?.EmployeeCode ||
      !employeeData.Personal?.EmployeeName
    ) {
      res.status(400).send({
        error: "Missing required fields: EmployeeID, EmployeeCode, or EmployeeName.",
      });
      return;
    }

    try {
      // Reference to the employee document
      const employeeDocRef = db.collection("employees").doc(employeeData.Personal.EmployeeID);

      // Get the current date and time in Pakistan timezone
      const pakistanTime = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
      const currentDate = pakistanTime.replace(/\//g, "-");

        // Enable ignoreUndefinedProperties for Firestore
        //admin.firestore().settings({ ignoreUndefinedProperties: true });


      // Helper function to remove undefined values from an object
      const cleanData = (data: any) => {
        return Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== undefined));
      };

      // Prepare the data to save, merging all details into one document
      const mergedData = {
    
        EmployeeName: employeeData.Personal.EmployeeName ?? "N/A",
          EmployeeCode: employeeData.Personal.EmployeeCode ?? "N/A",
          CNIC: employeeData.Personal.CNIC ?? "N/A",
        DOB: employeeData.Personal.DOB ?? "N/A",
        Gender: employeeData.Personal.Gender ?? "N/A",
        MaritalStatus: employeeData.Personal.MaritalStatus ?? "N/A",
        Mobile: employeeData.Personal.Mobile ?? "N/A",
        Type: employeeData.Personal.Type ?? "N/A",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        sMonth: employeeData.sMonth ?? "N/A",
        sYear: employeeData.sYear ?? "N/A",
        MType: employeeData.MType ?? "N/A",
        FromDate: employeeData.FromDate ?? "N/A",
        ToDate: employeeData.ToDate ?? "N/A",
        PayMode: employeeData.PayMode ?? "N/A",
        OTType: employeeData.OTType ?? "N/A",
        AccountNo: employeeData.AccountNo ?? "N/A",
        
          Personal: cleanData(employeeData.Personal),
          Job: cleanData(employeeData.Job),
          Attendance: cleanData(employeeData.Attendance),
          Financial: cleanData(employeeData.Financial),
        Log: {
          [currentDate]: {
            addedBy: employeeData.addedBy ?? "system",
            addedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
        },
      }
      ;

      // Save the data to Firestore
      await employeeDocRef.set(mergedData, { merge: true });

      res.status(200).send({
        message: "Employee data stored successfully in a single document!",
        employeeId: employeeData.Personal.EmployeeID,
      });
    } catch (error) {
      console.error("Error storing employee data:", error);
      res.status(500).send({ error: "Error storing employee data." });
    }
  });
});


export const getEmployeeData = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Fetch all documents in the "employees" collection
      const employeesSnapshot = await db.collection("employees").get();

      if (employeesSnapshot.empty) {
        res.status(404).send({ error: "No employees found." });
        return;
      }

      const employeeDataList: any[] = [];
      // Iterate through each employee document and fetch only the root data
      for (const employeeDoc of employeesSnapshot.docs) {
        const employeeData = employeeDoc.data(); // Get the root data of the employee

        // Add the employee data with ID to the list
        employeeDataList.push({
          ...employeeData, // Spread the root data into the new object
        });
      }

      res.status(200).send({ employees: employeeDataList });
    } catch (error) {
      console.error("Error retrieving employee data:", error);
      res.status(500).send({ error: "Error retrieving employee data." });
    }
  });
});

export const trialSlip = functions.https.onRequest({
  memory: "1GiB" },
  (req, res) => {
  corsHandler(req, res, async () => {
    generateTrialSlip(req,res);
  });
});

export const personalFileSlip = functions.https.onRequest( {
  memory: "512MiB" },
   (req, res) => {
  corsHandler(req, res, async () => {
    generatePersonalFileSlip(req,res);
  });
});

export const orientFile = functions.https.onRequest( {
  memory: "512MiB" },
   (req, res) => {
  corsHandler(req, res, async () => {
    generateOrientationChecklist(req,res);
  });
});

export const employementForm =functions.https.onRequest( {
  memory: "512MiB" },
   (req, res) => {
  corsHandler(req, res, async () => {
    generateEmploymentFormPDF(req,res);
  });
});

export const fitnessForm =functions.https.onRequest( {
  memory: "512MiB" },
   (req, res) => {
  corsHandler(req, res, async () => {
    generateFitnessFormPDF(req,res);
  });
});

export const ageVerifyForm =functions.https.onRequest( {
  memory: "512MiB" },
   (req, res) => {
  corsHandler(req, res, async () => {
    generateAgeVerificationFormPDF(req,res);
  });
});


export const jobDescriptionForm =functions.https.onRequest( {
  memory: "512MiB" },
   (req, res) => {
  corsHandler(req, res, async () => {
    generateJobDescFormPDF(req,res);
  });
});

export const taqarrurForm =functions.https.onRequest( {
  memory: "1GiB" },
   (req, res) => {
  corsHandler(req, res, async () => {
    generateTaqarrurFormPDF(req,res);
  });
});


export const PersonalFiles  = functions.https.onRequest( {
  memory: "1GiB" },
   (req, res) => {
  corsHandler(req, res, async () => {
    generateAllPDFs(req,res);
  });
});

export const timeIn = functions.https.onRequest(
  (req, res) => {
  corsHandler(req, res, async () => {
    logTimeIn(req,res);
  });
});

export const timeOut = functions.https.onRequest(
  (req, res) => {
  corsHandler(req, res, async () => {
    logTimeOut(req,res);
  });
});

export const attendanceSummary = functions.https.onRequest(
  (req, res) => {
  corsHandler(req, res, async () => {
    getAttendanceSummary(req,res);
  });
});

export const leaveApproval = functions.https.onRequest(
  (req, res) => {
  corsHandler(req, res, async () => {
    approveLeave(req,res);
  });
});

export const attendanceReport = functions.https.onRequest(
  (req, res) => {
  corsHandler(req, res, async () => {
    generateAttendanceReportPDF(req,res);
  });
});

export const getAttendanceReport = functions.https.onRequest(
  (req, res) => {
  corsHandler(req, res, async () => {
    generateAllAttendanceReportPDF(req,res);
  });
});

export const allAttendanceSummary = functions.https.onRequest(
  (req, res) => {
  corsHandler(req, res, async () => {
    getAllAttendanceSummary(req,res);
  });
});





