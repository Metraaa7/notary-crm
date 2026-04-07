import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

// Isolate localStorage between every test
beforeEach(() => localStorage.clear());
