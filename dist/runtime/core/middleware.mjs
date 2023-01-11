import { routeMeta, getMatchedComponents, normalizePath } from "../../utils";
import { useNuxtApp, defineNuxtRouteMiddleware } from "#imports";
export default defineNuxtRouteMiddleware(async (to, from) => {
  if (Object.hasOwn(to.meta, "auth") && routeMeta(to, "auth", false)) {
    return;
  }
  const matches = [];
  const Components = getMatchedComponents(to, matches);
  if (!Components.length) {
    return;
  }
  const ctx = useNuxtApp();
  const { login, callback } = ctx.$auth.options.redirect;
  const pageIsInGuestMode = Object.hasOwn(to.meta, "auth") && routeMeta(to, "auth", "guest");
  const insidePage = (page) => normalizePath(to.path) === normalizePath(page);
  if (ctx.$auth.$state.loggedIn) {
    const { tokenExpired, refreshTokenExpired, isRefreshable } = ctx.$auth.check(true);
    if (!login || insidePage(login) || pageIsInGuestMode) {
      ctx.$auth.redirect("home", to);
    }
    if (refreshTokenExpired) {
      ctx.$auth.reset();
    } else if (tokenExpired) {
      if (isRefreshable) {
        try {
          await ctx.$auth.refreshTokens();
        } catch (error) {
          ctx.$auth.reset();
        }
      } else {
        ctx.$auth.reset();
      }
    }
  } else if (!pageIsInGuestMode && (!callback || !insidePage(callback))) {
    ctx.$auth.redirect("login", to);
  }
});
