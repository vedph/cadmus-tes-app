import { Component, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  UntypedFormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FlatLookupPipe, NgxToolsValidators } from '@myrmidon/ngx-tools';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { AuthJwtService } from '@myrmidon/auth-jwt-login';
import { CloseSaveButtonsComponent, ModelEditorComponentBase } from '@myrmidon/cadmus-ui';
import { EditedObject, ThesauriSet, ThesaurusEntry } from '@myrmidon/cadmus-core';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';
import { HistoricalDatePipe } from '@myrmidon/cadmus-refs-historical-date';

import {
  SITE_RESOURCES_PART_TYPEID,
  SiteResource,
  SiteResourcesPart,
} from '../../site-resources-part';
import { SiteResourceEditor } from '../site-resource-editor/site-resource-editor';

interface SiteResourcesPartSettings {
  lookupProviderOptions?: LookupProviderOptions;
}

@Component({
  selector: 'cadmus-site-resources-part.component',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    // cadmus
    CloseSaveButtonsComponent,
    FlatLookupPipe,
    HistoricalDatePipe,
    SiteResourceEditor
  ],
  templateUrl: './site-resources-part.component.html',
  styleUrl: './site-resources-part.component.css',
})
export class SiteResourcesPartComponent
  extends ModelEditorComponentBase<SiteResourcesPart>
  implements OnInit
{
  public readonly editedIndex = signal<number>(-1);
  public readonly edited = signal<SiteResource | undefined>(undefined);

  // site-resource-types
  public readonly typeEntries = signal<ThesaurusEntry[] | undefined>(undefined);
  // site-resource-tags
  public readonly tagEntries = signal<ThesaurusEntry[] | undefined>(undefined);
  // site-resource-features
  public readonly featureEntries = signal<ThesaurusEntry[] | undefined>(undefined);
  // asserted-historical-date-tags
  public readonly dateTagEntries = signal<ThesaurusEntry[] | undefined>(undefined);
  // doc-reference-types
  public readonly refTypeEntries = signal<ThesaurusEntry[] | undefined>(undefined);
  // doc-reference-tags
  public readonly refTagEntries = signal<ThesaurusEntry[] | undefined>(undefined);
  // site-resource-count-ids
  public readonly countIdEntries = signal<ThesaurusEntry[] | undefined>(undefined);
  // site-resource-count-tags
  public readonly countTagEntries = signal<ThesaurusEntry[] | undefined>(undefined);
  // geo-location-tags
  public readonly locTagEntries = signal<ThesaurusEntry[] | undefined>(undefined);
  // assertion-tags
  public readonly assTagEntries = signal<ThesaurusEntry[] | undefined>(undefined);

  // lookup options depending on role
  public readonly lookupProviderOptions = signal<LookupProviderOptions | undefined>(undefined);

  public entries: FormControl<SiteResource[]>;

  constructor(
    authService: AuthJwtService,
    formBuilder: FormBuilder,
    private _dialogService: DialogService,
  ) {
    super(authService, formBuilder);
    // form
    this.entries = formBuilder.control([], {
      // at least 1 entry
      validators: NgxToolsValidators.strictMinLengthValidator(1),
      nonNullable: true,
    });
    // settings
    this.initSettings<SiteResourcesPartSettings>(SITE_RESOURCES_PART_TYPEID, (settings) => {
      this.lookupProviderOptions.set(settings?.lookupProviderOptions || undefined);
    });
  }

  public override ngOnInit(): void {
    super.ngOnInit();
  }

  protected buildForm(formBuilder: FormBuilder): FormGroup | UntypedFormGroup {
    return formBuilder.group({
      entries: this.entries,
    });
  }

  private updateThesauri(thesauri: ThesauriSet): void {
    let key = 'site-resource-types';
    if (this.hasThesaurus(key)) {
      this.typeEntries.set(thesauri[key].entries);
    } else {
      this.typeEntries.set(undefined);
    }
    key = 'site-resource-tags';
    if (this.hasThesaurus(key)) {
      this.tagEntries.set(thesauri[key].entries);
    } else {
      this.tagEntries.set(undefined);
    }
    key = 'site-resource-features';
    if (this.hasThesaurus(key)) {
      this.featureEntries.set(thesauri[key].entries);
    } else {
      this.featureEntries.set(undefined);
    }
    key = 'asserted-historical-date-tags';
    if (this.hasThesaurus(key)) {
      this.dateTagEntries.set(thesauri[key].entries);
    } else {
      this.dateTagEntries.set(undefined);
    }
    key = 'doc-reference-types';
    if (this.hasThesaurus(key)) {
      this.refTypeEntries.set(thesauri[key].entries);
    } else {
      this.refTypeEntries.set(undefined);
    }
    key = 'doc-reference-tags';
    if (this.hasThesaurus(key)) {
      this.refTagEntries.set(thesauri[key].entries);
    } else {
      this.refTagEntries.set(undefined);
    }
    key = 'site-resource-count-ids';
    if (this.hasThesaurus(key)) {
      this.countIdEntries.set(thesauri[key].entries);
    } else {
      this.countIdEntries.set(undefined);
    }
    key = 'site-resource-count-tags';
    if (this.hasThesaurus(key)) {
      this.countTagEntries.set(thesauri[key].entries);
    } else {
      this.countTagEntries.set(undefined);
    }
    key = 'geo-location-tags';
    if (this.hasThesaurus(key)) {
      this.locTagEntries.set(thesauri[key].entries);
    } else {
      this.locTagEntries.set(undefined);
    }
    key = 'assertion-tags';
    if (this.hasThesaurus(key)) {
      this.assTagEntries.set(thesauri[key].entries);
    } else {
      this.assTagEntries.set(undefined);
    }
  }

  private updateForm(part?: SiteResourcesPart | null): void {
    if (!part) {
      this.form.reset();
      return;
    }
    this.entries.setValue(part.resources || []);
    this.form.markAsPristine();
  }

  protected override onDataSet(data?: EditedObject<SiteResourcesPart>): void {
    // thesauri
    if (data?.thesauri) {
      this.updateThesauri(data.thesauri);
    }

    // form
    this.updateForm(data?.value);
  }

  protected getValue(): SiteResourcesPart {
    let part = this.getEditedPart(SITE_RESOURCES_PART_TYPEID) as SiteResourcesPart;
    part.resources = this.entries.value || [];
    return part;
  }

  public addResource(): void {
    const resource: SiteResource = {
      type: this.typeEntries()?.[0]?.id || ''
    };
    this.editResource(resource, -1);
  }

  public editResource(entry: SiteResource, index: number): void {
    this.editedIndex.set(index);
    this.edited.set(structuredClone(entry));
  }

  public closeResource(): void {
    this.editedIndex.set(-1);
    this.edited.set(undefined);
  }

  public saveResource(entry: SiteResource): void {
    const entries = [...this.entries.value];
    if (this.editedIndex() === -1) {
      entries.push(entry);
    } else {
      entries.splice(this.editedIndex(), 1, entry);
    }
    this.entries.setValue(entries);
    this.entries.markAsDirty();
    this.entries.updateValueAndValidity();
    this.closeResource();
  }

  public deleteResource(index: number): void {
    this._dialogService
      .confirm('Confirmation', 'Delete resource?')
      .subscribe((yes: boolean | undefined) => {
        if (yes) {
          if (this.editedIndex() === index) {
            this.closeResource();
          }
          const entries = [...this.entries.value];
          entries.splice(index, 1);
          this.entries.setValue(entries);
          this.entries.markAsDirty();
          this.entries.updateValueAndValidity();
        }
      });
  }

  public moveResourceUp(index: number): void {
    if (index < 1) {
      return;
    }
    const entry = this.entries.value[index];
    const entries = [...this.entries.value];
    entries.splice(index, 1);
    entries.splice(index - 1, 0, entry);
    this.entries.setValue(entries);
    this.entries.markAsDirty();
    this.entries.updateValueAndValidity();
  }

  public moveResourceDown(index: number): void {
    if (index + 1 >= this.entries.value.length) {
      return;
    }
    const entry = this.entries.value[index];
    const entries = [...this.entries.value];
    entries.splice(index, 1);
    entries.splice(index + 1, 0, entry);
    this.entries.setValue(entries);
    this.entries.markAsDirty();
    this.entries.updateValueAndValidity();
  }
}
