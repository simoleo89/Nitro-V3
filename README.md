# v2.2.0 -Nitro V3 !! Use at Own Risk as it is still in Beta !!

## Quick Install

For a guided one-command setup on **Windows or Linux**:

```
node install.mjs
```

This will check prerequisites, clone the sibling `Nitro_Render_V3` repo into `../Nitro_Render_V3`, install/link both projects, scaffold the three config files in `public/configuration/`, prompt for your URLs, and run `yarn build`.

Flags:
- `--non-interactive` (or `--skip-prompts`) — keep default URLs from `.example` files
- `--skip-build` — skip the final `yarn build`
- `--skip-clone` — assume `../Nitro_Render_V3` is already present
- `--skip-link` — skip `yarn link` calls (useful when re-running)
- `--help`, `-h` — show usage and exit

For manual setup, see the `Installation` section below.

## Prerequisites

-   [Git](https://git-scm.com/)
-   [NodeJS](https://nodejs.org/) >= 18
    - If using NodeJS < 18 remove `--openssl-legacy-provider` from the package.json scripts
-   [Yarn](https://yarnpkg.com/) `npm i yarn -g`

## Installation

-   First you should open terminal and navigate to the folder where you want to clone Nitro and Nitro-Renderer
-   Clone Nitro (Expl. C:\Github\)
    -   `git clone https://github.com/duckietm/Nitro-V3.git` <== For now switch to Dev-RendererV2 
	-   `git clone https://github.com/duckietm/Nitro_Render_V3.git`
	-   Install the dependencies for the renderer : cd C:\Github\Nitro_Render_V3
    	-   `yarn install`
	-	Now we will create a Link for the Nitro Renderer : `yarn link` This will give you a link address `yarn link "@nitrots/nitro-renderer"`
    -   Install the dependencies for Cool UI : cd C:\Github\Nitro-V3
	-   `yarn install`
	-   `yarn link "@nitrots/nitro-renderer"` <== This will link the renderer in the project
-   Rename a few files
    -   Copy `public/configuration/renderer-config.example` to `public/configuration/renderer-config.json`
    -   Copy `public/configuration/ui-config.example` to `public/configuration/ui-config.json`
    -   Copy `public/configuration/client-mode.example` to `public/configuration/client-mode.json`
    -   Set your links
    -   Open `public/configuration/renderer-config.json`
        -   Update `socket.url, asset.url, image.library.url, & hof.furni.url`
    -   Open `public/configuration/ui-config.json`
        -   Update `camera.url, thumbnails.url, url.prefix, habbopages.url`
	-   `yarn build` <== the final step to build the DIST folder this is where your browser needs to point / or upload this to your /client if you do the compile on a other machine (preferd)
    -   You can override any variable by passing it to `NitroConfig` in the index.html

## Usage

-   To use Nitro you need `.nitro` assets generated, see [nitro-converter](https://git.krews.org/nitro/nitro-converter) for instructions
-   See [Morningstar Websockets](https://git.krews.org/nitro/ms-websockets) for instructions on configuring websockets on your server

### Development

Run Nitro in development mode when you are editing the files, this way you can see the changes in your browser instantly

```
yarn start
```

### Production

To build a production version of Nitro just run the following command

```
yarn build:prod
```

-   A `dist` folder will be generated, these are the files that must be uploaded to your webserver
-   Consult your CMS documentation for compatibility with Nitro and how to add the production files
