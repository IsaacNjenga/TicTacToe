export type LOG_ACTIONS =
  | "created"
  | "updated"
  | "deleted"
  | "fetched"
  | "sent"
  | "received"
  | "failed"
  | "logged_in"
  | "logged_out";

export interface LogEntry {
  _id: string;
  type: string;
  refId: string;
  action: LOG_ACTIONS;
  title?: string;
  description?: string;
  refModel: string;
  actor: string;
}

export interface CreateLogDTO {
  type: string;
  refId: string;
  action: LOG_ACTIONS;
  title?: string;
  description?: string;
  refModel: string;
  actor: string;
}
