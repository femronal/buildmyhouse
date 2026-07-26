#!/usr/bin/env node
/**
 * Publishes a CloudFront viewer-request function that:
 * - 301-redirects legacy alias URLs
 * - Rewrites extensionless routes to .html so S3 serves per-route SEO HTML
 * Requires AWS_CLOUDFRONT_HOMEOWNER_ID and IAM permissions for cloudfront:* on functions + distribution.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const FUNCTION_NAME = 'buildmyhouse-homeowner-legacy-redirects';
const distributionId = process.env.AWS_CLOUDFRONT_HOMEOWNER_ID;
const region = process.env.AWS_REGION || 'eu-north-1';

if (!distributionId) {
  console.log('[cf-redirects] Skipped: AWS_CLOUDFRONT_HOMEOWNER_ID not set');
  process.exit(0);
}

const functionPath = path.resolve(process.cwd(), 'cloudfront/viewer-redirects.js');
if (!fs.existsSync(functionPath)) {
  throw new Error(`[cf-redirects] Missing ${functionPath}`);
}

function aws(args) {
  return execFileSync('aws', [...args, '--region', region], { encoding: 'utf8' }).trim();
}

function awsJson(args) {
  return JSON.parse(aws(args));
}

let etag;
try {
  const existing = awsJson(['cloudfront', 'describe-function', '--name', FUNCTION_NAME]);
  etag = existing.ETag;
  const updated = awsJson([
    'cloudfront',
    'update-function',
    '--name',
    FUNCTION_NAME,
    '--if-match',
    etag,
    '--function-config',
    'Comment=Legacy redirects + clean URL to .html rewrite,Runtime=cloudfront-js-2.0',
    '--function-code',
    `fileb://${functionPath}`,
  ]);
  etag = updated.ETag;
  console.log(`[cf-redirects] Updated function ${FUNCTION_NAME}`);
} catch {
  const created = awsJson([
    'cloudfront',
    'create-function',
    '--name',
    FUNCTION_NAME,
    '--function-config',
    'Comment=Legacy redirects + clean URL to .html rewrite,Runtime=cloudfront-js-2.0',
    '--function-code',
    `fileb://${functionPath}`,
  ]);
  etag = created.ETag;
  console.log(`[cf-redirects] Created function ${FUNCTION_NAME}`);
}

const published = awsJson(['cloudfront', 'publish-function', '--name', FUNCTION_NAME, '--if-match', etag]);
const functionArn = published.FunctionSummary?.FunctionMetadata?.FunctionARN;
if (!functionArn) {
  throw new Error('[cf-redirects] publish-function did not return FunctionARN');
}

console.log(`[cf-redirects] Published ${functionArn}`);

const distConfig = awsJson([
  'cloudfront',
  'get-distribution-config',
  '--id',
  distributionId,
]);
const config = distConfig.DistributionConfig;
const configEtag = distConfig.ETag;

const association = {
  EventType: 'viewer-request',
  FunctionARN: functionArn,
};

if (!config.DefaultCacheBehavior?.FunctionAssociations?.Items) {
  config.DefaultCacheBehavior.FunctionAssociations = { Quantity: 0, Items: [] };
} else {
  config.DefaultCacheBehavior.FunctionAssociations.Items =
    config.DefaultCacheBehavior.FunctionAssociations.Items.filter(
      (item) => item.EventType !== 'viewer-request',
    );
}

config.DefaultCacheBehavior.FunctionAssociations.Items.push(association);
config.DefaultCacheBehavior.FunctionAssociations.Quantity =
  config.DefaultCacheBehavior.FunctionAssociations.Items.length;

// Stop soft-404s: missing objects must not return homepage HTML with HTTP 200.
// Legitimate public routes are prebuilt as .html during deploy.
config.CustomErrorResponses = {
  Quantity: 2,
  Items: [
    {
      ErrorCode: 403,
      ResponsePagePath: '/404.html',
      ResponseCode: '404',
      ErrorCachingMinTTL: 60,
    },
    {
      ErrorCode: 404,
      ResponsePagePath: '/404.html',
      ResponseCode: '404',
      ErrorCachingMinTTL: 60,
    },
  ],
};

const configPath = path.join(process.cwd(), '.cf-distribution-config.json');
fs.writeFileSync(configPath, JSON.stringify(config));
aws(['cloudfront', 'update-distribution', '--id', distributionId, '--if-match', configEtag, '--distribution-config', `file://${configPath}`]);
fs.unlinkSync(configPath);

console.log(`[cf-redirects] Attached viewer-request function to distribution ${distributionId}`);
console.log('[cf-redirects] Custom error responses now return /404.html with HTTP 404');
