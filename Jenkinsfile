
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        DOCKER_IMAGE = 'ranjithkumarrk27/project-2-cicd'
        APP_CONTAINER = 'project-2-app'
        APP_PORT = '3001'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo 'Static website source code checked out.'
            }
        }

        stage('Verify Environment') {
            steps {
                sh '''
                    set -eu

                    echo "Docker version:"
                    docker --version

                    echo "Website files:"
                    ls -la

                    test -f index.html
                    echo "index.html found successfully."
                '''
            }
        }

        stage('Validate Static Website') {
            steps {
                sh '''
                    set -eu

                    test -s index.html

                    grep -qi '<html' index.html

                    echo "Static website validation passed."
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        set -eu

                        /var/jenkins_home/tools/hudson.plugins.sonar.SonarRunnerInstallation/SonarScanner/bin/sonar-scanner
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    script {
                        def qualityGate = waitForQualityGate(
                            abortPipeline: true
                        )

                        echo "SonarQube Quality Gate: ${qualityGate.status}"
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    set -eu

                    docker build \
                        -t "$DOCKER_IMAGE:$BUILD_NUMBER" \
                        -t "$DOCKER_IMAGE:latest" .
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKERHUB_USER',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    sh '''
                        set -eu
                        set +x

                        echo "$DOCKERHUB_TOKEN" | docker login \
                            --username "$DOCKERHUB_USER" \
                            --password-stdin

                        docker push "$DOCKER_IMAGE:$BUILD_NUMBER"
                        docker push "$DOCKER_IMAGE:latest"

                        docker logout
                    '''
                }
            }
        }

        stage('Deploy Static Website') {
            steps {
                sh '''
                    set -eu

                    docker pull "$DOCKER_IMAGE:latest"

                    docker rm -f "$APP_CONTAINER" || true

                    docker run -d \
                        --name "$APP_CONTAINER" \
                        --restart unless-stopped \
                        -p "$APP_PORT:80" \
                        "$DOCKER_IMAGE:latest"

                    echo "Static website container started."
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    set -eu

                    ATTEMPTS=12

                    for i in $(seq 1 "$ATTEMPTS"); do
                        if curl -fsS \
                            "http://127.0.0.1:$APP_PORT/" \
                            -o /dev/null; then

                            echo "Website health check passed."
                            exit 0
                        fi

                        echo "Waiting for website... ($i/$ATTEMPTS)"
                        sleep 5
                    done

                    echo "Website health check failed."
                    docker logs "$APP_CONTAINER" || true
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Static website CI/CD completed.'
        }

        failure {
            echo 'FAILED: Check the Jenkins Console Output.'
        }

        always {
            echo "Pipeline finished with status: ${currentBuild.currentResult}"
        }
    }
}
