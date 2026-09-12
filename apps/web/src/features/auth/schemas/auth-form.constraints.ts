import { authPasswordConstraints } from "@workspace/contracts/auth/constraints"

export const authFormConstraints = {
  passwordMinLength: authPasswordConstraints.minLength,
  userNameMinLength: 2,
}
