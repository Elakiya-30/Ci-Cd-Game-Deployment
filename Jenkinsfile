pipeline {
    agent any

    environment {
        AWS_REGION  = "ap-south-1"
        TF_DIR      = "terraform"
        BACKEND_DIR = "terraform/backend-setup"
        ANSIBLE_DIR = "ansible"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Elakiya-30/Ci-Cd-Game-Deployment.git'
            }
        }

        stage('Create Backend Infra') {
            steps {
                dir("${BACKEND_DIR}") {
                    sh '''
                        terraform init
                        terraform apply -auto-approve
                    '''
                }
            }
        }

        stage('Verify Backend') {
            steps {
                sh '''
                    aws s3api head-bucket --bucket my-game-terraform-state-bucket-elakiya-123
                    aws dynamodb describe-table --table-name game-terraform-state-locking --region ${AWS_REGION}
                '''
            }
        }

        stage('Init Main Terraform') {
            steps {
                dir("${TF_DIR}") {
                    sh '''
                        rm -rf .terraform
                        terraform init -reconfigure
                    '''
                }
            }
        }

        stage('Terraform Plan') {
            steps {
                dir("${TF_DIR}") {
                    sh 'terraform plan -out=tfplan'
                }
            }
        }

        stage('Terraform Apply') {
            steps {
                dir("${TF_DIR}") {
                    sh 'terraform apply -auto-approve tfplan'
                }
            }
        }

        stage('Ansible Configuration') {
            steps {
                dir("${ANSIBLE_DIR}") {
                    sh 'ansible-playbook playbook.yml'
                }
            }
        }

        stage('Health Check') {
            steps {
                dir("${TF_DIR}") {
                    script {
                        def ALBDns = sh(script: 'terraform output -raw alb_dns_name', returnStdout: true).trim()
                        echo "ALB: ${ALBDns}"

                        retry(5) {
                            sleep time: 60, unit: 'SECONDS'
                            def response = sh(
                                script: "curl -s -o /dev/null -w '%{http_code}' http://${ALBDns}",
                                returnStdout: true
                            ).trim()

                            if (response != "200") {
                                error "Health check failed: ${response}"
                            }
                        }
                    }
                }
            }
        }
    }
}
