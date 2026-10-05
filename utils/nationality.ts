/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * One rule for deciding whether an employee is a Saudi citizen, so the badge in
 * the employee registry, the badge on the profile page and the nationality
 * column can never contradict each other.
 *
 * A citizen is never issued an Iqama, so a recorded Iqama expiry outranks the
 * `isSaudi` flag: the document is hard evidence, the flag is a stored opinion.
 */

import { Employee, EmployeeContract } from '../types';

type EmployeeLike = Pick<Employee, 'isSaudi'> | null | undefined;
type ContractLike = Pick<EmployeeContract, 'iqamaExp'> | null | undefined;

export const isSaudiEmployee = (emp: EmployeeLike, contract: ContractLike): boolean => {
  // Holding residency papers rules out citizenship
  if (contract?.iqamaExp) {
    return false;
  }
  // Otherwise trust the explicit flag, and treat a record without one as a citizen
  if (emp && emp.isSaudi !== undefined) {
    return emp.isSaudi;
  }
  return true;
};
