import bcrypt from "bcryptjs";

// パスワードを複雑にする処理を何回繰り返すか(多いほど安全だが遅くなる)
const SALT_ROUNDS = 10;

// ① 新規登録のときに使う関数:生のパスワード → 保存用のハッシュ値
async function hashPassword(plain: string): Promise<string> {
  // bcryptjsに「このパスワードをハッシュ化して」とお願いする
  const hashedResult = await bcrypt.hash(plain, SALT_ROUNDS);

  // ハッシュ化された文字列を返す
  return hashedResult;
}

// ② ログインのときに使う関数:入力パスワードとDBのハッシュ値を比較する
async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  // bcryptjsに「この生パスワードとハッシュ値、同じ元パスワードから作られた?」と聞く
  const isMatch = await bcrypt.compare(plain, hash);

  // 一致していればtrue、していなければfalse
  return isMatch;
}

export { hashPassword, verifyPassword };
