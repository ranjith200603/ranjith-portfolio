
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Files') {
            steps {
                sh '''
                    set -eu
                    test -f index.html
                    echo "Portfolio files verified"
                '''
            }
        }

        stage('Deploy Portfolio') {
            steps {
                sh '''
                    set -eu
                    sudo cp index.html /var/www/html/index.html
                    sudo cp -r admin /var/www/html/ 2>/dev/null || true
                    sudo cp -r *.jpg /var/www/html/ 2>/dev/null || true
                    sudo cp -r *.png /var/www/html/ 2>/dev/null || true
                    echo "Portfolio deployment completed"
                '''
            }
        }
    }

    post {
        success {
            echo 'Portfolio deployed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check the console output.'
        }
    }
}
