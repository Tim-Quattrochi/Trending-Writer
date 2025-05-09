//https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#loading-environment-variables-with-nextenv

import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);
