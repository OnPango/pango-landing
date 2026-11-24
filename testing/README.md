# Landing validation
Run `powershell -ExecutionPolicy Bypass -File testing/run.ps1` using Node and pnpm supported by package.json. This builds Astro and checks the generated homepage.
Run pnpm preview and open the local URL. Verify navigation, signup/login links, responsive layout and no console errors. Run Lighthouse desktop three times and export reports. Record observations and screenshots. No production mutation.
