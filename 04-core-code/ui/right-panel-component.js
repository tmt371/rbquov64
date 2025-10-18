/**
 * @fileoverview A dedicated component for managing and rendering the Right Panel UI.
 */
import { EVENTS, DOM_IDS } from '../config/constants.js';

export class RightPanelComponent {
    constructor(panelElement, eventAggregator, calculationService) {
        if (!panelElement) {
            throw new Error("Panel element is required for RightPanelComponent.");
        }
        this.panelElement = panelElement;
        this.eventAggregator = eventAggregator;
        this.calculationService = calculationService;
        this.state = null; // To hold the latest state

        this.tabContainer = this.panelElement.querySelector('.tab-container');
        this.tabButtons = this.panelElement.querySelectorAll('.tab-button');
        this.tabContents = this.panelElement.querySelectorAll('.tab-content');

        this._cacheF1Elements();
        this._cacheF2Elements();
        this._cacheF3Elements();
        this._cacheF4Elements();
        this.initialize();
        console.log("RightPanelComponent Initialized for F1 Cost Display.");
    }

    initialize() {
        if (this.tabContainer) {
            this.tabContainer.addEventListener('click', (event) => {
                const target = event.target.closest('.tab-button');
                if (target && !target.disabled) {
                    this._setActiveTab(target);
                }
            });
        }

        const panelToggle = document.getElementById(DOM_IDS.FUNCTION_PANEL_TOGGLE);
        if (panelToggle) {
            panelToggle.addEventListener('click', () => {
                // When the panel is toggled, check if F1 is the active tab and refresh it.
                const f1Tab = this.tabContainer.querySelector('#f1-tab');
                if (f1Tab && f1Tab.classList.contains('active')) {
                    // Use a small timeout to ensure the state is fresh after any preceding actions.
                    setTimeout(() => this._renderF1Tab(this.state), 0);
                }
            });
        }

        this._initializeF1Listeners();
        this._initializeF2Listeners();
        this._initializeF3Listeners();
        this._initializeF4ButtonListeners();

        this.eventAggregator.subscribe(EVENTS.FOCUS_ELEMENT, ({ elementId }) => {
            const element = this.panelElement.querySelector(`#${elementId}`);
            if (element) {
                element.focus();
                element.select();
            }
        });
    }

    _initializeF1Listeners() {
        // Handles clickable divs that act like buttons
        const remote1chQtyDiv = this.f1.displays.qty['remote-1ch'];
        if (remote1chQtyDiv) {
            remote1chQtyDiv.addEventListener('click', () => this.eventAggregator.publish(EVENTS.USER_REQUESTED_REMOTE_DISTRIBUTION));
        }

        const slimQtyDiv = this.f1.displays.qty['slim'];
        if (slimQtyDiv) {
            slimQtyDiv.addEventListener('click', () => this.eventAggregator.publish(EVENTS.USER_REQUESTED_DUAL_DISTRIBUTION));
        }

        // Handles discount input
        const discountInput = this.f1.inputs['discount'];
        if (discountInput) {
            discountInput.addEventListener('input', (event) => {
                const percentage = parseFloat(event.target.value) || 0;
                // Use a dedicated event for clarity
                this.eventAggregator.publish(EVENTS.F1_DISCOUNT_CHANGED, { percentage });
            });
        }
    }

