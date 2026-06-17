import { NitroEvent } from '@nitrots/nitro-renderer';
import { CatalogWidgetEvent } from './CatalogWidgetEvent';

export class CatalogPurchaseOverrideEvent extends NitroEvent {
    private _callback: (...args: any[]) => void;

    constructor(callback: (...args: any[]) => void) {
        super(CatalogWidgetEvent.PURCHASE_OVERRIDE);

        this._callback = callback;
    }

    public get callback(): (...args: any[]) => void {
        return this._callback;
    }
}
