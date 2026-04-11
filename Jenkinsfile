pipeline {
    agent any
    
    environment {
        AWS_REGION = "ap-south-1"
        TF_DIR = "terraform"
        ANSIBLE_DIR = "ansible"
    }
    
    stages {
        stage('Checkout') {
            steps {
                // Pull code explicitly from your GitHub repository
                git branch: 'master', url: 'https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git'
            }
        }
        
        stage('Terraform Init & Plan') {
            steps {
                dir("${TF_DIR}") {
                    sh 'terraform init'
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
                    // Make sure AWS credentials are available in environment for aws_ec2 plugin
                    sh 'ansible-playbook playbook.yml'
                }
            }
        }
        
        stage('Health Check') {
            steps {
                dir("${TF_DIR}") {
                    script {
                        def ALBDns = sh(script: 'terraform output -raw alb_dns_name', returnStdout: true).trim()
                        echo "ALB is at: ${ALBDns}"
                        
                        // Retry loop for the health check up to 5 times
                        retry(5) {
                            sleep time: 10, unit: 'SECONDS'
                            def response = sh(script: "curl -s -o /dev/null -w '%{http_code}' http://${ALBDns}", returnStdout: true).trim()
                            if (response != "200") {
                                error "Health check failed with HTTP code ${response}"
                            }
                        }
                        echo "Game is successfully deployed and reachable!"
                    }
                }
            }
        }
    }
    
    post {
        failure {
            echo "Pipeline failed. Executing manual rollback steps or sending alerts."
            // In a real environment, you might run `terraform destroy` but it's dangerous without approval.
            // Sending an alert is better.
        }
        success {
            echo "Pipeline completed successfully!"
        }
    }
}
