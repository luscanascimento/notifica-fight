import {
  createParamDecorator,
  UnauthorizedException,
} from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { AdminRequest } from "./admin-principal";

export const AdminSubject = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const subject = request.adminPrincipal?.subject;
    if (!subject) {
      throw new UnauthorizedException("Verified admin subject is required");
    }
    return subject;
  },
);
