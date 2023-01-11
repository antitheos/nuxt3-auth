import type { HTTPResponse } from '../../types';
import { RefreshScheme } from './refresh';
export declare class LaravelJWTScheme extends RefreshScheme {
    protected updateTokens(response: HTTPResponse, { isRefreshing, updateOnRefresh }?: {
        isRefreshing?: boolean | undefined;
        updateOnRefresh?: boolean | undefined;
    }): void;
}
