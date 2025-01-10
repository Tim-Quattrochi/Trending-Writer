import { TrendItem } from "@/types/trend";

type SuccessResult = {
  trends: TrendItem[];
  total: number;
  error?: undefined;
};

type ErrorResult = {
  trends?: undefined;
  total?: undefined;
  error: string;
};

export type GetAllTrendsResult = SuccessResult | ErrorResult;
