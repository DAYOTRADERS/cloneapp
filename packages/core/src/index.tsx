/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/no-named-as-default */
import ReactDOM from 'react-dom';
import React from 'react';
import 'promise-polyfill';
// eslint-disable-next-line
import registerServiceWorker, { unregister as unregisterServiceWorker } from 'Utils/pwa';
import initStore from 'App/initStore';
import App from 'App/app.jsx';
import { checkAndSetEndpointFromUrl } from '@deriv/shared';
import AppNotificationMessages from './App/Containers/app-notification-messages.jsx';
import { AnalyticsInitializer } from 'Utils/Analytics';
import { getActiveAccounts, isTmbEnabled } from '@deriv/utils';

AnalyticsInitializer();

const is_deriv_origin =
    window.location.hostname === 'deriv.com' ||
    window.location.hostname.endsWith('.deriv.com') ||
    window.location.hostname === 'deriv.app' ||
    window.location.hostname.endsWith('.deriv.app') ||
    window.location.hostname === 'deriv.me' ||
    window.location.hostname.endsWith('.deriv.me') ||
    window.location.hostname === 'deriv.be' ||
    window.location.hostname.endsWith('.deriv.be');

// A custom Vercel deployment should always use the network version of the app.
// The repository's PWA worker uses CacheFirst for bundles, which can otherwise
// keep an older JavaScript build alive after a deployment.
if (is_deriv_origin) {
    registerServiceWorker();
} else {
    unregisterServiceWorker();
}

const has_endpoint_url = checkAndSetEndpointFromUrl();

// if has endpoint url, APP will be redirected
if (!has_endpoint_url) {
    const initApp = async () => {
        let is_tmb_enabled = false;
        let accounts;

        // TMB is only relevant on Deriv-owned origins. Do not wait for this
        // network-dependent helper on custom deployments such as Vercel.
        if (is_deriv_origin) {
            try {
                is_tmb_enabled = await Promise.race([
                    isTmbEnabled(),
                    new Promise(resolve => setTimeout(() => resolve(false), 2500)),
                ]);
            } catch (error) {
                console.warn('TMB detection failed; continuing with normal startup.', error);
            }
        }

        if (is_tmb_enabled) {
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
