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
                    sh 'docker --version'
                    sh 'docker-compose --version'
                    sh 'docker-compose build'
                }
            }
        }
        stage('Deploy Container') {
            steps {
                echo 'Deploying container..'
                dir ('src/azure-sa') {
                    sh 'docker-compose down || true'
                    sh 'docker-compose up -d'
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up..'
            dir ('src/azure-sa') {
                sh 'docker image prune -f || true'
            }
        }
    }
}