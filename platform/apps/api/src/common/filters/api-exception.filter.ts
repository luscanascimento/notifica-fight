import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { ExceptionFilter } from "@nestjs/common";
import type { Request, Response } from "express";

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttpException) {
      this.logger.error("Unhandled request error");
    }

    const exceptionResponse = isHttpException ? exception.getResponse() : undefined;
    const message = this.getSafeMessage(exceptionResponse, status);
    const body: ErrorBody = {
      statusCode: status,
      error: HttpStatus[status] ?? "Error",
      message,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }

  private getSafeMessage(
    response: string | object | undefined,
    status: number,
  ): string | string[] {
    if (status >= 500) return "Internal server error";
    if (typeof response === "string") return response;
    if (response && "message" in response) {
      const message = (response as { message?: unknown }).message;
      if (typeof message === "string") return message;
      if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
        return message;
      }
    }
    return "Request failed";
  }
}
