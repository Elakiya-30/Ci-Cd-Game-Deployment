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
                git branch: 'main', url: 'https://github.com/Elakiya-30/Ci-Cd-Game-Deployment.git'
            }
        }

        // ✅ Step 1: Create S3 bucket (without backend)
        stage('Create S3 Bucket') {
            steps {
                dir("${TF_DIR}") {
                    sh '''
                    # remove backend temporarily
                    sed -i '/backend "s3"/,/}/d' provider.tf

                    terraform init
                    terraform apply -auto-approve
                    '''
                }
            }
        }

        // ✅ Sleep (wait for AWS consistency)
        stage('Sleep') {
            steps {
                sleep time: 60, unit: 'SECONDS'
            }
        }

        // ✅ Step 2: Re-enable backend
        stage('Terraform Init (Backend)') {
            steps {
                dir("${TF_DIR}") {
                    sh '''
                    git checkout provider.tf
                    terraform init -reconfigure
                    '''
                }
            }
        }

        // ✅ Plan
        stage('Terraform Plan') {
            steps {
                dir("${TF_DIR}") {
                    sh 'terraform plan -out=tfplan'
                }
            }
        }

        // ✅ Apply
        stage('Terraform Apply') {
            steps {
                dir("${TF_DIR}") {
                    sh 'terraform apply -auto-approve tfplan'
                }
            }
        }

        // ✅ Ansible
        stage('Ansible Configuration') {
            steps {
                dir("${ANSIBLE_DIR}") {
                    sh 'ansible-playbook playbook.yml'
                }
            }
        }

        // ✅ Health Check
        stage('Health Check') {
            steps {
                dir("${TF_DIR}") {
                    script {
                        def ALBDns = sh(script: 'terraform output -raw alb_dns_name', returnStdout: true).trim()
                        echo "ALB is at: ${ALBDns}"

                        retry(5) {
                            sleep time: 60, unit: 'SECONDS'
                            def response = sh(script: "curl -s -o /dev/null -w '%{http_code}' http://${ALBDns}", returnStdout: true).trim()
                            if (response != "200") {
                                error "Health check failed with HTTP code ${response}"
                            }
                        }
                    }
                }
            }
        }
    }
    
    post {
        failure {
            echo "Pipeline failed."
        }
        success {
            echo "Pipeline completed successfully!"
        }
    }
}
