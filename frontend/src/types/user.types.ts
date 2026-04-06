export type UserRole = 'NOTARY' | 'ASSISTANT';

export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export type UpdateEmployeePayload = Partial<Omit<CreateEmployeePayload, 'password'>>;
