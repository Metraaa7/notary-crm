export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  dateOfBirth: string;
  address: Address;
  phone: string;
  email?: string;
  notes?: string;
  isActive: boolean;
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientPayload {
  firstName: string;
  lastName: string;
  nationalId: string;
  dateOfBirth: string;
  address: Address;
  phone: string;
  email?: string;
  notes?: string;
}

export type UpdateClientPayload = Partial<Omit<CreateClientPayload, 'nationalId'>>;
