/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/no-named-as-default */
import ReactDOM from 'react-dom';
import React from 'react';
import 'promise-polyfill';
// eslint-disable-next-line
import registerServiceWorker from 'Utils/pwa';
import initStore from 'App/initStore';
import App from 'App/app.jsx';
import { checkAndSetEndpointFromUrl } from '@deriv/shared';
import AppNotificationMessages from './App/Containers/app-notification-messages.jsx';
import { AnalyticsInitializer } from 'Utils/Analytics';
import { getActiveAccounts, isTmbEnabled } from '@deriv/utils';

const DERIV_OAUTH_APP_ID = '34jChK9KLIlj89GWZImQ5';

const configureDerivAppId = () => {
    try {
        // Store the App ID as a plain string. The WebSocket URL must receive
        // app_id=34jChK9KLIlj89GWZImQ5, not a JSON-quoted value.
        window.localStorage.setItem('config.app_id', DERIV_OAUTH_APP_ID);
    } catch (error) {
        // Do not prevent the application from starting if browser storage is unavailable.
        console.warn('Unable to configure the Deriv App ID in local storage.', error);
    }
};

configureDerivAppId();
AnalyticsInitializer();
if (
    !!window?.localStorage.getItem?.('debug_service_worker') || // To enable local service worker related development
    (!window.location.hostname.startsWith('localhost') && !/binary\.sx/.test(window.location.hostname)) ||
    window.location.hostname === 'deriv-app.binary.sx'
) {
    registerServiceWorker();
}

const has_endpoint_url = checkAndSetEndpointFromUrl();

// if has endpoint url, APP will be redirected
if (!has_endpoint_url) {
    const initApp = async () => {
        // Do not block the entire UI on account discovery. If the account helper
        // is slow/unavailable, the application can still boot and authenticate later.
        let is_tmb_enabled = false;
        let accounts;

        try {
            is_tmb_enabled = await Promise.race([
                isTmbEnabled(),
                new Promise(resolve => setTimeout(() => resolve(false), 2500)),
            ]);
        } catch (error) {
            console.warn('TMB detection failed; continuing with normal startup.', error);
        }

        // The TMB active-session endpoint is not CORS-enabled for custom/third-party
        // origins such as this Vercel deployment. Only use it on Deriv-owned origins.
        const is_deriv_origin =
            window.location.hostname === 'deriv.com' || window.location.hostname.endsWith('.deriv.com');

        if (is_tmb_enabled && is_deriv_origin) {
            try {
                accounts = await Promise.race([
                    getActiveAccounts(),
                    new Promise(resolve => setTimeout(() => resolve(undefined), 2500)),
                ]);
            } catch (error) {
                console.warn('Active account discovery failed; continuing with normal startup.', error);
            }
        }

        const root_store = is_tmb_enabled
            ? initStore(AppNotificationMessages, accounts)
            : initStore(AppNotificationMessages);

        const wrapper = document.getElementById('deriv_app');
        if (wrapper) {
            ReactDOM.render(<App useSuspense={false} root_store={root_store} />, wrapper);
        }
    };

    initApp();
}