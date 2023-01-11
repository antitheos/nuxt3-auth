import type { HTTPRequest, HTTPResponse, Scheme, SchemeOptions, SchemeCheck, ModuleOptions, Route } from '../../types';
import type { NuxtApp } from '#app';
import { Storage } from './storage';
export type ErrorListener = (...args: any[]) => void;
export type RedirectListener = (to: string, from: string) => string;
export declare class Auth {
    #private;
    ctx: NuxtApp;
    options: ModuleOptions;
    strategies: Record<string, Scheme>;
    $storage: Storage;
    $state: {
        strategy: string;
        user: Record<string, any>;
        loggedIn: boolean;
    };
    error?: Error;
    constructor(ctx: NuxtApp, options: ModuleOptions);
    getStrategy(throwException?: boolean): Scheme<SchemeOptions>;
    get strategy(): Scheme;
    get user(): Record<string, any> | null;
    get loggedIn(): boolean;
    get busy(): boolean;
    init(): Promise<void>;
    registerStrategy(name: string, strategy: Scheme): void;
    setStrategy(name: string): Promise<HTTPResponse | void>;
    mounted(...args: any[]): Promise<HTTPResponse | void>;
    loginWith(name: string, ...args: any[]): Promise<HTTPResponse | void>;
    login(...args: any[]): Promise<HTTPResponse | void>;
    fetchUser(...args: any[]): Promise<HTTPResponse | void>;
    logout(...args: any[]): Promise<void>;
    setUserToken(token: string | boolean, refreshToken?: string | boolean): Promise<HTTPResponse | void>;
    reset(...args: any[]): void;
    refreshTokens(): Promise<HTTPResponse | void>;
    check(...args: any[]): SchemeCheck;
    fetchUserOnce(...args: any[]): Promise<HTTPResponse | void>;
    setUser(user: any): void;
    request(endpoint: HTTPRequest, defaults?: HTTPRequest): Promise<HTTPResponse | void>;
    requestWith(endpoint?: HTTPRequest, defaults?: HTTPRequest): Promise<HTTPResponse | void>;
    wrapLogin(promise: Promise<HTTPResponse | void>): Promise<HTTPResponse | void>;
    onError(listener: ErrorListener): void;
    callOnError(error: Error, payload?: {}): void;
    /**
     *
     * @param name redirect name
     * @param route (default: false) Internal useRoute() (false) or manually specify
     * @param router (default: true) Whether to use nuxt redirect (true) or window redirect (false)
     *
     * @returns
     */
    redirect(name: string, route?: Route | false, router?: boolean): void;
    onRedirect(listener: RedirectListener): void;
    callOnRedirect(to: string, from: string): string;
    hasScope(scope: string): boolean;
}
