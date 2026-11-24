export function startRouter(renderRoute) {
  function getRoute() {
    const hash = window.location.hash || "#/";
    const route = hash.slice(1).split("?")[0];
    return route === "" ? "/" : route;
  }

  function handleRoute() {
    renderRoute(getRoute());
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", handleRoute);
  handleRoute();
  return getRoute;
}
