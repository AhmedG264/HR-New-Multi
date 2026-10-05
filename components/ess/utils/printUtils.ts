/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee } from '../../../types';

export interface PayslipDetails {
  monthName: string;
  monthStatus: string;
  isCurrent: boolean;
  extraBonus: number;
  extraDeduct: number;
  extraNotes: string;
  calcBasic: number;
  calcHousing: number;
  calcTransport: number;
  calcOtherAllow: number;
  calcGross: number;
  calcGosi: number;
  calcMed: number;
  calcOtherDeduct: number;
  calcTotalDeds: number;
  calcNet: number;
}

/**
 * Generates and prints a detailed Payslip document in a new window.
 */
export const printPayslip = (activeEmployee: Employee, payslipDetails: PayslipDetails): void => {
  const win = window.open("", "_blank");
  if (!win) {
    alert("الرجاء السماح بنوافذ منبثقة (Popups) لمعاينة وطباعة كشف الراتب.");
    return;
  }
  const printDate = new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
  const processId = `PAY-SHB-${Math.floor(Math.random() * 900000 + 100000)}`;

  win.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>كشف راتب تفصيلي ومعتمد - ${activeEmployee.name} - ${payslipDetails.monthName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        body {
          font-family: 'Cairo', system-ui, -apple-system, sans-serif;
          margin: 15mm 15mm;
          color: #1e293b;
          background: #fff;
          line-height: 1.6;
          font-size: 10pt;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          border-bottom: 3px double #00875A;
          padding-bottom: 12px;
        }
        .header-right {
          text-align: right;
          font-size: 9.5pt;
          color: #0f172a;
          line-height: 1.7;
        }
        .header-left {
          text-align: left;
          font-size: 8.5pt;
          color: #64748b;
          vertical-align: middle;
        }
        .header-logo {
          text-align: center;
          vertical-align: middle;
          font-weight: 800;
          font-size: 18pt;
          color: #00875A;
        }
        .title {
          text-align: center;
          margin: 20px 0;
          font-size: 14pt;
          font-weight: 800;
          color: #0f172a;
        }
        .title span {
          border-bottom: 2px solid #00875A;
          padding-bottom: 4px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .info-table td {
          padding: 6px 8px;
          font-size: 9.5pt;
          border: 1px solid #f1f5f9;
        }
        .info-label {
          font-weight: 700;
          color: #475569;
          background-color: #f8fafc;
          width: 20%;
        }
        .info-value {
          color: #1e293b;
          width: 30%;
        }
        .financial-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 20px;
        }
        .financial-table th {
          background-color: #00875A;
          color: #ffffff;
          padding: 8px 10px;
          font-weight: 700;
          font-size: 10pt;
          border: 1px solid #00875A;
        }
        .financial-table td {
          border: 1px solid #e2e8f0;
          padding: 8px 10px;
          font-size: 9.5pt;
        }
        .total-row {
          font-weight: bold;
          background-color: #f8fafc;
        }
        .net-box {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
          padding: 12px;
          text-align: center;
          font-size: 12pt;
          font-weight: 800;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        .notes-box {
          font-size: 8.5pt;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
          background-color: #fafafa;
        }
        .sig-container {
          display: flex;
          justify-content: space-between;
          margin-top: 35px;
          font-size: 9.5pt;
        }
        .stamp-box {
          width: 90px;
          height: 90px;
          border: 2px dashed #00875A;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #00875A;
          font-size: 7.5pt;
          font-weight: 800;
          transform: rotate(-5deg);
          background-color: rgba(209, 250, 229, 0.1);
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td class="header-right">
            <strong>شركة سحابة الأعمال كابيتال لتقنية المعلومات</strong><br>
            سجل الاستحقاقات وحماية الأجور WPS بوزارة الموارد البشرية<br>
            الرياض - المملكة العربية السعودية
          </td>
          <td class="header-logo">
            ☁️ سحابة الموارد
          </td>
          <td class="header-left">
            رقم العملية: ${processId}<br>
            تاريخ إصدار الكشف: ${printDate}<br>
            بوابة الخدمة الذاتية المعتمدة
          </td>
        </tr>
      </table>

      <div class="title">
        <span>كشف تفصيلي بالأجر الشهري والمستحقات (Payslip)</span>
      </div>

      <table class="info-table">
        <tr>
          <td class="info-label">اسم الموظف كلياً</td>
          <td class="info-value"><strong>${activeEmployee.name}</strong></td>
          <td class="info-label">الرقم التعريفي (الرمز)</td>
          <td class="info-value"><code>${activeEmployee.id}</code></td>
        </tr>
        <tr>
          <td class="info-label">المسمى الوظيفي</td>
          <td class="info-value">${activeEmployee.job}</td>
          <td class="info-label">القسم والفرع</td>
          <td class="info-value">${activeEmployee.dept}</td>
        </tr>
        <tr>
          <td class="info-label">تاريخ الصرف والاستحقاق</td>
          <td class="info-value"><strong>${payslipDetails.monthName}</strong></td>
          <td class="info-label">حالة الصرف والـ WPS</td>
          <td class="info-value"><strong>${payslipDetails.monthStatus}</strong></td>
        </tr>
      </table>

      <table class="financial-table">
        <thead>
          <tr>
            <th style="width: 50%;">بند المستحقات والأرباح (Earnings)</th>
            <th style="width: 50%;">بند الخصومات والاستقطاعات (Deductions)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div style="display: flex; justify-content: space-between;">
                <span>الراتب الأساسي الشهري:</span>
                <strong>${payslipDetails.calcBasic.toLocaleString()} ر.س</strong>
              </div>
            </td>
            <td>
              <div style="display: flex; justify-content: space-between;">
                <span>خصم التأمينات الاجتماعية (GOSI):</span>
                <strong style="color: #de350b;">${payslipDetails.calcGosi.toLocaleString()} ر.س</strong>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div style="display: flex; justify-content: space-between;">
                <span>بدل السكن الموزع (60%):</span>
                <strong>${payslipDetails.calcHousing.toLocaleString()} ر.س</strong>
              </div>
            </td>
            <td>
              <div style="display: flex; justify-content: space-between;">
                <span>خصم الرعاية والتأمين الطبي:</span>
                <strong style="color: #de350b;">${payslipDetails.calcMed.toLocaleString()} ر.س</strong>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div style="display: flex; justify-content: space-between;">
                <span>بدل النقل ومصاريف البنزين (30%):</span>
                <strong>${payslipDetails.calcTransport.toLocaleString()} ر.س</strong>
              </div>
            </td>
            <td>
              <div style="display: flex; justify-content: space-between;">
                <span>خصومات غياب أو جزاءات معلقة:</span>
                <strong style="color: #de350b;">${payslipDetails.calcOtherDeduct.toLocaleString()} ر.س</strong>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div style="display: flex; justify-content: space-between;">
                <span>بدلات إضافية وتعويضات واتصال (10%):</span>
                <strong>${payslipDetails.calcOtherAllow.toLocaleString()} ر.س</strong>
              </div>
            </td>
            <td>
              <div style="display: flex; justify-content: space-between;">
                <span>-</span>
                <span>-</span>
              </div>
            </td>
          </tr>
          ${payslipDetails.extraBonus > 0 ? `
          <tr>
            <td style="background-color: #f0fdf4;">
              <div style="display: flex; justify-content: space-between; color: #15803d; font-weight: bold;">
                <span>إضافات ومكافأة أداء استثنائية:</span>
                <span>+${payslipDetails.extraBonus.toLocaleString()} ر.س</span>
              </div>
            </td>
            <td>
              <span>-</span>
            </td>
          </tr>
          ` : ""}
          <tr class="total-row">
            <td>
              <div style="display: flex; justify-content: space-between;">
                <span>إجمالي المستحقات والبدلات:</span>
                <span>${payslipDetails.calcGross.toLocaleString()} ر.س</span>
              </div>
            </td>
            <td>
              <div style="display: flex; justify-content: space-between; color: #de350b;">
                <span>إجمالي الخصومات والتأمين:</span>
                <span>${payslipDetails.calcTotalDeds.toLocaleString()} ر.س</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="net-box">
        صافي الأجر المحول للحساب البنكي (Net Pay): ${payslipDetails.calcNet.toLocaleString()} ريال سعودي
      </div>

      <div class="notes-box">
        <strong>ملاحظات وشروحات المسير:</strong><br>
        ${payslipDetails.extraNotes}<br>
        * هذا الكشف مسجل وموثق أمنياً لحساب نظام التوطين وحماية الأجور وخاضع لكافة تنظيمات العمل بموجب أنظمة تفعيل الرواتب في المملكة العربية السعودية.
      </div>

      <div class="sig-container">
        <div>
          <strong>إدارة الرواتب والشركاء (HR Payroll)</strong><br>
          سارة العتيبي<br>
          <span style="font-size: 8pt; color: #a0aec0;">✓ مصدق رقمياً ومطابق للمصارف</span>
        </div>
        
        <div class="stamp-box">
          <div style="text-align: center; line-height: 1.2;">
            <span>سحابة الموارد</span><br>
            <span style="font-size: 5pt; border-top: 1px solid #00875A;">قسم الرواتب</span>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  win.document.close();
};

/**
 * Generates and prints a detailed Salary Certificate document in a new window.
 */
export const printCertificate = (
  activeEmployee: Employee,
  isSaudi: boolean,
  basicSalary: number,
  allowance: number,
  totalDeducts: number,
  netSalary: number
): void => {
  const win = window.open("", "_blank");
  if (!win) {
    alert("الرجاء السماح بنوافذ منبثقة (Popups) لمعاينة وطباعة الشهادات الإدارية المصدقة.");
    return;
  }
  const printDate = new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
  const refNumber = `SHB-ESS-${Math.floor(Math.random() * 900000 + 100000)}`;

  win.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>خطاب تعريف بالراتب مصدق - ${activeEmployee.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        body {
          font-family: 'Cairo', system-ui, -apple-system, sans-serif;
          margin: 20mm 20mm;
          color: #1e293b;
          background: #fff;
          line-height: 1.6;
          font-size: 11pt;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          border-bottom: 3px double #00875A;
          padding-bottom: 15px;
        }
        .header-right {
          text-align: right;
          font-size: 10pt;
          color: #0f172a;
          line-height: 1.8;
        }
        .header-left {
          text-align: left;
          font-size: 9pt;
          color: #64748b;
          vertical-align: middle;
        }
        .header-logo {
          text-align: center;
          vertical-align: middle;
          font-weight: 800;
          font-size: 20pt;
          color: #00875A;
        }
        .title {
          text-align: center;
          margin: 30px 0;
          font-size: 16pt;
          font-weight: 800;
          color: #0f172a;
        }
        .title span {
          border-bottom: 2px solid #00875A;
          padding-bottom: 6px;
        }
        .salute {
          font-weight: 700;
          margin-bottom: 20px;
          font-size: 12pt;
        }
        .body-text {
          text-align: justify;
          margin-bottom: 25px;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 25px 0;
        }
        .data-table th, .data-table td {
          border: 1px solid #e2e8f0;
          padding: 10px 12px;
          text-align: right;
          font-size: 10.5pt;
        }
        .data-table th {
          background-color: #f8fafc;
          color: #475569;
          font-weight: 700;
          width: 30%;
        }
        .financial-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
          margin: 25px 0;
          border: 1px solid #e2e8f0;
          background-color: #f8fafc;
          border-radius: 8px;
          padding: 15px;
        }
        .financial-card {
          text-align: center;
          padding: 10px;
        }
        .financial-title {
          font-size: 9.5pt;
          color: #475569;
          font-weight: 700;
          margin-bottom: 5px;
        }
        .financial-value {
          font-size: 13pt;
          font-weight: 800;
          color: #00875A;
        }
        .footer-section {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .signature-area {
          text-align: right;
        }
        .stamp-box {
          width: 110px;
          height: 110px;
          border: 3px double #00875A;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #00875A;
          font-size: 8pt;
          font-weight: 800;
          transform: rotate(-5deg);
          background-color: rgba(209, 250, 229, 0.1);
        }
        .cert-verification-msg {
          margin-top: 40px;
          padding-top: 15px;
          border-top: 1px dashed #cbd5e1;
          font-size: 8.5pt;
          color: #64748b;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .qr-placeholder {
          border: 1px solid #cbd5e1;
          padding: 6px 12px;
          border-radius: 4px;
          font-family: monospace;
          text-align: center;
          font-size: 7.5pt;
          background: #f8fafc;
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td class="header-right">
            <strong>شركة سحابة الأعمال كابيتال المحدودة</strong><br>
            سجل تجاري رقم: 1010982347<br>
            وزارة الموارد البشرية والامتثال السحابي<br>
            الرياض - المملكة العربية السعودية
          </td>
          <td class="header-logo">
            ☁️ سحابة الموارد
          </td>
          <td class="header-left">
            التاريخ: ${printDate}<br>
            الرقم المرجعي: ${refNumber}<br>
            حالة المستند: معتمد وموافق عليه
          </td>
        </tr>
      </table>

      <div class="title">
        <span>خطاب تعريف بالراتب والمستحقات الوظيفية</span>
      </div>

      <div class="salute">أصحاب السعادة / الجهات المعنية والمصارف المحترمين،</div>
      <div class="salute" style="font-weight: normal; margin-bottom: 25px;">السلام عليكم ورحمة الله وبركاته، أما بعد،،،</div>

      <div class="body-text">
        يفيد قسم الموارد البشرية والامتثال الإداري في شركة سحابة الأعمال كابيتال لتقنية المعلومات والتكامل السحابي بأن الموظف المذكورة تفاصيله المهنية أدناه يعمل لدى الشركة وتحت كفالتها، وما يزال على رأس العمل حتى تاريخه. وبناءً على طلبه، تم تزويده بهذا الخطاب لتوضيح تفاصيل الأجر الشهري المحول بنظام الصرف الوزاري دون أي أدنى التزام أو مسؤولية على الشركة:
      </div>

      <table class="data-table">
        <tr>
          <th>اسم الموظف الكامل</th>
          <td><strong>${activeEmployee.name}</strong></td>
        </tr>
        <tr>
          <th>الجنسية والصفة القانونية</th>
          <td>${isSaudi ? "سعودي الجنسية" : "مقيم نظامي"}</td>
        </tr>
        <tr>
          <th>رقم السجل المدني / الإقامة</th>
          <td><code>${isSaudi ? "109" : "230"}${Math.floor(Math.random() * 9000000 + 1000000)}</code></td>
        </tr>
        <tr>
          <th>المسمى الوظيفي المسجل</th>
          <td>${activeEmployee.job}</td>
        </tr>
        <tr>
          <th>القسم التابع له</th>
          <td>${activeEmployee.dept}</td>
        </tr>
        <tr>
          <th>تاريخ المباشرة المعتمد بالشركة</th>
          <td>${activeEmployee.hire}</td>
        </tr>
      </table>

      <div class="salute" style="margin-top: 25px; margin-bottom: 10px; font-size: 11pt;">بيان الأجر والبدلات الشهرية الثابتة:</div>
      
      <div class="financial-grid">
        <div class="financial-card">
          <div class="financial-title">الراتب الأساسي الشهري</div>
          <div class="financial-value">${basicSalary.toLocaleString()} ر.س</div>
        </div>
        <div class="financial-card">
          <div class="financial-title">البدلات الشهرية الثابتة</div>
          <div class="financial-value">+${allowance.toLocaleString()} ر.س</div>
        </div>
        <div class="financial-card">
          <div class="financial-title">إجمالي الاستقطاعات والخصميات</div>
          <div class="financial-value" style="color: #ef4444;">-${totalDeducts.toLocaleString()} ر.س</div>
        </div>
      </div>

      <div style="text-align: center; border: 1px solid #00875A; padding: 12px; background-color: rgba(209,250,229,0.3); border-radius: 8px; margin-bottom: 30px;">
        <span style="font-size: 10.5pt; font-weight: bold; color: #065f46;">
          الأجر الصافي المحول لحساب الاستحقاق البنكي (WPS): 
          <span style="font-size: 13pt; font-weight: 800;">${netSalary.toLocaleString()} ريال سعودي فقط لا غير</span>
        </span>
      </div>

      <div class="body-text" style="font-size: 10pt; color: #475569;">
        يرجى العلم بأن أجور موظفينا خاضعة لنظام حماية الأجور الوزاري السعودي (WPS) ومسجلة في قواعد التأمينات الاجتماعية للتكامل والتطابق المستمر.
      </div>

      <div class="footer-section">
        <div class="signature-area">
          <strong>مديرة إدارة الموارد البشرية والامتثال</strong><br>
          سارة العتيبي<br>
          <span style="font-style: italic; color: #64748b; font-size: 9.5pt; font-family: cursive;">Sarah Al-Otaibi</span><br>
          <i>التوقيع الإلكتروني معتمد بموجب الصلاحيات واللوائح المنظمة</i>
        </div>

        <div class="stamp-area">
          <div class="stamp-box">
            <span>سحابة الأعمال</span>
            <span style="border-top: 1px solid #00875A; border-bottom: 1px solid #00875A; font-size: 7.5pt; margin: 3px 0; padding: 1px 4px;">شؤون الموظفين</span>
            <span>✓ مصدق رقمياً</span>
          </div>
        </div>
      </div>

      <div class="cert-verification-msg">
        <div>
          <span>كود التحقق الإلكتروني المعتمد: ${refNumber}</span><br>
          <span>* يمكن التحقق من صحة المستند بالتنسيق مع قسم الامتثال بالشركة والمطابقة مع نظام GOSI.</span>
        </div>
        <div class="qr-placeholder">
          <span>التصديق الرقمي<br>Sahaba QR<br>🔐 Secure</span>
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  win.document.close();
};
