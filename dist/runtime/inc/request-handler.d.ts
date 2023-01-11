import type { TokenableScheme, RefreshableScheme } from '../../types';
import { FetchInstance } from '@refactorjs/ofetch';
export declare class RequestHandler {
    #private;
    scheme: TokenableScheme | RefreshableScheme;
    http: FetchInstance;
    interceptor: number | undefined | null;
    constructor(scheme: TokenableScheme | RefreshableScheme, http: FetchInstance);
    setHeader(token: string): void;
    clearHeader(): void;
    initializeRequestInterceptor(refreshEndpoint?: string | Request): void;
    reset(): void;
}
