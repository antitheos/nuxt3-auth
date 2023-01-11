import { isSet, getProp, routeMeta, isRelativeURL } from "../../utils";
import { useRouter, useRoute } from "#imports";
import { Storage } from "./storage.mjs";
import { isSamePath } from "ufo";
import requrl from "requrl";
export class Auth {
  constructor(ctx, options) {
    this.strategies = {};
    this.#errorListeners = [];
    this.#redirectListeners = [];
    this.ctx = ctx;
    this.options = options;
    const initialState = {
      user: null,
      loggedIn: false
    };
    const storage = new Storage(ctx, {
      ...options,
      initialState
    });
    this.$storage = storage;
    this.$state = storage.state;
  }
  #errorListeners;
  #redirectListeners;
  getStrategy(throwException = true) {
    if (throwException) {
      if (!this.$state.strategy) {
        throw new Error("No strategy is set!");
      }
      if (!this.strategies[this.$state.strategy]) {
        throw new Error("Strategy not supported: " + this.$state.strategy);
      }
    }
    return this.strategies[this.$state.strategy];
  }
  get strategy() {
    return this.getStrategy();
  }
  get user() {
    return this.$state.user;
  }
  // ---------------------------------------------------------------
  // Strategy and Scheme
  // ---------------------------------------------------------------
  get loggedIn() {
    return this.$state.loggedIn;
  }
  get busy() {
    return this.$storage.getState("busy");
  }
  async init() {
    if (this.options.resetOnError) {
      this.onError((...args) => {
        if (typeof this.options.resetOnError !== "function" || this.options.resetOnError(...args)) {
          this.reset();
        }
      });
    }
    this.$storage.syncUniversal("strategy", this.options.defaultStrategy);
    if (!this.getStrategy(false)) {
      this.$storage.setUniversal("strategy", this.options.defaultStrategy);
      if (!this.getStrategy(false)) {
        return Promise.resolve();
      }
    }
    try {
      await this.mounted();
    } catch (error) {
      this.callOnError(error);
    } finally {
      if (process.client && this.options.watchLoggedIn) {
        this.$storage.watchState("loggedIn", (loggedIn) => {
          if (Object.hasOwn(useRoute().meta, "auth") && !routeMeta(useRoute(), "auth", false)) {
            this.redirect(loggedIn ? "home" : "logout");
          }
        });
      }
    }
  }
  registerStrategy(name, strategy) {
    this.strategies[name] = strategy;
  }
  async setStrategy(name) {
    if (name === this.$storage.getUniversal("strategy")) {
      return Promise.resolve();
    }
    if (!this.strategies[name]) {
      throw new Error(`Strategy ${name} is not defined!`);
    }
    this.reset();
    this.$storage.setUniversal("strategy", name);
    return this.mounted();
  }
  async mounted(...args) {
    if (!this.getStrategy().mounted) {
      return this.fetchUserOnce();
    }
    return Promise.resolve(this.getStrategy().mounted(...args)).catch(
      (error) => {
        this.callOnError(error, { method: "mounted" });
        return Promise.reject(error);
      }
    );
  }
  async loginWith(name, ...args) {
    return this.setStrategy(name).then(() => this.login(...args));
  }
  async login(...args) {
    if (!this.getStrategy().login) {
      return Promise.resolve();
    }
    return this.wrapLogin(this.getStrategy().login(...args)).catch(
      (error) => {
        this.callOnError(error, { method: "login" });
        return Promise.reject(error);
      }
    );
  }
  async fetchUser(...args) {
    if (!this.getStrategy().fetchUser) {
      return Promise.resolve();
    }
    return Promise.resolve(this.getStrategy().fetchUser(...args)).catch(
      (error) => {
        this.callOnError(error, { method: "fetchUser" });
        return Promise.reject(error);
      }
    );
  }
  async logout(...args) {
    if (!this.getStrategy().logout) {
      this.reset();
      return Promise.resolve();
    }
    return Promise.resolve(this.getStrategy().logout(...args)).catch(
      (error) => {
        this.callOnError(error, { method: "logout" });
        return Promise.reject(error);
      }
    );
  }
  // ---------------------------------------------------------------
  // User helpers
  // ---------------------------------------------------------------
  async setUserToken(token, refreshToken) {
    if (!this.getStrategy().setUserToken) {
      this.getStrategy().token.set(token);
      return Promise.resolve();
    }
    return Promise.resolve(this.getStrategy().setUserToken(token, refreshToken)).catch((error) => {
      this.callOnError(error, { method: "setUserToken" });
      return Promise.reject(error);
    });
  }
  reset(...args) {
    if (this.getStrategy().token && !this.getStrategy().reset) {
      this.setUser(false);
      this.getStrategy().token.reset();
      this.getStrategy().refreshToken.reset();
    }
    return this.getStrategy().reset(
      ...args
    );
  }
  async refreshTokens() {
    if (!this.getStrategy().refreshController) {
      return Promise.resolve();
    }
    return Promise.resolve(this.getStrategy().refreshController.handleRefresh()).catch((error) => {
      this.callOnError(error, { method: "refreshTokens" });
      return Promise.reject(error);
    });
  }
  check(...args) {
    if (!this.getStrategy().check) {
      return { valid: true };
    }
    return this.getStrategy().check(...args);
  }
  async fetchUserOnce(...args) {
    if (!this.$state.user) {
      return this.fetchUser(...args);
    }
    return Promise.resolve();
  }
  // ---------------------------------------------------------------
  // Utils
  // ---------------------------------------------------------------
  setUser(user) {
    this.$storage.setState("user", user);
    let check = { valid: Boolean(user) };
    if (check.valid) {
      check = this.check();
    }
    this.$storage.setState("loggedIn", check.valid);
  }
  async request(endpoint, defaults = {}) {
    const request = typeof defaults === "object" ? Object.assign({}, defaults, endpoint) : endpoint;
    if (request.baseURL === "") {
      request.baseURL = requrl(process.server ? this.ctx.ssrContext?.event.req : void 0);
    }
    if (!this.ctx.$http) {
      return Promise.reject(new Error("[AUTH] add the @nuxtjs-alt/http module to nuxt.config file"));
    }
    return this.ctx.$http.request(request).catch((error) => {
      this.callOnError(error, { method: "request" });
      return Promise.reject(error);
    });
  }
  async requestWith(endpoint, defaults) {
    const request = Object.assign({}, defaults, endpoint);
    if (this.getStrategy().token) {
      const token = this.getStrategy().token.get();
      const tokenName = this.getStrategy().options.token.name || "Authorization";
      if (!request.headers) {
        request.headers = {};
      }
      if (!request.headers[tokenName] && isSet(token) && token && typeof token === "string") {
        request.headers[tokenName] = token;
      }
    }
    return this.request(request);
  }
  async wrapLogin(promise) {
    this.$storage.setState("busy", true);
    this.error = void 0;
    return Promise.resolve(promise).then((response) => {
      this.$storage.setState("busy", false);
      return response;
    }).catch((error) => {
      this.$storage.setState("busy", false);
      return Promise.reject(error);
    });
  }
  onError(listener) {
    this.#errorListeners.push(listener);
  }
  callOnError(error, payload = {}) {
    this.error = error;
    for (const fn of this.#errorListeners) {
      fn(error, payload);
    }
  }
  /**
   * 
   * @param name redirect name
   * @param route (default: false) Internal useRoute() (false) or manually specify
   * @param router (default: true) Whether to use nuxt redirect (true) or window redirect (false)
   *
   * @returns
   */
  redirect(name, route = false, router = true) {
    const activeRouter = useRouter();
    const activeRoute = useRoute();
    if (!this.options.redirect) {
      return;
    }
    const nuxtRoute = this.options.fullPathRedirect ? activeRoute.fullPath : activeRoute.path;
    const from = route ? this.options.fullPathRedirect ? route.fullPath : route.path : nuxtRoute;
    let to = this.options.redirect[name];
    if (!to) {
      return;
    }
    if (this.options.rewriteRedirects) {
      if (name === "logout" && isRelativeURL(from) && !isSamePath(to, from)) {
        this.$storage.setUniversal("redirect", from);
      }
      if (name === "login" && isRelativeURL(from) && !isSamePath(to, from)) {
        this.$storage.setUniversal("redirect", from);
      }
      if (name === "home") {
        const redirect = this.$storage.getUniversal("redirect");
        this.$storage.setUniversal("redirect", null);
        if (isRelativeURL(redirect)) {
          to = redirect;
        }
      }
    }
    to = this.callOnRedirect(to, from) || to;
    if (isSamePath(to, from)) {
      return;
    }
    const query = activeRoute.query;
    const queryString = Object.keys(query).map((key) => key + "=" + query[key]).join("&");
    if (!router) {
      window.location.replace(to + (queryString ? "?" + queryString : ""));
    } else {
      activeRouter.push(to + (queryString ? "?" + queryString : ""));
    }
  }
  onRedirect(listener) {
    this.#redirectListeners.push(listener);
  }
  callOnRedirect(to, from) {
    for (const fn of this.#redirectListeners) {
      to = fn(to, from) || to;
    }
    return to;
  }
  hasScope(scope) {
    const userScopes = this.$state.user && getProp(this.$state.user, this.options.scopeKey);
    if (!userScopes) {
      return false;
    }
    if (Array.isArray(userScopes)) {
      return userScopes.includes(scope);
    }
    return Boolean(getProp(userScopes, scope));
  }
}
