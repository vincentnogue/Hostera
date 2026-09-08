
const isNode = typeof window === 'undefined';

const isClearAccessTokenRequested = () =>
	!isNode && new URLSearchParams(window.location.search).get("clear_access_token") === 'true';

const clearStoredAccessToken = () => {
	window.localStorage.removeItem('base44_access_token');
	window.localStorage.removeItem('token');
}

// Supabase persists the session under `sb-<project-ref>-auth-token` in
// localStorage. Reading it synchronously here (rather than the async
// supabase.auth.getSession()) preserves the original synchronous
// appParams.token contract that other call sites rely on.
const getAccessToken = () => {
	if (isNode) return null;
	try {
		const url = import.meta.env.VITE_SUPABASE_URL || '';
		const ref = url.match(/^https?:\/\/([^.]+)\.supabase\.co/)?.[1];
		if (!ref) return null;
		const raw = window.localStorage.getItem(`sb-${ref}-auth-token`);
		if (!raw) return null;
		return JSON.parse(raw)?.access_token || null;
	} catch {
		return null;
	}
};

const getAppParams = () => {
	if (isClearAccessTokenRequested()) {
		clearStoredAccessToken();
	}
	return {
		appId: import.meta.env.VITE_SUPABASE_URL,
		token: getAccessToken(),
		functionsVersion: undefined,
		appBaseUrl: import.meta.env.VITE_SUPABASE_URL,
	}
}

export const appParams = {
	...getAppParams()
}
