import { FC, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GetConfigurationValue, persistAccessTokenFromPayload } from '../../api';
import { ForgotDialog } from './components/ForgotDialog';
import { NewsWindow } from './components/NewsWindow';
import { RegisterDialog } from './components/RegisterDialog';
import { TurnstileWidget } from './TurnstileWidget';
import { BanInfo, formatRemaining, parseBan } from './utils/ban';
import { interpolate, t } from './utils/i18n';
import { LOCK_DURATION_MS, LOCK_WINDOW_MS, MAX_ATTEMPTS, readLock, writeLock } from './utils/lockState';

type DialogMode = 'login' | 'register' | 'forgot';

export interface LoginViewProps
{
    onAuthenticated: (ssoTicket: string) => void;
}

export const LoginView: FC<LoginViewProps> = ({ onAuthenticated }) =>
{
    const [ mode, setMode ] = useState<DialogMode>('login');
    const [ username, setUsername ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ rememberMe, setRememberMe ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);
    const [ banInfo, setBanInfo ] = useState<BanInfo | null>(null);
    const [ , setBanTick ] = useState(0);
    const [ info, setInfo ] = useState<string | null>(null);
    const [ submitting, setSubmitting ] = useState(false);
    const [ loginTurnstileToken, setLoginTurnstileToken ] = useState('');
    const [ loginTurnstileResetSignal, setLoginTurnstileResetSignal ] = useState(0);
    const [ loginServerReachable, setLoginServerReachable ] = useState<boolean | null>(null);
    const [ loginPingingServer, setLoginPingingServer ] = useState(false);
    const submitTimeRef = useRef(0);

    const loginImages: Record<string, string> = ((GetConfigurationValue<Record<string, unknown>>('loginview', {})?.['images']) as Record<string, string>) ?? {};

    const backgroundColor = (loginImages['background.colour'] || GetConfigurationValue<string>('login_background.colour', '#6eadc8'));
    const background = interpolate(loginImages['background'] || GetConfigurationValue<string>('login_background', ''));
    const sun = interpolate(loginImages['sun'] || GetConfigurationValue<string>('login_sun', ''));
    const drape = interpolate(loginImages['drape'] || GetConfigurationValue<string>('login_drape', ''));
    const left = interpolate(loginImages['left'] || GetConfigurationValue<string>('login_left', ''));
    const rightRepeat = interpolate(loginImages['right.repeat'] || GetConfigurationValue<string>('login_right.repeat', ''));
    const right = interpolate(loginImages['right'] || GetConfigurationValue<string>('login_right', ''));
    const loginUrl = GetConfigurationValue<string>('login.endpoint', '/api/auth/login');
    const registerUrl = GetConfigurationValue<string>('login.register.endpoint', '/api/auth/register');
    const roomTemplatesUrl = GetConfigurationValue<string>('login.room_templates.endpoint', '/api/auth/room-templates');
    const forgotUrl = GetConfigurationValue<string>('login.forgot.endpoint', '/api/auth/forgot-password');
    const turnstileSiteKey = GetConfigurationValue<string>('login.turnstile.sitekey', '');
    const rawTurnstileEnabled = GetConfigurationValue<unknown>('login.turnstile.enabled', false);
    const turnstileEnabled = (rawTurnstileEnabled === true
        || rawTurnstileEnabled === 'true'
        || rawTurnstileEnabled === 1
        || rawTurnstileEnabled === '1') && !!turnstileSiteKey;

    const resetLoginTurnstile = useCallback(() =>
    {
        setLoginTurnstileToken('');
        setLoginTurnstileResetSignal(prev => prev + 1);
    }, []);

    useEffect(() =>
    {
        setError(null);
        setBanInfo(null);
        if(mode === 'login') resetLoginTurnstile();
    }, [ mode, resetLoginTurnstile ]);

    useEffect(() =>
    {
        if(!banInfo || banInfo.permanent || !banInfo.expiresAt) return;
        const interval = window.setInterval(() =>
        {
            if(banInfo.expiresAt && banInfo.expiresAt <= Math.floor(Date.now() / 1000))
            {
                setBanInfo(null);
                return;
            }
            setBanTick(t => t + 1);
        }, 1000);
        return () => window.clearInterval(interval);
    }, [ banInfo ]);

    useEffect(() =>
    {
        if(!info) return;
        const timeout = window.setTimeout(() => setInfo(null), 8000);
        return () => window.clearTimeout(timeout);
    }, [ info ]);

    const lockState = useMemo(() => readLock(), [ submitting ]);
    const now = Date.now();
    const isLocked = lockState.lockedUntil > now;

    const recordFailure = useCallback(() =>
    {
        const state = readLock();
        const currentNow = Date.now();

        if(currentNow - state.firstAt > LOCK_WINDOW_MS)
        {
            writeLock({ attempts: 1, firstAt: currentNow, lockedUntil: 0 });
            return;
        }

        const attempts = state.attempts + 1;
        const lockedUntil = attempts >= MAX_ATTEMPTS ? currentNow + LOCK_DURATION_MS : 0;
        writeLock({ attempts, firstAt: state.firstAt || currentNow, lockedUntil });
    }, []);

    const clearLock = useCallback(() =>
    {
        writeLock({ attempts: 0, firstAt: 0, lockedUntil: 0 });
    }, []);

    const postJson = useCallback(async (url: string, body: Record<string, unknown>) =>
    {
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'NitroLoginView'
            },
            body: JSON.stringify(body)
        });

        let payload: Record<string, unknown> = {};
        try { payload = await response.json(); }
        catch { }

        return { ok: response.ok, status: response.status, payload };
    }, []);

    const healthUrl = GetConfigurationValue<string>('login.health.endpoint', '/api/health');
    const healthMethodRaw = GetConfigurationValue<string>('login.health.method', 'GET');
    const healthMethod = (healthMethodRaw || 'GET').toUpperCase();
    const checkServerReachable = useCallback(async (): Promise<boolean> =>
    {
        if(!healthUrl) return true;
        try
        {
            const controller = new AbortController();
            const timer = window.setTimeout(() => controller.abort(), 5000);
            try
            {
                const response = await fetch(healthUrl, { method: healthMethod, credentials: 'omit', signal: controller.signal });
                if(response.status === 403) return false;
                if(response.status >= 500) return false;
                return true;
            }
            finally
            {
                window.clearTimeout(timer);
            }
        }
        catch
        {
            return false;
        }
    }, [ healthUrl, healthMethod ]);

    const pingLoginServer = useCallback(async () =>
    {
        setLoginPingingServer(true);
        try
        {
            const ok = await checkServerReachable();
            setLoginServerReachable(ok);
            return ok;
        }
        finally
        {
            setLoginPingingServer(false);
        }
    }, [ checkServerReachable ]);

    useEffect(() =>
    {
        let cancelled = false;
        (async () =>
        {
            const ok = await checkServerReachable();
            if(!cancelled) setLoginServerReachable(ok);
        })();
        return () => { cancelled = true; };
    }, [ checkServerReachable ]);

    const handleLoginSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) =>
    {
        event.preventDefault();

        if(submitting) return;

        const nowTs = Date.now();
        if(nowTs - submitTimeRef.current < 1000) return;
        submitTimeRef.current = nowTs;

        const state = readLock();
        if(state.lockedUntil > nowTs)
        {
            const remaining = Math.ceil((state.lockedUntil - nowTs) / 1000);
            setError(t('nitro.login.error.too_many_attempts', 'Too many attempts. Try again in %seconds%s.', [ 'seconds' ], [ String(remaining) ]));
            return;
        }

        if(!username.trim() || !password)
        {
            setError(t('nitro.login.error.missing_credentials', 'Please enter both your Habbo name and password.'));
            return;
        }

        if(turnstileEnabled && !loginTurnstileToken)
        {
            setError(t('nitro.login.error.turnstile', 'Please complete the security check.'));
            return;
        }

        setError(null);
        setBanInfo(null);
        setSubmitting(true);

        try
        {
            const serverOk = await pingLoginServer();
            if(!serverOk)
            {
                setError(t('nitro.login.error.server_offline', 'The gameserver is not running. Please try again later.'));
                return;
            }
            const { ok, payload } = await postJson(loginUrl, {
                username: username.trim(),
                password,
                remember: rememberMe,
                turnstileToken: turnstileEnabled ? loginTurnstileToken : undefined
            });

            const ssoTicket = typeof payload.ssoTicket === 'string' ? payload.ssoTicket : (typeof payload.sso === 'string' ? payload.sso : '');

            if(ok && ssoTicket)
            {
                try
                {
                    const rememberToken = typeof payload.rememberToken === 'string' ? payload.rememberToken : '';
                    if(rememberMe && rememberToken) window.localStorage.setItem('nitro.remember.token', rememberToken);
                    else window.localStorage.removeItem('nitro.remember.token');
                    persistAccessTokenFromPayload(payload);
                }
                catch {}

                clearLock();
                onAuthenticated(ssoTicket);
                return;
            }

            const ban = parseBan(payload);
            if(ban)
            {
                setBanInfo(ban);
                resetLoginTurnstile();
                return;
            }

            recordFailure();
            const message = typeof payload.error === 'string' ? payload.error : t('nitro.login.error.invalid_credentials', 'Invalid Habbo name or password.');
            setError(message);
            resetLoginTurnstile();
        }
        catch(err)
        {
            recordFailure();
            setError(t('nitro.login.error.login_unreachable', 'Unable to reach the login service. Please try again.'));
            resetLoginTurnstile();
        }
        finally
        {
            setSubmitting(false);
        }
    }, [ submitting, username, password, rememberMe, turnstileEnabled, loginTurnstileToken, loginUrl, postJson, clearLock, recordFailure, onAuthenticated, resetLoginTurnstile, pingLoginServer ]);

    const newsUrl = GetConfigurationValue<string>('login.news.endpoint', '/api/auth/news');

    const checkEmailUrl = GetConfigurationValue<string>('login.check-email.endpoint', '/api/auth/check-email');
    const checkUsernameUrl = GetConfigurationValue<string>('login.check-username.endpoint', '/api/auth/check-username');
    const imagingUrl = GetConfigurationValue<string>('login.register.imaging.url', 'https://www.habbo.com/habbo-imaging/avatarimage?figure={figure}&gender={gender}&direction=2&head_direction=2&size=l');

    const interpretAvailability = (ok: boolean, status: number, payload: Record<string, unknown>): { available: boolean; error?: string } =>
    {
        const isTrue = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';
        const isFalse = (v: unknown) => v === false || v === 'false' || v === 0 || v === '0';

        if(ok)
        {
            if(isTrue(payload.available) || isFalse(payload.exists) || isFalse(payload.taken) || isFalse(payload.inUse) || isFalse(payload.in_use)) return { available: true };
            if(isFalse(payload.available) || isTrue(payload.exists) || isTrue(payload.taken) || isTrue(payload.inUse) || isTrue(payload.in_use)) return { available: false, error: typeof payload.error === 'string' ? payload.error : undefined };
            return { available: true };
        }

        if(status === 404 || status === 405 || status === 501) return { available: true };
        if(status === 409) return { available: false, error: typeof payload.error === 'string' ? payload.error : undefined };

        return { available: true };
    };

    const checkEmailAvailable = useCallback(async (email: string): Promise<{ available: boolean; error?: string }> =>
    {
        try
        {
            const { ok, status, payload } = await postJson(checkEmailUrl, { email });
            const result = interpretAvailability(ok, status, payload);
            if(result.available) return { available: true };
            return { available: false, error: result.error || t('nitro.login.error.email_taken', 'This email is already in use.') };
        }
        catch
        {
            return { available: true };
        }
    }, [ checkEmailUrl, postJson ]);

    const checkUsernameAvailable = useCallback(async (username: string): Promise<{ available: boolean; error?: string }> =>
    {
        try
        {
            const { ok, status, payload } = await postJson(checkUsernameUrl, { username });
            const result = interpretAvailability(ok, status, payload);
            if(result.available) return { available: true };
            return { available: false, error: result.error || t('nitro.login.error.username_taken', 'This Habbo name is already taken.') };
        }
        catch
        {
            return { available: true };
        }
    }, [ checkUsernameUrl, postJson ]);

    const handleRegisterSubmit = useCallback(async (body: { username: string; email: string; password: string; figure: string; gender: string; turnstileToken: string; templateId: number | null; }, onDialogReset: () => void) =>
    {
        if(turnstileEnabled && !body.turnstileToken)
        {
            setError(t('nitro.login.error.turnstile', 'Please complete the security check.'));
            return;
        }

        setError(null);
        setInfo(null);
        setSubmitting(true);

        try
        {
            const { ok, payload } = await postJson(registerUrl, {
                username: body.username,
                email: body.email,
                password: body.password,
                figure: body.figure,
                gender: body.gender,
                templateId: body.templateId ?? undefined,
                turnstileToken: turnstileEnabled ? body.turnstileToken : undefined
            });

            if(ok)
            {
                const friendly = t('nitro.login.register.success', 'Welcome aboard, %username%! Your account is ready — log in below with the password you just chose.', [ 'username' ], [ body.username ]);
                setInfo(typeof payload.message === 'string' ? payload.message : friendly);
                setMode('login');
                setUsername(body.username);
                setPassword('');
                return;
            }

            setError(typeof payload.error === 'string' ? payload.error : t('nitro.login.error.register_failed', 'Unable to create your account.'));
            onDialogReset();
        }
        catch
        {
            setError(t('nitro.login.error.register_unreachable', 'Unable to reach the registration service.'));
            onDialogReset();
        }
        finally
        {
            setSubmitting(false);
        }
    }, [ turnstileEnabled, registerUrl, postJson ]);

    const handleForgotSubmit = useCallback(async (body: { email: string; turnstileToken: string; }, onDialogReset: () => void) =>
    {
        if(turnstileEnabled && !body.turnstileToken)
        {
            setError(t('nitro.login.error.turnstile', 'Please complete the security check.'));
            return;
        }

        setError(null);
        setInfo(null);
        setSubmitting(true);

        try
        {
            const { ok, payload } = await postJson(forgotUrl, {
                email: body.email,
                turnstileToken: turnstileEnabled ? body.turnstileToken : undefined
            });

            if(ok)
            {
                const friendly = t('nitro.login.forgot.success', 'Email sent! If an account matches that address you\'ll find a reset link in your inbox shortly (check spam if it doesn\'t show up within a minute).');
                setInfo(typeof payload.message === 'string' ? payload.message : friendly);
                setMode('login');
                return;
            }

            setError(typeof payload.error === 'string' ? payload.error : t('nitro.login.error.forgot_failed', 'Unable to send a reset email right now.'));
            onDialogReset();
        }
        catch
        {
            setError(t('nitro.login.error.forgot_unreachable', 'Unable to reach the password reset service.'));
            onDialogReset();
        }
        finally
        {
            setSubmitting(false);
        }
    }, [ turnstileEnabled, forgotUrl, postJson ]);

    return (
        <div
            className="nitro-login-view"
            style={ backgroundColor ? { background: backgroundColor } : undefined }
        >
            { background ? <div className="login-background login-layer" style={ { backgroundImage: `url(${ background })` } } /> : null }
            { sun ? <div className="login-sun login-layer" style={ { backgroundImage: `url(${ sun })` } } /> : null }
            { drape ? <div className="login-drape login-layer" style={ { backgroundImage: `url(${ drape })` } } /> : null }
            { left ? <div className="login-left login-layer" style={ { backgroundImage: `url(${ left })` } } /> : null }
            { rightRepeat ? <div className="login-right-repeat login-layer" style={ { backgroundImage: `url(${ rightRepeat })` } } /> : null }
            { right ? <div className="login-right login-layer" style={ { backgroundImage: `url(${ right })` } } /> : null }

            <NewsWindow newsUrl={ newsUrl } />

            <div className="login-stack">
                <div className="nitro-login-card">
                    <div className="card-title">{ t('nitro.login.firsttime.title', 'First time here?') }</div>
                    <div className="card-body register-card-body">
                        <span>{ t('nitro.login.firsttime.text', 'Don\'t have a Habbo yet?') }</span>
                        <a onClick={ () => setMode('register') }>{ t('nitro.login.firsttime.link', 'You can create one here') }</a>
                    </div>
                </div>

                <div className="nitro-login-card">
                    <div className="card-title">{ t('nitro.login.card.title', 'What\'s your Habbo called?') }</div>
                    <form className="card-body" onSubmit={ handleLoginSubmit } autoComplete="on">
                        <div className="field">
                            <label htmlFor="login-username">{ t('login.username', 'Name of your Habbo') }</label>
                            <input
                                id="login-username"
                                name="username"
                                autoComplete="username"
                                type="text"
                                maxLength={ 32 }
                                value={ username }
                                onChange={ e => setUsername(e.target.value) }
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="login-password">{ t('generic.password', 'Password') }</label>
                            <input
                                id="login-password"
                                name="password"
                                autoComplete="current-password"
                                type="password"
                                maxLength={ 128 }
                                value={ password }
                                onChange={ e => setPassword(e.target.value) }
                            />
                        </div>
                        <label className="remember-me">
                            <input type="checkbox" checked={ rememberMe } onChange={ e => setRememberMe(e.target.checked) } />
                            <span>{ t('login.remember_me', 'Remember me') }</span>
                        </label>
                        { turnstileEnabled && mode === 'login' &&
                            <TurnstileWidget
                                siteKey={ turnstileSiteKey }
                                size="compact"
                                onToken={ setLoginTurnstileToken }
                                onExpire={ () => setLoginTurnstileToken('') }
                                onError={ () => setLoginTurnstileToken('') }
                                resetSignal={ loginTurnstileResetSignal }
                            /> }
                        { loginServerReachable === false &&
                            <div className="error-line server-offline">
                                { t('nitro.login.server.offline.short', 'The gameserver isn\'t running right now. Please try again in a moment.') }
                                <button type="button" className="retry-link" onClick={ pingLoginServer } disabled={ loginPingingServer }>
                                    { loginPingingServer ? t('nitro.login.server.checking', 'Checking…') : t('nitro.login.server.retry', 'Retry') }
                                </button>
                            </div>
                        }
                        { banInfo &&
                            <div className="error-line ban-message">
                                <div className="ban-title">
                                    { banInfo.type === 'ip'
                                        ? t('nitro.login.error.banned.ip.title', 'This connection is banned')
                                        : t('nitro.login.error.banned.account.title', 'Your account is banned') }
                                </div>
                                { banInfo.permanent
                                    ? <div className="ban-status">{ t('nitro.login.error.banned.permanent', 'This is a permanent ban.') }</div>
                                    : (banInfo.expiresAt
                                        ? <div className="ban-status">{ t('nitro.login.error.banned.temporary', 'You can log in again in %time%.', [ 'time' ], [ formatRemaining(banInfo.expiresAt) ]) }</div>
                                        : null) }
                                { banInfo.reason &&
                                    <div className="ban-reason">{ t('nitro.login.error.banned.reason', 'Reason: %reason%', [ 'reason' ], [ banInfo.reason ]) }</div> }
                            </div>
                        }
                        { error && <div className="error-line">{ error }</div> }
                        { info && <div className="info-line">{ info }</div> }
                        <div className="submit-row">
                            <button
                                type="submit"
                                className="ok-button"
                                disabled={ submitting || isLocked || loginServerReachable === false || loginPingingServer || !!banInfo }
                            >{ loginPingingServer ? t('nitro.login.server.checking', 'Checking…') : t('login.title', 'Log in') }</button>
                        </div>
                        <a className="forgot" onClick={ () => setMode('forgot') }>{ t('login.forgot_password', 'Forgotten your password?') }</a>
                    </form>
                </div>
            </div>

            { mode === 'register' &&
                <RegisterDialog
                    onCancel={ () => setMode('login') }
                    onSubmit={ handleRegisterSubmit }
                    onCheckEmail={ checkEmailAvailable }
                    onCheckUsername={ checkUsernameAvailable }
                    onCheckServer={ checkServerReachable }
                    imagingUrl={ imagingUrl }
                    roomTemplatesUrl={ roomTemplatesUrl }
                    submitting={ submitting }
                    error={ error }
                    info={ info }
                    turnstileEnabled={ turnstileEnabled }
                    turnstileSiteKey={ turnstileSiteKey }
                /> }

            { mode === 'forgot' &&
                <ForgotDialog
                    onCancel={ () => setMode('login') }
                    onSubmit={ handleForgotSubmit }
                    submitting={ submitting }
                    error={ error }
                    info={ info }
                    turnstileEnabled={ turnstileEnabled }
                    turnstileSiteKey={ turnstileSiteKey }
                /> }
        </div>
    );
};
