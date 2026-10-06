// Vitestでは "server-only" を空モジュールに差し替える(vitest.config.ts の alias 参照)。
// 本物のパッケージはReact Server Components環境以外でimportされると例外を投げるため。
export {};
