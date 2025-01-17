import { ConfigurationDocumentRequestError } from "./configuration-document-request-error.mjs";
import { defu } from "defu";
const ConfigurationDocumentWarning = (message) => console.warn(`[AUTH] [OPENID CONNECT] Invalid configuration. ${message}`);
export class ConfigurationDocument {
  constructor(scheme, storage) {
    this.scheme = scheme;
    this.$storage = storage;
    this.key = "_configuration_document." + this.scheme.name;
  }
  #set(value) {
    return this.$storage.setState(this.key, value);
  }
  get() {
    return this.$storage.getState(this.key);
  }
  set(value) {
    this.#set(value);
    return value;
  }
  async request() {
    const serverDoc = this.scheme.$auth.ctx.payload.data.$auth?.openIDConnect?.configurationDocument;
    if (process.client && serverDoc) {
      this.set(serverDoc);
    }
    if (!this.get()) {
      const configurationDocument = await this.scheme.requestHandler.http.$get(this.scheme.options.endpoints.configuration).catch((e) => Promise.reject(e));
      if (process.server) {
        this.scheme.$auth.ctx.payload.data = {
          ...this.scheme.$auth.ctx.payload.data,
          $auth: {
            /* use `openIDConnect` instead of `oidc` because it could not be picked up by `serverDoc` */
            openIDConnect: {
              configurationDocument
            }
          }
        };
      }
      this.set(configurationDocument);
    }
  }
  validate() {
    const mapping = {
      responseType: "response_types_supported",
      scope: "scopes_supported",
      grantType: "grant_types_supported",
      acrValues: "acr_values_supported"
    };
    Object.keys(mapping).forEach((optionsKey) => {
      const configDocument = this.get();
      const configDocumentKey = mapping[optionsKey];
      const configDocumentValues = configDocument[configDocumentKey];
      const optionsValues = this.scheme.options[optionsKey];
      if (typeof configDocumentValues !== "undefined") {
        if (Array.isArray(optionsValues) && Array.isArray(configDocumentValues)) {
          optionsValues.forEach((optionsValue) => {
            if (!configDocumentValues.includes(optionsValue)) {
              ConfigurationDocumentWarning(
                `A value of scheme options ${optionsKey} is not supported by ${configDocumentKey} of by Authorization Server.`
              );
            }
          });
        }
        if (!Array.isArray(optionsValues) && Array.isArray(configDocumentValues) && !configDocumentValues.includes(optionsValues)) {
          ConfigurationDocumentWarning(`Value of scheme option ${optionsKey} is not supported by ${configDocumentKey} of by Authorization Server.`);
        }
        if (!Array.isArray(optionsValues) && !Array.isArray(configDocumentValues) && configDocumentValues !== optionsValues) {
          ConfigurationDocumentWarning(`Value of scheme option ${optionsKey} is not supported by ${configDocumentKey} of by Authorization Server.`);
        }
      }
    });
  }
  async init() {
    await this.request().catch(() => {
      throw new ConfigurationDocumentRequestError();
    });
    this.validate();
    this.setSchemeEndpoints();
  }
  setSchemeEndpoints() {
    const configurationDocument = this.get();
    this.scheme.options.endpoints = defu(this.scheme.options.endpoints, {
      authorization: configurationDocument.authorization_endpoint,
      token: configurationDocument.token_endpoint,
      userInfo: configurationDocument.userinfo_endpoint,
      logout: configurationDocument.end_session_endpoint
    });
  }
  reset() {
    this.#set(false);
  }
}
