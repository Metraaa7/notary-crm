import { Spinner } from './Spinner';

export function PageLoader() {
  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-gray-50">
      <Spinner size="lg" />
    </div>
  );
}
