import type { Request } from "express";

export interface AdminPrincipal {
  subject: string;
}

export interface AdminRequest extends Request {
  adminPrincipal?: AdminPrincipal;
}
