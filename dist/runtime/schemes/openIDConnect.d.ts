import type { HTTPResponse, SchemeCheck, SchemePartialOptions } from '../../types';
import type { Auth } from '..';
import { Oauth2Scheme, Oauth2SchemeEndpoints, Oauth2SchemeOptions } from './oauth2';
import { IdToken, ConfigurationDocument } from '../inc';
import { IdTokenableSchemeOptions } from '../../types';
export interface OpenIDConnectSchemeEndpoints extends Oauth2SchemeEndpoints {
    configuration: string;
}
export interface OpenIDConnectSchemeOptions extends Oauth2SchemeOptions, IdTokenableSchemeOptions {
    fetchRemote: boolean;
    endpoints: OpenIDConnectSchemeEndpoints;
}
export declare class OpenIDConnectScheme<OptionsT extends OpenIDConnectSchemeOptions = OpenIDConnectSchemeOptions> extends Oauth2Scheme<OptionsT> {
    #private;
    idToken: IdToken;
    configurationDocument: ConfigurationDocument;
    constructor($auth: Auth, options: SchemePartialOptions<OpenIDConnectSchemeOptions>, ...defaults: SchemePartialOptions<OpenIDConnectSchemeOptions>[]);
    protected updateTokens(response: HTTPResponse): void;
    check(checkStatus?: boolean): SchemeCheck;
    mounted(): Promise<any>;
    reset(): void;
    logout(): void;
    fetchUser(): Promise<void>;
}
