pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
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
    }
}