import * as functions from "firebase-functions";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as admin from "firebase-admin";

export const generateAttendanceReportPDF = functions.https.onRequest(async (req, res) => {
    try {
        // Validate HTTP method
        if (req.method !== "GET") {
            res.status(405).send("Method Not Allowed");
            return;
        }

        // Validate query parameters
        const { empCode,fromDate, toDate } = req.body;
        if (!fromDate || !toDate) {
            res.status(400).send("Missing required query parameters: fromDate or toDate");
            return;
        }

        const from = new Date(fromDate as string);
        const to = new Date(toDate as string);
        if (from > to) {
            res.status(400).send("fromDate cannot be greater than toDate");
            return;
        }

        const attendanceRef = admin.firestore().collection("attendance").doc(empCode as string);
        const leaveRef = admin.firestore().collection("leaves").doc(empCode as string);
        const attendanceDoc = await attendanceRef.get();
        const leaveDocs = await leaveRef.get();
        const employeeRef = admin.firestore().collection("employees").doc(empCode as string);
        const employeeDoc = await employeeRef.get();
        const EmployeeName = employeeDoc.data()?.EmployeeName;

        let attendanceData: any;
        let leaveData: any;
        attendanceData = attendanceDoc.data();
        leaveData = leaveDocs.data();
        console.log("During the function",attendanceData,leaveData);

        if (attendanceData) {
            attendanceData = [
            {
                id: attendanceDoc.id,
                dailyAttendance: attendanceDoc.data()?.dailyAttendance,
        }
        ];
        }

        if (leaveData) {
            leaveData = [
            {
                employeeCode: leaveDocs.id,
                leaveDate: leaveDocs.data()?.leaveDate,
                status: leaveDocs.data()?.status,
            },
            ];
        }

        if (!attendanceData) {
            attendanceData = [
            {
                id: "emp1",
                dailyAttendance: [
                { date: "2023-10-01", timeIn: "08:00", timeOut: "17:00", workingHours: "09:00", latecomings: "00:00", earlyLeavings: "00:00", overtime: "01:00" },
                { date: "2023-10-02", timeIn: "08:30", timeOut: "17:00", workingHours: "08:30", latecomings: "00:30", earlyLeavings: "00:00", overtime: "00:00" },
                ],
            },
            ];
        }

        if (!leaveData) {
            leaveData = [
            { employeeCode: "emp1", leaveDate: "2023-10-03", status: "approved" },
            ];
        }
        console.log("After the function",attendanceData,leaveData);
        // for(let i=0;i<attendanceData.length;i++){
        //     console.log(attendanceData[i].dailyAttendance);
        // }

        // Initialize jsPDF with improved spacing
        const doc = new jsPDF('landscape', 'mm', 'a3');
        const pageWidth = doc.internal.pageSize.width;
        // const pageHeight = doc.internal.pageSize.height;
        const margin = 15;
        const maxEmployeesPerPage = 3; // Reduced for better spacing
        
        // Function to add page header
        const addPageHeader = (pageNum: number, totalPages: number) => {
            // Reset font settings for header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.text("Bitsol Ventures", pageWidth / 2, margin, { align: "center" });

            doc.setFontSize(16);
            doc.text(`Attendance Report (${fromDate} to ${toDate})`, pageWidth / 2, margin + 8, { align: "center" });
            
            // Add page number
            doc.setFontSize(10);
            doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, margin, { align: "right" });
            
            // Add horizontal line
            doc.setLineWidth(0.5);
            doc.line(margin, margin + 15, pageWidth - margin, margin + 15);
            
            return margin + 25; // Return next Y position
        };

        // Calculate total pages
        const totalPages = Math.ceil(attendanceData.length / maxEmployeesPerPage);
        let currentPage = 1;
        let startY = margin + 25;

        // Process attendance data for each employee
        for (let i = 0; i < attendanceData.length; i++) {
            if (i > 0 && i % maxEmployeesPerPage === 0) {
                doc.addPage();
                currentPage++;
                startY = addPageHeader(currentPage, totalPages);
            } else if (i === 0) {
                startY = addPageHeader(currentPage, totalPages);
            }

            const attendance = attendanceData[i];
            const { id, dailyAttendance } = attendance;
            console.log("id",id);
            console.log("dailyAttendance",dailyAttendance);
            
            // Filter attendance records
            const filteredAttendance = dailyAttendance.filter((record: any) => {
                const date = new Date(record.date);
                const timeIn = new Date(record.timeIn);
                const timeOut = new Date(record.timeOut);
                console.log("date", date);
                console.log("timeIn", timeIn);
                console.log("timeOut", timeOut);
                console.log("overTime", record.overtime);
                console.log("earlyLeavings", record.earlyLeavings);
                console.log("latecomings", record.latecomings);
            
                return date >= from && date <= to;
            });

            // Filter leave records
            const leaveRecords = leaveData.filter(
                (leave: any) =>
                    leave.employeeCode === id &&
                    new Date(leave.leaveDate) >= from &&
                    new Date(leave.leaveDate) <= to &&
                    leave.status === "approved"
            );
            console.log("leaveRecords",leaveRecords);
            console.log("filteredAttendance",filteredAttendance);

            // Calculate summaries
            const present = filteredAttendance.filter((record: any) => record.timeIn && record.timeOut).length;
            const absent = filteredAttendance.filter((record: any) => !record.timeIn || !record.timeOut).length + leaveRecords.length;
            const overtime = filteredAttendance.filter((record: any) => record.overtime && record.overtime !== "00:00").length;

            // Employee Section Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text(`Employee ID: ${id}`, margin, startY);
            doc.text(`Employee Name: ${EmployeeName}`, margin, startY + 8);
            
            // Summary Table with consistent styling
            doc.autoTable({
                head: [["Present Days", "Absent Days", "Days with Overtime"]],
                body: [[present, absent, overtime]],
                startY: startY + 5,
                theme: "grid",
                styles: {
                    fontSize: 12,
                    cellPadding: 5,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5,
                    halign: 'center'
                },
                headStyles: {
                    fillColor: [220, 220, 220],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold'
                },
                margin: { left: margin }
            });

            // Attendance Details Table
            if (filteredAttendance.length > 0) {
                const attendanceTable = filteredAttendance.map((record: any) => [
                    record.date || "N/A",
                    record.timeIn || "N/A",
                    record.timeOut || "N/A",
                    record.workingHours || "00:00",
                    record.latecomings || "00:00",
                    record.earlyLeavings || "00:00",
                    record.overtime || "00:00",
                ]);

                doc.autoTable({
                    head: [["Date", "Time In", "Time Out", "Working Hours", "Latecomings", "Early Leavings", "Overtime"]],
                    body: attendanceTable,
                    startY: doc.lastAutoTable.finalY + 10,
                    theme: "grid",
                    styles: {
                        fontSize: 10,
                        cellPadding: 4,
                        lineColor: [200, 200, 200],
                        lineWidth: 0.2,
                        halign: 'center'
                    },
                    headStyles: {
                        fillColor: [240, 240, 240],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold'
                    },
                    margin: { left: margin },
                    didDrawPage: (data: any) => {
                        if (data.pageCount > 1) {
                            addPageHeader(currentPage, totalPages);
                        }
                    }
                });
            }

            // Leave Records Table
            if (leaveRecords.length > 0) {
                const leaveTable = leaveRecords.map((leave: any) => [leave.leaveDate, leave.status]);

                doc.autoTable({
                    head: [["Leave Date", "Status"]],
                    body: leaveTable,
                    startY: doc.lastAutoTable.finalY + 10,
                    theme: "grid",
                    styles: {
                        fontSize: 10,
                        cellPadding: 4,
                        lineColor: [200, 200, 200],
                        lineWidth: 0.2,
                        halign: 'center'
                    },
                    headStyles: {
                        fillColor: [240, 240, 240],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold'
                    },
                    margin: { left: margin }
                });
            }

            startY = doc.lastAutoTable.finalY + 20;
        }

        // Generate and upload PDF
        const bucket = admin.storage().bucket();
        const fileName = `attendance_reports/attendance13_report_${fromDate}_to_${toDate}.pdf`;
        const file = bucket.file(fileName);

        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
        await file.save(pdfBuffer, {
            metadata: { contentType: "application/pdf" },
            public: true,
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        res.status(200).send({ publicUrl });
    } catch (error) {
        console.error("Error generating attendance report:", error);
        res.status(500).send("Internal Server Error");
    }
});
export const generateAllAttendanceReportPDF = functions.https.onRequest(async (req, res) => {
    try {
        // Validate HTTP method
        if (req.method !== "GET") {
            res.status(405).send("Method Not Allowed");
            return;
        }

        // Validate query parameters
        const { fromDate, toDate, reportType } = req.body;
        if (!fromDate || !toDate) {
            res.status(400).send("Missing required query parameters: fromDate or toDate");
            return;
        }

        const from = new Date(fromDate as string);
        const to = new Date(toDate as string);
        if (from > to) {
            res.status(400).send("fromDate cannot be greater than toDate");
            return;
        }

        // Fetch data from Firestore
        const attendanceRef = admin.firestore().collection("attendance");
        const employeeRef = admin.firestore().collection("employees");
        const leaveRef = admin.firestore().collection("leaves");

        const [attendanceDocs, employeeDocs, leaveDocs] = await Promise.all([
            attendanceRef.get(),
            employeeRef.get(),
            leaveRef.get()
        ]);

        const attendanceData = attendanceDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const employeeData = employeeDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const leaveData = leaveDocs.docs.map(doc => ({ id: doc.id, employeeCode: doc.data().employeeCode, ...doc.data() }));

        // Initialize PDF
        const doc = new jsPDF('landscape', 'mm', 'a3');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;

        // Add Report Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Bitsol Ventures", pageWidth / 2, margin, { align: "center" });

        doc.setFontSize(16);
        doc.text(`Employee Attendance Report (${reportType || 'Monthly'})`, pageWidth / 2, margin + 8, { align: "center" });

        doc.setFontSize(12);
        doc.text(`Period: ${fromDate} to ${toDate}`, pageWidth / 2, margin + 16, { align: "center" });

        // Format data for the table
        const formatAttendanceData = async (employee: any, attendance: any, leaves: any) => {
            //leave it empty
            if (!employee || !attendance) {
                return [];
            }
        
           
            const fetchAttendanceSummary = async (employeeCode: string, fromDate: string, toDate: string) => {
                const response = await fetch(`http://127.0.0.1:5001/hrms-1613d/us-central1/attendanceSummary?employeeCode=${employeeCode}&fromDate=${fromDate}&toDate=${toDate}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch attendance summary");
                }
                return response.json();
            };

            const attendanceSummary = await fetchAttendanceSummary(employee.EmployeeCode, fromDate as string, toDate as string);
           
            return [
                employee?.EmployeeCode || 'N/A',
                employee?.EmployeeName || 'N/A',
                employee?.Job.Designation || 'N/A',
                employee?.Job.DateOfJoining || 'N/A',
                attendanceSummary.presents || '0',
                attendanceSummary.absents || '0',
                attendanceSummary.totalOvertime || '0',
                'N/A', // Pay
                attendanceSummary.totalWorkingHours || '0',
                attendanceSummary.totalLatecomings || '0',
                attendanceSummary.totalEarlyLeavings|| '0',
            ];
        };

        // Create table headers
        const tableHeaders = [
            [
                { content: 'Employee ID', styles: { fillColor: [220, 220, 220] } },
                { content: 'Name', styles: { fillColor: [220, 220, 220] } },
                { content: 'Designation', styles: { fillColor: [220, 220, 220] } },
                { content: 'Date of Joining', styles: { fillColor: [220, 220, 220] } },
                { content: 'Present', styles: { fillColor: [220, 220, 220] } },
                { content: 'Absent', styles: { fillColor: [220, 220, 220] } },
                { content: 'Overtime', styles: { fillColor: [220, 220, 220] } },
                { content: 'Pay', styles: { fillColor: [220, 220, 220] } },
                { content: 'Working Hours', styles: { fillColor: [220, 220, 220] } },
                { content: 'Latecomings', styles: { fillColor: [220, 220, 220] } },
                { content: 'Early Leavings', styles: { fillColor: [220, 220, 220] } }
            ]
        ];

        // Format data for table
        const tableData = await Promise.all(employeeData.map(async employee => {
            const attendance = attendanceData.find(att => att.id === employee.id);
            const leaves = leaveData.filter(leave => leave.employeeCode === employee.id);
            return formatAttendanceData(employee, attendance, leaves);
        }));

        // Generate table
        doc.autoTable({
            head: tableHeaders,
            body: tableData,
            startY: margin + 25,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 5,
                overflow: 'linebreak',
                cellWidth: 'wrap',
                halign: 'center' // Center align the table content
            },
            columnStyles: {
                0: { cellWidth: 25 }, // Employee ID
                1: { cellWidth: 30 }, // Name
                2: { cellWidth: 30 }, // Designation
                3: { cellWidth: 25 }, // Date of Joining
                4: { cellWidth: 20 }, // Present
                5: { cellWidth: 20 }, // Absent
                6: { cellWidth: 20 }, // Overtime
                7: { cellWidth: 20 }, // Pay
                8: { cellWidth: 25 }, // Working Hours
                9: { cellWidth: 25 }, // Latecomings
                10: { cellWidth: 25 } // Early Leavings
            },
            headStyles: {
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center' // Center align the table headers
            },
            bodyStyles: {
                halign: 'center' // Center align the table body
            },
            didDrawPage: (data:any) => {
                // Add header to each page
                if (data.pageNumber > 1) {
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(20);
                    doc.text("Bitsol Ventures", pageWidth / 2, margin, { align: "center" });
                    doc.setFontSize(16);
                    doc.text(`Employee Attendance Report (${reportType || 'Monthly'})`, pageWidth / 2, margin + 8, { align: "center" });
                }
            }
        });

        // Add footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - margin, { align: 'right' });
        }

        // Generate and upload PDF
        const bucket = admin.storage().bucket();
        const fileName = `attendance_reports/attendance_report7_${fromDate}_to_${toDate}.pdf`;
        const file = bucket.file(fileName);

        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
        await file.save(pdfBuffer, {
            metadata: { contentType: "application/pdf" },
            public: true,
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        res.status(200).send({ publicUrl });
    } catch (error) {
        console.error("Error generating attendance report:", error);
        res.status(500).send("Internal Server Error");
    }
});