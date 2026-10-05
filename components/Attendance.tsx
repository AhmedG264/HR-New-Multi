/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useHR } from '../context/HRContext';
import { 
  Clock, 
  UserCheck, 
  UserX, 
  Calendar, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  ArrowLeftRight, 
  Printer, 
  Download, 
  Users, 
  FileCheck,
  Building
} from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import * as XLSX from 'xlsx';

export const Attendance: React.FC = () => {
  const { 
    employees, 
    attendance, 
    leaves, 
    recordAttendance, 
    recordBulkAttendance,
    deleteAttendance,
    setCurrentView,
    setSelectedEmployeeId,
    setEmployeeFileTab 
  } = useHR();

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  
  // Custom states for date navigation
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    // Return today's date in YYYY-MM-DD
    return new Date().toISOString().slice(0, 10);
  });

  // Modal Control
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Form Fields
  const [formEmpId, setFormEmpId] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formCheckType, setFormCheckType] = useState<'in' | 'out' | 'both'>('in');
  const [formInTime, setFormInTime] = useState('08:00');
  const [formOutTime, setFormOutTime] = useState('-');
  const [formStatus, setFormStatus] = useState<'حاضر' | 'متأخر' | 'إجازة' | 'غائب'>('حاضر');
  const [isSaving, setIsSaving] = useState(false);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('الكل');
  const [filterStatus, setFilterStatus] = useState('الكل');
  const [filterEmployeeId, setFilterEmployeeId] = useState('الكل');
  const [showAllDates, setShowAllDates] = useState(false);

  // Excel Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [parsedRecords, setParsedRecords] = useState<Array<{
    empId: string;
    empName: string;
    empDept: string;
    date: string;
    in: string;
    out: string;
    status: 'حاضر' | 'متأخر' | 'إجازة' | 'غائب';
    warning?: string;
  }>>([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('ar-SA'));
      setDateStr(now.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper: auto-detect late or present based on chosen time
  const handleTimeChange = (time: string) => {
    setFormInTime(time);
    // Standard Shift starts at 08:30 AM
    if (time > '08:30') {
      setFormStatus('متأخر');
    } else {
      setFormStatus('حاضر');
    }
  };

  // Pre-fill Check Out if Check In already exists for this employee/date
  const handleEmployeeSelect = (empId: string) => {
    setFormEmpId(empId);
    const existing = attendance.find(a => a.empId === empId && a.date === formDate);
    if (existing) {
      setFormInTime(existing.in);
      setFormOutTime(existing.out !== '-' ? existing.out : new Date().toTimeString().slice(0, 5));
      setFormStatus(existing.status);
      setFormCheckType('both');
    } else {
      setFormInTime('08:00');
      setFormOutTime('-');
      setFormStatus('حاضر');
      setFormCheckType('in');
    }
  };

  const handleOpenNewLog = () => {
    setEditingRecordId(null);
    setFormEmpId('');
    setFormDate(selectedCalendarDate);
    setFormCheckType('in');
    setFormInTime('08:00');
    setFormOutTime('-');
    setFormStatus('حاضر');
    setShowFormModal(true);
  };

  const handleOpenEditLog = (record: typeof attendance[0]) => {
    setEditingRecordId(record.id);
    setFormEmpId(record.empId);
    setFormDate(record.date);
    setFormInTime(record.in);
    setFormOutTime(record.out);
    setFormStatus(record.status);
    
    if (record.in !== '-' && record.out !== '-') {
      setFormCheckType('both');
    } else if (record.out !== '-') {
      setFormCheckType('out');
    } else {
      setFormCheckType('in');
    }
    setShowFormModal(true);
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId) {
      alert('الرجاء تحديد الموظف أولاً من فضلك.');
      return;
    }

    setIsSaving(true);
    try {
      const recordData = {
        empId: formEmpId,
        date: formDate,
        in: formCheckType === 'out' ? '-' : formInTime,
        out: formCheckType === 'in' ? '-' : formOutTime,
        status: formStatus
      };

      await recordAttendance(recordData);
      setShowFormModal(false);
    } catch (err) {
      console.error(err);
      alert('عذراً، حدث خطأ أثناء توثيق البصمة الالكترونية.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string, empName: string) => {
    const isConfirmed = window.confirm(`هل أنت متأكد من رغبتك في حذف سجل حضور الموظف ${empName}؟ السجل سيحذف نهائياً من قاعدة البيانات السحابية.`);
    if (!isConfirmed) return;

    try {
      if (deleteAttendance) {
        await deleteAttendance(id);
      }
    } catch (err) {
      console.error(err);
      alert('فشل حذف بصمة الحضور من النظام.');
    }
  };

  const navigateToProfile = (empId: string) => {
    setSelectedEmployeeId(empId);
    setEmployeeFileTab('info');
    setCurrentView('empfiles');
  };

  // Generate compliance spreadsheet for raw auditing
  const handleExportCSV = () => {
    const filename = `سجل_الحضور_والانصراف_${selectedCalendarDate}`;
    const headers = ['الاسم الكامل', 'القسم الحالي', 'التاريخ', 'وقت الدخول', 'وقت الانصراف', 'حالة الحضور والالتزام'];
    const rows = filteredRecords.map(a => {
      const emp = employees.find(e => e.id === a.empId);
      return [
        emp ? emp.name : 'موظف مجهول',
        emp ? emp.dept : '-',
        a.date,
        a.in,
        a.out,
        a.status
      ];
    });
    
    exportToCSV(filename, headers, rows);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = 'سجل الحضور';
        
        if (!workbook.SheetNames.includes(sheetName)) {
          alert(`خطأ: لم يتم العثور على ورقة عمل باسم "${sheetName}". يرجى التأكد من اسم الورقة في ملف الإكسيل.`);
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        // Convert sheet to JSON array
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rawRows.length <= 1) {
          alert('الملف فارغ أو يحتوي على العناوين فقط.');
          return;
        }

        // Headers: Row 0
        const headers = rawRows[0].map((h: any) => String(h).trim());
        const empIdIdx = headers.findIndex((h: string) => h.includes('رقم الموظف') || h.includes('كود الموظف') || h.includes('رقم'));
        const dateIdx = headers.findIndex((h: string) => h.includes('التاريخ'));
        const timeIdx = headers.findIndex((h: string) => h.includes('الوقت'));
        const fullTimeIdx = headers.findIndex((h: string) => h.includes('التوقيت الكامل'));

        if (empIdIdx === -1) {
          alert('خطأ: لم يتم العثور على عمود "رقم الموظف" أو "كود الموظف"');
          return;
        }
        
        // We need either a specific time/date column or the full datetime column
        if (dateIdx === -1 && fullTimeIdx === -1) {
          alert('خطأ: لم يتم العثور على عمود "التاريخ"');
          return;
        }

        const logs: Array<{ excelEmpId: string; date: string; time: string }> = [];

        // Parse Excel Helper functions for Dates and Times
        const parseExcelDate = (val: any): string => {
          if (!val) return '';
          // If JS Date
          if (val instanceof Date) {
            return val.toISOString().slice(0, 10);
          }
          // If Excel serial number (days since 1900-01-01)
          if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            return date.toISOString().slice(0, 10);
          }
          // String parse (try YYYY-MM-DD or DD/MM/YYYY or YYYY/MM/DD)
          const str = String(val).trim();
          // Match YYYY-MM-DD or YYYY/MM/DD
          let match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
          if (match) {
            const y = match[1];
            const m = match[2].padStart(2, '0');
            const d = match[3].padStart(2, '0');
            return `${y}-${m}-${d}`;
          }
          // Match DD-MM-YYYY or DD/MM/YYYY
          match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
          if (match) {
            const d = match[1].padStart(2, '0');
            const m = match[2].padStart(2, '0');
            const y = match[3];
            return `${y}-${m}-${d}`;
          }
          // Fallback to native JS parser if possible
          try {
            const d = new Date(str);
            if (!isNaN(d.getTime())) {
              return d.toISOString().slice(0, 10);
            }
          } catch(e){}
          return str;
        };

        const parseExcelTime = (val: any): string => {
          if (val === undefined || val === null) return '';
          // If number (Excel represents time as a fraction of a 24h day, e.g. 0.5 = 12:00)
          if (typeof val === 'number') {
            const totalSeconds = Math.round(val * 24 * 3600);
            const hrs = Math.floor(totalSeconds / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
          }
          const str = String(val).trim();
          // Match HH:MM:SS or HH:MM
          let match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
          if (match) {
            const h = match[1].padStart(2, '0');
            const m = match[2];
            return `${h}:${m}`;
          }
          // Fallback to match AM/PM (e.g. 05:08:04 PM)
          match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/);
          if (match) {
            let h = parseInt(match[1]);
            const m = match[2];
            const ampm = match[4]?.toUpperCase();
            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return `${String(h).padStart(2, '0')}:${m}`;
          }
          return str;
        };

        // Read all rows starting from row 1 (row 0 is header)
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          const rawEmpId = row[empIdIdx];
          if (rawEmpId === undefined || rawEmpId === null || String(rawEmpId).trim() === '') continue;

          let dateStr = '';
          let timeStr = '';

          // If we have fullTimeIdx, we can extract both date and time from it
          if (fullTimeIdx !== -1 && row[fullTimeIdx]) {
            const rawFullTime = row[fullTimeIdx];
            if (rawFullTime instanceof Date) {
              dateStr = rawFullTime.toISOString().slice(0, 10);
              timeStr = parseExcelTime(rawFullTime.getHours() / 24 + rawFullTime.getMinutes() / 1440);
            } else {
              const strVal = String(rawFullTime).trim();
              const parts = strVal.split(/\s+/);
              if (parts.length >= 2) {
                dateStr = parseExcelDate(parts[0]);
                timeStr = parseExcelTime(parts[1]);
              } else {
                dateStr = parseExcelDate(rawFullTime);
                timeStr = parseExcelTime(rawFullTime);
              }
            }
          }

          // If separate date/time exist, they override or fallback
          if (!dateStr && dateIdx !== -1 && row[dateIdx]) {
            dateStr = parseExcelDate(row[dateIdx]);
          }
          if (!timeStr && timeIdx !== -1 && row[timeIdx]) {
            timeStr = parseExcelTime(row[timeIdx]);
          }

          if (!dateStr || !timeStr) continue;

          logs.push({
            excelEmpId: String(rawEmpId).trim(),
            date: dateStr,
            time: timeStr
          });
        }

        if (logs.length === 0) {
          alert('لم يتم العثور على أي حركات حضور مسجلة بشكل صحيح في الملف.');
          return;
        }

        // Group logs by employee ID and date to find earliest (in) and latest (out)
        const grouped: { [key: string]: { [date: string]: string[] } } = {};
        logs.forEach(log => {
          if (!grouped[log.excelEmpId]) {
            grouped[log.excelEmpId] = {};
          }
          if (!grouped[log.excelEmpId][log.date]) {
            grouped[log.excelEmpId][log.date] = [];
          }
          grouped[log.excelEmpId][log.date].push(log.time);
        });

        const tempParsedRecords: typeof parsedRecords = [];

        Object.keys(grouped).forEach(excelEmpId => {
          // Attempt to match employee in database
          const matchedEmployee = employees.find(e => {
            const cleanDbId = e.id.toLowerCase().replace(/^emp_/, '').trim();
            const cleanExcelId = excelEmpId.toLowerCase().replace(/^emp_/, '').trim();
            return cleanDbId === cleanExcelId;
          });

          Object.keys(grouped[excelEmpId]).forEach(date => {
            const times = grouped[excelEmpId][date].sort();
            let checkIn = '-';
            let checkOut = '-';

            if (times.length === 1) {
              const singleTime = times[0];
              // If only one swipe:
              // before 12:00 PM is check-in, after 12:00 PM is check-out
              if (singleTime < '12:00') {
                checkIn = singleTime;
              } else {
                checkOut = singleTime;
              }
            } else if (times.length > 1) {
              checkIn = times[0];
              checkOut = times[times.length - 1];
            }

            // Determine status
            let status: 'حاضر' | 'متأخر' | 'إجازة' | 'غائب' = 'حاضر';
            if (checkIn !== '-' && checkIn > '08:30') {
              status = 'متأخر';
            }

            tempParsedRecords.push({
              empId: matchedEmployee ? matchedEmployee.id : `UNKNOWN_${excelEmpId}`,
              empName: matchedEmployee ? matchedEmployee.name : `موظف غير معرّف (${excelEmpId})`,
              empDept: matchedEmployee ? matchedEmployee.dept : '—',
              date,
              in: checkIn,
              out: checkOut,
              status,
              warning: matchedEmployee ? undefined : `رقم الموظف (${excelEmpId}) غير مسجل بالنظام`
            });
          });
        });

        // Sort parsed records by date desc, then employee name
        tempParsedRecords.sort((a, b) => b.date.localeCompare(a.date) || a.empName.localeCompare(b.empName));

        setParsedRecords(tempParsedRecords);
        setShowImportModal(true);
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء قراءة ملف الإكسيل. يرجى التأكد من تنسيق الملف وصيغته.');
      }
    };

    reader.readAsBinaryString(file);
    // Reset file input value so same file can be uploaded again
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    const validRecords = parsedRecords.filter(r => !r.warning);
    if (validRecords.length === 0) {
      alert('لا توجد سجلات صالحة للاستيراد.');
      return;
    }

    setIsImporting(true);
    try {
      if (recordBulkAttendance) {
        const recordsToSave = validRecords.map(r => ({
          empId: r.empId,
          date: r.date,
          in: r.in,
          out: r.out,
          status: r.status
        }));
        await recordBulkAttendance(recordsToSave);
        setShowImportModal(false);
        alert(`تم بنجاح استيراد وتحديث عدد (${validRecords.length}) سجل حضور موحد في قاعدة البيانات السحابية.`);
      }
    } catch (err) {
      console.error(err);
      alert('عذراً، حدث خطأ أثناء حفظ السجلات المجمعة في السحابة.');
    } finally {
      setIsImporting(false);
    }
  };

  // Calculations based on filters and showAllDates toggle
  const filteredRecords = attendance.filter(a => {
    const matchDate = showAllDates || a.date === selectedCalendarDate;
    const emp = employees.find(e => e.id === a.empId);
    const matchSearch = emp ? emp.name.includes(searchTerm) || emp.job.includes(searchTerm) : false;
    const matchDept = filterDepartment === 'الكل' || (emp && emp.dept === filterDepartment);
    const matchStatus = filterStatus === 'الكل' || a.status === filterStatus;
    const matchEmployee = filterEmployeeId === 'الكل' || a.empId === filterEmployeeId;
    
    return matchDate && matchSearch && matchDept && matchStatus && matchEmployee;
  });

  // Daily records strictly for metrics cards of the selected calendar date
  const dailyRecords = attendance.filter(a => a.date === selectedCalendarDate);

  // Calculate high-fidelity Saudi performance & presence metrics for the active calendar date
  const activeEmployees = employees.filter(e => e.status !== 'موقوف');
  const totalExcusedLeaveToday = leaves.filter(l => 
    l.status === 'موافق عليها' && 
    selectedCalendarDate >= l.from && 
    selectedCalendarDate <= l.to
  );

  const presentTodayCount = dailyRecords.filter(r => r.status === 'حاضر').length;
  const lateTodayCount = dailyRecords.filter(r => r.status === 'متأخر').length;
  const leaveTodayCount = dailyRecords.filter(r => r.status === 'إجازة').length;
  const loggedAbsentTodayCount = dailyRecords.filter(r => r.status === 'غائب').length;

  // Unaccounted employees are those on active duty but have no record today and are not on leave
  const unaccountedActiveEmployees = activeEmployees.filter(emp => {
    const hasLog = attendance.some(a => a.empId === emp.id && a.date === selectedCalendarDate);
    const isOnLeave = totalExcusedLeaveToday.some(l => l.empId === emp.id);
    return !hasLog && !isOnLeave;
  });

  const totalRegisteredCount = activeEmployees.length;
  const attendanceRatio = totalRegisteredCount 
    ? Math.round(((presentTodayCount + lateTodayCount) / totalRegisteredCount) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-slideup">
      {/* Clock & Real-time Integration Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row items-center justify-between shadow-sm relative overflow-hidden">
        {/* Background Radial Glow */}
        <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <div className="space-y-1 text-right">
            <div className="text-3xl sm:text-4xl font-extrabold text-gold tracking-tight font-mono">
              {timeStr || '٠٨:٠٠:٠٠ م'}
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {dateStr || 'جاري ربط التوقيت...'}
            </div>
          </div>
        </div>

        {/* Live Calendar Navigation */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 w-full lg:w-auto items-stretch lg:items-center">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const prev = new Date(selectedCalendarDate);
                prev.setDate(prev.getDate() - 1);
                setSelectedCalendarDate(prev.toISOString().slice(0, 10));
              }}
              disabled={showAllDates}
              className={`px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer text-xs font-bold transition flex items-center justify-center select-none ${showAllDates ? 'opacity-40 cursor-not-allowed' : ''}`}
              title="اليوم السابق"
            >
              ◀
            </button>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2 rounded-lg">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">تاريخ العرض:</span>
              <input 
                type="date" 
                value={selectedCalendarDate} 
                disabled={showAllDates}
                onChange={(e) => setSelectedCalendarDate(e.target.value)}
                className={`bg-transparent border-none text-xs font-bold text-slate-800 outline-none cursor-pointer ${showAllDates ? 'opacity-40 cursor-not-allowed' : ''}`}
              />
            </div>

            <button
              onClick={() => {
                const next = new Date(selectedCalendarDate);
                next.setDate(next.getDate() + 1);
                setSelectedCalendarDate(next.toISOString().slice(0, 10));
              }}
              disabled={showAllDates}
              className={`px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer text-xs font-bold transition flex items-center justify-center select-none ${showAllDates ? 'opacity-40 cursor-not-allowed' : ''}`}
              title="اليوم التالي"
            >
              ▶
            </button>
          </div>

          <button
            onClick={handleOpenNewLog}
            className="bg-gold text-slate-900 border-none px-5 py-2.5 rounded-lg cursor-pointer text-xs font-bold shadow-md hover:bg-gold-light hover:-translate-y-0.5 transition-all text-center flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + تسجيل بصمة يدوية
          </button>
        </div>
      </div>

      {/* 📊 High-Polish Dynamic Live Stat Metrics Card Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-bold text-slate-400">انضباط الحضور اليومي</p>
            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">{attendanceRatio}%</span>
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold font-sans text-slate-800">
              {presentTodayCount + lateTodayCount}
            </span>
            <span className="text-xs text-slate-500">من {totalRegisteredCount} موظف</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-gold h-full rounded-full" style={{ width: `${attendanceRatio}%` }}></div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-bold text-emerald-600">حاضر بالوقت</p>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold font-sans text-emerald-700">{presentTodayCount}</span>
            <span className="text-[10px] text-emerald-500 font-bold">بصمة مبكرة</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-bold text-amber-600">متأخرين</p>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold font-sans text-amber-700">{lateTodayCount}</span>
            <span className="text-[10px] text-amber-500 font-medium">بعد 08:30 ص</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-bold text-blue-600">إجازات اليوم المعتمدة</p>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold font-sans text-blue-700">
              {leaveTodayCount || totalExcusedLeaveToday.length}
            </span>
            <button 
              onClick={() => setCurrentView('leaves')}
              className="text-[10px] text-indigo-500 hover:underline bg-transparent border-none cursor-pointer"
            >
              عرض الإجازات ↗
            </button>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-bold text-rose-500">غياب غير مرخص</p>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold font-sans text-rose-700">
              {loggedAbsentTodayCount + unaccountedActiveEmployees.length}
            </span>
            <span className="text-[9px] bg-rose-50 text-rose-600 px-1 py-0.5 rounded font-bold">خصم آلي</span>
          </div>
        </div>
      </div>

      {/* Search & Dynamic Filter Control Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 ابحث باسم الموظف أو وظيفته..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs text-slate-700 focus:border-gold outline-none w-56 bg-slate-50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          <select
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:border-gold outline-none bg-slate-50"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            <option value="الكل">كل الأقسام</option>
            <option value="تقنية المعلومات">تقنية المعلومات</option>
            <option value="الموارد البشرية">الموارد البشرية</option>
            <option value="المالية">المالية</option>
            <option value="التسويق">التسويق</option>
            <option value="المبيعات">المبيعات</option>
            <option value="العمليات">العمليات</option>
          </select>

          <select
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:border-gold outline-none bg-slate-50"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="الكل">كل الحالات</option>
            <option value="حاضر">حاضر مبكراً</option>
            <option value="متأخر">متأخر</option>
            <option value="إجازة">في إجازة</option>
            <option value="غائب">غائب</option>
          </select>

          <select
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:border-gold outline-none bg-slate-50 max-w-[180px]"
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
          >
            <option value="الكل">كل الموظفين</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAllDates}
              onChange={(e) => setShowAllDates(e.target.checked)}
              className="accent-gold cursor-pointer"
            />
            <span>عرض كل التواريخ</span>
          </label>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <label
            className="flex-1 md:flex-none border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg cursor-pointer text-xs font-bold transition flex items-center justify-center gap-1.5 select-none"
            title="رفع ملف اكسل حضور وانصراف الموظفين"
          >
            <Download className="w-3.5 h-3.5 rotate-180 text-slate-500" />
            استيراد سجل الحضور (Excel)
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleExcelUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleExportCSV}
            className="flex-1 md:flex-none border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg cursor-pointer text-xs font-bold transition flex items-center justify-center gap-1.5"
            title="تصدير كشف حضور اليوم لملف اكسل متوافق"
          >
            <Download className="w-3.5 h-3.5" />
            تصدير تقرير إداري عريض
          </button>
        </div>
      </div>

      {/* Unaccounted / Warning Banner for Saudi HR compliance */}
      {unaccountedActiveEmployees.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-250 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">تنبيه حماية الأجور والامتثال</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                توجد ({unaccountedActiveEmployees.length}) كوادر نشطة لم يسجل حضورها أو انصرافها أو غيابها لهذا اليوم في النظام السحابي حتى الآن.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {unaccountedActiveEmployees.slice(0, 3).map(emp => (
              <button
                key={emp.id}
                onClick={() => {
                  setFormEmpId(emp.id);
                  setFormDate(selectedCalendarDate);
                  setFormCheckType('both');
                  setFormInTime('08:00');
                  setFormOutTime('17:00');
                  setFormStatus('حاضر');
                  setShowFormModal(true);
                }}
                className="text-[10px] font-bold text-slate-700 bg-white hover:bg-gold-light hover:text-slate-900 border border-slate-200 rounded px-2.5 py-1 transition cursor-pointer"
              >
                + قيد الحضور: {emp.name}
              </button>
            ))}
            {unaccountedActiveEmployees.length > 3 && (
              <span className="text-[10px] text-slate-400 self-center font-bold font-sans">+{unaccountedActiveEmployees.length - 3} آخرين</span>
            )}
          </div>
        </div>
      )}

      {/* Main Table: Attendance Records */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
          <div>
            <h3 className="text-sm font-bold text-slate-800">بيانات البصمات الإلكترونية المسجلة ({filteredRecords.length})</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">تفاصيل الحضور والانصراف المستخرجة لحظياً للتاريخ المحدد: {selectedCalendarDate}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-emerald-600 font-sans">قاعدة البيانات متصلة</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[11px] bg-slate-50/50 uppercase tracking-wider">
                <th className="p-3 text-right">الموظف</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">القسم المعتمد</th>
                <th className="p-3">وقت توقيع الحضور</th>
                <th className="p-3">وقت توقيع الانصراف</th>
                <th className="p-3">ساعات العمل الفعلية</th>
                <th className="p-3">الحالة والالتزام</th>
                <th className="p-3 text-center">إجراءات التدقيق والربط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    لا تتوفر في قاعدة البيانات أي بصمات مبرمة متطابقة لهذه التصفية. <br/>
                    <span className="text-xs text-slate-400 font-normal">اضغط على زر (تسجيل بصمة يدوية) للبدء في توثيق الحركات اليومية.</span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((a) => {
                  const emp = employees.find(e => e.id === a.empId);
                  
                  // Handle conditional rendering status style
                  const statusClass = 
                    a.status === 'حاضر' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : a.status === 'متأخر' 
                      ? 'bg-amber-50 text-amber-600 border-amber-200' 
                      : a.status === 'إجازة'
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'bg-rose-50 text-rose-600 border-rose-200';

                  // Dynamic calculation of actual shift hours
                  const calculateHours = (inT: string, outT: string) => {
                    if (inT === '-' || outT === '-' || !inT || !outT) return '—';
                    const [inH, inM] = inT.split(':').map(Number);
                    const [outH, outM] = outT.split(':').map(Number);
                    if (isNaN(inH) || isNaN(outH)) return '—';
                    const totalInMinutes = inH * 60 + inM;
                    const totalOutMinutes = outH * 60 + outM;
                    const diff = totalOutMinutes - totalInMinutes;
                    if (diff <= 0) return '0 س';
                    const hrs = Math.floor(diff / 60);
                    const mins = diff % 60;
                    return `${hrs} ${hrs >= 3 && hrs <= 10 ? 'ساعات' : 'ساعة'}${mins > 0 ? ` و ${mins} دقيقة` : ''}`;
                  };

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      {/* Name Card */}
                      <td className="p-3 font-semibold text-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-dim to-gold flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {emp ? emp.name[0] : 'م'}
                          </div>
                          <div>
                            <span className="text-slate-800 text-xs font-bold block">{emp ? emp.name : 'موظف مجهول'}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{emp ? emp.job : 'مسمّى وظيفي غير معرّف'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-3 text-slate-600 font-mono text-xs font-semibold">
                        {a.date}
                      </td>

                      {/* Department */}
                      <td className="p-3 text-slate-500 text-xs font-semibold">
                        {emp ? emp.dept : '—'}
                      </td>

                      {/* In Time */}
                      <td className="p-3 font-mono font-bold text-slate-700 text-xs">
                        {a.in === '-' ? (
                          <span className="text-slate-350">—</span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100">{a.in}</span>
                        )}
                      </td>

                      {/* Out Time */}
                      <td className="p-3 font-mono font-bold text-slate-700 text-xs">
                        {a.out === '-' ? (
                          <span className="text-slate-350">—</span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100">{a.out}</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="p-3 text-slate-500 font-medium text-xs">
                        {calculateHours(a.in, a.out)}
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={`inline-block border px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}`}>
                          {a.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleOpenEditLog(a)}
                            className="p-1.5 text-xs font-bold text-slate-500 bg-slate-150 rounded hover:bg-gold hover:text-slate-900 transition-colors cursor-pointer border border-slate-200 hover:border-gold shadow-xs"
                            title="تعديل البصمات والأوقات يدوياً"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => emp && handleDeleteRecord(a.id, emp.name)}
                            className="p-1.5 text-xs font-bold text-rose-500 bg-rose-50 rounded hover:bg-rose-500 hover:text-white transition-colors cursor-pointer border border-rose-200"
                            title="حذف هذا السجل نهائياً من قاعدة البيانات"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => emp && navigateToProfile(emp.id)}
                            className="px-2.5 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer border-none transition"
                            title="الانتقال إلى الملف الوظيفي والملفات الإلكترونية"
                          >
                            📁 عرض الملف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ⏱️ Dialog Modal for Adding and Editing Attendance Logs */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto animate-slideup">
            <h3 className="text-base font-bold text-gold mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {editingRecordId ? 'تعديل وتدقيق البصمة السحابية' : 'تسجيل بصمة جديدة في لوائح حماية الأجور'}
            </h3>
            
            <form onSubmit={handleSaveAttendance} className="space-y-4 font-sans text-right">
              {/* Employee Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">اسم الموظف المكلّف *</label>
                <select
                  required
                  disabled={!!editingRecordId}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-800"
                  value={formEmpId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                >
                  <option value="">-- اختر من الكوادر البشرية --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.job} - {e.dept})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">تاريخ البصمة والمطابقة *</label>
                <input
                  type="date"
                  required
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 text-slate-800"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>

              {/* Check Type Selector */}
              <div className="flex flex-col gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                <label className="text-xs font-bold text-slate-500 mb-1 block">تحديد الإجراء المطلوب:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormCheckType('in');
                      setFormOutTime('-');
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-bold border cursor-pointer text-center ${formCheckType === 'in' ? 'bg-gold border-gold text-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                  >
                    حضور فقط
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCheckType('out');
                      setFormInTime('-');
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-bold border cursor-pointer text-center ${formCheckType === 'out' ? 'bg-gold border-gold text-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                  >
                    انصراف فقط
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCheckType('both');
                      if (formInTime === '-') setFormInTime('08:00');
                      if (formOutTime === '-') setFormOutTime('17:00');
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-bold border cursor-pointer text-center ${formCheckType === 'both' ? 'bg-gold border-gold text-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                  >
                    حضور وانصراف
                  </button>
                </div>
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-2 gap-4">
                {formCheckType !== 'out' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">ساعة الحضور (دخل)</label>
                    <input
                      type="time"
                      required
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 text-slate-800"
                      value={formInTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                    />
                  </div>
                )}

                {formCheckType !== 'in' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">ساعة الانصراف (خرج)</label>
                    <input
                      type="time"
                      required
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 text-slate-800"
                      value={formOutTime}
                      onChange={(e) => setFormOutTime(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Attendance Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">تصنيف الحضور والامتثال</label>
                <select
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 text-slate-800"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                >
                  <option value="حاضر">حاضر (في موعد الوردية)</option>
                  <option value="متأخر">متأخر (تنبيه خصم أو تأخر)</option>
                  <option value="إجازة">إجازة رسمية معتمدة</option>
                  <option value="غائب">غائب (غياب بدون عذر)</option>
                </select>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-0.5">
                  ملاحظة: تلتزم المنشأة بنموذج حماية الأجور (WPS) في تسجيل وتبرير الغيابات والخصومات للامتثال الإلكتروني لمنصة قوى وقواعد وزارة الموارد البشرية.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowFormModal(false)}
                  className="bg-transparent text-slate-400 border border-slate-200 px-4 py-2 rounded-lg cursor-pointer text-xs font-bold hover:text-slate-600 hover:bg-slate-50 disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  إلغاء التعديل
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gold text-slate-900 border-none px-5 py-2 rounded-lg cursor-pointer text-xs font-bold hover:bg-gold-light flex items-center justify-center gap-2 min-w-[130px] disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                      <span>جاري حفظ البصمة...</span>
                    </>
                  ) : (
                    '💾 تأكيد البصمة في السحابة'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📥 Excel Sheet Data Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slideup text-right">
            <h3 className="text-base font-bold text-gold mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Download className="w-5 h-5 rotate-180" />
              <span>مراجعة وتدقيق حركات الحضور المستخرجة من شيت الإكسيل</span>
            </h3>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              يرجى مراجعة البيانات المستخرجة أدناه والتأكد من مطابقة كود الموظف وتوقيت الحضور والانصراف مع سجلات الموظفين الفعلية قبل الحفظ في السحابة. سيتم تجاهل الأسطر التي تحتوي على أخطاء أو تحذيرات.
            </p>

            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[40vh] overflow-y-auto mb-5">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold bg-slate-50 uppercase tracking-wider">
                    <th className="p-3 text-right">الموظف</th>
                    <th className="p-3">القسم</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">وقت الحضور</th>
                    <th className="p-3">وقت الانصراف</th>
                    <th className="p-3">الحالة والالتزام</th>
                    <th className="p-3 text-center">ملاحظات ومطابقة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRecords.map((r, idx) => {
                    const statusClass = 
                      r.status === 'حاضر' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-250' 
                        : 'bg-amber-50 text-amber-600 border-amber-250';
                    return (
                      <tr key={idx} className={r.warning ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}>
                        <td className="p-3 font-semibold text-slate-700">
                          {r.warning ? (
                            <span className="text-rose-600 font-bold">{r.empName}</span>
                          ) : (
                            <span className="text-slate-800">{r.empName}</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500">{r.empDept}</td>
                        <td className="p-3 font-mono font-medium text-slate-600">{r.date}</td>
                        <td className="p-3 font-mono">
                          {r.in === '-' ? (
                            <span className="text-slate-300">—</span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-bold">{r.in}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono">
                          {r.out === '-' ? (
                            <span className="text-slate-300">—</span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 font-bold">{r.out}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block border px-2 py-0.5 rounded text-[10px] font-bold ${statusClass}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {r.warning ? (
                            <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              ⚠️ {r.warning}
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              ✓ تم المطابقة بنجاح
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Statistics in preview */}
            <div className="bg-slate-50 border border-slate-150 rounded-lg p-3.5 mb-5 flex justify-between text-xs text-slate-600 font-semibold">
              <div>
                <span>إجمالي السجلات المستخرجة: </span>
                <span className="text-slate-800 font-sans font-bold">{parsedRecords.length}</span>
              </div>
              <div>
                <span className="text-emerald-600">سجلات صالحة للحفظ: </span>
                <span className="text-emerald-700 font-sans font-bold">{parsedRecords.filter(r => !r.warning).length}</span>
              </div>
              <div>
                <span className="text-rose-500">سجلات بها تحذيرات (ستتجاهل): </span>
                <span className="text-rose-700 font-sans font-bold">{parsedRecords.filter(r => !!r.warning).length}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={isImporting}
                onClick={() => setShowImportModal(false)}
                className="bg-transparent text-slate-400 border border-slate-200 px-4 py-2 rounded-lg cursor-pointer text-xs font-bold hover:text-slate-600 hover:bg-slate-50 disabled:opacity-55"
              >
                إلغاء واستبعاد
              </button>
              <button
                type="button"
                disabled={isImporting || parsedRecords.filter(r => !r.warning).length === 0}
                onClick={handleConfirmImport}
                className="bg-gold text-slate-900 border-none px-5 py-2 rounded-lg cursor-pointer text-xs font-bold hover:bg-gold-light flex items-center justify-center gap-2 min-w-[150px] disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري حفظ السجلات...</span>
                  </>
                ) : (
                  `💾 اعتماد وحفظ (${parsedRecords.filter(r => !r.warning).length}) سجل`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
