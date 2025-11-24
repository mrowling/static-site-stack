# Static Site Stack

An example repo for creating a static website and hosting on the cloud.

It takes an opinionated view, separating development from deployment into `web` and `infra` directories.

## Prerequisites

- Node.js installed
- AWS CLI installed
- AWS credentials configured

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Develop the Site

```bash
cd web
pnpm dev
```

Build for production:

```bash
pnpm build
```

### Deploy to AWS

```bash
cd infra
```

Log in to AWS using your desired method and configure your profile appropriately.

If this is the first time deploying to your AWS account:

```bash
pnpm cdk bootstrap
```

Deploy the stack:

```bash
pnpm deploy
```

The deployment will automatically build both the web and infra projects before deploying. After deployment, you'll see the CloudFront distribution URL in the outputs.

## CI/CD Setup

This project includes a GitHub Actions workflow that automatically deploys to AWS when code is merged to the `master` branch.

### Required GitHub Secrets

Configure this secret in your GitHub repository settings:

**AWS_ROLE_ARN** - The ARN of the IAM role for GitHub OIDC authentication (e.g., `arn:aws:iam::123456789012:role/GitHubActionsRole`)

The AWS region is configured in the workflow file (`.github/workflows/deploy.yml`).

### Setting Up AWS OIDC for GitHub Actions

To enable automated deployment for your repository, run the setup script:

```bash
./scripts/setup-github-oidc.sh
```

The script will automatically detect your repository and will create the necessary AWS infrastructure and add the secrets to GitHub.


## Tech Stack

### Tools

- **pnpm** - A modern node package manager that is much faster than npm
- **AWS CDK** - TypeScript-based infrastructure as code with generally faster feature adoption than other languages. Co-exists nicely with the front-end ecosystem
- **Vite** - Extremely fast in development with a rich ecosystem of production-ready plugins

### Cloud Technologies

- **AWS S3** - Cost-effective storage of static assets with versioning and lifecycle rules configured to retain only the 3 most recent noncurrent versions (expired after 360 days)
- **AWS CloudFront** - Global CDN providing faster response times and cheaper data transfer out. Provides HTTPS, caching, and compression
- **AWS ACM** - SSL/TLS certificates, courtesty of AWS Cloudfront.

## Features

- Caching of static assets (1 week for assets, 5 minutes for HTML)
- DDoS protection via AWS Shield
- S3 origin never exposed (Origin Access Control)
- S3 bucket versioning for rollback capability
- CloudFront managed security headers policy
- Lifecycle management to retain limited previous versions of files
- Automated CI/CD deployment via GitHub Actions

## Potential Enhancements

- AWS WAF for additional web application firewall protection
- S3 Intelligent Tiering for automatic cost optimization if longer lifecycle is required
- Custom domain with Route 53
- Multi-environment setup (dev, staging, production)
- CloudWatch alarms and monitoring dashboards

## Alternatives

**GitHub Pages** - Free static site hosting directly from a GitHub repository. Note: Only suitable if all data can be publicly available. 100GB per month bandwidth limit. Not intended for commercial services.

**Cloudflare Pages** - Similar concept to GitHub Pages with the ability to host Pages Functions, enabling dynamic functionality without running a dedicated server.

**AWS Amplify** - Managed service that can deploy web frameworks globally. Bundles CI/CD by connecting to a git repo.

**AWS Lightsail** - Run Nginx on a VM to serve static files. More traditional approach with full server control.

**Vercel** - Optimized for Next.js and modern web frameworks with excellent DX and automatic deployments.

**Netlify** - Popular JAMstack platform with built-in CI/CD, serverless functions, and edge network.
