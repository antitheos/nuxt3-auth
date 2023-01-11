import decode from "jwt-decode";
import { addTokenPrefix } from "../../utils";
import { TokenStatus } from "./token-status.mjs";
export class IdToken {
  constructor(scheme, storage) {
    this.scheme = scheme;
    this.$storage = storage;
  }
  get() {
    const key = this.scheme.options.idToken.prefix + this.scheme.name;
    return this.$storage.getUniversal(key);
  }
  set(tokenValue) {
    const idToken = addTokenPrefix(tokenValue, this.scheme.options.idToken.type);
    this.#setToken(idToken);
    this.#updateExpiration(idToken);
    return idToken;
  }
  sync() {
    const idToken = this.#syncToken();
    this.#syncExpiration();
    return idToken;
  }
  reset() {
    this.#setToken(false);
    this.#setExpiration(false);
  }
  status() {
    return new TokenStatus(this.get(), this.#getExpiration());
  }
  #getExpiration() {
    const key = this.scheme.options.idToken.expirationPrefix + this.scheme.name;
    return this.$storage.getUniversal(key);
  }
  #setExpiration(expiration) {
    const key = this.scheme.options.idToken.expirationPrefix + this.scheme.name;
    return this.$storage.setUniversal(key, expiration);
  }
  #syncExpiration() {
    const key = this.scheme.options.idToken.expirationPrefix + this.scheme.name;
    return this.$storage.syncUniversal(key);
  }
  #updateExpiration(idToken) {
    let idTokenExpiration;
    const tokenIssuedAtMillis = Date.now();
    const tokenTTLMillis = Number(this.scheme.options.idToken.maxAge) * 1e3;
    const tokenExpiresAtMillis = tokenTTLMillis ? tokenIssuedAtMillis + tokenTTLMillis : 0;
    try {
      idTokenExpiration = decode(idToken).exp * 1e3 || tokenExpiresAtMillis;
    } catch (error) {
      idTokenExpiration = tokenExpiresAtMillis;
      if (!(error && error.name === "InvalidTokenError")) {
        throw error;
      }
    }
    return this.#setExpiration(idTokenExpiration || false);
  }
  #setToken(idToken) {
    const key = this.scheme.options.idToken.prefix + this.scheme.name;
    return this.$storage.setUniversal(key, idToken);
  }
  #syncToken() {
    const key = this.scheme.options.idToken.prefix + this.scheme.name;
    return this.$storage.syncUniversal(key);
  }
  userInfo() {
    const idToken = this.get();
    if (typeof idToken === "string") {
      return decode(idToken);
    }
  }
}
