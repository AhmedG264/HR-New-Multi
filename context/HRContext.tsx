/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useRef } from 'react';
import { HRContextProps, SeedStatus } from './HRContext.types';
import { useHREntityData } from './useHREntityData';
import { useHRAuth } from './useHRAuth';
import { useHRMutators } from './useHRMutators';

const HRContext = createContext<HRContextProps | undefined>(undefined);

export const HRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // UI navigation/selection state stays here — it's simple and doesn't belong
  // to data-loading, auth, or mutation concerns.
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeFileTab, setEmployeeFileTab] = useState('info');

  // useHRAuth needs loadAllData/setSeedStatus/resetLoadedViews (owned by
  // useHREntityData), while useHREntityData needs currentUser/firebaseAuthReady
  // (owned by useHRAuth). Refs break this circular dependency: the callbacks
  // passed into useHRAuth stay referentially stable, but always call through
  // to the latest entity-data functions, which are (re)assigned every render
  // before anything can invoke them.
  const loadAllDataRef = useRef<() => Promise<void>>(async () => { });
  const setSeedStatusRef = useRef<(status: SeedStatus) => void>(() => { });
  const resetLoadedViewsRef = useRef<() => void>(() => { });

  const auth = useHRAuth({
    loadAllData: () => loadAllDataRef.current(),
    setSeedStatus: (status) => setSeedStatusRef.current(status),
    resetLoadedViews: () => resetLoadedViewsRef.current(),
    goToDashboard: () => setCurrentView('dashboard')
  });

  const data = useHREntityData({
    currentUser: auth.currentUser,
    currentView,
    firebaseAuthReady: auth.firebaseAuthReady,
    loadRbacViewData: auth.loadRbacViewData
  });

  loadAllDataRef.current = data.loadAllData;
  setSeedStatusRef.current = data.setSeedStatus;
  resetLoadedViewsRef.current = data.resetLoadedViews;

  const mutators = useHRMutators({
    hasPermission: auth.hasPermission,
    currentUser: auth.currentUser,
    loadAllData: data.loadAllData,
    employees: data.employees,
    leaves: data.leaves,
    attendance: data.attendance,
    assets: data.assets
  });

  return (
    <HRContext.Provider
      value={{
        loading: data.loading,
        loadError: data.loadError,
        firebaseAuthReady: auth.firebaseAuthReady,
        currentView,
        setCurrentView,
        employees: data.employees,
        leaves: data.leaves,
        attendance: data.attendance,
        jobs: data.jobs,
        candidates: data.candidates,
        reviews: data.reviews,
        trainings: data.trainings,
        expenses: data.expenses,
        trips: data.trips,
        health: data.health,
        contracts: data.contracts,
        professions: data.professions,
        deductions: data.deductions,
        docs: data.docs,
        tasks: data.tasks,
        deductionTypes: data.deductionTypes,

        selectedEmployeeId,
        setSelectedEmployeeId,
        employeeFileTab,
        setEmployeeFileTab,

        addEmployee: mutators.addEmployee,
        updateEmployee: mutators.updateEmployee,
        deleteEmployee: mutators.deleteEmployee,
        addLeave: mutators.addLeave,
        updateLeaveStatus: mutators.updateLeaveStatus,
        updateLeave: mutators.updateLeave,
        deleteLeave: mutators.deleteLeave,
        recordAttendance: mutators.recordAttendance,
        recordBulkAttendance: mutators.recordBulkAttendance,
        deleteAttendance: mutators.deleteAttendance,
        addJob: mutators.addJob,
        updateJob: mutators.updateJob,
        deleteJob: mutators.deleteJob,
        addCandidate: mutators.addCandidate,
        updateCandidate: mutators.updateCandidate,
        deleteCandidate: mutators.deleteCandidate,
        addReview: mutators.addReview,
        updateReview: mutators.updateReview,
        deleteReview: mutators.deleteReview,
        addTraining: mutators.addTraining,
        updateTraining: mutators.updateTraining,
        deleteTraining: mutators.deleteTraining,
        addExpense: mutators.addExpense,
        updateExpenseStatus: mutators.updateExpenseStatus,
        updateExpense: mutators.updateExpense,
        deleteExpense: mutators.deleteExpense,
        addTrip: mutators.addTrip,
        updateTripStatus: mutators.updateTripStatus,
        updateTrip: mutators.updateTrip,
        deleteTrip: mutators.deleteTrip,
        addHealth: mutators.addHealth,
        updateHealth: mutators.updateHealth,
        deleteHealth: mutators.deleteHealth,
        updateContract: mutators.updateContract,
        updateProfession: mutators.updateProfession,
        updateEmployeeDeductions: mutators.updateEmployeeDeductions,
        addDoc: mutators.addDoc,
        deleteDoc: mutators.deleteDoc,
        addTask: mutators.addTask,
        updateTask: mutators.updateTask,
        deleteTask: mutators.deleteTask,
        addDeductionType: mutators.addDeductionType,
        updateDeductionType: mutators.updateDeductionType,
        deleteDeductionType: mutators.deleteDeductionType,
        seedStatus: data.seedStatus,
        triggerSeeding: data.triggerSeeding,

        rbacUsers: auth.rbacUsers,
        rbacRoles: auth.rbacRoles,
        rbacPermissions: auth.rbacPermissions,
        currentUser: auth.currentUser,
        currentRole: auth.currentRole,
        setCurrentUserById: auth.setCurrentUserById,
        hasPermission: auth.hasPermission,
        login: auth.login,
        logout: auth.logout,
        resetPassword: auth.resetPassword,

        currentCompany: auth.currentCompany,
        currentCompanyId: auth.currentCompanyId,
        allCompanies: auth.allCompanies,
        registerCompany: auth.registerCompany,
        switchCompany: auth.switchCompany,
        approveCompany: auth.approveCompany,
        rejectCompany: auth.rejectCompany,
        suspendCompany: auth.suspendCompany,
        reactivateCompany: auth.reactivateCompany,
        refreshCompanies: auth.refreshCompanies,

        addRBACUser: auth.addRBACUser,
        updateRBACUser: auth.updateRBACUser,
        deleteRBACUser: auth.deleteRBACUser,
        addRBACRole: auth.addRBACRole,
        updateRBACRole: auth.updateRBACRole,
        deleteRBACRole: auth.deleteRBACRole,
        loadViewData: data.loadViewData,

        assets: data.assets,
        assetHistory: data.assetHistory,
        addAsset: mutators.addAsset,
        updateAsset: mutators.updateAsset,
        updateAssetStatus: mutators.updateAssetStatus,
        deleteAsset: mutators.deleteAsset,
        addAssetHistoryEntry: mutators.addAssetHistoryEntry
      }}
    >
      {children}
    </HRContext.Provider>
  );
};

export const useHR = () => {
  const context = useContext(HRContext);
  if (context === undefined) {
    throw new Error('useHR must be used within a HRProvider');
  }
  return context;
};
