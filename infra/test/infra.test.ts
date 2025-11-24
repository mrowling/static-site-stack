import { describe, test, beforeAll } from 'vitest';
import * as cdk from 'aws-cdk-lib/core';
import { Template } from 'aws-cdk-lib/assertions';
import * as Infra from '../lib/infra-stack';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('InfraStack', () => {
    let mockAssetPath: string;

    beforeAll(() => {
        // Create a temporary directory to use as mock asset path
        mockAssetPath = fs.mkdtempSync(path.join(os.tmpdir(), 'cdk-test-assets-'));
        // Create an almost empty html file so the asset path is valid
        fs.writeFileSync(path.join(mockAssetPath, 'index.html'), '<html></html>');
    });

    test('Creates S3 bucket with versioning and lifecycle rules', () => {
        const app = new cdk.App();
        const stack = new Infra.InfraStack(app, 'TestStack', { assetPath: mockAssetPath });
        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::S3::Bucket', {
            VersioningConfiguration: {
                Status: 'Enabled',
            },
            LifecycleConfiguration: {},
        });
    });

    test('Creates CloudFront distribution', () => {
        const app = new cdk.App();
        const stack = new Infra.InfraStack(app, 'TestStack', { assetPath: mockAssetPath });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::CloudFront::Distribution', 1);
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
            DistributionConfig: {
                DefaultRootObject: 'index.html',
            },
        });
    });

    test('Creates two S3 bucket deployments', () => {
        const app = new cdk.App();
        const stack = new Infra.InfraStack(app, 'TestStack', { assetPath: mockAssetPath });
        const template = Template.fromStack(stack);

        // BucketDeployment creates custom resources backed by Lambda
        template.resourceCountIs('Custom::CDKBucketDeployment', 2);
    });

    test('CloudFront distribution uses managed security headers policy', () => {
        const app = new cdk.App();
        const stack = new Infra.InfraStack(app, 'TestStack', { assetPath: mockAssetPath });
        const template = Template.fromStack(stack);

        // Verify the distribution uses the managed security headers policy
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
            DistributionConfig: {
                DefaultCacheBehavior: {
                    ResponseHeadersPolicyId: '67f7725c-6f97-4210-82d7-5512b31e9d03', // Managed SECURITY_HEADERS policy
                },
            },
        });
    });
});
