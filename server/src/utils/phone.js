// People on Bangla keyboards type ০১৭১২… — convert Bangla digits to ASCII first.
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toAsciiDigits = (s) => String(s ?? '').replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

// Bangladesh mobile numbers: 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX → always stored as 01XXXXXXXXX.
const BD = /^(?:\+?88)?(01[3-9]\d{8})$/;

export function normalizePhone(input) {
  const cleaned = toAsciiDigits(input).replace(/[\s\-()]/g, '');
  const m = BD.exec(cleaned);
  return m ? m[1] : '';
}
