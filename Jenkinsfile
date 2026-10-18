
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

                    cp index.html /var/www/html/index.html

                    if [ -d admin ]; then
                        cp -r admin /var/www/html/
                    fi

                    for file in *.jpg *.jpeg *.png *.svg *.webp *.pdf; do
                        if [ -f "$file" ]; then
                            cp "$file" /var/www/html/
                        fi
                    done

                    echo "Portfolio deployment completed successfully"
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Portfolio deployed!'
        }
        failure {
            echo 'FAILED: Check Console Output.'
        }
    }
}
