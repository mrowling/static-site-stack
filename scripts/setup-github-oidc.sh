#!/bin/bash

# Script to set up AWS OIDC provider and IAM role for GitHub Actions
# Usage: ./scripts/setup-github-oidc.sh

set -e

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Get repository info from gh CLI
REPO_INFO=$(gh repo view --json nameWithOwner,name,owner -q '{full: .nameWithOwner}')
REPO_FULL_NAME=$(echo "$REPO_INFO" | jq -r '.full')

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Setting up GitHub OIDC for repository: ${REPO_FULL_NAME}"
echo "AWS Account ID: ${ACCOUNT_ID}"
echo ""

# Check if OIDC provider already exists
OIDC_PROVIDER_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "${OIDC_PROVIDER_ARN}" 2>/dev/null; then
    echo "OIDC provider already exists"
else
    echo "Creating OIDC provider..."
    aws iam create-open-id-connect-provider \
        --url https://token.actions.githubusercontent.com \
        --client-id-list sts.amazonaws.com \
        --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
    echo "OIDC provider created"
fi

# Create trust policy
TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "${OIDC_PROVIDER_ARN}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${REPO_FULL_NAME}:ref:refs/heads/master"
        }
      }
    }
  ]
}
EOF
)

ROLE_NAME="GitHubActionsDeployRole"

# Check if role already exists
if aws iam get-role --role-name "${ROLE_NAME}" 2>/dev/null; then
    echo "IAM role ${ROLE_NAME} already exists"
    echo "Updating trust policy..."
    echo "${TRUST_POLICY}" > /tmp/trust-policy.json
    aws iam update-assume-role-policy \
        --role-name "${ROLE_NAME}" \
        --policy-document file:///tmp/trust-policy.json
    rm /tmp/trust-policy.json
    echo "Trust policy updated"
else
    echo "Creating IAM role ${ROLE_NAME}..."
    echo "${TRUST_POLICY}" > /tmp/trust-policy.json
    aws iam create-role \
        --role-name "${ROLE_NAME}" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "Role for GitHub Actions to deploy CDK stack"
    rm /tmp/trust-policy.json
    echo "IAM role created"
fi

# Attach AdministratorAccess policy (or create a more restrictive policy if preferred)
echo "Attaching AdministratorAccess policy to role..."
aws iam attach-role-policy \
    --role-name "${ROLE_NAME}" \
    --policy-arn "arn:aws:iam::aws:policy/AdministratorAccess"
echo "Policy attached"

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

echo ""
echo "GitHub Secret Required:"
echo "AWS_ROLE_ARN=${ROLE_ARN}"
echo ""

echo "Adding secret to GitHub repository..."
gh secret set AWS_ROLE_ARN --body "${ROLE_ARN}" --repo "${REPO_FULL_NAME}"

echo "=========================================="
echo "Setup complete!"
echo "=========================================="
