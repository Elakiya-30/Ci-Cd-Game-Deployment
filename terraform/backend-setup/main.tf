# Random ID to ensure the S3 bucket name is globally unique
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# 1. S3 Bucket for Terraform State
resource "aws_s3_bucket" "terraform_state" {
  bucket = "aws-game-terraform-state-${random_id.bucket_suffix.hex}"
  
  lifecycle {
    prevent_destroy = true # Prevents accidental deletion of the state bucket
  }
}

# Enable Versioning
resource "aws_s3_bucket_versioning" "terraform_state_versioning" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable Server-Side Encryption by default
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state_crypto" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block all public access to the S3 bucket
resource "aws_s3_bucket_public_access_block" "terraform_state_public_access" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 2. DynamoDB Table for State Locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "game-terraform-state-locking"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

# Output the names so you can copy-paste them into your main provider.tf
output "s3_bucket_name" {
  value       = aws_s3_bucket.terraform_state.bucket
  description = "COPY THIS into the 'bucket' field of your main provider.tf backend block"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.terraform_locks.name
  description = "COPY THIS into the 'dynamodb_table' field of your main provider.tf backend block"
}
