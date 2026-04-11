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

        // ✅ STEP 1: Create ONLY S3 bucket
        stage('Create S3 Backend') {
            steps {
                dir("${TF_DIR}") {
                    sh '''
                    sed -i '/backend "s3"/,/}/d' provider.tf

                    terraform init
                    terraform apply -target=aws_s3_bucket.tf_state -auto-approve
                    '''
                }
            }
        }

        // ✅ Wait
        stage('Sleep') {
            steps {
                sleep time: 60, unit: 'SECONDS'
            }
        }

        // ✅ STEP 2: Enable backend
        stage('Init Backend') {
            steps {
                dir("${TF_DIR}") {
                    sh '''
                    git checkout provider.tf
                    terraform init -reconfigure
                    '''
                }
            }
        }

        // ✅ STEP 3: FULL INFRA create
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
                        echo "ALB: ${ALBDns}"

                        retry(5) {
                            sleep time: 60, unit: 'SECONDS'
                            def response = sh(script: "curl -s -o /dev/null -w '%{http_code}' http://${ALBDns}", returnStdout: true).trim()
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
