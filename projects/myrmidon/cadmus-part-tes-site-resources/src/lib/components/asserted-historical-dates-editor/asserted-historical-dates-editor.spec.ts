import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';

import { FlatLookupPipe } from '@myrmidon/ngx-tools';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { AssertedHistoricalDate, HistoricalDatePipe } from '@myrmidon/cadmus-refs-historical-date';

import { AssertedHistoricalDatesEditor } from './asserted-historical-dates-editor';

const DATES: AssertedHistoricalDate[] = [
  { a: { value: 200 }, tag: 't1' },
  { a: { value: 300 } },
  { a: { value: 400 } },
];

const NEW_DATE: AssertedHistoricalDate = { a: { value: 500 } };

// stub for the date editor: it renders its received date and has a button
// to emit a fixed new value, as the real editor does at each change
@Component({
  selector: 'cadmus-refs-asserted-historical-date',
  template: `<p>edited date: {{ date()?.a?.value }}</p>
    <p>edited date tags: {{ tagEntries()?.length ?? 0 }}</p>
    <button type="button" (click)="dateChange.emit(value)">change date</button>`,
})
class AssertedHistoricalDateStub {
  public readonly value = NEW_DATE;
  public readonly date = input<AssertedHistoricalDate>();
  public readonly tagEntries = input<ThesaurusEntry[]>();
  public readonly assertionTagEntries = input<ThesaurusEntry[]>();
  public readonly docReferenceTypeEntries = input<ThesaurusEntry[]>();
  public readonly docReferenceTagEntries = input<ThesaurusEntry[]>();
  public readonly dateChange = output<AssertedHistoricalDate>();
}

const COMPONENT_IMPORTS = [
  MatButtonModule,
  MatExpansionModule,
  MatIconModule,
  MatTooltipModule,
  FlatLookupPipe,
  HistoricalDatePipe,
  AssertedHistoricalDateStub,
];

async function setup(inputs: Record<string, unknown> = {}, confirm = true) {
  const datesChange = vi.fn();
  const dialogService = { confirm: vi.fn(() => of(confirm)) };
  const result = await render(AssertedHistoricalDatesEditor, {
    componentImports: COMPONENT_IMPORTS,
    providers: [
      { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      { provide: DialogService, useValue: dialogService },
    ],
    inputs: { dates: structuredClone(DATES), ...inputs },
  });
  // dates is a model: its change output is not accepted by "on"
  result.fixture.componentInstance.dates.subscribe(datesChange);
  await result.fixture.whenStable();
  return { ...result, datesChange, dialogService, user: userEvent.setup() };
}

/** Get the body rows of the dates table, as arrays of cell texts. */
function getRows(): string[][] {
  const table = screen.queryByRole('table');
  if (!table) {
    return [];
  }
  const [, body] = within(table).getAllByRole('rowgroup');
  return within(body)
    .getAllByRole('row')
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .slice(1)
        .map((cell) => cell.textContent?.trim() ?? ''),
    );
}

/** Get the button with the given name in the row at the given index. */
function rowButton(index: number, name: string): HTMLButtonElement {
  const [, body] = within(screen.getByRole('table')).getAllByRole('rowgroup');
  const row = within(body).getAllByRole('row')[index];
  return within(row).getByRole('button', { name }) as HTMLButtonElement;
}

/** Get the date values emitted by the last datesChange. */
function lastValues(datesChange: ReturnType<typeof vi.fn>): number[] {
  const dates = datesChange.mock.lastCall![0] as AssertedHistoricalDate[];
  return dates.map((d) => d.a.value);
}

