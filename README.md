# Arch Engineering Services

Production website for Arch Engineering Services, LLC, built with Next.js,
Vinext, Vite, and Cloudflare Workers.

## Local development

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run build
```

## Deploy to Cloudflare

The repository is ready for Cloudflare Workers Builds.

- Production branch: `main`
- Install command: `npm install`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

For a manual authenticated deployment, run:

```bash
npm run deploy
```

After verifying the generated `workers.dev` address, attach
`archengineeringservices.com` and `www.archengineeringservices.com` as custom
domains in the Cloudflare Worker dashboard. Preserve all existing MX, DKIM,
SPF, DMARC, and other email-related DNS records.
