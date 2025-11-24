# Static Site Infrastructure - CDK

This CDK project defines the cloud infrastructure for hosting a static website on AWS using S3, CloudFront, and Origin Access Control.

## Architecture

The stack deploys:
- **S3 Bucket**: Private bucket with versioning and lifecycle rules (retains 3 noncurrent versions)
- **CloudFront Distribution**: Global CDN with managed security headers policy
- **Origin Access Control**: Ensures S3 bucket is only accessible via CloudFront
- **Bucket Deployments**: Automated deployment of web assets with differentiated caching strategies
  - HTML files: 5-minute cache for fast rollback
  - Static assets: 1-week cache for performance

## Useful commands

* `pnpm run build`   compile typescript to js
* `pnpm run watch`   watch for changes and compile
* `pnpm run test`    perform the jest unit tests
* `pnpm run deploy`  deploy this stack to your default AWS account/region
* `pnpm cdk diff`    compare deployed stack with current state
* `pnpm cdk synth`   emits the synthesized CloudFormation template
* `pnpm cdk bootstrap` (first-time only) prepare your AWS account for CDK deployments

## Outputs

After deployment, the stack outputs:
- **DistributionDomainName**: CloudFront domain name (e.g., `d1234abcd.cloudfront.net`)
- **DistributionUrl**: Full HTTPS URL to access your site
