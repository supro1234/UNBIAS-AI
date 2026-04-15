export const datasetMetrics = [
  { group: 'Male', applicants: 15430, acceptanceRate: 68, biasFlag: false },
  { group: 'Female', applicants: 12100, acceptanceRate: 42, biasFlag: true },
  { group: 'Non-Binary', applicants: 890, acceptanceRate: 45, biasFlag: true },
  { group: 'Undisclosed', applicants: 2100, acceptanceRate: 51, biasFlag: false }
];

export const fairnessOverTime = [
  { month: 'Jan', fairnessScore: 65, accuracy: 88 },
  { month: 'Feb', fairnessScore: 68, accuracy: 89 },
  { month: 'Mar', fairnessScore: 72, accuracy: 88 },
  { month: 'Apr', fairnessScore: 71, accuracy: 89 },
  { month: 'May', fairnessScore: 85, accuracy: 87 },
  { month: 'Jun', fairnessScore: 92, accuracy: 86 }
];

export const biasTypes = [
  { category: 'Gender Identity', impact: 85, fill: '#EA4335' }, // critical
  { category: 'Age', impact: 65, fill: '#FBBC05' }, // warning
  { category: 'Geography', impact: 40, fill: '#4285F4' }, // info
  { category: 'Education Level', impact: 20, fill: '#34A853' } // ok
];

export const recentFlags = [
  { id: 'FLG-1029', model: 'Recruitment-AI-V3', detail: 'Historical Hiring Skew Detected', severity: 'Critical', region: 'NA' },
  { id: 'FLG-1030', model: 'Loan-Approval-Net', detail: 'ZIP Code Redlining Pattern', severity: 'Critical', region: 'EMEA' },
  { id: 'FLG-1031', model: 'Healthcare-Triage', detail: 'Symptom Weighting Disparity', severity: 'Warning', region: 'GLOBAL' }
];
