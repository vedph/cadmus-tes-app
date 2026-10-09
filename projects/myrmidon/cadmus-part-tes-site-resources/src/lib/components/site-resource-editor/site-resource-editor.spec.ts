import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { DecoratedCount } from '@myrmidon/cadmus-refs-decorated-counts';
import { AssertedHistoricalDate } from '@myrmidon/cadmus-refs-historical-date';
import { AssertedLocation } from '@myrmidon/cadmus-part-geo-asserted-locations';

import { SiteResource } from '../../site-resources-part';
import { SiteResourceEditor } from './site-resource-editor';

// --- stubs for the complex child editors, each rendering its received
// data and a button to emit a fixed new value

const LOCATION: AssertedLocation = {
  value: { label: 'Quarry A', latitude: 41.9, longitude: 12.5 },
};
const DATE: AssertedHistoricalDate = { a: { value: 200 } };
const COUNTS: DecoratedCount[] = [{ id: 'blocks', value: 3 }];

@Component({
  selector: 'cadmus-thesaurus-entries-picker',
  template: `<ul aria-label="picked features">
      @for (e of entries(); track e.id) {
        <li>{{ e.value }}</li>
      }
    </ul>
    <button type="button" (click)="pick()">pick features</button>`,
})
class ThesaurusEntriesPickerStub {
  public readonly availableEntries = input.required<ThesaurusEntry[]>();
  public readonly entries = input<ThesaurusEntry[]>([]);
  public readonly hierarchicLabels = input<boolean>(false);
  public readonly entriesChange = output<ThesaurusEntry[]>();

  public pick(): void {
    this.entriesChange.emit(this.availableEntries().slice(0, 2));
  }
}

@Component({
  selector: 'cadmus-asserted-location',
  template: `<p>location: {{ location()?.value?.label }}</p>
    <p>location assertion tags: {{ assTagEntries()?.length ?? 0 }}</p>
    <button type="button" (click)="locationChange.emit(value)">set location</button>`,
})
class AssertedLocationStub {
  public readonly value = LOCATION;
  public readonly location = input<AssertedLocation>();
  public readonly locTagEntries = input<ThesaurusEntry[]>();
  public readonly assTagEntries = input<ThesaurusEntry[]>();
  public readonly refTypeEntries = input<ThesaurusEntry[]>();
  public readonly refTagEntries = input<ThesaurusEntry[]>();
  public readonly lookupProviderOptions = input<unknown>();
  public readonly locationChange = output<AssertedLocation>();
}

@Component({
  selector: 'cadmus-refs-asserted-historical-date',
  template: `<p>date: {{ date()?.a?.value }}</p>
    <button type="button" (click)="dateChange.emit(value)">set date</button>`,
})
class AssertedHistoricalDateStub {
  public readonly value = DATE;
  public readonly date = input<AssertedHistoricalDate>();
  public readonly tagEntries = input<ThesaurusEntry[]>();
  public readonly assertionTagEntries = input<ThesaurusEntry[]>();
  public readonly docReferenceTypeEntries = input<ThesaurusEntry[]>();
  public readonly docReferenceTagEntries = input<ThesaurusEntry[]>();
  public readonly dateChange = output<AssertedHistoricalDate>();
}

@Component({
  selector: 'cadmus-refs-decorated-counts',
  template: `<p>counts: {{ counts()?.length ?? 0 }}</p>
    <button type="button" (click)="countsChange.emit(value)">set counts</button>`,
})
class DecoratedCountsStub {
  public readonly value = COUNTS;
  public readonly counts = input<DecoratedCount[]>();
  public readonly allowCustomId = input<boolean>();
  public readonly idEntries = input<ThesaurusEntry[]>();
  public readonly tagEntries = input<ThesaurusEntry[]>();
  public readonly countsChange = output<DecoratedCount[]>();
}

const COMPONENT_IMPORTS = [
  ReactiveFormsModule,
  MatButtonModule,
  MatCheckboxModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatSelectModule,
  MatTooltipModule,
  ThesaurusEntriesPickerStub,
  AssertedLocationStub,
  AssertedHistoricalDateStub,
  DecoratedCountsStub,
];

const PROVIDERS = [{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }];

const TYPE_ENTRIES: ThesaurusEntry[] = [
  { id: 'quarry', value: 'quarry' },
  { id: 'mine', value: 'mine' },
];
const TAG_ENTRIES: ThesaurusEntry[] = [
  { id: 'ancient', value: 'ancient' },
  { id: 'modern', value: 'modern' },
];
const FEATURE_ENTRIES: ThesaurusEntry[] = [
  { id: 'f1', value: 'feature one' },
  { id: 'f2', value: 'feature two' },
  { id: 'f3', value: 'feature three' },
];

