import React from 'react';
import { getPositionsV2TabIndexFromURL, makeLazyLoader, moduleLoader, routes } from '@deriv/shared';
import { Loading } from '@deriv/components';
import { TCoreStores } from '@deriv/stores/types';
import { TWebSocket } from 'Types';

type Apptypes = {
    passthrough: {
        root_store: TCoreStores;
        WS: TWebSocket;
    };
};

// DTrader V2 is the default trading interface for this build.
// Keep the legacy loader out of the selection path so the old Deriv
// trader UI is not shown when the trading page opens.
const AppV2Loader = makeLazyLoader(
    () => moduleLoader(() => import(/* webpackChunkName: "trader-app-v2", webpackPreload: true */ './AppV2/index')),
    () => (
        <Loading.DTraderV2
            initial_app_loading
            is_contract_details={window.location.pathname.startsWith('/contract/')}
            is_positions={window.location.pathname === routes.trader_positions}
            is_closed_tab={getPositionsV2TabIndexFromURL() === 1}
        />
    )
)() as React.ComponentType<Apptypes>;

const App = ({ passthrough }: Apptypes) => <AppV2Loader passthrough={passthrough} />;

export default App;
