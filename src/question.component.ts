import {Component, EventEmitter, HostBinding} from '@angular/core'
import {ControlGroup} from '@angular/common'
import {Question} from './data.interface'

@Component({
    selector: 'ef-question',
    inputs: ['info'],
    outputs: ['valueChange'],
    template: `
        <div [ngFormModel]="form">
            <label 
                *ngIf="question.label" 
                [ngClass]="question.classes?.label"
                [attr.for]="question.key">
                {{question.label}}
            </label>
            
            <div [ngSwitch]="question.type">
                <select 
                    *ngSwitchWhen="'dropdown'"
                    [ngControl]="question.key"
                    (ngModelChange)="onValueChange($event)"
                    [id]="question.key">
                    [ngClass]="question.classes?.question"
                    <option *ngFor="let o of question.options" [value]="o.value">{{o.name ? o.name : o.value}}</option>
                </select>   
                
                <div *ngSwitchWhen="'checkbox'" [ngClass]="question.classes?.question">
                    <div class="checkbox" *ngFor="let o of question.options">
                        <input 
                            [type]="question.type"
                            [ngControl]="question.key"
                            [name]="question.key"
                            [value]="o.value"
                            [checked]="isSelectActive(o)"
                            (change)="chackboxValueChange()"
                            [disabled]="o.disabled"
                            (click)="setCheckbox(o)">
                        <span>{{o.name ? o.name : o.value}}</span>   
                    </div>
                </div>
                
                <div *ngSwitchWhen="'radio'" [ngClass]="question.classes?.question">
                    <div class="radio" *ngFor="let o of question.options">
                        <input 
                            [type]="question.type"
                            [ngControl]="question.key"
                            [name]="question.key"
                            [value]="o.value"
                            [checked]="question.value === o.value"
                            (click)="setRadio(o)">
                        <span>{{o.name ? o.name : o.value}}</span>    
                    </div>
                </div>
            
                <input 
                    *ngSwitchDefault
                    [ngControl]="question.key"  
                    [type]="question.type"
                    (ngModelChange)="onValueChange($event)"
                    [ngClass]="question.classes?.question"
                    [id]="question.key"> 
            </div>
            
            <div class="error-block" *ngIf="settings.showValidation" [hidden]="showErrorMsg" [ngClass]="question.classes?.error">
                <span *ngFor="let e of errors()">{{e}}</span>
            </div>
        </div>

    `
})

export class QuestionComponent {

    // Add class to the wrapper
    @HostBinding('class') get toSet() {
        return this.question && this.question.classes && this.question.classes.wrapper ? this.question.classes.wrapper : '';
    }

    set info(value) {
        this.question = value.question;
        this.form = value.form;
        this.settings = value.settings;

        if (this.question.type === 'checkbox') {
            this.question.value = !this.question.value ? [] : this.question.value;
            this.checkboxIsRequired = this.question.validation && this.question.validation.find(a => a.type === 'required');
        }
    }

    get showErrorMsg() {
        return this.settings.errorOnDirty ?
            !this.form.controls[this.question.key].valid && !this.form.controls[this.question.key].dirty :
            !this.form.controls[this.question.key].valid
    }

    question: Question;
    form: ControlGroup;
    valueChange: EventEmitter = new EventEmitter();

    private checkboxIsRequired: boolean = false;
    private settings: any;

    
    errors() {
        if (this.question.validation && !this.form.valid) {
            let temp: any = [],
                errors = this.form.controls[this.question.key].errors,
                errorKeys = Object.keys(errors);
            
            if (this.settings.singleErrorMessage) temp.push(this._setError(errorKeys[errorKeys.length - 1]));
            else errorKeys.forEach(a => temp.push(this._setError(a)));

            return temp;
        }
    }

    setRadio(option) {
        this.form.controls[this.question.key].updateValue(option.value);
        this.onValueChange(option.value)
    }

    setCheckbox(option) {
        let index = this.question.value.indexOf(option.value);

        if (index !== -1) this.question.value.splice(index, 1);
        else this.question.value.push(option.value);

        this.form.controls[this.question.key].updateValue(this.question.value);
        this.onValueChange(this.question.value)
    }

    chackboxValueChange() {
        if (this.question.value.length === 1) this.question.options.find(a => a.value === this.question.value[0]).disabled = true;
        else this.question.options.forEach(a => a.disabled = false)
    }

    onValueChange(event) { if (this.question.emitChanges !== false) this.valueChange.emit({[this.question.key]: event}) }
    isSelectActive(option) { return this.question.value.find(a => a === option.value) ? true : false }

    private _setError(item) {
        let errorMsg: string = this.question.validation.find(a => a.type.toLowerCase() === item).message,
            tag: string = this.question.label || this.question.key;
    
        if (!errorMsg) {
            switch (item) {
                // Set error messages
                case 'required':
                    errorMsg = `${tag} is required`;
                    break;
    
                case 'minlength':
                    errorMsg = `${tag} has to be at least ${errors[item].requiredLength} characters long.`;
                    break;
    
                case 'maxlength':
                    errorMsg = `${tag} can't be longer then ${errors[item].requiredLength} characters.`;
                    break;
    
                case 'pattern':
                    errorMsg = `${tag} must match this pattern: ${errors[item].requiredPattern}.`;
                    break;
    
                case 'match':
                    errorMsg = `${tag} must match the ${errors[item].mustMatchField} field.`;
                    break;
            }
        }
    
        return errorMsg;
    }
}