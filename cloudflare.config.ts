/** @prose
 * # How the site is deployed
 *
 * The site is static files on a Cloudflare Worker, with no code. `prose build` writes the pages
 * into `.prose`, and `pnpm quality` adds the Quality page beside them.
 *
 * The Worker's build command is `pnpm run verify`, which builds `.prose`. Its deploy command is
 * `pnpm run ship`, which uploads it with `craftz deploy`. This file names the domain, so a deploy
 * can't drop it. The steps are in [development](docs/development.md#the-site).
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
