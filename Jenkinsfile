pipeline {
    agent any

    environment {
        AZURE_SUBSCRIPTION_ID = credentials('azure-subscription-id')
        AZURE_TENANT_ID = credentials('azure-tenant-id')
        AZURE_CLIENT_ID = credentials('azure-client-id')
        AZURE_CLIENT_SECRET = credentials('azure-client-secret')
        DOCKER_IMAGE = "filevault"
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📦 Checking out code...'
                checkout scm
            }
        }
        
        stage('Azure Login') {
            steps {
                echo '🔐 Logging into Azure...'
                sh '''
                    az login --service-principal \
                        -u ${AZURE_CLIENT_ID} \
                        -p ${AZURE_CLIENT_SECRET} \
                        --tenant ${AZURE_TENANT_ID}
                    az account set --subscription ${AZURE_SUBSCRIPTION_ID}
                    echo "✅ Logged into Azure"
                '''
            }
        }
        
        stage('Terraform Init') {
            steps {
                echo '🔧 Initializing Terraform...'
                dir('terraform') {
                    sh 'terraform init'
                }
            }
        }
        
        stage('Terraform Plan') {
            steps {
                echo '📋 Planning Terraform changes...'
                dir('terraform') {
                    sh 'terraform plan -out=tfplan'
                }
            }
        }
        
        stage('Terraform Apply') {
            steps {
                echo '🚀 Applying Terraform configuration...'
                dir('terraform') {
                    sh 'terraform apply -auto-approve tfplan'
                }
            }
        }
        
        stage('Get Terraform Outputs') {
            steps {
                script {
                    echo '📤 Retrieving Terraform outputs...'
                    dir('terraform') {
                        env.STORAGE_ACCOUNT_NAME = sh(
                            script: 'terraform output -raw storage_account_name',
                            returnStdout: true
                        ).trim()
                        env.STORAGE_ACCOUNT_KEY = sh(
                            script: 'terraform output -raw storage_account_key',
                            returnStdout: true
                        ).trim()
                        env.CONTAINER_NAME = sh(
                            script: 'terraform output -raw container_name',
                            returnStdout: true
                        ).trim()
                        
                        echo "✅ Storage Account: ${env.STORAGE_ACCOUNT_NAME}"
                        echo "✅ Container: ${env.CONTAINER_NAME}"
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo '🐳 Building Docker image...'
                dir('src/azure-sa') {
                    sh '''
                        docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} .
                        docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKER_IMAGE}:latest
                    '''
                }
            }
        }
        
        stage('Stop Old Container') {
            steps {
                echo '🛑 Stopping old container...'
                sh '''
                    docker stop filevault 2>/dev/null || true
                    docker rm filevault 2>/dev/null || true
                '''
            }
        }
        
        stage('Run Application') {
            steps {
                echo '▶️  Starting application container...'
                sh '''
                    docker run -d \
                        --name filevault \
                        --network jenkins \
                        -p 3000:3000 \
                        -e AZURE_STORAGE_ACCOUNT_NAME=${STORAGE_ACCOUNT_NAME} \
                        -e AZURE_STORAGE_ACCOUNT_KEY=${STORAGE_ACCOUNT_KEY} \
                        -e AZURE_CONTAINER_NAME=${CONTAINER_NAME} \
                        -e PORT=3000 \
                        ${DOCKER_IMAGE}:latest
                '''
            }
        }
        
        stage('Verify Application') {
            steps {
                echo '✅ Verifying application is running...'
                sh '''
                    sleep 5
                    docker ps | grep filevault
                    docker logs filevault --tail 20
                '''
                echo '🎉 Application is accessible at http://localhost:3000'
            }
        }
    }
    
    post {
        always {
            echo '🧹 Cleaning up Docker resources...'
            sh 'docker system prune -f || true'
        }
        success {
            echo '✅ ====================================='
            echo '✅ Pipeline completed successfully!'
            echo '✅ Application running at: http://localhost:3000'
            echo '✅ ====================================='
        }
        failure {
            echo '❌ ====================================='
            echo '❌ Pipeline failed!'
            echo '❌ Check the logs above for errors'
            echo '❌ ====================================='
        }
    }
}