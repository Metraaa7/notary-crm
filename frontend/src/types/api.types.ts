export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}
