const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password)
}
