import type { ModuleOptions } from '../../types';
import type { NuxtApp } from '#app';
export declare class Storage {
    #private;
    ctx: NuxtApp;
    options: ModuleOptions;
    state: any;
    constructor(ctx: NuxtApp, options: ModuleOptions);
    setUniversal<V extends any>(key: string, value: V): V | void;
    getUniversal(key: string): any;
    syncUniversal(key: string, defaultValue?: any): any;
    removeUniversal(key: string): void;
    get store(): any;
    getStore(): any;
    setState<V extends any>(key: string, value: V): V;
    getState(key: string): any;
    watchState(watchKey: string, fn: (value: any) => void): any;
    removeState(key: string): void;
    setLocalStorage<V extends any>(key: string, value: V): V | void;
    getLocalStorage(key: string): any;
    removeLocalStorage(key: string): void;
    getLocalStoragePrefix(): string;
    isLocalStorageEnabled(): boolean;
    setSessionStorage<V extends any>(key: string, value: V): V | void;
    getSessionStorage(key: string): any;
    removeSessionStorage(key: string): void;
    getSessionStoragePrefix(): string;
    isSessionStorageEnabled(): boolean;
    getCookies(): Record<string, any> | void;
    setCookie<V extends any>(key: string, value: V, options?: {
        prefix?: string;
    }): V | undefined;
    getCookie(key: string): any;
    removeCookie(key: string, options?: {
        prefix?: string;
    }): void;
    isCookiesEnabled(): boolean;
}
