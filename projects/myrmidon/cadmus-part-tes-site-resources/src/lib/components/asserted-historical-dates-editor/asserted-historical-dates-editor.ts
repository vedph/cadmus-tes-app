import { ChangeDetectionStrategy, Component, inject, input, model, signal } from '@angular/core';

// material
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FlatLookupPipe } from '@myrmidon/ngx-tools';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import {
  AssertedHistoricalDate,
  AssertedHistoricalDateComponent,
  HistoricalDatePipe,
} from '@myrmidon/cadmus-refs-historical-date';

/**
 * Editor for a list of asserted historical dates. Each date can be added,
 * edited, moved, or deleted; every change to the list is emitted via
 * `datesChange`. As the date editor saves at each change, the edited date
 * enters the list only when the user accepts it.
 */
@Component({
  selector: 'cadmus-asserted-historical-dates-editor',
  imports: [
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatTooltipModule,
    FlatLookupPipe,
    HistoricalDatePipe,
    AssertedHistoricalDateComponent,
  ],
  templateUrl: './asserted-historical-dates-editor.html',
  styleUrl: './asserted-historical-dates-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssertedHistoricalDatesEditor {
  private readonly _dialogService = inject(DialogService);

  /**
   * The dates to edit.
   */
  public readonly dates = model<AssertedHistoricalDate[]>([]);

  // asserted-historical-date-tags
  public readonly tagEntries = input<ThesaurusEntry[] | undefined>();
  // assertion-tags
  public readonly assertionTagEntries = input<ThesaurusEntry[] | undefined>();
  // doc-reference-types
  public readonly docReferenceTypeEntries = input<ThesaurusEntry[] | undefined>();
  // doc-reference-tags
  public readonly docReferenceTagEntries = input<ThesaurusEntry[] | undefined>();

  // the date being edited (a copy), and its index (-1 for a new date)
  public readonly editedIndex = signal<number>(-1);
  public readonly edited = signal<AssertedHistoricalDate | undefined>(undefined);

  public addDate(): void {
    this.editDate({ a: { value: 0 } }, -1);
  }

  public editDate(date: AssertedHistoricalDate, index: number): void {
    this.editedIndex.set(index);
    // structuredClone also drops any form's Symbol tag
    this.edited.set(structuredClone(date));
  }

  public onEditedChange(date: AssertedHistoricalDate | undefined): void {
    this.edited.set(date);
  }

  public closeDate(): void {
    this.editedIndex.set(-1);
    this.edited.set(undefined);
  }

  public saveDate(): void {
    const date = this.edited();
    if (!date) {
      return;
    }
    const dates = [...this.dates()];
    if (this.editedIndex() === -1) {
      dates.push(date);
    } else {
      dates.splice(this.editedIndex(), 1, date);
    }
    this.dates.set(dates);
    this.closeDate();
  }

  public deleteDate(index: number): void {
    this._dialogService
      .confirm('Confirmation', 'Delete date?')
      .subscribe((yes: boolean | undefined) => {
        if (yes) {
          if (this.editedIndex() === index) {
            this.closeDate();
          } else if (this.editedIndex() > index) {
            // keep the edited index in sync with the shifted dates
            this.editedIndex.update((i) => i - 1);
          }
          this.dates.set(this.dates().filter((_, i) => i !== index));
        }
      });
  }

  /**
   * Keep the edited index in sync when two adjacent dates are swapped.
   */
  private swapEditedIndex(a: number, b: number): void {
    if (this.editedIndex() === a) {
      this.editedIndex.set(b);
    } else if (this.editedIndex() === b) {
      this.editedIndex.set(a);
    }
  }

  public moveDateUp(index: number): void {
    if (index < 1) {
      return;
    }
    const dates = [...this.dates()];
    const date = dates[index];
    dates.splice(index, 1);
    dates.splice(index - 1, 0, date);
    this.swapEditedIndex(index, index - 1);
    this.dates.set(dates);
  }

  public moveDateDown(index: number): void {
    if (index + 1 >= this.dates().length) {
      return;
    }
    const dates = [...this.dates()];
    const date = dates[index];
    dates.splice(index, 1);
    dates.splice(index + 1, 0, date);
    this.swapEditedIndex(index, index + 1);
    this.dates.set(dates);
  }
}
