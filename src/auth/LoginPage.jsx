import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import './auth.css'
import {
  checkEmailExists,
  formatAuthError,
  getRememberedEmail,
  redeemMembershipCode,
  resetPasswordForEmail,
  setRememberedEmail,
  signIn,
  signUp,
  useAuthSession,
  verifyOtpAndResetPassword,
} from './session.js'

const EMPTY_ERRORS = {}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function parseRecoveryContext(location) {
  const searchParams = new URLSearchParams(location.search)
  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''))
  const isResetPath = location.pathname === '/auth/reset-password'
  const isRecoveryType =
    searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery'
  const email = searchParams.get('email') || hashParams.get('email') || ''

  return {
    email,
    isRecoveryRoute: isResetPath || isRecoveryType,
  }
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, session } = useAuthSession()
  const recoveryContext = useMemo(() => parseRecoveryContext(location), [location])

  const from = location.state?.from || '/dashboard'
  const rememberedEmail = useMemo(() => getRememberedEmail(), [])

  const [tab, setTab] = useState('login')
  const [submitting, setSubmitting] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryStep, setRecoveryStep] = useState('email')
  const [loginEmail, setLoginEmail] = useState(rememberedEmail)
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail))
  const [loginErrors, setLoginErrors] = useState(EMPTY_ERRORS)
  const [loginGeneral, setLoginGeneral] = useState('')

  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirm, setRegisterConfirm] = useState('')
  const [registerTerms, setRegisterTerms] = useState(false)
  const [membershipCode, setMembershipCode] = useState('')
  const [registerErrors, setRegisterErrors] = useState(EMPTY_ERRORS)
  const [registerGeneral, setRegisterGeneral] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [holdAuthenticatedRedirect, setHoldAuthenticatedRedirect] = useState(false)

  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [recoveryPassword, setRecoveryPassword] = useState('')
  const [recoveryConfirm, setRecoveryConfirm] = useState('')
  const [recoveryErrors, setRecoveryErrors] = useState(EMPTY_ERRORS)
  const [recoveryGeneral, setRecoveryGeneral] = useState('')
  const [recoverySuccess, setRecoverySuccess] = useState('')

  useEffect(() => {
    if (!showRecovery) {
      setRecoveryStep('email')
      setRecoveryErrors(EMPTY_ERRORS)
      setRecoveryGeneral('')
      setRecoverySuccess('')
      setRecoveryEmail('')
      setRecoveryCode('')
      setRecoveryPassword('')
      setRecoveryConfirm('')
    }
  }, [showRecovery])

  useEffect(() => {
    if (!recoveryContext.isRecoveryRoute) {
      return
    }

    setTab('login')
    setShowRecovery(true)
    setRecoveryStep('code')

    if (recoveryContext.email) {
      setRecoveryEmail(recoveryContext.email)
      setLoginEmail(recoveryContext.email)
    }
  }, [recoveryContext.email, recoveryContext.isRecoveryRoute])

  if (!loading && session && !holdAuthenticatedRedirect && !recoveryContext.isRecoveryRoute) {
    return <Navigate to={from} replace />
  }

  async function handleLoginSubmit(event) {
    event.preventDefault()

    const nextErrors = {}

    if (!loginEmail) {
      nextErrors.email = '请输入邮箱地址'
    } else if (!isValidEmail(loginEmail)) {
      nextErrors.email = '请输入有效的邮箱地址'
    }

    if (!loginPassword) {
      nextErrors.password = '请输入密码'
    } else if (loginPassword.length < 6) {
      nextErrors.password = '密码至少6位'
    }

    setLoginErrors(nextErrors)
    setLoginGeneral('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)
    const { error } = await signIn(loginEmail, loginPassword)
    setSubmitting(false)

    if (error) {
      setLoginGeneral(formatAuthError(error))
      return
    }

    setRememberedEmail(loginEmail, rememberMe)
    navigate('/dashboard', { replace: true })
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault()

    const nextErrors = {}

    if (!registerName) {
      nextErrors.name = '请输入用户名'
    } else if (registerName.trim().length < 2) {
      nextErrors.name = '用户名至少2个字符'
    }

    if (!registerEmail) {
      nextErrors.email = '请输入邮箱地址'
    } else if (!isValidEmail(registerEmail)) {
      nextErrors.email = '请输入有效的邮箱地址'
    }

    if (!registerPassword) {
      nextErrors.password = '请输入密码'
    } else if (registerPassword.length < 6) {
      nextErrors.password = '密码至少6位'
    }

    if (!registerConfirm) {
      nextErrors.confirm = '请确认密码'
    } else if (registerPassword !== registerConfirm) {
      nextErrors.confirm = '两次密码输入不一致'
    }

    if (!registerTerms) {
      nextErrors.terms = '请同意用户协议和隐私政策'
    }

    setRegisterErrors(nextErrors)
    setRegisterGeneral('')
    setRegisterSuccess('')
    setHoldAuthenticatedRedirect(false)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)
    const { error } = await signUp(registerEmail, registerPassword, registerName.trim())

    if (error) {
      setSubmitting(false)
      setRegisterGeneral(formatAuthError(error))
      return
    }

    if (membershipCode.trim()) {
      const redeemResult = await redeemMembershipCode(membershipCode)

      if (!redeemResult.success) {
        setSubmitting(false)
        setHoldAuthenticatedRedirect(true)
        setRegisterGeneral(
          redeemResult.error?.message || '已完成注册，但兑换失败，请稍后重试或检查兑换码是否正确',
        )
        setRegisterSuccess('注册成功，请先确认兑换提示后再继续。')
        return
      }
    }

    setSubmitting(false)
    setRegisterSuccess('注册成功！正在为您跳转到主页...')
    navigate('/dashboard', { replace: true })
  }

  async function handleRecoveryEmailSubmit(event) {
    event.preventDefault()

    const nextErrors = {}

    if (!recoveryEmail) {
      nextErrors.email = '请输入邮箱地址'
    } else if (!isValidEmail(recoveryEmail)) {
      nextErrors.email = '请输入有效的邮箱地址'
    }

    setRecoveryErrors(nextErrors)
    setRecoveryGeneral('')
    setRecoverySuccess('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      const payload = await checkEmailExists(recoveryEmail)

      if (payload?.exists === false) {
        setRecoveryGeneral('该邮箱尚未注册，请先注册账号。')
        setTab('register')
        setRegisterEmail(recoveryEmail)
        setShowRecovery(false)
        return
      }

      const { error } = await resetPasswordForEmail(recoveryEmail)

      if (error) {
        setRecoveryGeneral(formatAuthError(error))
        return
      }

      setRecoveryStep('code')
      setRecoverySuccess('验证码已发送至 ' + recoveryEmail)
    } catch (error) {
      setRecoveryGeneral(formatAuthError(error))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRecoveryResetSubmit(event) {
    event.preventDefault()

    const nextErrors = {}

    if (!recoveryCode) {
      nextErrors.code = '请输入验证码'
    } else if (recoveryCode.length !== 6) {
      nextErrors.code = '验证码为6位数字'
    }

    if (!recoveryPassword) {
      nextErrors.password = '请输入新密码'
    } else if (recoveryPassword.length < 6) {
      nextErrors.password = '密码至少6位'
    }

    if (!recoveryConfirm) {
      nextErrors.confirm = '请确认新密码'
    } else if (recoveryPassword !== recoveryConfirm) {
      nextErrors.confirm = '两次密码输入不一致'
    }

    setRecoveryErrors(nextErrors)
    setRecoveryGeneral('')
    setRecoverySuccess('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)
    const { error } = await verifyOtpAndResetPassword(recoveryEmail, recoveryCode, recoveryPassword)
    setSubmitting(false)

    if (error) {
      setRecoveryGeneral(formatAuthError(error))
      return
    }

    setRecoverySuccess('密码重置成功！请使用新密码登录')
    setShowRecovery(false)
    setTab('login')
    setHoldAuthenticatedRedirect(false)
    setLoginEmail(recoveryEmail)
    navigate('/auth', { replace: true })
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <header className="auth-hero">
          <div className="auth-eyebrow">Study Operations</div>
          <h1>小打卡</h1>
          <p>把学习计划、习惯打卡与考试反馈整理进一个连续工作台。</p>
        </header>

        <section className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Auth tabs">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'login'}
              className={`auth-tab${tab === 'login' ? ' is-active' : ''}`}
              onClick={() => setTab('login')}
            >
              登录
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'register'}
              className={`auth-tab${tab === 'register' ? ' is-active' : ''}`}
              onClick={() => setTab('register')}
            >
              注册
            </button>
          </div>

          {tab === 'login' ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <label className="auth-field">
                <span>邮箱</span>
                <input
                  aria-label="邮箱"
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="请输入邮箱地址"
                />
                {loginErrors.email ? <strong className="auth-error">{loginErrors.email}</strong> : null}
              </label>

              <label className="auth-field">
                <span>密码</span>
                <input
                  aria-label="密码"
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="请输入密码"
                />
                {loginErrors.password ? (
                  <strong className="auth-error">{loginErrors.password}</strong>
                ) : null}
              </label>

              <div className="auth-row">
                <label className="auth-check">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>记住我</span>
                </label>

                <button type="button" className="auth-link" onClick={() => setShowRecovery(true)}>
                  忘记密码？
                </button>
              </div>

              {loginGeneral ? <div className="auth-error auth-banner">{loginGeneral}</div> : null}

              <button className="auth-submit" type="submit" disabled={submitting}>
                {submitting ? '登录中...' : '登录'}
              </button>

              <p className="auth-inline-hint">
                还没有账号？
                <button type="button" className="auth-link" onClick={() => setTab('register')}>
                  立即注册
                </button>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <label className="auth-field">
                <span>用户名</span>
                <input
                  aria-label="用户名"
                  type="text"
                  value={registerName}
                  onChange={(event) => setRegisterName(event.target.value)}
                  placeholder="请输入用户名"
                />
                {registerErrors.name ? <strong className="auth-error">{registerErrors.name}</strong> : null}
              </label>

              <label className="auth-field">
                <span>邮箱</span>
                <input
                  aria-label="邮箱"
                  type="email"
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  placeholder="请输入邮箱地址"
                />
                {registerErrors.email ? (
                  <strong className="auth-error">{registerErrors.email}</strong>
                ) : null}
              </label>

              <label className="auth-field">
                <span>密码</span>
                <input
                  aria-label="密码"
                  type="password"
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  placeholder="请输入密码（至少6位）"
                />
                {registerErrors.password ? (
                  <strong className="auth-error">{registerErrors.password}</strong>
                ) : null}
              </label>

              <label className="auth-field">
                <span>确认密码</span>
                <input
                  aria-label="确认密码"
                  type="password"
                  value={registerConfirm}
                  onChange={(event) => setRegisterConfirm(event.target.value)}
                  placeholder="请再次输入密码"
                />
                {registerErrors.confirm ? (
                  <strong className="auth-error">{registerErrors.confirm}</strong>
                ) : null}
              </label>

              <label className="auth-field">
                <span>兑换码（可选）</span>
                <input
                  aria-label="兑换码（可选）"
                  type="text"
                  value={membershipCode}
                  onChange={(event) => setMembershipCode(event.target.value.toUpperCase())}
                  placeholder="如有兑换码可填写（试用不需要填写）"
                />
                <small className="auth-help">填写后将会在注册成功后自动兑换；兑换码错误不影响注册。</small>
              </label>

              <label className="auth-check auth-check-block">
                <input
                  aria-label="我已阅读并同意用户协议和隐私政策"
                  type="checkbox"
                  checked={registerTerms}
                  onChange={(event) => setRegisterTerms(event.target.checked)}
                />
                <span>
                  我已阅读并同意
                  <button type="button" className="auth-link auth-link-inline">
                    用户协议
                  </button>
                  和
                  <button type="button" className="auth-link auth-link-inline">
                    隐私政策
                  </button>
                </span>
              </label>
              {registerErrors.terms ? <strong className="auth-error">{registerErrors.terms}</strong> : null}

              {registerGeneral ? <div className="auth-error auth-banner">{registerGeneral}</div> : null}
              {registerSuccess ? <div className="auth-success auth-banner">{registerSuccess}</div> : null}

              <button className="auth-submit" type="submit" disabled={submitting}>
                {submitting ? '注册中...' : '注册'}
              </button>

              {holdAuthenticatedRedirect ? (
                <button
                  className="auth-secondary"
                  type="button"
                  onClick={() => {
                    setHoldAuthenticatedRedirect(false)
                    navigate('/dashboard', { replace: true })
                  }}
                >
                  继续前往主页
                </button>
              ) : null}

              <p className="auth-inline-hint">
                已有账号？
                <button type="button" className="auth-link" onClick={() => setTab('login')}>
                  立即登录
                </button>
              </p>
            </form>
          )}
        </section>

        {showRecovery ? (
          <section className="recovery-panel">
            <div className="recovery-head">
              <div>
                <h2>重置密码</h2>
                <p>
                  {recoveryStep === 'email'
                    ? '请输入您的注册邮箱，我们将发送验证码到您的邮箱'
                    : '请输入收到的验证码和新密码'}
                </p>
              </div>
              <button type="button" className="auth-link" onClick={() => setShowRecovery(false)}>
                返回登录
              </button>
            </div>

            {recoveryStep === 'email' ? (
              <form className="auth-form" onSubmit={handleRecoveryEmailSubmit}>
                <label className="auth-field">
                  <span>邮箱地址</span>
                  <input
                    aria-label="邮箱地址"
                    type="email"
                    value={recoveryEmail}
                    onChange={(event) => setRecoveryEmail(event.target.value)}
                    placeholder="请输入注册邮箱"
                  />
                  {recoveryErrors.email ? (
                    <strong className="auth-error">{recoveryErrors.email}</strong>
                  ) : null}
                </label>

                {recoveryGeneral ? <div className="auth-error auth-banner">{recoveryGeneral}</div> : null}
                {recoverySuccess ? <div className="auth-success auth-banner">{recoverySuccess}</div> : null}

                <button className="auth-submit" type="submit" disabled={submitting}>
                  {submitting ? '重置中...' : '发送验证码'}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRecoveryResetSubmit}>
                <label className="auth-field">
                  <span>验证码</span>
                  <input
                    aria-label="验证码"
                    type="text"
                    value={recoveryCode}
                    onChange={(event) => setRecoveryCode(event.target.value)}
                    placeholder="请输入6位验证码"
                  />
                  {recoveryErrors.code ? <strong className="auth-error">{recoveryErrors.code}</strong> : null}
                </label>

                <label className="auth-field">
                  <span>新密码</span>
                  <input
                    aria-label="新密码"
                    type="password"
                    value={recoveryPassword}
                    onChange={(event) => setRecoveryPassword(event.target.value)}
                    placeholder="请输入新密码（至少6位）"
                  />
                  {recoveryErrors.password ? (
                    <strong className="auth-error">{recoveryErrors.password}</strong>
                  ) : null}
                </label>

                <label className="auth-field">
                  <span>确认新密码</span>
                  <input
                    aria-label="确认新密码"
                    type="password"
                    value={recoveryConfirm}
                    onChange={(event) => setRecoveryConfirm(event.target.value)}
                    placeholder="请再次输入新密码"
                  />
                  {recoveryErrors.confirm ? (
                    <strong className="auth-error">{recoveryErrors.confirm}</strong>
                  ) : null}
                </label>

                {recoveryGeneral ? <div className="auth-error auth-banner">{recoveryGeneral}</div> : null}
                {recoverySuccess ? <div className="auth-success auth-banner">{recoverySuccess}</div> : null}

                <button className="auth-submit" type="submit" disabled={submitting}>
                  {submitting ? '重置中...' : '重置密码'}
                </button>
              </form>
            )}
          </section>
        ) : null}
      </div>
    </main>
  )
}

export default LoginPage
