pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    stages {
        stage('Build') {
            steps {
                echo 'Building..'
            }
        }
        stage('Linting') {
            steps {
                dir ('src/azure-sa') {
                    sh 'npm install'
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