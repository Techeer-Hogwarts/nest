module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint/eslint-plugin'],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
    ],
    root: true,
    env: {
        node: true,
        jest: true,
    },
    ignorePatterns: ['.eslintrc.js', 'dist/**'],
    rules: {
        'no-console': 'error', // console 명령어 금지
        // indent: ['error', 4],
        // semi: ['error', 'always'], // 세미콜론 사용
        'array-element-newline': [
            'error',
            {
                ArrayExpression: { multiline: true, minItems: 3 }, // 배열의 요소가 3개 이상일 경우, 각각 한 줄씩
            },
        ],
        // quotes: [2, 'single', { avoidEscape: false }], // ', `만 허용
        eqeqeq: [2, 'allow-null'], // == 금지
        'no-empty': ['error', { allowEmptyCatch: false }], // 빈 catch 금지
        'eol-last': 2, // 파일 끝에 개행문자가 없을 경우 경고
        camelcase: ['error', { properties: 'never' }], // 변수, 함수명 카멜케이스 강제
        'space-in-parens': [2, 'never'], // () 안에 공백을 추가하지 않음
        'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }], // 빈 줄 최대 1개
        'space-before-blocks': [2, 'always'], // 블록 앞에 공백을 강제
        // 'brace-style': [2, '1tbs', { allowSingleLine: true }], // 중괄호 스타일
        '@typescript-eslint/explicit-function-return-type': 2, // 명시적 함수 반환 타입 허용
        '@typescript-eslint/explicit-module-boundary-types': 0, // 명시적 모듈 바운더리 타입 허용
        '@typescript-eslint/no-explicit-any': 0, // any 허용
        'function-paren-newline': ['error', 'consistent'], // 함수 생성 시 인자가 여러 줄일 경우, 첫번째 인자는 첫 줄에, 나머지는 각각 한 줄씩
        'object-property-newline': [
            'error',
            { allowAllPropertiesOnSameLine: false },
        ], // 객체의 프로퍼티가 여러 줄일 경우, 첫번째 프로퍼티는 첫 줄에, 나머지는 각각 한 줄씩
        'object-curly-spacing': ['error', 'always'], // {} 사이 공백 강제
        'function-call-argument-newline': ['off'], // 함수 호출 시 인자에 줄바꿈 금지
        'max-len': [2, 200, 4, { ignoreUrls: true }], // 한 줄의 최대 길이, url은 예외
    },
};
