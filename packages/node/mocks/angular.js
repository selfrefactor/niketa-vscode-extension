export const angularMock = {
  stdout: '----------|---------|----------|---------|---------|-------------------\n' +
    'File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s \n' +
    '----------|---------|----------|---------|---------|-------------------\n' +
    'All files |     100 |      100 |     100 |     100 |                   \n' +
    ' foo.ts   |     100 |      100 |     100 |     100 |                   \n' +
    '----------|---------|----------|---------|---------|-------------------\n',
  stderr: "ts-jest[versions] (WARN) Version 25.1.0 of jest installed has not been tested with ts-jest. If you're experiencing issues, consider using a supported version (>=24.0.0 <25.0.0). Please do not report issues in ts-jest if you are using unsupported versions.\n" +
    'PASS src/app/helpers/foo.spec.ts\n' +
    '  ✓ happy (1ms)\n' +
    '\n' +
    'Test Suites: 1 passed, 1 total\n' +
    'Tests:       1 passed, 1 total\n' +
    'Snapshots:   0 total\n' +
    'Time:        1.465s\n' +
    'Ran all test suites matching /\\/home\\/s\\/repos\\/joke-maker-angular\\/src\\/app\\/helpers\\/foo.spec.ts/i.\n'
}

export const angularWithLog ={}
export const angularError ={}
export const angularErrorWithLog ={}