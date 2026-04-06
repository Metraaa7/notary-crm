'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  CreateEmployeeFormValues,
  UpdateEmployeeFormValues,
} from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/Spinner';
import { ChevronDown } from 'lucide-react';

const ROLE_LABELS = {
  NOTARY: 'Нотаріус',
  ASSISTANT: 'Асистент',
} as const;

type Role = keyof typeof ROLE_LABELS;

interface CreateProps {
  isEdit?: false;
  defaultValues?: Partial<CreateEmployeeFormValues>;
  onSubmit: (values: CreateEmployeeFormValues) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

interface EditProps {
  isEdit: true;
  defaultValues?: Partial<UpdateEmployeeFormValues>;
  onSubmit: (values: UpdateEmployeeFormValues) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

type EmployeeFormProps = CreateProps | EditProps;

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

function Field({ label, error, children, required }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}>
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function EmployeeForm(props: EmployeeFormProps) {
  const { isEdit, defaultValues, isLoading, onCancel } = props;

  const [roleOpen, setRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | ''>(
    (defaultValues?.role as Role) ?? '',
  );

  const schema = isEdit ? updateEmployeeSchema : createEmployeeSchema;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setValue('role', role, { shouldValidate: true });
    setRoleOpen(false);
  };

  const roleError = (errors as Record<string, { message?: string }>).role?.message;

  return (
    <form onSubmit={handleSubmit(props.onSubmit as any)} className="space-y-5">
      <Field label="Повне ім'я" error={(errors as any).name?.message} required>
        <Input
          {...register('name')}
          placeholder="Іван Коваленко"
          className={(errors as any).name ? 'border-red-400' : ''}
        />
      </Field>

      <Field label="Електронна пошта" error={(errors as any).email?.message} required>
        <Input
          {...register('email')}
          type="email"
          placeholder="ivan@example.com"
          className={(errors as any).email ? 'border-red-400' : ''}
        />
      </Field>

      {!isEdit && (
        <Field label="Пароль" error={(errors as any).password?.message} required>
          <Input
            {...register('password')}
            type="password"
            placeholder="Щонайменше 8 символів"
            className={(errors as any).password ? 'border-red-400' : ''}
          />
        </Field>
      )}

      {/* Role dropdown */}
      <div className="space-y-1.5">
        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Роль</Label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleOpen((o) => !o)}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
              roleError ? 'border-red-400' : 'border-input'
            } ${!selectedRole ? 'text-muted-foreground' : 'text-gray-900'}`}
          >
            <span>{selectedRole ? ROLE_LABELS[selectedRole] : 'Оберіть роль'}</span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${roleOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {roleOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
              {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRoleSelect(key)}
                  className={`flex w-full items-center px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    selectedRole === key
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        {roleError && <p className="text-xs text-red-500">{roleError}</p>}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Скасувати
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Spinner size="sm" className="mr-2" />}
          {isEdit ? 'Зберегти зміни' : 'Створити працівника'}
        </Button>
      </div>
    </form>
  );
}
