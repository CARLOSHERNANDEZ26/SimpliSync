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

// cutoffPeriod parameter (1 = 1st-15th, 2 = 16th-End)
export const calculateMandatoryDeductions = (
  baseSalary: number, 
  cutoffPeriod: 1 | 2 | "monthly" = "monthly"
): DeductionBreakdown => {
  if (!baseSalary || baseSalary <= 0) {
    return { sss: 0, philhealth: 0, pagibig: 0, totalMandatory: 0, taxableIncome: 0 };
  }

  if (baseSalary < 1500) {
    return { sss: 0, philhealth: 0, pagibig: 0, totalMandatory: 0, taxableIncome: baseSalary };
  }

  // Calculate the FULL monthly amounts
  const monthlySSS = calculateSSS(baseSalary);
  const monthlyPhilhealth = calculatePhilHealth(baseSalary);
  const monthlyPagibig = calculatePagIBIG(baseSalary);

  let sss = 0, philhealth = 0, pagibig = 0;

  // DOLE Standard Semi-Monthly Split
  if (cutoffPeriod === 1) {
    // 1st Cutoff: SSS & Pag-IBIG
    sss = monthlySSS;
    pagibig = monthlyPagibig;
    philhealth = 0; 
  } else if (cutoffPeriod === 2) {
    // 2nd Cutoff: PhilHealth
    sss = 0;
    pagibig = 0;
    philhealth = monthlyPhilhealth;
  } else {
    // Full Monthly (if needed)
    sss = monthlySSS;
    pagibig = monthlyPagibig;
    philhealth = monthlyPhilhealth;
  }

  const totalMandatory = sss + philhealth + pagibig;
  
  const semiMonthlyBasic = baseSalary / 2;
  const taxableIncome = Math.max(0, semiMonthlyBasic - totalMandatory);

  return { sss, philhealth, pagibig, totalMandatory, taxableIncome };
};