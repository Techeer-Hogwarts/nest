pipeline {
    agent any

    environment {
        repository = "suhach0523/techeerism-nest"  // docker hub id와 repository 이름
        DOCKERHUB_CREDENTIALS = credentials('docker-hub') // jenkins에 등록해 놓은 docker hub credentials 이름
        IMAGE_TAG = "" // docker image tag
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                git branch: 'develop', url: "https://github.com/Techeer-Hogwarts/nest.git"
            }
        }

        stage('Test') {
            steps {
                script {
                    sh "docker --version"
                }
            }
        }

        stage('Set Image Tag') {
            steps {
                script {
                    // Set image tag based on branch name
                    if (env.BRANCH_NAME == 'develop') {
                        IMAGE_TAG = "1.0.${BUILD_NUMBER}"
                    } else {
                        IMAGE_TAG = "0.0.${BUILD_NUMBER}"
                    }
                    echo "Image tag set to: ${IMAGE_TAG}"
                }
            }
        }

        stage('Building our image') {
            steps {
                script {
                    sh "docker build -t ${repository}:${IMAGE_TAG} ." // docker build

                }
            }
        }
        stage('Login'){
            steps{
                sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin" // docker hub 로그인
            }
        }
        stage('Deploy our image') {
            steps {
                script {
                    sh "docker push ${repository}:${IMAGE_TAG}"//docker push
                }
            }
        }
        stage('Cleaning up') {
            steps {
                sh "docker rmi ${repository}:${IMAGE_TAG}" // docker image 제거
            }
        }
    }

    post {
        always {
            cleanWs(cleanWhenNotBuilt: false,
                    deleteDirs: true,
                    disableDeferredWipeout: true,
                    notFailBuild: true,
                    patterns: [[pattern: '.gitignore', type: 'INCLUDE'],
                            [pattern: '.propsfile', type: 'EXCLUDE']])
        }
        success {
            echo 'Build and deployment successful!'
        }
        failure {
            echo 'Build or deployment failed.'
        }
    }
}