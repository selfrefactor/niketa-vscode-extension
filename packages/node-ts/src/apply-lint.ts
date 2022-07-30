import { existsSync } from 'fs';
import { log } from 'helpers-fn';
import { lintFn, LintFnResult } from 'lint-fn';

function checkShouldContinue(result: false|LintFnResult, label:string, debug: boolean){
  if(debug) console.log(result, label);
  if(!result || result.usePrettierResult.length === 0){

    return true
  } 

  log(`File is linted`, 'success');
  log('sep');
  return false
}

export async function applyLint(fileName: string, debug = false) {
  if (!existsSync(fileName))
    return log(`${fileName} is deleted`, 'error');

  log('sep');
  log(`will lint ${fileName}`, 'info');

  const initialLintResult = await lintFn({
    filePath: fileName,
    debug
  });
  if(checkShouldContinue(initialLintResult,'initial', debug)) return

  const lintResultWithOuter = await lintFn({
    filePath: fileName,
    prettierSpecialCase: 'outer',
    debug
  });
  if(checkShouldContinue(lintResultWithOuter,'outer', debug)) return
  const lintResultWithLocal = await lintFn({
    filePath: fileName,
    prettierSpecialCase: 'local',
    forceTypescript: true,
    debug
  });
  if(checkShouldContinue(lintResultWithLocal,'local', debug)) return
  log(`File failed to be linted`, 'error');
  log('sep');
}
