import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    const err = error as Error & { status?: number; code?: string }

    // Skip 401/404 errors in logs (too noisy)
    if (err.status === 401 || err.status === 404) {
      return
    }

    // Log error details
    console.error('')
    console.error('❌ ERROR:', err.message)
    console.error('   Route:', ctx.request.method(), ctx.request.url())
    console.error('   Status:', err.status || 500)
    if (err.code) {
      console.error('   Code:', err.code)
    }
    if (this.debug && err.stack) {
      console.error('   Stack:', err.stack.split('\n').slice(1, 4).join('\n'))
    }
    console.error('')

    return super.report(error, ctx)
  }
}
