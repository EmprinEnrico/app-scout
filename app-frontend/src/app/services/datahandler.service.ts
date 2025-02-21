import { Injectable } from '@angular/core';
import { PreferencesService } from './preferences.service';

export interface Branca {
    value: string;
    viewValue: string;
}

export interface Tappa {
    value: string;
    viewValue: string;
}

export interface Database {
    [tappa: string]: string[];
}


@Injectable({
  providedIn: 'root',
})
export class DatahandlerService {

    constructor(private preferencesService: PreferencesService){}

    // Selected settings data

    public branche: Branca[] = [
        {value: 'branco', viewValue: 'La mia pista'},
        {value: 'reparto', viewValue: 'Il mio sentiero'},
        {value: 'clan', viewValue: 'La mia strada'},
    ];

    public tappeBranco: Tappa[] = [
        {value: 'branco-1', viewValue: 'Lupo Legge'},
        {value: 'branco-2', viewValue: 'Lupo Rupe'},
        {value: 'branco-3', viewValue: 'Lupo Anziano'},
    ];

    public tappeReparto: Tappa[] = [
        {value: 'reparto-1', viewValue: 'Tappa della scoperta'},
        {value: 'reparto-2', viewValue: 'Tappa della competenza'},
        {value: 'reparto-3', viewValue: 'Tappa della responsabilità'},
    ];

    public tappeClan: Tappa[] = [
        {value: 'clan-1', viewValue: 'Punto della strada 1'},
        {value: 'clan-2', viewValue: 'Punto della strada 2'},
        {value: 'clan-3', viewValue: 'Punto della strada 3'},
        {value: 'clan-4', viewValue: 'Punto della strada 4'},
        {value: 'clan-5', viewValue: 'Punto della strada 5'},
        {value: 'clan-6', viewValue: 'Punto della strada 6'},
        {value: 'clan-7', viewValue: 'Punto della strada 7'},
        {value: 'clan-8', viewValue: 'Punto della strada 8'},
    ];

    async getSelectedBranca(): Promise<string> {
        let selectedBranca = await this.preferencesService.get<string>('selectedBranca');
        if (selectedBranca) {
            return selectedBranca;
        } else {
            return "";
        }
    }

    async getSelectedTappa(): Promise<string> {
        let selectedTappa = await this.preferencesService.get<string>('selectedTappa');
        if (selectedTappa) {
            return selectedTappa;
        } else {
            return "";
        }
    }

    async setSelectedBranca(selectedBranca: string): Promise<void> {
        await this.preferencesService.set('selectedBranca', selectedBranca);
    }
    
    async setSelectedTappa(selectedTappa: string): Promise<void> {
        await this.preferencesService.set('selectedTappa', selectedTappa);
    }

    // Database data

    private default_database:Database = {
        'branco-1': [""],
        'branco-2': [""],
        'branco-3': [""],
        'reparto-1': [""],
        'reparto-2': [""],
        'reparto-3': [""],
        'clan-1': [""],
        'clan-2': [""],
        'clan-3': [""],
        'clan-4': [""],
        'clan-5': [""],
        'clan-6': [""],
        'clan-7': [""],
        'clan-8': [""],
    };

    async setDatabase(newDatabase: object): Promise<void> {
        await this.preferencesService.set("database", newDatabase);
    }

    async getDatabase(): Promise<Database> {
        let database = await this.preferencesService.get<Database>("database");
        if(database == null || database == undefined){
            this.setDatabase(this.default_database);
            database = this.default_database;
        }
        return database;
    }

    getAllNonEmptyTappe(database: Database): Database {
        const nonEmptyTappe: Database = {};

        for (const [tappa, objectives] of Object.entries(database)) {
            if (objectives.some(obj => obj.trim() !== '')) {
                nonEmptyTappe[tappa] = objectives.filter(obj => obj.trim() !== '');
            }
        }
        return nonEmptyTappe;
    }

    getTappaObjectives(database: Database, tappa: string):string[] {
        return database[tappa];
    }

    async setTappaObjective(database: Database, tappa: string, objectiveNumber: number, objective: string):Promise<Database> {
        
        database[tappa][objectiveNumber - 1] = objective;
        await this.setDatabase(database);
        return database;
    }
    
    async removeObjective(database: Database, tappa: string, objectiveNumber: number):Promise<Database> {
        database[tappa].splice(objectiveNumber - 1, 1);
        await this.setDatabase(database);
        return database;
    }

}
