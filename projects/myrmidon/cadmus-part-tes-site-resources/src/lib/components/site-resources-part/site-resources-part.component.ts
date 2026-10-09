import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';

import { TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FlatLookupPipe, NgxToolsSignalValidators } from '@myrmidon/ngx-tools';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import {
  CloseSaveButtonsComponent,
  HelpLinkComponent,
  ModelEditorComponentBase,
  copyFormValue,
} from '@myrmidon/cadmus-ui';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
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

interface SiteResourcesPartControls {
  entries: SiteResource[];
}

function toDraft(part?: SiteResourcesPart | null): SiteResourcesPartControls {
  // copy: the form tags the objects in its arrays
  return { entries: copyFormValue(part?.resources || []) };
}

/**
 * Site resources part editor component.
 * Thesauri: site-resource-types, site-resource-tags, site-resource-features, asserted-historical-date-tags,
 * doc-reference-types, doc-reference-tags, site-resource-count-ids, site-resource-count-tags,
 * geo-location-tags, assertion-tags.
 * Settings: lookupProviderOptions (LookupProviderOptions).
 */
@Component({
  selector: 'cadmus-site-resources-part',
  imports: [
    TitleCasePipe,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatTooltipModule,
    // cadmus
    CloseSaveButtonsComponent,
    FlatLookupPipe,
    HistoricalDatePipe,
    SiteResourceEditor,
    HelpLinkComponent,
  ],
  templateUrl: './site-resources-part.component.html',
  styleUrl: './site-resources-part.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteResourcesPartComponent extends ModelEditorComponentBase<SiteResourcesPart> {
  private readonly _dialogService = inject(DialogService);

  public readonly editedIndex = signal<number>(-1);
  public readonly edited = signal<SiteResource | undefined>(undefined);

  // site-resource-types
  public readonly typeEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['site-resource-types']?.entries,
  );
  // site-resource-tags
  public readonly tagEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['site-resource-tags']?.entries,
  );
  // site-resource-features
  public readonly featureEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['site-resource-features']?.entries,
  );
  // asserted-historical-date-tags
  public readonly dateTagEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['asserted-historical-date-tags']?.entries,
  );
  // doc-reference-types
  public readonly refTypeEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['doc-reference-types']?.entries,
  );
  // doc-reference-tags
  public readonly refTagEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['doc-reference-tags']?.entries,
  );
  // site-resource-count-ids
  public readonly countIdEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['site-resource-count-ids']?.entries,
  );
  // site-resource-count-tags
  public readonly countTagEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['site-resource-count-tags']?.entries,
  );
  // geo-location-tags
  public readonly locTagEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['geo-location-tags']?.entries,
  );
  // assertion-tags
  public readonly assTagEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['assertion-tags']?.entries,
  );

  // lookup options depending on role
  public readonly lookupProviderOptions = signal<LookupProviderOptions | undefined>(undefined);

  private readonly _draft = linkedSignal(() => toDraft(this.data()?.value));
  public readonly form = this.createForm(this._draft, (p) => {
    // at least 1 entry
    NgxToolsSignalValidators.strictMinLength(p.entries, 1);
  });

  constructor() {
    super();
    this.initSettings<SiteResourcesPartSettings>(SITE_RESOURCES_PART_TYPEID, (settings) => {
      this.lookupProviderOptions.set(settings?.lookupProviderOptions || undefined);
    });
  }

  protected getValue(): SiteResourcesPart {
    const part = this.getEditedPart(SITE_RESOURCES_PART_TYPEID) as SiteResourcesPart;
    part.resources = copyFormValue(this._draft().entries);
    return part;
  }

  /**
   * Set the entries as the result of a user action.
   */
  private setEntries(entries: SiteResource[]): void {
    this.form.entries().value.set(entries);
    this.form.entries().markAsDirty();
  }

  public addResource(): void {
    const resource: SiteResource = {
      type: this.typeEntries()?.[0]?.id || '',
    };
    this.editResource(resource, -1);
  }

  public editResource(entry: SiteResource, index: number): void {
    this.editedIndex.set(index);
    // structuredClone also drops the form's Symbol tag
    this.edited.set(structuredClone(entry));
  }

  public closeResource(): void {
    this.editedIndex.set(-1);
    this.edited.set(undefined);
  }

  public saveResource(entry: SiteResource): void {
    const entries = [...this.form.entries().value()];
    if (this.editedIndex() === -1) {
      entries.push(copyFormValue(entry));
    } else {
      entries.splice(this.editedIndex(), 1, copyFormValue(entry));
    }
    this.setEntries(entries);
    this.closeResource();
  }

  public deleteResource(index: number): void {
    this._dialogService
      .confirm('Confirmation', 'Delete resource?')
      .subscribe((yes: boolean | undefined) => {
        if (yes) {
          if (this.editedIndex() === index) {
            this.closeResource();
          } else if (this.editedIndex() > index) {
            // keep the edited index in sync with the shifted entries
            this.editedIndex.update((i) => i - 1);
          }
          this.setEntries(
            this.form
              .entries()
              .value()
              .filter((_, i) => i !== index),
          );
        }
      });
  }

  /**
   * Keep the edited index in sync when two adjacent entries are swapped.
   */
  private swapEditedIndex(a: number, b: number): void {
    if (this.editedIndex() === a) {
      this.editedIndex.set(b);
    } else if (this.editedIndex() === b) {
      this.editedIndex.set(a);
    }
  }

  public moveResourceUp(index: number): void {
    if (index < 1) {
      return;
    }
    const entries = [...this.form.entries().value()];
    const entry = entries[index];
    entries.splice(index, 1);
    entries.splice(index - 1, 0, entry);
    this.swapEditedIndex(index, index - 1);
    this.setEntries(entries);
  }

  public moveResourceDown(index: number): void {
    if (index + 1 >= this.form.entries().value().length) {
      return;
    }
    const entries = [...this.form.entries().value()];
    const entry = entries[index];
    entries.splice(index, 1);
    entries.splice(index + 1, 0, entry);
    this.swapEditedIndex(index, index + 1);
    this.setEntries(entries);
  }
}
