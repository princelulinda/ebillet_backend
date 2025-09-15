import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
import EmailVerificationToken from '#models/email_verification_token'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { registerUserValidator } from '#validators/register_user'
import { confirmEmailValidator } from '#validators/confirm_email'
import { loginUserValidator } from '#validators/login_user'
import mail from '@adonisjs/mail/services/main'
import Profile from '#models/profile'
import { forgotPasswordValidator } from '#validators/forgot_password'
import { resetPasswordValidator } from '#validators/reset_password'
import PasswordResetToken from '#models/password_reset_token'
import crypto from 'crypto'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerUserValidator)

    try {
      const user = await User.create(payload)
      await Profile.create({ userId: user.id })

      const token = uuidv4()
      await EmailVerificationToken.create({
        userId: user.id,
        token: token,
        expiresAt: DateTime.now().plus({ hours: 24 }),
      })
      await mail.send((message) => {
        message
          .to(user.email)
          .from('no-reply@sania.com', 'Ebillet App')
          .subject('Verify your email address')
          .htmlView('emails/verify_email', { user: user, token: token })
      })
      // await Mail.send(new VerifyEmailNotification(user, token))

      return response.created({
        message: 'User registered successfully. Please check your email for verification.',
      })
    } catch (error) {
      if (error.code === '23505') {
        return response.conflict({ message: 'Email address already exists.' })
      }
      console.log('Error during registration:', error)
      return response.internalServerError({ message: 'An error occurred during registration.' })
    }
  }

  async confirmEmail({ request, response }: HttpContext) {
    const { email, token } = await request.validateUsing(confirmEmailValidator)

    const user = await User.findBy('email', email)
    if (!user) {
      return response.badRequest({ message: 'Invalid email or token.' })
    }

    const emailVerificationToken = await EmailVerificationToken.query()
      .where('userId', user.id)
      .where('token', token)
      .first()

    if (!emailVerificationToken || emailVerificationToken.expiresAt < DateTime.now()) {
      return response.badRequest({ message: 'Invalid or expired token.' })
    }

    user.isVerified = true
    await user.save()

    await emailVerificationToken.delete()

    return response.ok({ message: 'Email verified successfully.' })
  }

  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginUserValidator)

    const user = await User.verifyCredentials(email, password)
    if (!user) {
      return response.badRequest({ message: 'Invalid email or password.' })
    }

    if (!user.isVerified) {
      return response.badRequest({ message: 'Please verify your email before logging in.' })
    }
    console.log(user)

    const token = await User.accessTokens.create(user)

    return response.ok({
      token: token.value!.release(),
      user: user.serialize(),
    })
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('profile')
    return response.ok(user)
  }

  async forgotPassword({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)
    const user = await User.findBy('email', email)
    console.log(user?.email)

    if (!user?.email) {
      return response.ok({
        message: 'If a user with this email exists, a password reset link has been sent.',
      })
    }

    const token = crypto.randomBytes(32).toString('hex')
    await PasswordResetToken.create({
      email: user.email,
      token: token,
    })

    // Send email with reset link
    const resetLink = `http://localhost:3000/auth/reset-password?token=${token}`
    await mail.send((message) => {
      message
        .to(user.email)
        .from('no-reply@sania.com', 'Ebillet App')
        .subject('Reset your password')
        .htmlView('emails/reset_password', { user: user, link: resetLink })
    })

    return response.ok({
      message: 'If a user with this email exists, a password reset link has been sent.',
    })
  }

  async resetPassword({ request, response }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)

    const passwordResetToken = await PasswordResetToken.findBy('token', token)

    if (!passwordResetToken || passwordResetToken.createdAt < DateTime.now().minus({ hours: 1 })) {
      return response.badRequest({ message: 'Invalid or expired token.' })
    }

    const user = await User.findBy('email', passwordResetToken.email)
    if (!user) {
      return response.badRequest({ message: 'Invalid token.' })
    }

    user.password = password
    await user.save()

    await passwordResetToken.delete()

    return response.ok({ message: 'Password reset successfully.' })
  }
}
