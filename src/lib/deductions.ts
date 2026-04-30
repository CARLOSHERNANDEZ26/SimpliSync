export const calculateSSS = (baseSalary: number): number => {
  // 1. SSS Minimum and Maximum constraints for 2025/2026
  const minMSC = 5000;
  const maxMSC = 30000;

  // SSS brackets step by 500, starting at a 250 offset.
  // Example: 17,100 - 250 = 16,850. Floor(16,850/500) = 33. 
  // 33 * 500 = 16,500 + 500 = 17,000 MSC.
  let msc = Math.floor((baseSalary - 250) / 500) * 500 + 500;
  
  if (msc < minMSC) msc = minMSC;
  if (msc > maxMSC) msc = maxMSC;

  return msc * 0.05; // 5% Employee Share
};

export const calculatePhilHealth = (baseSalary: number): number => {
  // 5% Total (2.5% Employee Share)
  const minSalary = 10000;
  const maxSalary = 100000;

  let applicableSalary = baseSalary;
  if (baseSalary < minSalary) applicableSalary = minSalary;
  if (baseSalary > maxSalary) applicableSalary = maxSalary;

  return applicableSalary * 0.025; // 2.5% Employee Share
};

export const calculatePagIBIG = (baseSalary: number): number => {
  // Max compensation limit capped at 10,000
  const maxSalary = 10000;
  const applicableSalary = Math.min(baseSalary, maxSalary);

  if (baseSalary <= 1500) {
    return applicableSalary * 0.01; // 1% for 1,500 and below
  }
  return applicableSalary * 0.02; // 2% otherwise
};

export interface DeductionBreakdown {
  sss: number;
  philhealth: number;
  pagibig: number;
  totalMandatory: number;
  taxableIncome: number;
}

export const calculateMandatoryDeductions = (baseSalary: number): DeductionBreakdown => {
  if (!baseSalary || baseSalary <= 0) {
    return { sss: 0, philhealth: 0, pagibig: 0, totalMandatory: 0, taxableIncome: 0 };
  }

  // 🔥 THE "NEGATIVE PAY SHIELD" (Based on AI Feedback)
  // If an employee earns practically nothing (e.g., severe absences like Maria Clara's ₱250), 
  // standard monthly deductions are typically waived or capped to avoid negative debt.
  if (baseSalary < 1500) {
    return {
      sss: 0,
      philhealth: 0,
      pagibig: 0,
      totalMandatory: 0,
      taxableIncome: baseSalary
    };
  }

  const sss = calculateSSS(baseSalary);
  const philhealth = calculatePhilHealth(baseSalary);
  const pagibig = calculatePagIBIG(baseSalary);
  const totalMandatory = sss + philhealth + pagibig;

  // Final safety check: Deductions should never exceed the gross salary
  const actualDeductions = Math.min(totalMandatory, baseSalary);

  return {
    sss,
    philhealth,
    pagibig,
    totalMandatory: actualDeductions,
    taxableIncome: Math.max(0, baseSalary - actualDeductions)
  };
};