pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Building..'
            }
        }
        stage('Linting') {
            steps {
                sh 'npm run lint'
                echo 'Linting..'
            }
        }
        stage('Test') {
            steps {
                echo 'Testing..'
            }
        }
    }
}