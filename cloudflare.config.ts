/** @prose
 * # How the site is deployed
 *
 * The site is static files on a Cloudflare Worker, with no code. `prose build` writes the pages
 * into `.prose`, and `pnpm quality` adds the Quality page beside them.
 *
 * The Worker's build command is `pnpm run verify`, which ends with `vp build`: Vite hands `.prose`
 * to Cloudflare, as [vite.config.ts](vite.config.ts) says. Its deploy command is `pnpm run ship`,
 * which runs `cf deploy --prebuilt`. This file names the domain, so a deploy can't drop it. The
 * steps are in [development](docs/development.md#the-site).
 */
import { site } from "@amitkaps/craftz/cloudflare";

export default site({
  name: "markz",
  domains: ["markz.amitkaps.com"],
  assets: {
    directory: ".prose",
    // Serve the site's own 404.html for any missing address.
    notFoundHandling: "404-page",
    // Serve /src/html.ts from src/html.ts.html, with no redirect.
    htmlHandling: "auto-trailing-slash",
  },
});
