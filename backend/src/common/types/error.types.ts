export interface ErrorResponse {
  status: "error" | "fail";
  message: string;
  stack?: string;
}