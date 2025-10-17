// 04-core-code/app-context.js

/**
 * @description
 * AppContext 是一個簡易的依賴注入（DI）容器，用於管理應用程式中各個模組的實例化和依賴關係。
 * 它的主要職責是：
 * 1. 集中創建和配置服務（Services）、管理器（Managers）、工廠（Factories）和視圖（Views）。
 * 2. 解決模組之間的依賴，確保每個模組都能獲得它所需要的其他模組的實例。
 * 3. 簡化 `main.js`，使其只專注於應用程式的啟動流程，而不是物件的創建細節。
 *
 * 這個模式的好處是：
 * - **集中管理**: 所有物件的創建邏輯都集中在此，方便維護和修改。
 * - **降低耦合**: 模組之間不再直接創建依賴，而是通過 AppContext 來獲取，降低了耦合度。
 * - **提高可測試性**: 在測試時，可以輕鬆地替換掉真實的依賴，注入模擬（mock）的物件。
 */
export class AppContext {
    constructor() {
        this.instances = {};
    }

    /**
     * 註冊一個實例。
     * @param {string} name - 實例的名稱。
     * @param {object} instance - 要註冊的實例。
     */
    register(name, instance) {
        this.instances[name] = instance;
    }

    /**
     * 獲取一個實例。
     * @param {string} name - 想要獲取的實例的名稱。
     * @returns {object} - 返回對應的實例。
     */
    get(name) {
        const instance = this.instances[name];
        if (!instance) {
            throw new Error(`Instance '${name}' not found.`);
        }
        return instance;
    }

    initialize(startingQuoteData = null) {
        // 在這裡，我們將從 main.js 遷移過來的實例化邏輯
        const eventAggregator = new EventAggregator();
        this.register('eventAggregator', eventAggregator);

        const configManager = new ConfigManager(eventAggregator);
        this.register('configManager', configManager);

        const productFactory = new ProductFactory({ configManager });
        this.register('productFactory', productFactory);

        let initialStateWithData = JSON.parse(JSON.stringify(initialState));
        if (startingQuoteData) {
            initialStateWithData.quoteData = startingQuoteData;
        }

        const stateService = new StateService({
            initialState: initialStateWithData,
            eventAggregator,
            productFactory,
            configManager
        });
        this.register('stateService', stateService);

        const calculationService = new CalculationService({
            stateService,
            productFactory,
            configManager
        });
        this.register('calculationService', calculationService);

        const fileService = new FileService({ productFactory });
        this.register('fileService', fileService);

        const focusService = new FocusService({
            stateService
        });
        this.register('focusService', focusService);

        const publishStateChangeCallback = () => eventAggregator.publish('stateChanged', this.get('appController')._getFullState());

        const k1LocationView = new K1LocationView({ stateService, publishStateChangeCallback });
        const k2FabricView = new K2FabricView({ stateService, eventAggregator, publishStateChangeCallback });
        const k3OptionsView = new K3OptionsView({ stateService, publishStateChangeCallback });
        const dualChainView = new DualChainView({ stateService, calculationService, eventAggregator, publishStateChangeCallback });
        const driveAccessoriesView = new DriveAccessoriesView({ stateService, calculationService, eventAggregator, publishStateChangeCallback });

        this.register('k1LocationView', k1LocationView);
        this.register('k2FabricView', k2FabricView);
        this.register('k3OptionsView', k3OptionsView);
        this.register('dualChainView', dualChainView);
        this.register('driveAccessoriesView', driveAccessoriesView);

        const detailConfigView = new DetailConfigView({
            stateService,
            calculationService,
            eventAggregator,
            publishStateChangeCallback,
            k1LocationView,
            k2FabricView,
            k3OptionsView,
            dualChainView,
            driveAccessoriesView
        });
        this.register('detailConfigView', detailConfigView);
        
        const workflowService = new WorkflowService({
            eventAggregator,
            stateService,
            fileService,
            calculationService,
            productFactory,
            detailConfigView
        });
        this.register('workflowService', workflowService);

        const quickQuoteView = new QuickQuoteView({
            stateService,
            calculationService,
            focusService,
            fileService,
            eventAggregator,
            productFactory,
            configManager,
            publishStateChangeCallback
        });
        this.register('quickQuoteView', quickQuoteView);

        const appController = new AppController({
            eventAggregator,
            stateService,
            workflowService,
            quickQuoteView,
            detailConfigView
        });
        this.register('appController', appController);
    }
}

// Import all necessary classes
import { EventAggregator } from './event-aggregator.js';
import { ConfigManager } from './config-manager.js';
import { AppController } from './app-controller.js';
import { ProductFactory } from './strategies/product-factory.js';
import { StateService } from './services/state-service.js';
import { CalculationService } from './services/calculation-service.js';
import { FocusService } from './services/focus-service.js';
import { FileService } from './services/file-service.js';
import { WorkflowService } from './services/workflow-service.js';
import { QuickQuoteView } from './ui/views/quick-quote-view.js';
import { DetailConfigView } from './ui/views/detail-config-view.js';
import { K1LocationView } from './ui/views/k1-location-view.js';
import { K2FabricView } from './ui/views/k2-fabric-view.js';
import { K3OptionsView } from './ui/views/k3-options-view.js';
import { DualChainView } from './ui/views/dual-chain-view.js';
import { DriveAccessoriesView } from './ui/views/drive-accessories-view.js';
import { initialState } from './config/initial-state.js';