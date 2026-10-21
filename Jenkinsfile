
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
        APP_INTERNAL_PORT = '3000'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo 'Source code checked out successfully.'
            }
        }

        stage('Verify Environment') {
            steps {
                sh '''
                    set -eu

                    echo "Node.js version:"
                    node --version

                    echo "NPM version:"
                    npm --version

                    echo "Docker version:"
                    docker --version
                '''
            }
        }

        stage('Install and Test') {
            steps {
                sh '''
                    set -eu
                    npm install
                    npm test
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

        stage('Deploy to EC2') {
            steps {
                sh '''
                    set -eu

                    docker pull "$DOCKER_IMAGE:latest"

                    docker rm -f "$APP_CONTAINER" || true

                    docker run -d \
                        --name "$APP_CONTAINER" \
                        --restart unless-stopped \
                        -p "$APP_PORT:$APP_INTERNAL_PORT" \
                        "$DOCKER_IMAGE:latest"

                    echo "Application container started."
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    set -eu

                    ATTEMPTS=12

                    for i in $(seq 1 "$ATTEMPTS"); do
                        if docker exec "$APP_CONTAINER" node -e "
                            fetch('http://127.0.0.1:3000/health')
                              .then(async r => {
                                console.log(await r.text());
                                process.exit(r.ok ? 0 : 1);
                              })
                              .catch(() => process.exit(1));
                        "; then
                            echo "Application health check passed."
                            exit 0
                        fi

                        echo "Waiting for application... ($i/$ATTEMPTS)"
                        sleep 5
                    done

                    echo "Health check failed."
                    docker logs "$APP_CONTAINER" || true
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: CI/CD pipeline completed successfully.'

            emailext(
                to: 'YOUR_EMAIL@gmail.com',
                subject: "SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
Hello,

Your CI/CD pipeline completed successfully.

Job: ${env.JOB_NAME}
Build Number: ${env.BUILD_NUMBER}
Status: ${currentBuild.currentResult}

Completed stages:
- Node.js tests
- SonarQube analysis and Quality Gate
- Docker image build and Docker Hub push
- EC2 deployment
- Application health check

Console Output:
${env.BUILD_URL}console

Regards,
Jenkins CI/CD
"""
            )
        }

        failure {
            echo 'FAILED: Please check the Jenkins Console Output.'

            emailext(
                to: 'YOUR_EMAIL@gmail.com',
                subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
Hello,

Your CI/CD pipeline failed.

Job: ${env.JOB_NAME}
Build Number: ${env.BUILD_NUMBER}
Status: ${currentBuild.currentResult}

Please check the Console Output to identify the failing stage.

Console Output:
${env.BUILD_URL}console

Regards,
Jenkins CI/CD
"""
            )
        }

        always {
            echo "Pipeline finished with status: ${currentBuild.currentResult}"
        }
    }
}
