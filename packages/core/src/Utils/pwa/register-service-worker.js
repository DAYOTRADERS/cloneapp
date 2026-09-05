import { getUrlBase } from '@deriv/shared';

const EVERY_HOUR = 3600000; // 1000 * 60 * 60

let interval_id;

function refreshOnUpdate() {
    return swRegistrationObject => {
        swRegistrationObject.onupdatefound = () => {
            const updatingWorker = swRegistrationObject.installing;
            if (!updatingWorker) return;

            updatingWorker.onstatechange = () => {
                if (updatingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // eslint-disable-next-line no-console
                    console.log('New version is found, refreshing the page...');
                    clearInterval(interval_id);
                }
            };
        };
    };
}

export default function register() {
    // Register the service worker only where the application explicitly supports
    // the PWA cache. Custom deployments are intentionally kept network-first.
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const sw_url = `${window.location.origin}${getUrlBase('/service-worker.js')}`;
            navigator.serviceWorker
                .register(sw_url)
                .then(registration => {
                    interval_id = setInterval(() => {
                        registration
                            .update()
                            .then(refreshOnUpdate)
                            .catch(error => {
                                console.error('Error during service worker update:', error); // eslint-disable-line no-console
                            });
                    }, EVERY_HOUR);

                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        if (!installingWorker) return;

                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller && performance.now() > EVERY_HOUR) {
                                    const new_version_received = new Event('UpdateAvailable');
                                    document.dispatchEvent(new_version_received);
                                }
                            }
                        };
                    };
                })
                .catch(error => {
                    console.error('Error during service worker registration:', error, sw_url); // eslint-disable-line no-console
                });
        });
    }
}

export function unregister() {
    if (!('serviceWorker' in navigator)) return;

    // Do not wait on navigator.serviceWorker.ready: a stale worker can keep
    // serving an old bundle indefinitely. Remove all registrations immediately
    // and clear their Cache Storage entries on custom deployments.
    navigator.serviceWorker
        .getRegistrations()
        .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
        .catch(error => console.warn('Unable to unregister stale service workers.', error));

    if ('caches' in window) {
        caches
            .keys()
            .then(cache_names => Promise.all(cache_names.map(cache_name => caches.delete(cache_name))))
            .catch(error => console.warn('Unable to clear stale PWA caches.', error));
    }
}
