// Node 커스텀 resolve 훅: `@/...` 별칭 + 확장자 없는 상대 import(.ts/index.ts) 보정.
// gen-seed 스크립트가 앱 TS 소스를 path alias·무확장 import 그대로 import할 수 있게 한다.
import { pathToFileURL, fileURLToPath } from 'node:url';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(import.meta.dirname, '../../src');

const resolveTs = (absNoExt) => {
  if (existsSync(absNoExt) && statSync(absNoExt).isDirectory()) {
    return path.join(absNoExt, 'index.ts');
  }
  if (existsSync(`${absNoExt}.ts`)) return `${absNoExt}.ts`;
  return absNoExt;
};

export async function resolve(specifier, context, nextResolve) {
  // @/ 별칭
  if (specifier.startsWith('@/')) {
    const abs = resolveTs(path.join(SRC, specifier.slice(2)));
    return nextResolve(pathToFileURL(abs).href, context);
  }
  // 무확장 상대 import (./ ../) — 부모가 file: URL일 때만
  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    !path.extname(specifier) &&
    context.parentURL?.startsWith('file:')
  ) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const abs = resolveTs(path.resolve(parentDir, specifier));
    if (existsSync(abs)) return nextResolve(pathToFileURL(abs).href, context);
  }
  return nextResolve(specifier, context);
}
