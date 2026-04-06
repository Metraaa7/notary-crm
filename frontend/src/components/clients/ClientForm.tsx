'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, ClientFormValues } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/Spinner';

interface ClientFormProps {
  defaultValues?: Partial<ClientFormValues>;
  isLoading?: boolean;
  isEdit?: boolean;
  onSubmit: (values: ClientFormValues) => Promise<void>;
  onCancel?: () => void;
}

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

export function ClientForm({
  defaultValues,
  isLoading,
  isEdit,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ClientFormValues, any, ClientFormValues>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      address: { country: 'Україна' },
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Особисті дані
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Ім'я"
            error={errors.firstName?.message}
            required
          >
            <Input
              {...register('firstName')}
              placeholder="Іван"
              className={errors.firstName ? 'border-red-400' : ''}
            />
          </Field>

          <Field
            label="Прізвище"
            error={errors.lastName?.message}
            required
          >
            <Input
              {...register('lastName')}
              placeholder="Коваленко"
              className={errors.lastName ? 'border-red-400' : ''}
            />
          </Field>

          <Field
            label="РНОКПП (ідентифікаційний номер)"
            error={errors.nationalId?.message}
            required
          >
            <Input
              {...register('nationalId')}
              placeholder="1234567890"
              maxLength={10}
              disabled={isEdit}
              className={errors.nationalId ? 'border-red-400' : ''}
            />
            {isEdit && (
              <p className="text-xs text-gray-400">
                Ідентифікаційний номер не можна змінити
              </p>
            )}
          </Field>

          <Field
            label="Дата народження"
            error={errors.dateOfBirth?.message}
            required
          >
            <Input
              {...register('dateOfBirth')}
              type="date"
              className={errors.dateOfBirth ? 'border-red-400' : ''}
            />
          </Field>
        </div>
      </div>

      <Separator />

      {/* Contact */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Контактні дані
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Телефон"
            error={errors.phone?.message}
            required
          >
            <Input
              {...register('phone')}
              type="tel"
              placeholder="+380501234567"
              className={errors.phone ? 'border-red-400' : ''}
            />
          </Field>

          <Field
            label="Електронна пошта"
            error={errors.email?.message}
          >
            <Input
              {...register('email')}
              type="email"
              placeholder="ivan@example.com"
              className={errors.email ? 'border-red-400' : ''}
            />
          </Field>
        </div>
      </div>

      <Separator />

      {/* Address */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Адреса
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Вулиця"
            error={errors.address?.street?.message}
            required
          >
            <Input
              {...register('address.street')}
              placeholder="вул. Хрещатик, 1"
              className={errors.address?.street ? 'border-red-400' : ''}
            />
          </Field>

          <Field
            label="Місто"
            error={errors.address?.city?.message}
            required
          >
            <Input
              {...register('address.city')}
              placeholder="Київ"
              className={errors.address?.city ? 'border-red-400' : ''}
            />
          </Field>

          <Field
            label="Поштовий індекс"
            error={errors.address?.postalCode?.message}
            required
          >
            <Input
              {...register('address.postalCode')}
              placeholder="01001"
              className={errors.address?.postalCode ? 'border-red-400' : ''}
            />
          </Field>

          <Field label="Країна">
            <Input
              {...register('address.country')}
              placeholder="Україна"
            />
          </Field>
        </div>
      </div>

      <Separator />

      {/* Notes */}
      <Field label="Нотатки" error={errors.notes?.message}>
        <Textarea
          {...register('notes')}
          placeholder="Додаткова інформація про клієнта..."
          rows={3}
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Скасувати
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Spinner size="sm" className="mr-2" />}
          {isEdit ? 'Зберегти зміни' : 'Створити клієнта'}
        </Button>
      </div>
    </form>
  );
}
