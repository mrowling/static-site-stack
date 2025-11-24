import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60;
    const FIVE_MINUTES_IN_SECONDS = 5 * 60;

    const destinationKeyPrefix = 'www/static';
    const shortCachePaths = ['/index.html'];

    // Private bucket - only CloudFront can access via Origin Access Control
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true, // Enable object versioning for rollback capability
      lifecycleRules: [
        {
          noncurrentVersionsToRetain: 3,
          noncurrentVersionExpiration: cdk.Duration.days(360),
        },
      ],
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket, {
          originPath: `/${destinationKeyPrefix}`,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      },
      defaultRootObject: 'index.html',
    });

    // Deploy HTML entry files with short cache for fast rollback.
    new s3Deployment.BucketDeployment(this, 'DeployWebsiteHtml', {
      sources: [s3Deployment.Source.asset('./../web/dist')],
      destinationBucket: websiteBucket,
      destinationKeyPrefix,
      distribution,
      distributionPaths: shortCachePaths,
      include: shortCachePaths,
      cacheControl: [
        s3Deployment.CacheControl.maxAge(cdk.Duration.seconds(FIVE_MINUTES_IN_SECONDS)),
      ],
      prune: false, // Avoid deleting other objects in prefix
    });

    // Deploy remaining static assets with long cache.
    new s3Deployment.BucketDeployment(this, 'DeployWebsiteAssets', {
      sources: [s3Deployment.Source.asset('./../web/dist')],
      destinationBucket: websiteBucket,
      destinationKeyPrefix,
      distribution,
      exclude: shortCachePaths,
      cacheControl: [
        s3Deployment.CacheControl.maxAge(cdk.Duration.seconds(ONE_WEEK_IN_SECONDS)),
      ],
      prune: false,
    });

    // Output the CloudFront distribution URL
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
    });

  }
}
