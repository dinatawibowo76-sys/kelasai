export function generateCode(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateUniqueCode(
  length: number,
  checkFn: (code: string) => Promise<boolean>
): Promise<string> {
  let code = generateCode(length);
  let attempts = 0;
  while (await checkFn(code)) {
    code = generateCode(length);
    attempts++;
    if (attempts > 100) {
      throw new Error('Failed to generate unique code');
    }
  }
  return code;
}
