import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  linkedSignal,
  model,
  output,
  untracked,
} from '@angular/core';
import { FormField, form, maxLength, required } from '@angular/forms/signals';

// material
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { copyFormValue, isImplicitSubmission, setFieldFromChild } from '@myrmidon/cadmus-ui';
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

/**
 * The editable shape behind the form.
 */
interface SiteResourceControls {
  eid: string;
  type: string;
  tag: string;
  features: string[];
  hasLocation: boolean;
  location: AssertedLocation | null;
  hasDate: boolean;
  date: AssertedHistoricalDate | null;
  counts: DecoratedCount[];
}

/**
 * Resource -> editable draft.
 */
function toDraft(resource?: SiteResource | null): SiteResourceControls {
  return {
    eid: resource?.eid || '',
    type: resource?.type || '',
    tag: resource?.tag || '',
    features: [...(resource?.features || [])],
    hasLocation: !!resource?.location,
    location: copyFormValue(resource?.location || null),
    hasDate: !!resource?.date,
    date: copyFormValue(resource?.date || null),
    counts: copyFormValue(resource?.counts || []),
  };
}

/**
 * Editable draft -> resource.
 */
function toModel(draft: SiteResourceControls): SiteResource {
  return {
    eid: draft.eid.trim() || undefined,
    type: draft.type,
    tag: draft.tag.trim() || undefined,
    features: draft.features.length ? [...draft.features] : undefined,
    location: draft.hasLocation ? copyFormValue(draft.location || undefined) : undefined,
    date: draft.hasDate ? copyFormValue(draft.date || undefined) : undefined,
    counts: draft.counts.length ? copyFormValue(draft.counts) : undefined,
  };
}

/**
 * Editor component for a site resource. The resource is saved only when
 * the user accepts the changes.
 */
@Component({
  selector: 'cadmus-site-resource-editor',
  imports: [
    FormField,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  /**
   * The editable draft, rebuilt from each new resource. The echo of our
   * own save (equal to what the draft maps to) keeps the draft as it is,
   * because toModel() normalizes it (e.g. trimming).
   */
  private readonly _draft = linkedSignal<SiteResource | undefined, SiteResourceControls>({
    source: () => this.resource(),
    computation: (resource, previous) =>
      previous && JSON.stringify(resource) === JSON.stringify(toModel(previous.value))
        ? previous.value
        : toDraft(resource),
  });

  public readonly form = form(this._draft, (p) => {
    required(p.type);
    maxLength(p.type, 100);
  });

  /**
   * The picked features as thesaurus entries, so that the picker can show
   * their labels. Features not found in the thesaurus show their ID.
   */
  public readonly pickedFeatures = computed<ThesaurusEntry[]>(() => {
    const entries = this.featureEntries();
    return this.form
      .features()
      .value()
      .map((id) => entries?.find((e) => e.id === id) || { id, value: id });
  });

  constructor() {
    // once the draft mirrors the bound resource again, there are no
    // unsaved edits: clear the interaction state (touched, dirty).
    // Keyed on the draft, which does not change on the echo of a save.
    effect(() => {
      const draft = this._draft();
      untracked(() => {
        if (this.isDraftInSync(draft)) {
          this.form().reset();
        }
      });
    });
  }

  /**
   * True when the draft still mirrors the bound resource.
   */
  private isDraftInSync(draft: SiteResourceControls): boolean {
    return JSON.stringify(draft) === JSON.stringify(toDraft(this.resource()));
  }

  public onFeatureEntriesChange(entries: ThesaurusEntry[]): void {
    this.form.features().value.set(entries.map((e) => e.id));
    this.form.features().markAsDirty();
  }

  public onLocationChange(location: AssertedLocation | undefined): void {
    setFieldFromChild(this.form.location, copyFormValue(location || null));
  }

  public onDateChange(date: AssertedHistoricalDate | undefined): void {
    setFieldFromChild(this.form.date, copyFormValue(date || null));
  }

  public onCountsChange(counts: DecoratedCount[]): void {
    setFieldFromChild(this.form.counts, copyFormValue(counts || []));
  }

  /**
   * Handle Enter in this editor: in a text input, save as the accept
   * button would, when enabled. This replaces the implicit submission of
   * the form this editor used to render.
   * @param event The keydown event.
   */
  public onEnterKey(event: Event): void {
    if (!isImplicitSubmission(event) || this.form().invalid() || !this.form().dirty()) {
      return;
    }
    event.preventDefault();
    this.save();
  }

  public cancel(): void {
    this.cancelEdit.emit();
  }

  /**
   * Save the current draft into the `resource` model signal.
   * @param pristine If true (default), the form's interaction state is
   * cleared after saving.
   */
  public save(pristine = true): void {
    if (this.form().invalid()) {
      // show validation errors
      this.form().markAsTouched();
      return;
    }

    this.resource.set(toModel(this._draft()));

    if (pristine) {
      this.form().reset();
    }
  }
}
