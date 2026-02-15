import { CommonModule } from '@angular/common';
import { Component, effect, input, model, output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

// material
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { DecoratedCount, DecoratedCountsComponent } from '@myrmidon/cadmus-refs-decorated-counts';
import {
  AssertedHistoricalDate,
  AssertedHistoricalDateComponent,
} from '@myrmidon/cadmus-refs-historical-date';
import {
  AssertedLocation,
  AssertedLocationComponent,
} from '@myrmidon/cadmus-part-geo-asserted-locations';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';
import { ThesaurusEntriesPickerComponent } from '@myrmidon/cadmus-thesaurus-store';

import { SiteResource } from '../../site-resources-part';

@Component({
  selector: 'cadmus-site-resource-editor',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    ThesaurusEntriesPickerComponent,
    AssertedLocationComponent,
    AssertedHistoricalDateComponent,
    DecoratedCountsComponent,
  ],
  templateUrl: './site-resource-editor.html',
  styleUrl: './site-resource-editor.css',
})
export class SiteResourceEditor {
  /**
   * The resource to edit.
   */
  public readonly resource = model<SiteResource | undefined>();

  /**
   * Emitted when the user cancels editing.
   */
  public readonly cancelEdit = output();

  // site-resource-types
  public readonly typeEntries = input<ThesaurusEntry[] | undefined>();
  // site-resource-tags
  public readonly tagEntries = input<ThesaurusEntry[] | undefined>();
  // site-resource-features
  public readonly featureEntries = input<ThesaurusEntry[] | undefined>();
  // asserted-historical-date-tags
  public readonly dateTagEntries = input<ThesaurusEntry[] | undefined>();
  // doc-reference-types
  public readonly refTypeEntries = input<ThesaurusEntry[] | undefined>();
  // doc-reference-tags
  public readonly refTagEntries = input<ThesaurusEntry[] | undefined>();
  // site-resource-count-ids
  public readonly countIdEntries = input<ThesaurusEntry[] | undefined>();
  // site-resource-count-tags
  public readonly countTagEntries = input<ThesaurusEntry[] | undefined>();
  // geo-location-tags
  public readonly locTagEntries = input<ThesaurusEntry[] | undefined>();
  // assertion-tags
  public readonly assTagEntries = input<ThesaurusEntry[] | undefined>();

  public readonly lookupProviderOptions = input<LookupProviderOptions | undefined>();

  public eid: FormControl<string | null>;
  public type: FormControl<string>;
  public tag: FormControl<string | null>;
  public features: FormControl<ThesaurusEntry[]>;
  public hasLocation: FormControl<boolean>;
  public location: FormControl<AssertedLocation | null>;
  public hasDate: FormControl<boolean>;
  public date: FormControl<AssertedHistoricalDate | null>;
  public counts: FormControl<DecoratedCount[]>;
  public form: FormGroup;

  constructor(formBuilder: FormBuilder) {
    // form
    this.eid = new FormControl<string | null>(null);
    this.type = new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    });
    this.tag = new FormControl<string | null>(null);
    this.features = new FormControl<ThesaurusEntry[]>([], { nonNullable: true });
    this.hasLocation = new FormControl<boolean>(false, { nonNullable: true });
    this.location = new FormControl<AssertedLocation | null>(null);
    this.hasDate = new FormControl<boolean>(false, { nonNullable: true });
    this.date = new FormControl<AssertedHistoricalDate | null>(null);
    this.counts = new FormControl<DecoratedCount[]>([], { nonNullable: true });
    this.form = formBuilder.group({
      eid: this.eid,
      type: this.type,
      tag: this.tag,
      features: this.features,
      hasLocation: this.hasLocation,
      location: this.location,
      hasDate: this.hasDate,
      date: this.date,
      counts: this.counts,
    });

    // when model changes, update form
    effect(() => {
      const data = this.resource();
      this.updateForm(data);
    });
  }

  private mapIdsToEntries(ids: string[], entries: ThesaurusEntry[] | undefined): ThesaurusEntry[] {
    if (!entries) return ids.map((id) => ({ id, value: id }));
    return ids.map((id) => entries.find((e) => e.id === id) || { id, value: id });
  }

  private updateForm(data: SiteResource | undefined | null): void {
    if (!data) {
      this.form.reset();
    } else {
      this.eid.setValue(data.eid ?? null);
      this.type.setValue(data.type);
      this.tag.setValue(data.tag ?? null);
      this.features.setValue(this.mapIdsToEntries(data.features ?? [], undefined));
      this.hasLocation.setValue(!!data.location);
      this.location.setValue(data.location ?? null);
      this.hasDate.setValue(!!data.date);
      this.date.setValue(data.date ?? null);
      this.counts.setValue(data.counts ?? []);
      this.form.markAsPristine();
    }
  }

  private getData(): SiteResource {
    return {
      eid: this.eid.value ?? undefined,
      type: this.type.value,
      tag: this.tag.value ?? undefined,
      features: this.features.value.length ? this.features.value.map((e) => e.id) : undefined,
      location: this.hasLocation.value ? (this.location.value ?? undefined) : undefined,
      date: this.hasDate.value ? (this.date.value ?? undefined) : undefined,
      counts: this.counts.value?.length ? this.counts.value : undefined,
    };
  }

  public onFeatureEntriesChange(entries: ThesaurusEntry[]): void {
    this.features.setValue(entries);
    this.features.markAsDirty();
    this.features.updateValueAndValidity();
  }

  public onLocationChange(location: AssertedLocation | null): void {
    this.location.setValue(location);
    this.location.markAsDirty();
    this.location.updateValueAndValidity();
  }

  public onDateChange(date: AssertedHistoricalDate | null): void {
    this.date.setValue(date);
    this.date.markAsDirty();
    this.date.updateValueAndValidity();
  }

  public onCountsChange(counts: DecoratedCount[]): void {
    this.counts.setValue(counts);
    this.counts.markAsDirty();
    this.counts.updateValueAndValidity();
  }

  public cancel(): void {
    this.cancelEdit.emit();
  }

  /**
   * Saves the current form data by updating the `data` model signal.
   * This method can be called manually (e.g., by a Save button) or
   * automatically (via auto-save).
   * @param pristine If true (default), the form is marked as pristine
   * after saving.
   * Set to false for auto-save if you want the form to remain dirty.
   */
  public save(pristine = true): void {
    if (this.form.invalid) {
      // show validation errors
      this.form.markAllAsTouched();
      return;
    }

    const data = this.getData();
    this.resource.set(data);

    if (pristine) {
      this.form.markAsPristine();
    }
  }
}
