import { assignDefaults } from "../utils/provider";
export function laravelSanctum(nuxt, strategy) {
  const endpointDefaults = {
    credentials: "include"
  };
  const DEFAULTS = {
    scheme: "cookie",
    name: "laravelSanctum",
    cookie: {
      name: "XSRF-TOKEN",
      server: nuxt.options.ssr
    },
    endpoints: {
      csrf: {
        ...endpointDefaults,
        url: "/sanctum/csrf-cookie"
      },
      login: {
        ...endpointDefaults,
        url: "/login"
      },
      logout: {
        ...endpointDefaults,
        url: "/logout"
      },
      user: {
        ...endpointDefaults,
        url: "/api/user"
      }
    },
    user: {
      property: {
        server: false,
        client: false
      },
      autoFetch: true
    }
  };
  assignDefaults(strategy, DEFAULTS);
}
