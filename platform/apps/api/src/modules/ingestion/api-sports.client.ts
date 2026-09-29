import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EnvironmentVariables } from "../../config/environment";

/** Typed wrapper for the API-Sports MMA v1 REST API. */

export interface ApiSportsResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | unknown[];
  results: number;
  response: T[];
}

export interface ApiSportsFighter {
  id: number;
  name: string;
  logo?: string;
  winner?: boolean | null;
}

export interface ApiSportsFight {
  id: number;
  date: string;              // ISO 8601, e.g. "2024-01-13T13:00:00+00:00"
  time: string | null;       // HH:mm or null
  timestamp: number | null;  // unix seconds or null
  timezone: string;          // e.g. "UTC"
  slug: string | null;       // e.g. "UFC Fight Night: Ankalaev vs. Walker 2"
  is_main: boolean;
  category: string | null;   // e.g. "Bantamweight"
  status: {
    long: string;            // e.g. "Finished", "Not Started", "Cancelled"
    short: string;           // e.g. "FT", "NS", "CANC"
  };
  fighters: {
    first: ApiSportsFighter;
    second: ApiSportsFighter;
  };
}

@Injectable()
export class ApiSportsClient {
  private readonly logger = new Logger(ApiSportsClient.name);
  private readonly apiKey: string;
  private readonly baseUrl = "https://v1.mma.api-sports.io";

  constructor(
    @Inject(ConfigService) config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.apiKey = config.get("API_SPORTS_KEY", { infer: true });
  }

  get isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async getCategories(): Promise<string[]> {
    return this.request<string>("/categories");
  }

  async getSeasons(): Promise<number[]> {
    return this.request<number>("/seasons");
  }

  async getFightsByDate(date: string): Promise<ApiSportsFight[]> {
    return this.request<ApiSportsFight>("/fights", { date });
  }

  async getFightsBySeason(season: number | string): Promise<ApiSportsFight[]> {
    return this.request<ApiSportsFight>("/fights", { season: String(season) });
  }

  private async request<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T[]> {
    if (!this.isConfigured) {
      throw new Error("API_SPORTS_KEY is not configured");
    }

    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    this.logger.debug(`GET ${url.pathname}${url.search}`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-apisports-key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `API-Sports request failed: ${response.status} ${response.statusText}`,
      );
    }

    const body = (await response.json()) as ApiSportsResponse<T>;

    const hasErrors =
      (Array.isArray(body.errors) && body.errors.length > 0) ||
      (!Array.isArray(body.errors) && Object.keys(body.errors).length > 0);

    if (hasErrors) {
      throw new Error(
        `API-Sports returned errors: ${JSON.stringify(body.errors)}`,
      );
    }

    return body.response;
  }
}
