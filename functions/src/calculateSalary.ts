
// Payroll Calculation Logic
export default function calculatePayroll(employeeData: any) {
    const {
      monthlySalary,
      workingDaysInMonth,
      dailyWorkingHours,
      absentDays,
      overtimeHours,
      maximumOvertimeAllowed, // Corrected parameter name to match input
      attendanceAllowance,
      otherAllowances,
      eobiContribution,
      lateDays
    } = employeeData;
  
    // 1. Per Day Salary
    const perDaySalary = monthlySalary / workingDaysInMonth;
  
    // 2. Per Hour Salary
    const perHourSalary = perDaySalary / dailyWorkingHours;
  
    // 3. Effective Absent Days
    const effectiveAbsentDays = Math.max(0, absentDays - 1); // At least 0 if no absent days
  
    // 4. Absent Deduction
    const absentDeduction = effectiveAbsentDays * perDaySalary;
  
    // 5. Overtime Adjustment
    const excessOvertime = Math.max(0, overtimeHours - maximumOvertimeAllowed); // Excess overtime hours
    const adjustedOvertimeHours =
      overtimeHours <= maximumOvertimeAllowed
        ? overtimeHours // If within allowed, take as is
        : maximumOvertimeAllowed + excessOvertime / 2; // Otherwise, adjust for excess overtime
  
    // 6. Overtime Amount
    const overtimeAmount = adjustedOvertimeHours * perHourSalary * 1.5; // 1.5x rate for overtime
  
    // 7. Gross Salary
    const grossSalary =
      monthlySalary +
      (overtimeAmount || 0) + // Ensure no null values
      (attendanceAllowance || 0) +
      (otherAllowances || 0);
  
    // 8. Late Coming Deduction
    const lateComingDeduction = lateDays * (perDaySalary / dailyWorkingHours);
  
    // 9. Total Deductions
    const totalDeductions =
      lateComingDeduction + (eobiContribution || 0) + (absentDeduction || 0);
  
    // 10. Net Salary
    const netSalary = grossSalary - totalDeductions;
  
    // Return calculated payroll
    return {
      perDaySalary,
      perHourSalary,
      adjustedOvertimeHours,
      overtimeAmount,
      grossSalary,
      lateComingDeduction,
      totalDeductions,
      netSalary
    };
  }
  