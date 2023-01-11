import type { HTTPRequest, HTTPResponse } from '.';
import type { Auth } from '../runtime/core';
import type { Token, IdToken, RefreshToken, RefreshController, RequestHandler } from '../runtime/inc';
import type { PartialExcept } from './utils';
export interface UserOptions {
    property: string | false;
    autoFetch: boolean;
}
export interface CookieUserOptions {
    property: {
        client: string | false;
        server: string | false;
    };
    autoFetch: boolean;
}
export interface EndpointsOption {
    [endpoint: string]: string | HTTPRequest | false;
}
export interface SchemeOptions {
    name?: string;
}
export type SchemePartialOptions<Options extends SchemeOptions> = PartialExcept<Options, keyof SchemeOptions>;
export interface SchemeCheck {
    valid: boolean;
    tokenExpired?: boolean;
    refreshTokenExpired?: boolean;
    idTokenExpired?: boolean;
    isRefreshable?: boolean;
}
export interface Scheme<OptionsT extends SchemeOptions = SchemeOptions> {
    options: OptionsT;
    name?: string;
    $auth: Auth;
    mounted?(...args: any[]): Promise<HTTPResponse | void>;
    check?(checkStatus: boolean): SchemeCheck;
    login(...args: any[]): Promise<HTTPResponse | void>;
    fetchUser(endpoint?: HTTPRequest): Promise<HTTPResponse | void>;
    setUserToken?(token: string | boolean, refreshToken?: string | boolean): Promise<HTTPResponse | void>;
    logout?(endpoint?: HTTPRequest): Promise<void> | void;
    reset?(options?: {
        resetInterceptor: boolean;
    }): void;
}
export interface TokenOptions {
    property: string;
    type: string | false;
    name: string;
    maxAge: number | false;
    global: boolean;
    required: boolean;
    prefix: string;
    expirationPrefix: string;
}
export interface TokenableSchemeOptions extends SchemeOptions {
    token?: TokenOptions;
    endpoints: EndpointsOption;
}
export interface TokenableScheme<OptionsT extends TokenableSchemeOptions = TokenableSchemeOptions> extends Scheme<OptionsT> {
    token?: Token;
    requestHandler: RequestHandler;
}
export interface IdTokenableSchemeOptions extends SchemeOptions {
    idToken: TokenOptions;
}
export interface IdTokenableScheme<OptionsT extends IdTokenableSchemeOptions = IdTokenableSchemeOptions> extends Scheme<OptionsT> {
    idToken: IdToken;
    requestHandler: RequestHandler;
}
export interface RefreshTokenOptions {
    property: string | false;
    type: string | false;
    data: string | false;
    maxAge: number | false;
    required: boolean;
    tokenRequired: boolean;
    prefix: string;
    expirationPrefix: string;
}
export interface RefreshableSchemeOptions extends TokenableSchemeOptions {
    refreshToken: RefreshTokenOptions;
}
export interface RefreshableScheme<OptionsT extends RefreshableSchemeOptions = RefreshableSchemeOptions> extends TokenableScheme<OptionsT> {
    refreshToken: RefreshToken;
    refreshController: RefreshController;
    refreshTokens(): Promise<HTTPResponse | void>;
}
