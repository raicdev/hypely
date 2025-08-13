import type { Middleware } from "@/core/types";
import chalk from "chalk";
export declare const METHOD_COLORS: {
    GET: chalk.Chalk;
    POST: chalk.Chalk;
    PUT: chalk.Chalk;
    DELETE: chalk.Chalk;
    PATCH: chalk.Chalk;
    OPTIONS: chalk.Chalk;
};
export declare const TIME_COLORS: {
    slow: chalk.Chalk;
    medium: chalk.Chalk;
    fast: chalk.Chalk;
};
export declare const logger: () => Middleware;
