export default function generateMockAttendance() {
    const attendanceRecords = [];
    const today = new Date();
  
    for (let i = 1; i <= 5; i++) {
      const checkIn = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - i,
        9,
        Math.floor(Math.random() * 30) // Randomize minutes
      );
      const checkOut = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - i,
        17,
        Math.floor(Math.random() * 30) // Randomize minutes
      );
  
      attendanceRecords.push({
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        hoursWorked: (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60), // Calculate hours
      });
    }
  
    return attendanceRecords;
  }

 export function generateMockLeaves() {
    return [
      {
        totalLeaves: 20,
        usedLeaves: Math.floor(Math.random() * 10), 
        remainingLeaves: 20 - Math.floor(Math.random() * 10), // Total - Used
      },
    ];
  }
  