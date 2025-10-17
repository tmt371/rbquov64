// File: 04-core-code/main.js

import { AppContext } from './app-context.js';
import { MigrationService } from './services/migration-service.js';
import { UIManager } from './ui/ui-manager.js';
import { InputHandler } from './ui/input-handler.js';
import { paths } from './config/paths.js';
import { EVENTS, DOM_IDS } from './config/constants.js';

class App {
    constructor() {
        this.appContext = new AppContext();
        const migrationService = new MigrationService();
        
        const restoredData = migrationService.loadAndMigrateData();
        
        // 將恢復的資料傳遞給 AppContext 進行初始化
        this.appContext.initialize(restoredData);
    }

    async _loadPartials() {
        const eventAggregator = this.appContext.get('eventAggregator');
        const loadPartial = async (url, targetElement, injectionMethod = 'append') => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for ${url}`);
                }
                const html = await response.text();
                if (injectionMethod === 'innerHTML') {
                    targetElement.innerHTML = html;
                } else {
                    targetElement.insertAdjacentHTML('beforeend', html);
                }
            } catch (error) {
                console.error(`Failed to load HTML partial from ${url}:`, error);
                eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: `Error: Could not load UI component from ${url}!`, type: 'error'});
            }
        };
    
        await loadPartial(paths.partials.leftPanel, document.body);
        
        const functionPanel = document.getElementById(DOM_IDS.FUNCTION_PANEL);
        if (functionPanel) {
            await loadPartial(paths.partials.rightPanel, functionPanel, 'innerHTML');
        }
    }

    async run() {
        console.log("Application starting...");
        
        await this._loadPartials();

        const eventAggregator = this.appContext.get('eventAggregator');
        const calculationService = this.appContext.get('calculationService');
        const configManager = this.appContext.get('configManager');
        const appController = this.appContext.get('appController');

        this.uiManager = new UIManager(
            document.getElementById(DOM_IDS.APP),
            eventAggregator,
            calculationService
        );

        await configManager.initialize();

        eventAggregator.subscribe(EVENTS.STATE_CHANGED, (state) => {
            this.uiManager.render(state);
        });

        appController.publishInitialState();
        
        this.inputHandler = new InputHandler(eventAggregator);
        this.inputHandler.initialize();

        eventAggregator.subscribe(EVENTS.APP_READY, () => {
            // Re-introduce the timeout to allow the initial render to complete
            // before trying to focus a cell.
            setTimeout(() => {
                eventAggregator.publish(EVENTS.FOCUS_CELL, { rowIndex: 0, column: 'width' });
            }, 100);
        });

        // Publish the appReady event after all initializations are complete.
        eventAggregator.publish(EVENTS.APP_READY);
        
        console.log("Application running and interactive.");

        document.body.classList.add('app-is-ready');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    await app.run();
});