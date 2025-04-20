module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint/eslint-plugin', 'import'],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
    ],
    root: true,
    env: {
        node: true,
        jest: true,
    },
    ignorePatterns: ['.eslintrc.js', 'dist/**'],
    settings: {
        'import/resolver': {
            typescript: {},
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
    },
    rules: {
        'no-console': 'warn', // console 명령어 금지
        eqeqeq: [2, 'allow-null'], // == 금지
        'no-empty': ['error', { allowEmptyCatch: false }], // 빈 catch 금지
        'eol-last': 2, // 파일 끝에 개행문자가 없을 경우 경고
        camelcase: [
            'error',
            {
                properties: 'never',
                allow: ['drive_v3'], // drive_v3를 예외로 설정
            },
        ], // 변수, 함수명 카멜케이스 강제
        'space-in-parens': [2, 'never'], // () 안에 공백을 추가하지 않음
        'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }], // 빈 줄 최대 1개
        'space-before-blocks': [2, 'always'], // 블록 앞에 공백을 강제
        // 'brace-style': [2, '1tbs', { allowSingleLine: true }], // 중괄호 스타일
        '@typescript-eslint/explicit-function-return-type': 2, // 명시적 함수 반환 타입 허용
        '@typescript-eslint/explicit-module-boundary-types': 0, // 명시적 모듈 바운더리 타입 허용
        '@typescript-eslint/no-explicit-any': 0, // any 허용
        // 'function-paren-newline': ['error', 'consistent'], // 함수 생성 시 인자가 여러 줄일 경우, 첫번째 인자는 첫 줄에, 나머지는 각각 한 줄씩
        'object-property-newline': [
            'error',
            { allowAllPropertiesOnSameLine: false },
        ], // 객체의 프로퍼티가 여러 줄일 경우, 첫번째 프로퍼티는 첫 줄에, 나머지는 각각 한 줄씩
        'object-curly-spacing': ['error', 'always'], // {} 사이 공백 강제
        'function-call-argument-newline': ['off'], // 함수 호출 시 인자에 줄바꿈 금지
        'max-len': [2, 200, 4, { ignoreUrls: true }], // 한 줄의 최대 길이, url은 예외
        'import/order': [
            'error',
            {
                groups: [
                    ['builtin', 'external'],
                    ['parent', 'sibling'],
                    'internal',
                    'index',
                    'object',
                ],
                pathGroups: [
                    {
                        pattern: '@nestjs/**',
                        group: 'external',
                        position: 'before',
                    },
                    {
                        pattern: '@prisma/**',
                        group: 'external',
                        position: 'after',
                    },
                    {
                        pattern: './**',
                        group: 'sibling',
                        position: 'before',
                    },
                ],
                pathGroupsExcludedImportTypes: ['builtin'],
                'newlines-between': 'always',
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },
                distinctGroup: true,
            },
        ],
        'import/no-absolute-path': 'error',
        'import/no-useless-path-segments': 'error',
        'import/no-self-import': 'error',
    },
};
