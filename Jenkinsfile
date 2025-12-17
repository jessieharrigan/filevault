pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    environment {
        PATH = "/usr/local/bin:${env.PATH}"
    }

    stages {
        stage('Build') {
            steps {
                echo 'Building..'
                dir ('src/azure-sa') {
                    sh 'npm install'
                }
            }
        }
        stage('Linting') {
            steps {
                dir ('src/azure-sa') {
                    sh 'npm run lint'
                    echo 'Linting..'
                }
            }
        }
        stage('Test') {
            steps {
                echo 'Testing..'
            }
        }
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image..'
                dir ('src/azure-sa') {
                    withCredentials([
                        string(credentialsId: 'AZURE_STORAGE_ACCOUNT_NAME', variable: 'AZURE_STORAGE_ACCOUNT_NAME'),
                        string(credentialsId: 'AZURE_STORAGE_ACCOUNT_KEY', variable: 'AZURE_STORAGE_ACCOUNT_KEY'),
                        string(credentialsId: 'AZURE_CONTAINER_NAME', variable: 'AZURE_CONTAINER_NAME'),
                        string(credentialsId: 'port', variable: 'PORT')
                    ]) {
                        sh '''
                            cat > .env << EOF
AZURE_STORAGE_ACCOUNT_NAME=${AZURE_STORAGE_ACCOUNT_NAME}
AZURE_STORAGE_ACCOUNT_KEY=${AZURE_STORAGE_ACCOUNT_KEY}
AZURE_CONTAINER_NAME=${AZURE_CONTAINER_NAME}
PORT=${PORT}
EOF
                        '''
                        sh 'docker-compose build'
                    }
                }
            }
        }
        stage('Deploy Container') {
            steps {
                echo 'Deploying container..'
                dir ('src/azure-sa') {
                    withCredentials([
                        string(credentialsId: 'AZURE_STORAGE_ACCOUNT_NAME', variable: 'AZURE_STORAGE_ACCOUNT_NAME'),
                        string(credentialsId: 'AZURE_STORAGE_ACCOUNT_KEY', variable: 'AZURE_STORAGE_ACCOUNT_KEY'),
                        string(credentialsId: 'AZURE_CONTAINER_NAME', variable: 'AZURE_CONTAINER_NAME'),
                        string(credentialsId: 'port', variable: 'PORT')
                    ]) {
                        sh '''
                            cat > .env << EOF
AZURE_STORAGE_ACCOUNT_NAME=${AZURE_STORAGE_ACCOUNT_NAME}
AZURE_STORAGE_ACCOUNT_KEY=${AZURE_STORAGE_ACCOUNT_KEY}
AZURE_CONTAINER_NAME=${AZURE_CONTAINER_NAME}
PORT=${PORT}
EOF
                        '''
                        sh 'docker-compose down || true'
                        sh 'docker-compose up -d'
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up..'
            dir ('src/azure-sa') {
                sh 'rm -f .env'
                sh 'docker image prune -f || true'
            }
        }
    }
}