describe('AssertedHistoricalDatesEditor', () => {
  describe('list', () => {
    it('renders no table without dates', async () => {
      await setup({ dates: [] });
      expect(screen.queryByRole('table')).toBeNull();
    });

    it('lists the dates with their tag labels', async () => {
      await setup({ tagEntries: [{ id: 't1', value: 'tag one' }] });
      const rows = getRows();
      expect(rows.length).toBe(3);
      expect(rows[0][0]).toMatch(/200/);
      expect(rows[0][1]).toBe('tag one');
      expect(rows[1][0]).toMatch(/300/);
      expect(rows[2][0]).toMatch(/400/);
    });

    it('disables moving the first date up and the last down', async () => {
      await setup();
      expect(rowButton(0, 'Move this date up').disabled).toBe(true);
      expect(rowButton(0, 'Move this date down').disabled).toBe(false);
      expect(rowButton(2, 'Move this date up').disabled).toBe(false);
      expect(rowButton(2, 'Move this date down').disabled).toBe(true);
    });
  });

  describe('adding', () => {
    it('opens a new date editor', async () => {
      const { user } = await setup();

      await user.click(screen.getByRole('button', { name: 'date' }));

      expect(screen.getByText('date #new')).toBeTruthy();
      expect(screen.getByText('edited date: 0')).toBeTruthy();
    });

    it('passes the thesauri to the date editor', async () => {
      const { user } = await setup({ tagEntries: [{ id: 't1', value: 'tag one' }] });

      await user.click(screen.getByRole('button', { name: 'date' }));

      expect(screen.getByText('edited date tags: 1')).toBeTruthy();
    });

    it('appends the accepted new date', async () => {
      const { user, datesChange } = await setup();

      await user.click(screen.getByRole('button', { name: 'date' }));
      await user.click(screen.getByRole('button', { name: 'change date' }));
      // nothing is emitted until the date is accepted
      expect(datesChange).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: 'Accept date changes' }));

      expect(datesChange).toHaveBeenCalledTimes(1);
      expect(lastValues(datesChange)).toEqual([200, 300, 400, 500]);
      // the editor is closed
      expect(screen.queryByText(/date #/)).toBeNull();
    });

    it('discards the new date', async () => {
      const { user, datesChange } = await setup();

      await user.click(screen.getByRole('button', { name: 'date' }));
      await user.click(screen.getByRole('button', { name: 'change date' }));
      await user.click(screen.getByRole('button', { name: 'Discard date changes' }));

      expect(datesChange).not.toHaveBeenCalled();
      expect(screen.queryByText(/date #/)).toBeNull();
      expect(getRows().length).toBe(3);
    });
  });

  describe('editing', () => {
    it('opens the date editor on a copy of the date', async () => {
      const { user, fixture } = await setup();

      await user.click(rowButton(1, 'Edit this date'));

      expect(screen.getByText('date #2')).toBeTruthy();
      expect(screen.getByText('edited date: 300')).toBeTruthy();
      const component = fixture.componentInstance;
      expect(component.edited()).toEqual(component.dates()[1]);
      expect(component.edited()).not.toBe(component.dates()[1]);
    });

    it('replaces the edited date when accepted', async () => {
      const { user, datesChange } = await setup();

      await user.click(rowButton(1, 'Edit this date'));
      await user.click(screen.getByRole('button', { name: 'change date' }));
      await user.click(screen.getByRole('button', { name: 'Accept date changes' }));

      expect(lastValues(datesChange)).toEqual([200, 500, 400]);
    });

    it('keeps the date when its changes are discarded', async () => {
      const { user, datesChange } = await setup();

      await user.click(rowButton(1, 'Edit this date'));
      await user.click(screen.getByRole('button', { name: 'change date' }));
      await user.click(screen.getByRole('button', { name: 'Discard date changes' }));

      expect(datesChange).not.toHaveBeenCalled();
      expect(getRows()[1][0]).toMatch(/300/);
    });
  });

  describe('deleting', () => {
    it('deletes the date when confirmed', async () => {
      const { user, datesChange, dialogService } = await setup();

      await user.click(rowButton(0, 'Delete this date'));

      expect(dialogService.confirm).toHaveBeenCalledTimes(1);
      expect(lastValues(datesChange)).toEqual([300, 400]);
    });

    it('keeps the date when not confirmed', async () => {
      const { user, datesChange } = await setup({}, false);

      await user.click(rowButton(0, 'Delete this date'));

      expect(datesChange).not.toHaveBeenCalled();
      expect(getRows().length).toBe(3);
    });

    it('closes the editor when deleting the edited date', async () => {
      const { user } = await setup();

      await user.click(rowButton(1, 'Edit this date'));
      await user.click(rowButton(1, 'Delete this date'));

      expect(screen.queryByText(/date #/)).toBeNull();
    });

    it('keeps editing the same date when a previous one is deleted', async () => {
      const { user, datesChange } = await setup();

      await user.click(rowButton(2, 'Edit this date'));
      await user.click(rowButton(0, 'Delete this date'));
      expect(screen.getByText('date #2')).toBeTruthy();

      await user.click(screen.getByRole('button', { name: 'change date' }));
      await user.click(screen.getByRole('button', { name: 'Accept date changes' }));

      expect(lastValues(datesChange)).toEqual([300, 500]);
    });
  });

  describe('moving', () => {
    it('moves a date up', async () => {
      const { user, datesChange } = await setup();

      await user.click(rowButton(1, 'Move this date up'));

      expect(lastValues(datesChange)).toEqual([300, 200, 400]);
    });

    it('moves a date down', async () => {
      const { user, datesChange } = await setup();

      await user.click(rowButton(1, 'Move this date down'));

      expect(lastValues(datesChange)).toEqual([200, 400, 300]);
    });

    it('keeps editing the same date when it is moved', async () => {
      const { user, datesChange } = await setup();

      await user.click(rowButton(0, 'Edit this date'));
      await user.click(rowButton(0, 'Move this date down'));
      expect(screen.getByText('date #2')).toBeTruthy();

      await user.click(screen.getByRole('button', { name: 'change date' }));
      await user.click(screen.getByRole('button', { name: 'Accept date changes' }));

      expect(lastValues(datesChange)).toEqual([300, 500, 400]);
    });
  });
});
