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
                git branch: 'master', url: "https://github.com/Techeer-Hogwarts/nest.git"
            }
        }

        stage('Test') {
            steps {
                script {
                    sh "docker --version"
                    sh "node -v"
                    sh "npm install"  // 의존성 설치
                    // sh "npm run test" // Jest 테스트 실행
                }
            }
        }

        stage('Lint') {  // Lint 스테이지 추가
            steps {
                script {
                    // sh "npm install" // 패키지 설치 (ESLint 등)
                    sh "npm run lint" // ESLint 실행
                    
                }
            }
        }

        stage('Set Image Tag') {
            steps {
                script {
                    // Set image tag based on branch name
                    if (env.BRANCH_NAME == 'main') {
                        IMAGE_TAG = "1.1.${BUILD_NUMBER}"
                    } else {
                        IMAGE_TAG = "0.1.${BUILD_NUMBER}"
                    }
                    echo "Image tag set to: ${IMAGE_TAG}"
                }
            }
        }

        stage('Building our image') {
            steps {
                script {
                    sh "docker build -t ${repository}:${IMAGE_TAG} -f Dockerfile ." // docker build

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
            slackSend message: "Build deployed successfully - ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)", color: 'good'
        }
        failure {
            echo 'Build or deployment failed.'
            slackSend failOnError: true, message: "Build failed  - ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)", color: 'danger'
        }
    }
}