    _cacheF1Elements() {
        const query = (id) => this.panelElement.querySelector(id);
        this.f1 = {
            inputs: {
                'discount': query(`#${DOM_IDS.F1_RB_DISCOUNT_INPUT}`),
            },
            displays: {
                qty: {
                    'winder': query(`#${DOM_IDS.F1_QTY_WINDER}`),
                    'motor': query(`#${DOM_IDS.F1_QTY_MOTOR}`),
                    'remote-1ch': query(`#${DOM_IDS.F1_QTY_REMOTE_1CH}`),
                    'remote-16ch': query(`#${DOM_IDS.F1_QTY_REMOTE_16CH}`),
                    'charger': query(`#${DOM_IDS.F1_QTY_CHARGER}`),
                    '3m-cord': query(`#${DOM_IDS.F1_QTY_3M_CORD}`),
                    'dual-combo': query(`#${DOM_IDS.F1_QTY_DUAL_COMBO}`),
                    'slim': query(`#${DOM_IDS.F1_QTY_SLIM}`),
                },
                price: {
                    'winder': query(`#${DOM_IDS.F1_PRICE_WINDER}`),
                    'motor': query(`#${DOM_IDS.F1_PRICE_MOTOR}`),
                    'remote-1ch': query(`#${DOM_IDS.F1_PRICE_REMOTE_1CH}`),
                    'remote-16ch': query(`#${DOM_IDS.F1_PRICE_REMOTE_16CH}`),
                    'charger': query(`#${DOM_IDS.F1_PRICE_CHARGER}`),
                    '3m-cord': query(`#${DOM_IDS.F1_PRICE_3M_CORD}`),
                    'dual-combo': query(`#${DOM_IDS.F1_PRICE_DUAL_COMBO}`),
                    'slim': query(`#${DOM_IDS.F1_PRICE_SLIM}`),
                    'total': query(`#${DOM_IDS.F1_PRICE_TOTAL}`),
                    'rb-retail': query(`#${DOM_IDS.F1_RB_RETAIL}`),
                    'rb-price': query(`#${DOM_IDS.F1_RB_PRICE}`),
                    'sub-total': query(`#${DOM_IDS.F1_SUB_TOTAL}`),
                    'gst': query(`#${DOM_IDS.F1_GST}`),
                    'final-total': query(`#${DOM_IDS.F1_FINAL_TOTAL}`),
                }
            }
        };
    }

