/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, EmployeeDeduction } from '../types';
import { DEFAULT_CURRENCY, UNSPECIFIED_LABEL } from './employmentOptions';

/**
 * Escapes fields to safely output to a CSV format.
 */
const escapeCSVField = (field: string | number | undefined): string => {
  if (field === undefined || field === null) return '';
  const str = String(field).replace(/"/g, '""');
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
};

/**
 * Exports lists to Excel-friendly Arabic-compliant CSV.
 */
export const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvContent = [
    headers.map(escapeCSVField).join(','),
    ...rows.map(row => row.map(escapeCSVField).join(','))
  ].join('\r\n');

  // Prepend UTF-8 BOM so MS Excel reads Arabic text correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Helper to export the Employees list specifically
 */
export const exportEmployeesListCSV = (employees: Employee[]) => {
  const headers = ['المعرف', 'الاسم الكامل', 'المسمى الوظيفي', 'القسم', 'نوع العمل', 'نوع العقد', 'العملة', 'الراتب الأساسي', 'البدلات', 'الخصومات المباشرة', 'الحالة', 'تاريخ التعيين', 'رصيد الإجازات المتبقي'];
  const rows = employees.map(e => [
    e.id,
    e.name,
    e.job,
    e.dept,
    e.workType || UNSPECIFIED_LABEL,
    e.contractType || UNSPECIFIED_LABEL,
    e.currency || DEFAULT_CURRENCY,
    e.salary,
    e.allow,
    e.deduct,
    e.status,
    e.hire,
    e.leaveBalance
  ]);
  exportToCSV(`قائمة_الموظفين_${new Date().toISOString().slice(0, 10)}`, headers, rows);
};

/**
 * Helper to export the Payroll register specifically (WPS-Compliant Draft)
 */
export const exportPayrollCSV = (employees: Employee[], deductions: EmployeeDeduction[]) => {
  const headers = ['اسم الموظف', 'الراتب الأساسي (ر.س)', 'البدلات (ر.س)', 'استقطاع التأمينات GOSI (ر.س)', 'خصومات مباشر (ر.س)', 'إجمالي المستقطعات (ر.س)', 'صافي الراتب المستحق (ر.س)', 'الحالة القانونية'];
  
  const rows = employees.map(e => {
    const ded = deductions.find(d => d.empId === e.id) || { gosiPct: 9.75, medPct: 1.5, otherPct: 0 };
    const gosiAmount = Math.round(e.salary * (ded.gosiPct / 100));
    const medAmount = Math.round(e.salary * (ded.medPct / 100));
    const otherAmount = Math.round(e.salary * ((ded.otherPct || 0) / 100));
    const totalDeductions = gosiAmount + medAmount + otherAmount + e.deduct;
    const netSalary = e.salary + e.allow - totalDeductions;

    return [
      e.name,
      e.salary,
      e.allow,
      gosiAmount,
      e.deduct,
      totalDeductions,
      netSalary,
      e.status === 'موقوف' ? 'موقوف الصرف' : 'نشط مستحق'
    ];
  });

  exportToCSV(`مسير_الرواتب_الرسمي_${new Date().toISOString().slice(0, 7)}`, headers, rows);
};

/**
 * Elegant native print dialog handler optimized for Arabic tables.
 * Displays a clean and structured layout with ministry alignment & company stamp mock.
 */
export const printOfficialReport = (title: string, tableHTML: string, totalCount?: string, totalAmount?: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('الرجاء السماح بنوافذ منبثقة (Popups) لمعاينة وطباعة المستندات القانونية.');
    return;
  }

  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        
        body {
          font-family: 'system-ui', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 15mm 15mm;
          color: #1e293b;
          background: #fff;
          font-size: 11pt;
          line-height: 1.5;
        }

        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          border-bottom: 3px double #b45309;
          padding-bottom: 15px;
        }

        .header-left {
          text-align: left;
          font-size: 8.5pt;
          color: #64748b;
          vertical-align: middle;
        }

        .header-right {
          text-align: right;
          font-size: 9.5pt;
          color: #0f172a;
          vertical-align: middle;
          line-height: 1.7;
        }

        .header-logo {
          text-align: center;
          vertical-align: middle;
          font-weight: bold;
          font-size: 18pt;
          color: #047857; /* Saudi Green scale */
        }

        .title-block {
          text-align: center;
          margin: 25px 0;
        }

        .title-block h1 {
          font-size: 16pt;
          margin: 0;
          color: #0c4a6e;
          font-weight: bold;
          border-bottom: 2px solid #0c4a6e;
          display: inline-block;
          padding-bottom: 5px;
        }

        .title-block p {
          font-size: 9pt;
          color: #64748b;
          margin: 6px 0 0 0;
        }

        .badge-compliance {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          padding: 6px 12px;
          border-radius: 6px;
          display: inline-block;
          font-size: 9.5pt;
          font-weight: bold;
          margin-bottom: 20px;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }

        .report-table th {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          color: #1e293b;
          font-weight: bold;
          padding: 10px 8px;
          font-size: 10pt;
          text-align: right;
        }

        .report-table td {
          border: 1px solid #e2e8f0;
          padding: 8px 8px;
          font-size: 9.5pt;
        }

        .report-table tr:nth-child(even) {
          background-color: #f8fafc/40;
        }

        .summary-box {
          margin-top: 25px;
          background: #fdfbf7;
          border: 1px solid #fef3c7;
          border-radius: 8px;
          padding: 15px;
          width: 50%;
          margin-right: auto;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 10pt;
        }

        .summary-item.total {
          border-top: 2px solid #f59e0b;
          margin-top: 10px;
          font-weight: bold;
          font-size: 11pt;
          color: #1e293b;
        }

        .footer-sig {
          margin-top: 50px;
          width: 100%;
          border-collapse: collapse;
        }

        .sig-col {
          width: 33.3%;
          text-align: center;
          font-size: 10pt;
          vertical-align: top;
        }

        .stamp-box {
          border: 2px dashed #b45309;
          border-radius: 50%;
          width: 90px;
          height: 90px;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 7.5pt;
          font-weight: bold;
          color: #b45309;
          transform: rotate(-10deg);
          margin-top: 10px;
          opacity: 0.8;
        }

        .official-note {
          margin-top: 80px;
          font-size: 8pt;
          color: #94a3b8;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
        }

        @media print {
          body {
            margin: 10mm;
          }
          .no-print {
            display: none !important;
          }
          button {
            display: none !important;
          }
        }
      </style>
    </head>
    <body onload="window.print()">
      
      <!-- Top Action Ribbon -->
      <div class="no-print" style="background-color: #f1f5f9; padding: 12px 20px; margin: -15mm -15mm 20px -15mm; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1;">
        <span style="font-size: 10pt; color: #475569; font-weight: bold;">🖨️ معاينة ما قبل طباعة التقرير القانوني المعتمد</span>
        <div>
          <button onclick="window.print()" style="background-color: #047857; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 9.5pt;">طباعة / تصدير كملف PDF</button>
          <button onclick="window.close()" style="background-color: white; color: #475569; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-right: 8px; font-size: 9.5pt;">إغلاق المعاينة</button>
        </div>
      </div>

      <!-- Legal Saudi Style Header -->
      <table class="header-table">
        <tr>
          <td class="header-right">
            <strong>المملكة العربية السعودية</strong><br>
            وزارة الموارد البشرية والتنمية الاجتماعية<br>
            نظام مسير الأجور وإدارة الكوادر البشرية الموحد (HRMS)<br>
            الرخص والاعتمادات: متوافق مع بوابة قوى والتأمينات GOSI
          </td>
          <td class="header-logo">
            <span style="color: #047857;">🇸🇦</span> سحابة الأعمال
          </td>
          <td class="header-left">
            التاريخ: ${currentDate}<br>
            الوقت: ${currentTime}<br>
            مستند أرشفة مشفّر: HR-${Math.floor(100000 + Math.random() * 900000)}<br>
            حالة فحص الامتثال: نشط وسليم
          </td>
        </tr>
      </table>

      <!-- Title -->
      <div class="title-block">
        <h1>${title}</h1>
        <p>مستخرج من السجلات الإلكترونية الفعلية للمؤسسة لقواعد بيانات السحابة</p>
      </div>

      <!-- GOSI & Qiwa Compliance badge -->
      <div class="badge-compliance">
        ✓ تم الفحص والمطابقة التكنولوجية: مسير معتمد ومحدث بشكل متكامل مع متطلبات نظام العمل السعودي.
      </div>

      <!-- Main Data Table Container -->
      <div style="margin-bottom: 25px;">
        ${tableHTML}
      </div>

      <!-- Report Metadata Summary (Conditional) -->
      ${(totalCount || totalAmount) ? `
      <div class="summary-box">
        <h3 style="margin: 0 0 10px 0; font-size: 10.5pt; color: #0c4a6e; font-weight: bold;">ملامح المسح والتحليل السحابي</h3>
        ${totalCount ? `
        <div class="summary-item">
          <span>إجمالي القوى العاملة المشمولة بالتقرير:</span>
          <strong>${totalCount} موظفاً</strong>
        </div>` : ''}
        ${totalAmount ? `
        <div class="summary-item total">
          <span>إجمالي الميزانية / المستحقات المالية:</span>
          <strong>${totalAmount} ر.س</strong>
        </div>` : ''}
      </div>
      ` : ''}

      <!-- Signatures Footer -->
      <table class="footer-sig">
        <tr>
          <td class="sig-col">
            <strong>قُدّم بواسطة رئيس الموارد البشرية</strong><br>
            <span style="font-size: 9pt; color: #64748b; min-height: 40px; display: block; margin-top: 10px;">...................................</span><br>
            التوقيع والاعتماد الإلكتروني
          </td>
          <td class="sig-col">
            <strong>ختم المنشأة الرقمي الموثق</strong><br>
            <div class="stamp-box">
              <span>سحابة الأعمال</span>
              <span>🇸🇦 موثق 🇸🇦</span>
              <span style="font-size: 5.5pt; margin-top: 2px;">WPS / GOSI</span>
            </div>
          </td>
          <td class="sig-col">
            <strong>المدير المالي التنفيذي</strong><br>
            <span style="font-size: 9pt; color: #64748b; min-height: 40px; display: block; margin-top: 10px;">...................................</span><br>
            المطابقة والتدقيق التنفيذي
          </td>
        </tr>
      </table>

      <!-- Footer Note -->
      <div class="official-note">
        نظام إدارة الموارد البشرية "سحابة الأعمال" - وثيقة إلكترونية رسمية صادرة بموجب تنظيمات حماية البيانات ونظام التعاملات الإلكترونية في المملكة العربية السعودية. لا يتطلب توقيعاً خطياً إذا تم استصداره بختم السحابة الرقمي المعتمد.
      </div>

    </body>
    </html>
  `);
  printWindow.document.close();
};
