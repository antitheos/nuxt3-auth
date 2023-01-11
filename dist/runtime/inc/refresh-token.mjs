import { addTokenPrefix } from "../../utils";
import { TokenStatus } from "./token-status.mjs";
import jwtDecode from "jwt-decode";
export class RefreshToken {
  constructor(scheme, storage) {
    this.scheme = scheme;
    this.$storage = storage;
  }
  get() {
    const key = this.scheme.options.refreshToken.prefix + this.scheme.name;
    return this.$storage.getUniversal(key);
  }
  set(tokenValue) {
    const refreshToken = addTokenPrefix(tokenValue, this.scheme.options.refreshToken.type);
    this.#setToken(refreshToken);
    this.#updateExpiration(refreshToken);
    return refreshToken;
  }
  sync() {
    const refreshToken = this.#syncToken();
    this.#syncExpiration();
    return refreshToken;
  }
  reset() {
    this.#setToken(false);
    this.#setExpiration(false);
  }
  status() {
    return new TokenStatus(this.get(), this.#getExpiration());
  }
  #getExpiration() {
    const key = this.scheme.options.refreshToken.expirationPrefix + this.scheme.name;
    return this.$storage.getUniversal(key);
  }
  #setExpiration(expiration) {
    const key = this.scheme.options.refreshToken.expirationPrefix + this.scheme.name;
    return this.$storage.setUniversal(key, expiration);
  }
  #syncExpiration() {
    const key = this.scheme.options.refreshToken.expirationPrefix + this.scheme.name;
    return this.$storage.syncUniversal(key);
  }
  #updateExpiration(refreshToken) {
    let refreshTokenExpiration;
    const tokenIssuedAtMillis = Date.now();
    const tokenTTLMillis = Number(this.scheme.options.refreshToken.maxAge) * 1e3;
    const tokenExpiresAtMillis = tokenTTLMillis ? tokenIssuedAtMillis + tokenTTLMillis : 0;
    try {
      refreshTokenExpiration = jwtDecode(refreshToken).exp * 1e3 || tokenExpiresAtMillis;
    } catch (error) {
      refreshTokenExpiration = tokenExpiresAtMillis;
      if (!(error && error.name === "InvalidTokenError")) {
        throw error;
      }
    }
    return this.#setExpiration(refreshTokenExpiration || false);
  }
  #setToken(refreshToken) {
    const key = this.scheme.options.refreshToken.prefix + this.scheme.name;
    return this.$storage.setUniversal(key, refreshToken);
  }
  #syncToken() {
    const key = this.scheme.options.refreshToken.prefix + this.scheme.name;
    return this.$storage.syncUniversal(key);
  }
}
