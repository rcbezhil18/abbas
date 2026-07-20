import { BillItem } from "@/types";

export const rs = (n: number | string): string => {
  const num = Number(n || 0);
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export const rs2 = (n: number | string): string => {
  const num = Number(n || 0);
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function fmtDate(d: string | number | Date): string {
  if (!d) return '—';
  const x = new Date(d);
  if (isNaN(x.getTime())) return String(d);
  return x.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateDateBillNo(type: string, dateStr: string, existingBills: any[]): string {
  const dateKey = String(dateStr || todayISO()).replace(/\D/g, "");
  const sameDateBills = (existingBills || []).filter((b) => {
    const bDateKey = String(b.date || "").replace(/\D/g, "");
    return bDateKey === dateKey || String(b.billNo).includes(dateKey);
  });

  let nextSeq = 1;
  sameDateBills.forEach((b) => {
    const match = String(b.billNo).match(/-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num >= nextSeq) {
        nextSeq = num + 1;
      }
    }
  });

  // If no match found via regex but bills exist today, use list length + 1
  if (nextSeq === 1 && sameDateBills.length > 0) {
    nextSeq = sameDateBills.length + 1;
  }

  const seqStr = String(nextSeq).padStart(3, "0");

  if (type === "nontax") {
    return `NT-${dateKey}-${seqStr}`;
  } else if (type === "tax") {
    return `TX-${dateKey}-${seqStr}`;
  }
  return `${dateKey}-${seqStr}`;
}

export function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + Number(months || 0));
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function numWords(num: number): string {
  num = Math.round(Number(num) || 0);
  if (num === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function two(n: number) {
    return n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
  }
  function three(n: number) {
    return (n >= 100 ? a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' : '') : '') + (n % 100 ? two(n % 100) : '');
  }
  let out = '', crore = Math.floor(num / 10000000); num %= 10000000;
  let lakh = Math.floor(num / 100000); num %= 100000;
  let thou = Math.floor(num / 1000); num %= 1000;
  if (crore) out += three(crore) + ' Crore ';
  if (lakh) out += two(lakh) + ' Lakh ';
  if (thou) out += two(thou) + ' Thousand ';
  if (num) out += three(num);
  return out.trim().replace(/\s+/g, ' ') + ' Rupees Only';
}

export function calcBill(
  items: { qty: number | string; rate: number | string; [key: string]: any }[],
  ratePercent: number | string,
  interstate: boolean,
  inclusive: boolean,
  notax: boolean
) {
  const rate = notax ? 0 : Number(ratePercent) || 0;
  let gross = 0;
  
  const lines = items.map((it) => {
    const qty = Number(it.qty) || 0;
    const itemRate = Number(it.rate) || 0;
    const amount = qty * itemRate;
    gross += amount;
    return { ...it, qty, rate: itemRate, amount } as BillItem;
  });

  if (notax) {
    lines.forEach((l) => {
      l.taxable = l.amount;
      l.cgstA = 0;
      l.sgstA = 0;
      l.igstA = 0;
      l.lineTotal = l.amount;
    });
    return { lines, taxable: gross, gst: 0, cgst: 0, sgst: 0, igst: 0, grand: gross, rate: 0, notax: true };
  }

  const factor = inclusive ? (1 + rate / 100) : 1;
  const taxable = inclusive ? gross / factor : gross;
  const gst = inclusive ? gross - taxable : (gross * rate) / 100;
  const grand = inclusive ? gross : gross + gst;
  const cgst = interstate ? 0 : gst / 2;
  const sgst = interstate ? 0 : gst / 2;
  const igst = interstate ? gst : 0;

  lines.forEach((l) => {
    l.taxable = inclusive ? l.amount / factor : l.amount;
    const lg = inclusive ? l.amount - l.taxable : (l.amount * rate) / 100;
    l.cgstA = interstate ? 0 : lg / 2;
    l.sgstA = interstate ? 0 : lg / 2;
    l.igstA = interstate ? lg : 0;
    l.lineTotal = inclusive ? l.amount : l.amount + lg;
  });

  return { lines, taxable, gst, cgst, sgst, igst, grand, rate };
}

export function csvEscape(v: any): string {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function toCSV(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvEscape).join(',')).join('\n');
}

export function download(filename: string, text: string, mime: string = 'text/plain;charset=utf-8') {
  try {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {}
}
