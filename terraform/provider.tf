# Terraform required providers and backend block
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "my-game-terraform-state-bucket-unique" # REPLACE THIS
    key            = "dev/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "terraform-state-locking"              # REPLACE THIS
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