async function setup(inputs: Record<string, unknown> = {}) {
  const resourceChange = vi.fn();
  const cancelEdit = vi.fn();
  const result = await render(SiteResourceEditor, {
    componentImports: COMPONENT_IMPORTS,
    providers: PROVIDERS,
    inputs,
    on: { cancelEdit },
  });
  // resource is a model: its change output is not accepted by "on"
  result.fixture.componentInstance.resource.subscribe(resourceChange);
  await result.fixture.whenStable();
  return { ...result, resourceChange, cancelEdit, user: userEvent.setup() };
}

function acceptButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Accept changes' }) as HTMLButtonElement;
}

describe('SiteResourceEditor', () => {
  describe('free text fields (no thesauri)', () => {
    it('renders empty text inputs for type, tag and EID', async () => {
      await setup();
      expect(screen.getByRole('textbox', { name: 'type' })).toHaveProperty('value', '');
      expect(screen.getByRole('textbox', { name: 'tag' })).toHaveProperty('value', '');
      expect(screen.getByRole('textbox', { name: 'EID' })).toHaveProperty('value', '');
      expect(screen.queryByRole('combobox')).toBeNull();
    });

    it('does not render features or counts without their thesauri', async () => {
      await setup();
      expect(screen.queryByRole('group', { name: 'features' })).toBeNull();
      expect(screen.queryByRole('group', { name: 'counts' })).toBeNull();
    });

    it('populates the fields from the resource', async () => {
      await setup({ resource: { eid: 'r1', type: 'quarry', tag: 'ancient' } });
      expect(screen.getByRole('textbox', { name: 'type' })).toHaveProperty('value', 'quarry');
      expect(screen.getByRole('textbox', { name: 'tag' })).toHaveProperty('value', 'ancient');
      expect(screen.getByRole('textbox', { name: 'EID' })).toHaveProperty('value', 'r1');
    });

    it('disables accept while the form is pristine', async () => {
      await setup({ resource: { type: 'quarry' } });
      expect(acceptButton().disabled).toBe(true);
    });

    it('saves the edited resource', async () => {
      const { user, resourceChange } = await setup({ resource: { type: 'quarry' } });

      await user.clear(screen.getByRole('textbox', { name: 'type' }));
      await user.type(screen.getByRole('textbox', { name: 'type' }), 'mine');
      await user.type(screen.getByRole('textbox', { name: 'tag' }), 'modern');
      await user.type(screen.getByRole('textbox', { name: 'EID' }), 'm1');
      expect(acceptButton().disabled).toBe(false);
      await user.click(acceptButton());

      expect(resourceChange).toHaveBeenCalledTimes(1);
      expect(resourceChange).toHaveBeenCalledWith({
        eid: 'm1',
        type: 'mine',
        tag: 'modern',
        features: undefined,
        location: undefined,
        date: undefined,
        counts: undefined,
      });
      // pristine again after save
      expect(acceptButton().disabled).toBe(true);
    });

    it('saves blank EID and tag as undefined', async () => {
      const { user, resourceChange } = await setup({
        resource: { eid: 'r1', type: 'quarry', tag: 'ancient' },
      });

      await user.clear(screen.getByRole('textbox', { name: 'EID' }));
      await user.clear(screen.getByRole('textbox', { name: 'tag' }));
      await user.type(screen.getByRole('textbox', { name: 'tag' }), '  ');
      await user.click(acceptButton());

      const saved = resourceChange.mock.calls[0][0] as SiteResource;
      expect(saved.eid).toBeUndefined();
      expect(saved.tag).toBeUndefined();
      expect(saved.type).toBe('quarry');
    });

    it('requires a type', async () => {
      const { user, resourceChange } = await setup({ resource: { type: 'quarry' } });

      await user.clear(screen.getByRole('textbox', { name: 'type' }));
      // material shows errors once the control is touched
      await user.tab();

      expect(screen.getByText('type required')).toBeTruthy();
      expect(acceptButton().disabled).toBe(true);
      expect(resourceChange).not.toHaveBeenCalled();
    });

    it('signals a type too long', async () => {
      const { user } = await setup({ resource: { type: 'q' } });

      await user.type(screen.getByRole('textbox', { name: 'type' }), 'x'.repeat(100));
      await user.tab();

      expect(screen.getByText('type too long')).toBeTruthy();
      expect(acceptButton().disabled).toBe(true);
    });

    it('does not save an invalid form when submitted', async () => {
      const { user, resourceChange } = await setup({ resource: { type: 'quarry' } });
      const input = screen.getByRole('textbox', { name: 'type' });

      await user.clear(input);
      await user.type(input, '{Enter}');

      expect(resourceChange).not.toHaveBeenCalled();
    });

    it('saves when submitting with Enter', async () => {
      const { user, resourceChange } = await setup({ resource: { type: 'quarry' } });

      await user.type(screen.getByRole('textbox', { name: 'EID' }), 'x{Enter}');

      expect(resourceChange).toHaveBeenCalledTimes(1);
      expect((resourceChange.mock.calls[0][0] as SiteResource).eid).toBe('x');
    });

    it('emits cancelEdit when discarding', async () => {
      const { user, cancelEdit, resourceChange } = await setup({ resource: { type: 'quarry' } });

      await user.type(screen.getByRole('textbox', { name: 'EID' }), 'x');
      await user.click(screen.getByRole('button', { name: 'Discard changes' }));

      expect(cancelEdit).toHaveBeenCalledTimes(1);
      expect(resourceChange).not.toHaveBeenCalled();
    });

    it('resets the form when the resource is cleared', async () => {
      const { fixture } = await setup({ resource: { eid: 'r1', type: 'quarry' } });

      fixture.componentRef.setInput('resource', undefined);
      await fixture.whenStable();

      expect(screen.getByRole('textbox', { name: 'type' })).toHaveProperty('value', '');
      expect(screen.getByRole('textbox', { name: 'EID' })).toHaveProperty('value', '');
    });

    it('updates the form when the resource changes', async () => {
      const { fixture } = await setup({ resource: { eid: 'r1', type: 'quarry' } });

      fixture.componentRef.setInput('resource', { eid: 'r2', type: 'mine' });
      await fixture.whenStable();

      expect(screen.getByRole('textbox', { name: 'type' })).toHaveProperty('value', 'mine');
      expect(screen.getByRole('textbox', { name: 'EID' })).toHaveProperty('value', 'r2');
      expect(acceptButton().disabled).toBe(true);
    });
  });

  describe('bound fields (with thesauri)', () => {
    it('renders type and tag as selects', async () => {
      await setup({
        typeEntries: TYPE_ENTRIES,
        tagEntries: TAG_ENTRIES,
        resource: { type: 'quarry', tag: 'ancient' },
      });
      const type = screen.getByRole('combobox', { name: 'type' });
      const tag = screen.getByRole('combobox', { name: 'tag' });
      expect(type.textContent).toContain('quarry');
      expect(tag.textContent).toContain('ancient');
      expect(screen.queryByRole('textbox', { name: 'type' })).toBeNull();
      expect(screen.queryByRole('textbox', { name: 'tag' })).toBeNull();
    });

    it('saves the type and tag picked from the selects', async () => {
      const { user, resourceChange } = await setup({
        typeEntries: TYPE_ENTRIES,
        tagEntries: TAG_ENTRIES,
        resource: { type: 'quarry' },
      });

      await user.click(screen.getByRole('combobox', { name: 'type' }));
      await user.click(await screen.findByRole('option', { name: 'mine' }));
      await user.click(screen.getByRole('combobox', { name: 'tag' }));
      await user.click(await screen.findByRole('option', { name: 'modern' }));
      await user.click(acceptButton());

      expect(resourceChange).toHaveBeenCalledTimes(1);
      const saved = resourceChange.mock.calls[0][0] as SiteResource;
      expect(saved.type).toBe('mine');
      expect(saved.tag).toBe('modern');
    });
  });

  describe('features', () => {
    it('shows the resource features with their thesaurus labels', async () => {
      await setup({
        featureEntries: FEATURE_ENTRIES,
        resource: { type: 'quarry', features: ['f2', 'unknown'] },
      });
      const list = within(screen.getByRole('group', { name: 'features' })).getByRole('list', {
        name: 'picked features',
      });
      const items = within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent?.trim());
      expect(items).toEqual(['feature two', 'unknown']);
    });

    it('saves the picked features as IDs', async () => {
      const { user, resourceChange } = await setup({
        featureEntries: FEATURE_ENTRIES,
        resource: { type: 'quarry' },
      });

      await user.click(screen.getByRole('button', { name: 'pick features' }));
      await user.click(acceptButton());

      expect((resourceChange.mock.calls[0][0] as SiteResource).features).toEqual(['f1', 'f2']);
    });

    it('keeps existing features when saving other changes', async () => {
      const { user, resourceChange } = await setup({
        featureEntries: FEATURE_ENTRIES,
        resource: { type: 'quarry', features: ['f3'] },
      });

      await user.type(screen.getByRole('textbox', { name: 'EID' }), 'x');
      await user.click(acceptButton());

      expect((resourceChange.mock.calls[0][0] as SiteResource).features).toEqual(['f3']);
    });
  });

  describe('location', () => {
    it('hides the location editor until checked', async () => {
      const { user } = await setup({ resource: { type: 'quarry' } });
      const checkbox = screen.getByRole('checkbox', { name: 'location' });
      expect((checkbox as HTMLInputElement).checked).toBe(false);
      expect(screen.queryByRole('button', { name: 'set location' })).toBeNull();

      await user.click(checkbox);

      expect(screen.getByRole('group', { name: 'location' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'set location' })).toBeTruthy();
    });

    it('shows the existing location', async () => {
      await setup({ resource: { type: 'quarry', location: LOCATION } });
      expect(
        (screen.getByRole('checkbox', { name: 'location' }) as HTMLInputElement).checked,
      ).toBe(true);
      expect(screen.getByText('location: Quarry A')).toBeTruthy();
    });

    it('passes assertion tags to the location editor', async () => {
      await setup({
        resource: { type: 'quarry', location: LOCATION },
        assTagEntries: [{ id: 'a', value: 'a' }],
      });
      expect(screen.getByText('location assertion tags: 1')).toBeTruthy();
    });

    it('saves the edited location', async () => {
      const { user, resourceChange } = await setup({ resource: { type: 'quarry' } });

      await user.click(screen.getByRole('checkbox', { name: 'location' }));
      await user.click(screen.getByRole('button', { name: 'set location' }));
      await user.click(acceptButton());

      expect((resourceChange.mock.calls[0][0] as SiteResource).location).toEqual(LOCATION);
    });

    it('drops the location when unchecked', async () => {
      const { user, resourceChange } = await setup({
        resource: { type: 'quarry', location: LOCATION },
      });

      await user.click(screen.getByRole('checkbox', { name: 'location' }));
      expect(screen.queryByRole('button', { name: 'set location' })).toBeNull();
      await user.click(acceptButton());

      expect((resourceChange.mock.calls[0][0] as SiteResource).location).toBeUndefined();
    });
  });

  describe('date', () => {
    it('hides the date editor until checked', async () => {
      const { user } = await setup({ resource: { type: 'quarry' } });
      expect(screen.queryByRole('button', { name: 'set date' })).toBeNull();

      await user.click(screen.getByRole('checkbox', { name: 'date' }));

      expect(screen.getByRole('button', { name: 'set date' })).toBeTruthy();
    });

    it('shows the existing date', async () => {
      await setup({ resource: { type: 'quarry', date: DATE } });
      expect((screen.getByRole('checkbox', { name: 'date' }) as HTMLInputElement).checked).toBe(
        true,
      );
      expect(screen.getByText('date: 200')).toBeTruthy();
    });

    it('saves the edited date', async () => {
      const { user, resourceChange } = await setup({ resource: { type: 'quarry' } });

      await user.click(screen.getByRole('checkbox', { name: 'date' }));
      await user.click(screen.getByRole('button', { name: 'set date' }));
      await user.click(acceptButton());

      expect((resourceChange.mock.calls[0][0] as SiteResource).date).toEqual(DATE);
    });

    it('drops the date when unchecked', async () => {
      const { user, resourceChange } = await setup({ resource: { type: 'quarry', date: DATE } });

      await user.click(screen.getByRole('checkbox', { name: 'date' }));
      await user.click(acceptButton());

      expect((resourceChange.mock.calls[0][0] as SiteResource).date).toBeUndefined();
    });
  });

  describe('counts', () => {
    it('shows the counts editor only with count IDs thesaurus', async () => {
      await setup({
        countIdEntries: [{ id: 'blocks', value: 'blocks' }],
        resource: { type: 'quarry', counts: COUNTS },
      });
      expect(screen.getByRole('group', { name: 'counts' })).toBeTruthy();
      expect(screen.getByText('counts: 1')).toBeTruthy();
    });

    it('saves the edited counts', async () => {
      const { user, resourceChange } = await setup({
        countIdEntries: [{ id: 'blocks', value: 'blocks' }],
        resource: { type: 'quarry' },
      });

      await user.click(screen.getByRole('button', { name: 'set counts' }));
      await user.click(acceptButton());

      expect((resourceChange.mock.calls[0][0] as SiteResource).counts).toEqual(COUNTS);
    });
  });

  describe('nested in a parent form', () => {
    it('does not propagate its submit to the parent form', async () => {
      const outerSubmit = vi.fn();
      const resourceChange = vi.fn();
      const user = userEvent.setup();
      await render(
        `<form (submit)="outerSubmit()">
          <cadmus-site-resource-editor
            [resource]="resource"
            (resourceChange)="resourceChange($event)"
          />
        </form>`,
        {
          imports: [SiteResourceEditor],
          providers: PROVIDERS,
          componentProperties: {
            outerSubmit,
            resourceChange,
            resource: { type: 'quarry' } as SiteResource,
          },
        },
      );

      await user.type(screen.getByRole('textbox', { name: 'EID' }), 'x');
      await user.click(acceptButton());

      expect(resourceChange).toHaveBeenCalledTimes(1);
      expect(outerSubmit).not.toHaveBeenCalled();
    });
  });
});
