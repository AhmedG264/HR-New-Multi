/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  Employee,
  Leave,
  Attendance,
  RecruitmentJob,
  Candidate,
  PerformanceReview,
  TrainingCourse,
  Expense,
  Trip,
  HealthInsurance,
  EmployeeContract,
  EmployeeProfession,
  EmployeeDeduction,
  CompanyDoc,
  Task,
  DeductionType,
  RBACUser,
  EmployeeAsset,
  AssetHistory
} from '../types';
import {
  seedDatabase,
  getCollectionData,

} from '../services/db';
import { auth } from '../firebase';
import { SeedStatus } from './HRContext.types';

interface UseHREntityDataArgs {
  currentUser: RBACUser | null;
  currentView: string;
  firebaseAuthReady: boolean;
  /** Delegates loading of RBAC-owned collections (rbac-users/rbac-roles views) to useHRAuth. */
  loadRbacViewData: (viewName: string) => Promise<void>;
}

/**
 * Owns all business-entity collections (employees, leaves, attendance, ...),
 * their lazy per-view loading/caching, and the database seeding workflow.
 * This hook does not know about authentication or permission rules beyond
 * treating `currentUser` as a gate for whether it is safe to query Firestore.
 */
export function useHREntityData({ currentUser, currentView, firebaseAuthReady, loadRbacViewData }: UseHREntityDataArgs) {
  const [loading, setLoading] = useState(true);
  const [seedStatus, setSeedStatus] = useState<SeedStatus>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);

  // Core lists
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [jobs, setJobs] = useState<RecruitmentJob[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [trainings, setTrainings] = useState<TrainingCourse[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [health, setHealth] = useState<HealthInsurance[]>([]);
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [professions, setProfessions] = useState<EmployeeProfession[]>([]);
  const [deductions, setDeductions] = useState<EmployeeDeduction[]>([]);
  const [docs, setDocs] = useState<CompanyDoc[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [assets, setAssets] = useState<EmployeeAsset[]>([]);
  const [assetHistory, setAssetHistory] = useState<AssetHistory[]>([]);

  // Lazy loading state for on-demand collection fetching
  const [loadedViews, setLoadedViews] = useState<Record<string, boolean>>({});

  const safeLoad = async <T,>(collName: string, setter: (data: T[]) => void, fallback: T[] = []) => {
    // If the Firebase session is not signed in yet, use the local fallbacks immediately to prevent public permission/security errors
    const isLocal = localStorage.getItem('sahaba_session_type') === 'local';
    if (!auth.currentUser && !isLocal) {
      setter(fallback);
      return fallback;
    }
    try {
      const data = await getCollectionData<T>(collName);
      if (data && data.length > 0) {
        setter(data);
        return data;
      } else if (fallback && fallback.length > 0) {
        console.warn(`Collection ${collName} is empty in database, using system fallbacks.`);
        setter(fallback);
        return fallback;
      }
      return [];
    } catch (error: any) {
      console.error(`Error loading database collection ${collName}: `, error);
      if (fallback && fallback.length > 0) {
        setter(fallback);
        return fallback;
      }
      return [];
    }
  };

  const loadViewData = async (viewName: string, forceRefresh = false) => {
    if (!currentUser) return; // Prevent querying Firestore before auth context is established

    // Check if stayed on-page and cached already
    if (!forceRefresh && loadedViews[viewName]) {
      console.log(`[OPT ENGINE] Cache hit for view: ${viewName}. Bypassing duplicate Firebase request.`);
      return;
    }

    try {
      setLoading(true);
      setLoadError(null);

      // Cache invalidation: merge this view into the cache map rather than
      // replacing it, so previously-loaded views stay cached too.
      setLoadedViews(prev => ({ ...prev, [viewName]: true }));
      console.log(`[OPT ENGINE] Fetching database collections for view: ${viewName} (forceRefresh=${forceRefresh})`);

      switch (viewName) {
        case 'dashboard':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<Leave>('leaves', setLeaves, []),
            safeLoad<Task>('tasks', setTasks, []),
            safeLoad<RecruitmentJob>('jobs', setJobs, []),
            safeLoad<Trip>('trips', setTrips, []),
            safeLoad<Expense>('expenses', setExpenses, []),
            safeLoad<EmployeeContract>('contracts', setContracts, []),
            safeLoad<CompanyDoc>('docs', setDocs, []),
            safeLoad<HealthInsurance>('health', setHealth, []),
            safeLoad<Attendance>('attendance', setAttendance, []),
            safeLoad<TrainingCourse>('trainings', setTrainings, []),
            safeLoad<EmployeeAsset>('assets', setAssets, []),
            safeLoad<AssetHistory>('assetHistory', setAssetHistory, [])
          ]);
          break;
        case 'employees':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<EmployeeContract>('contracts', setContracts, []),
            safeLoad<EmployeeProfession>('professions', setProfessions, []),
            safeLoad<EmployeeDeduction>('deductions', setDeductions, []),
            safeLoad<EmployeeAsset>('assets', setAssets, []),
            safeLoad<AssetHistory>('assetHistory', setAssetHistory, [])
          ]);
          break;
        case 'ess':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<Leave>('leaves', setLeaves, []),
            safeLoad<Expense>('expenses', setExpenses, []),
            safeLoad<Trip>('trips', setTrips, []),
            safeLoad<EmployeeContract>('contracts', setContracts, []),
            safeLoad<EmployeeAsset>('assets', setAssets, []),
            safeLoad<AssetHistory>('assetHistory', setAssetHistory, [])
          ]);
          break;
        case 'attendance':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<Attendance>('attendance', setAttendance, [])
          ]);
          break;
        case 'leaves':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<Leave>('leaves', setLeaves, [])
          ]);
          break;
        case 'payroll':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<EmployeeContract>('contracts', setContracts, []),
            safeLoad<EmployeeDeduction>('deductions', setDeductions, []),
            safeLoad<DeductionType>('deductionTypes', setDeductionTypes, []),
            safeLoad<Leave>('leaves', setLeaves, []),
            safeLoad<Attendance>('attendance', setAttendance, [])
          ]);
          break;
        case 'compliance':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<EmployeeContract>('contracts', setContracts, []),
            safeLoad<Leave>('leaves', setLeaves, []),
            safeLoad<Attendance>('attendance', setAttendance, [])
          ]);
          break;
        case 'deductions':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<EmployeeDeduction>('deductions', setDeductions, []),
            safeLoad<DeductionType>('deductionTypes', setDeductionTypes, [])
          ]);
          break;
        case 'recruit':
          await Promise.all([
            safeLoad<RecruitmentJob>('jobs', setJobs, []),
            safeLoad<Candidate>('candidates', setCandidates, [])
          ]);
          break;
        case 'perf':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<PerformanceReview>('reviews', setReviews, [])
          ]);
          break;
        case 'training':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<TrainingCourse>('trainings', setTrainings, [])
          ]);
          break;
        case 'expenses':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<Expense>('expenses', setExpenses, [])
          ]);
          break;
        case 'trips':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<Trip>('trips', setTrips, [])
          ]);
          break;
        case 'empfiles':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<EmployeeContract>('contracts', setContracts, []),
            safeLoad<EmployeeProfession>('professions', setProfessions, []),
            safeLoad<CompanyDoc>('docs', setDocs, [])
          ]);
          break;
        case 'docs':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<CompanyDoc>('docs', setDocs, [])
          ]);
          break;
        case 'tasks':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<Task>('tasks', setTasks, [])
          ]);
          break;
        case 'health':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<HealthInsurance>('health', setHealth, [])
          ]);
          break;
        case 'reports':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<Leave>('leaves', setLeaves, []),
            safeLoad<Attendance>('attendance', setAttendance, []),
            safeLoad<Expense>('expenses', setExpenses, []),
            safeLoad<Trip>('trips', setTrips, []),
            safeLoad<EmployeeDeduction>('deductions', setDeductions, [])
          ]);
          break;
        case 'all-assets':
          await Promise.all([
            safeLoad<Employee>('employees', setEmployees, []),
            safeLoad<EmployeeAsset>('assets', setAssets, []),
            safeLoad<AssetHistory>('assetHistory', setAssetHistory, [])
          ]);
          break;
        case 'rbac-users':
        case 'rbac-roles':
          // RBAC state (rbacUsers/rbacRoles/rbacPermissions) is owned by
          // useHRAuth, so delegate the lazy-load for these views to it.
          await loadRbacViewData(viewName);
          break;
        default:
          break;
      }
    } catch (e) {
      console.error(`Failed to lazily load database collections for view ${viewName}:`, e);
      setLoadError("فشل تحميل البيانات من السيرفر، تم تفعيل طور العمل المحلي الاحتياطي");
      // Allow a retry the next time this view is visited, since this load attempt failed
      setLoadedViews(prev => {
        const next = { ...prev };
        delete next[viewName];
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    // Only load the current active view's data to satisfy the optimization/request-reduction constraint
    if (currentUser) {
      await loadViewData(currentView, true);
    } else {
      // If no session, set up default system fallbacks in local memory
      setEmployees([]);
      setLeaves([]);
      setAttendance([]);
      setJobs([]);
      setCandidates([]);
      setReviews([]);
      setTrainings([]);
      setExpenses([]);
      setTrips([]);
      setHealth([]);
      setContracts([]);
      setProfessions([]);
      setDeductions([]);
      setDocs([]);
      setTasks([]);
      setDeductionTypes([]);
      setAssets([]);
      setAssetHistory([]);
    }
  };

  const triggerSeeding = async () => {
    setSeedStatus('seeding');
    try {
      await seedDatabase();
      await loadAllData();
      setSeedStatus('done');
    } catch (e) {
      console.error(e);
      setSeedStatus('idle');
    }
  };

  const resetLoadedViews = () => {
    // Prevent the next user session from seeing cached data from this session
    setLoadedViews({});
  };

  // Dynamically load collections on view change (lazy loading implementation)
  useEffect(() => {
    if (!currentUser) return;

    // A restored localStorage session can be ready before Firebase's own auth
    // check finishes. Fetching too early makes safeLoad() fall back to mock data
    // and cache it, so the real data never loads until a forced refresh.
    // Local-fallback sessions never touch Firebase auth, so they skip the wait.
    const isLocalSession = localStorage.getItem('sahaba_session_type') === 'local';
    if (!firebaseAuthReady && !isLocalSession) return;

    loadViewData(currentView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, currentUser, firebaseAuthReady]);

  return {
    loading,
    loadError,
    seedStatus,
    setSeedStatus,

    employees,
    leaves,
    attendance,
    jobs,
    candidates,
    reviews,
    trainings,
    expenses,
    trips,
    health,
    contracts,
    professions,
    deductions,
    docs,
    tasks,
    deductionTypes,
    assets,
    assetHistory,

    loadViewData,
    loadAllData,
    triggerSeeding,
    resetLoadedViews
  };
}