    _initializeF2Listeners() {
        const setupF2InputListener = (inputElement) => {
            if (inputElement) {
                inputElement.addEventListener('change', (event) => {
                    this.eventAggregator.publish(EVENTS.F2_VALUE_CHANGED, { id: event.target.id, value: event.target.value });
                });
                
                inputElement.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        this.eventAggregator.publish(EVENTS.F2_INPUT_ENTER_PRESSED, { id: event.target.id });
                    }
                });
            }
        };

        const f2Inputs = [
            this.f2.b10_wifiQty, this.f2.b13_deliveryQty, this.f2.b14_installQty,
            this.f2.b15_removalQty, this.f2.b17_mulTimes, this.f2.b18_discount
        ];
        f2Inputs.forEach(input => setupF2InputListener(input));

        const feeCells = [
            { el: this.f2.c13_deliveryFee, type: 'delivery' },
            { el: this.f2.c14_installFee, type: 'install' },
            { el: this.f2.c15_removalFee, type: 'removal' }
        ];
        feeCells.forEach(({ el, type }) => {
            if (el) {
                el.addEventListener('click', () => {
                    this.eventAggregator.publish(EVENTS.TOGGLE_FEE_EXCLUSION, { feeType: type });
                });
            }
        });
    }

    _cacheF2Elements() {
        const query = (id) => this.panelElement.querySelector(id);
        this.f2 = {
            b2_winderPrice: query('#f2-b2-winder-price'),
            b3_dualPrice: query('#f2-b3-dual-price'),
            b4_acceSum: query('#f2-b4-acce-sum'),
            b6_motorPrice: query('#f2-b6-motor-price'),
            b7_remotePrice: query('#f2-b7-remote-price'),
            b8_chargerPrice: query('#f2-b8-charger-price'),
            b9_cordPrice: query('#f2-b9-cord-price'),
            b10_wifiQty: query('#f2-b10-wifi-qty'),
            c10_wifiSum: query('#f2-c10-wifi-sum'),
            b11_eAcceSum: query('#f2-b11-e-acce-sum'),
            b13_deliveryQty: query('#f2-b13-delivery-qty'),
            c13_deliveryFee: query('#f2-c13-delivery-fee'),
            b14_installQty: query('#f2-b14-install-qty'),
            c14_installFee: query('#f2-c14-install-fee'),
            b15_removalQty: query('#f2-b15-removal-qty'),
            c15_removalFee: query('#f2-c15-removal-fee'),
            b16_surchargeFee: query('#f2-b16-surcharge-fee'),
            a17_totalSum: query('#f2-a17-total-sum'),
            b17_mulTimes: query('#f2-b17-mul-times'),
            c17_1stRbPrice: query('#f2-c17-1st-rb-price'),
            b18_discount: query('#f2-b18-discount'),
            b19_disRbPrice: query('#f2-b19-dis-rb-price'),
            b20_singleprofit: query('#f2-b20-singleprofit'),
            b21_rbProfit: query('#f2-b21-rb-profit'),
            b22_sumprice: query('#f2-b22-sumprice'),
            b23_sumprofit: query('#f2-b23-sumprofit'),
            b24_gst: query('#f2-b24-gst'),
            b25_netprofit: query('#f2-b25-netprofit'),
        };
    }

    _cacheF3Elements() {
        const query = (id) => this.panelElement.querySelector(id);
        this.f3 = {
            inputs: {
                quoteId: query('#f3-quote-id'),
                issueDate: query('#f3-issue-date'),
                dueDate: query('#f3-due-date'),
                customerName: query('#f3-customer-name'),
                customerAddress: query('#f3-customer-address'),
                customerPhone: query('#f3-customer-phone'),
                customerEmail: query('#f3-customer-email'),
                finalOfferPrice: query('#f3-final-offer-price'),
                generalNotes: query('#f3-general-notes'),
                termsConditions: query('#f3-terms-conditions'),
            },
            buttons: {
                addQuote: query('#btn-add-quote'),
            }
        };
    }
    
    _initializeF3Listeners() {
        if (!this.f3.inputs.issueDate) return;

        // --- Date Chaining Logic ---
        this.f3.inputs.issueDate.addEventListener('input', (event) => {
            const issueDateValue = event.target.value;
            if (issueDateValue) {
                const issueDate = new Date(issueDateValue);
                // Adjust for timezone offset to prevent day-before issues
                issueDate.setMinutes(issueDate.getMinutes() + issueDate.getTimezoneOffset());
                
                const dueDate = new Date(issueDate);
                dueDate.setDate(dueDate.getDate() + 14);

                const year = dueDate.getFullYear();
                const month = String(dueDate.getMonth() + 1).padStart(2, '0');
                const day = String(dueDate.getDate()).padStart(2, '0');
                
                this.f3.inputs.dueDate.value = `${year}-${month}-${day}`;
            }
        });

        // --- Focus Jumping Logic ---
        const focusOrder = [
            'quoteId', 'issueDate', 'dueDate', 'customerName', 'customerAddress', 
            'customerPhone', 'customerEmail', 'finalOfferPrice', 'generalNotes', 'termsConditions'
        ];

        focusOrder.forEach((key, index) => {
            const currentElement = this.f3.inputs[key];
            if (currentElement) {
                currentElement.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || (event.key === 'Tab' && !event.shiftKey)) {
                        event.preventDefault();
                        const nextIndex = index + 1;
                        if (nextIndex < focusOrder.length) {
                            const nextKey = focusOrder[nextIndex];
                            this.f3.inputs[nextKey]?.focus();
                        } else {
                            this.f3.buttons.addQuote?.focus();
                        }
                    }
                });
            }
        });
    }

    _cacheF4Elements() {
        const query = (id) => this.panelElement.querySelector(id);
        this.f4 = {
            buttons: {
                'f1-key-save': query('#f1-key-save'),
                'f1-key-export': query('#f1-key-export'),
                'f1-key-load': query('#f1-key-load'),
                'f1-key-reset': query('#f1-key-reset'),
            }
        };
    }

    _initializeF4ButtonListeners() {
        const buttonEventMap = {
            'f1-key-save': EVENTS.USER_REQUESTED_SAVE,
            'f1-key-export': EVENTS.USER_REQUESTED_EXPORT_CSV,
            'f1-key-load': EVENTS.USER_REQUESTED_LOAD,
            'f1-key-reset': EVENTS.USER_REQUESTED_RESET
        };

        for (const [id, eventName] of Object.entries(buttonEventMap)) {
            const button = this.f4.buttons[id];
            if (button) {
                button.addEventListener('click', () => this.eventAggregator.publish(eventName));
            }
        }
    }

    render(state) {
        this.state = state; // Cache the latest state
        this._renderF1Tab(state);
        this._renderF2Tab(state);
    }

    _renderF1Tab(state) {
        if (!this.f1 || !state || !state.quoteData || !state.ui) return;

        const { quoteData, ui } = state;
        const items = quoteData.products.rollerBlind.items;
        const formatPrice = (price) => (typeof price === 'number' && price > 0 ? `$${price.toFixed(2)}` : '');
        const formatDisplay = (value) => (value !== null && value !== undefined) ? value : '';

        // --- Component Cost Calculation ---
        const componentPrices = {};
        const winderQty = items.filter(item => item.winder === 'HD').length;
        componentPrices.winder = this.calculationService.calculateF1ComponentPrice('winder', winderQty);
        this.f1.displays.qty.winder.textContent = winderQty;

        const motorQty = items.filter(item => !!item.motor).length;
        componentPrices.motor = this.calculationService.calculateF1ComponentPrice('motor', motorQty);
        this.f1.displays.qty.motor.textContent = motorQty;

        const totalRemoteQty = ui.driveRemoteCount || 0;
        const remote1chQty = ui.f1.remote_1ch_qty;
        const remote16chQty = (ui.f1.remote_1ch_qty === null) ? totalRemoteQty : (totalRemoteQty - remote1chQty);
        componentPrices['remote-1ch'] = this.calculationService.calculateF1ComponentPrice('remote-1ch', remote1chQty);
        componentPrices['remote-16ch'] = this.calculationService.calculateF1ComponentPrice('remote-16ch', remote16chQty);
        this.f1.displays.qty['remote-1ch'].textContent = remote1chQty;
        this.f1.displays.qty['remote-16ch'].textContent = remote16chQty;

        const chargerQty = ui.driveChargerCount || 0;
        componentPrices.charger = this.calculationService.calculateF1ComponentPrice('charger', chargerQty);
        this.f1.displays.qty.charger.textContent = chargerQty;

        const cordQty = ui.driveCordCount || 0;
        componentPrices['3m-cord'] = this.calculationService.calculateF1ComponentPrice('3m-cord', cordQty);
        this.f1.displays.qty['3m-cord'].textContent = cordQty;
        
        const totalDualPairs = Math.floor(items.filter(item => item.dual === 'D').length / 2);
        const comboQty = (ui.f1.dual_combo_qty === null) ? totalDualPairs : ui.f1.dual_combo_qty;
        const slimQty = (ui.f1.dual_slim_qty === null) ? 0 : ui.f1.dual_slim_qty;
        componentPrices['dual-combo'] = this.calculationService.calculateF1ComponentPrice('dual-combo', comboQty);
        componentPrices.slim = this.calculationService.calculateF1ComponentPrice('slim', slimQty);
        this.f1.displays.qty['dual-combo'].textContent = comboQty;
        this.f1.displays.qty.slim.textContent = slimQty;

        for (const [key, price] of Object.entries(componentPrices)) {
            if (this.f1.displays.price[key]) {
                this.f1.displays.price[key].textContent = formatPrice(price);
            }
        }
        const componentTotal = Object.values(componentPrices).reduce((sum, price) => sum + price, 0);
        this.f1.displays.price.total.textContent = formatPrice(componentTotal);

        // --- RB Pricing Calculation ---
        const retailTotal = quoteData.products.rollerBlind.summary.totalSum || 0;
        const discountPercentage = ui.f1.discountPercentage || 0;
        const discountAmount = retailTotal * (discountPercentage / 100);
        const rbPrice = retailTotal - discountAmount;

        this.f1.displays.price['rb-retail'].textContent = formatPrice(retailTotal);
        if (document.activeElement !== this.f1.inputs.discount) {
            this.f1.inputs.discount.value = formatDisplay(discountPercentage) || '';
        }
        this.f1.displays.price['rb-price'].textContent = formatPrice(rbPrice);

        // --- Final Summary Calculation ---
        const subTotal = componentTotal + rbPrice;
        const gst = subTotal * 0.10;
        const finalTotal = subTotal + gst;

        this.f1.displays.price['sub-total'].textContent = formatPrice(subTotal);
        this.f1.displays.price.gst.textContent = formatPrice(gst);
        this.f1.displays.price['final-total'].textContent = formatPrice(finalTotal);
    }

    _renderF2Tab(state) {
        if (!state || !state.ui.f2 || !this.f2.b2_winderPrice) return;
        
        const f2State = state.ui.f2;
        const productSummary = state.quoteData.products[state.quoteData.currentProduct]?.summary;
        const accessories = productSummary?.accessories || {};

        const formatIntegerCurrency = (value) => (typeof value === 'number') ? `$${value.toFixed(0)}` : '$';
        const formatDecimalCurrency = (value) => (typeof value === 'number') ? `$${value.toFixed(2)}` : '$';
        const formatValue = (value) => (value !== null && value !== undefined) ? value : '';

        const winderPrice = accessories.winderCostSum || 0;
        const dualPrice = accessories.dualCostSum || 0;
        const motorPrice = accessories.motorCostSum || 0;
        const remotePrice = accessories.remoteCostSum || 0;
        const chargerPrice = accessories.chargerCostSum || 0;
        const cordPrice = accessories.cordCostSum || 0;

        this.f2.b2_winderPrice.textContent = formatIntegerCurrency(winderPrice);
        this.f2.b3_dualPrice.textContent = formatIntegerCurrency(dualPrice);
        this.f2.b6_motorPrice.textContent = formatIntegerCurrency(motorPrice);
        this.f2.b7_remotePrice.textContent = formatIntegerCurrency(remotePrice);
        this.f2.b8_chargerPrice.textContent = formatIntegerCurrency(chargerPrice);
        this.f2.b9_cordPrice.textContent = formatIntegerCurrency(cordPrice);

        const wifiSum = f2State.wifiSum || 0;
        const deliveryFee = f2State.deliveryFee || 0;
        const installFee = f2State.installFee || 0;
        const removalFee = f2State.removalFee || 0;

        const acceSum = winderPrice + dualPrice;
        const eAcceSum = motorPrice + remotePrice + chargerPrice + cordPrice + wifiSum;
        const surchargeFee =
            (f2State.deliveryFeeExcluded ? 0 : deliveryFee) +
            (f2State.installFeeExcluded ? 0 : installFee) +
            (f2State.removalFeeExcluded ? 0 : removalFee);

        this.f2.b4_acceSum.textContent = formatIntegerCurrency(acceSum);
        this.f2.c10_wifiSum.textContent = formatIntegerCurrency(wifiSum);
        this.f2.b11_eAcceSum.textContent = formatIntegerCurrency(eAcceSum);
        this.f2.c13_deliveryFee.textContent = formatIntegerCurrency(deliveryFee);
        this.f2.c14_installFee.textContent = formatIntegerCurrency(installFee);
        this.f2.c15_removalFee.textContent = formatIntegerCurrency(removalFee);
        this.f2.b16_surchargeFee.textContent = formatIntegerCurrency(surchargeFee);
        
        this.f2.a17_totalSum.textContent = formatValue(f2State.totalSumForRbTime);
        this.f2.c17_1stRbPrice.textContent = formatDecimalCurrency(f2State.firstRbPrice);
        this.f2.b19_disRbPrice.textContent = formatDecimalCurrency(f2State.disRbPrice);
        this.f2.b20_singleprofit.textContent = formatDecimalCurrency(f2State.singleprofit);
        this.f2.b21_rbProfit.textContent = formatDecimalCurrency(f2State.rbProfit);
        this.f2.b22_sumprice.textContent = formatDecimalCurrency(f2State.sumPrice);
        this.f2.b23_sumprofit.textContent = formatDecimalCurrency(f2State.sumProfit);
        this.f2.b24_gst.textContent = formatDecimalCurrency(f2State.gst);
        this.f2.b25_netprofit.textContent = formatDecimalCurrency(f2State.netProfit);

        if (document.activeElement !== this.f2.b10_wifiQty) this.f2.b10_wifiQty.value = formatValue(f2State.wifiQty);
        if (doc