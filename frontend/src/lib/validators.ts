import { z } from 'zod';

export const addressSchema = z.object({
  street: z.string().min(1, "Вулиця обов'язкова"),
  city: z.string().min(1, "Місто обов'язкове"),
  postalCode: z.string().min(1, "Поштовий індекс обов'язковий"),
  country: z.string().default('Україна'),
});

export const clientSchema = z.object({
  firstName: z.string().min(1, "Ім'я обов'язкове"),
  lastName: z.string().min(1, "Прізвище обов'язкове"),
  nationalId: z.string().length(10, 'РНОКПП повинен містити 10 цифр'),
  dateOfBirth: z.string().min(1, "Дата народження обов'язкова"),
  address: addressSchema,
  phone: z.string().min(7, "Телефон обов'язковий"),
  email: z.string().email('Невірний формат email').optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const updateClientSchema = clientSchema.omit({ nationalId: true }).partial();

export const serviceSchema = z.object({
  type: z.enum(['DEED', 'POWER_OF_ATTORNEY', 'WILL', 'CERTIFICATION', 'CONTRACT', 'AFFIDAVIT', 'OTHER']),
  description: z.string().min(1, "Опис обов'язковий"),
  feeAmount: z.number().min(0, 'Сума не може бути від`ємною'),
  feeCurrency: z.string().default('UAH'),
  notes: z.string().optional(),
});

export const generateDocumentSchema = z.object({
  title: z.string().min(1, "Назва документа обов'язкова"),
  serviceIds: z.array(z.string()).min(1, 'Оберіть принаймні одну послугу'),
  notes: z.string().optional(),
});

export const createEmployeeSchema = z.object({
  name: z.string().min(1, "Ім'я обов'язкове"),
  email: z.string().email('Невірний формат email'),
  password: z.string().min(8, 'Пароль має містити щонайменше 8 символів'),
  role: z.enum(['NOTARY', 'ASSISTANT']),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(1, "Ім'я обов'язкове").optional(),
  email: z.string().email('Невірний формат email').optional(),
  role: z.enum(['NOTARY', 'ASSISTANT']).optional(),
});

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeSchema>;

export type ClientFormValues = z.infer<typeof clientSchema>;
export type UpdateClientFormValues = z.infer<typeof updateClientSchema>;
export type ServiceFormValues = z.infer<typeof serviceSchema>;
export type GenerateDocumentFormValues = z.infer<typeof generateDocumentSchema>;
