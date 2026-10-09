import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { AuthJwtService, User } from '@myrmidon/auth-jwt-login';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { EditedObject, PartIdentity, ThesauriSet } from '@myrmidon/cadmus-core';
import { AppRepository } from '@myrmidon/cadmus-state';
import { EditorHelpService } from '@myrmidon/cadmus-ui';

import { SITE_RESOURCES_PART_TYPEID, SiteResource, SiteResourcesPart } from '../../site-resources-part';
import { SiteResourcesPartComponent } from './site-resources-part.component';

const THESAURI: ThesauriSet = {
  'site-resource-types': {
    id: 'site-resource-types@en',
    language: 'en',
    entries: [
      { id: 'quarry', value: 'Quarry' },
      { id: 'mine', value: 'Mine' },
    ],
  },
  'site-resource-tags': {
    id: 'site-resource-tags@en',
    language: 'en',
    entries: [
      { id: 'ancient', value: 'Ancient' },
      { id: 'modern', value: 'Modern' },
    ],
  },
};

function createPart(resources: SiteResource[]): SiteResourcesPart {
  return {
    id: 'a0a0a0a0-0000-0000-0000-000000000001',
    itemId: 'b0b0b0b0-0000-0000-0000-000000000001',
    typeId: SITE_RESOURCES_PART_TYPEID,
    roleId: undefined,
    timeCreated: new Date(),
    creatorId: 'zeus',
    timeModified: new Date(),
    userId: 'zeus',
    resources,
  };
}

const RESOURCES: SiteResource[] = [
  {
    eid: 'r1',
    type: 'quarry',
    tag: 'ancient',
    location: { value: { label: 'Mount Pentelicus', latitude: 38.1, longitude: 23.9 } },
    date: { a: { value: 200 } },
  },
  { eid: 'r2', type: 'mine' },
  { eid: 'r3', type: 'other', tag: 'unlisted' },
];

interface SetupOptions {
  resources?: SiteResource[];
  thesauri?: ThesauriSet;
  roles?: string[];
  identity?: PartIdentity;
  confirm?: () => ReturnType<DialogService['confirm']>;
  /**
   * True to render the component inside a host template rather than as the
   * fixture root component, which always gets refreshed on change detection.
   */
  hosted?: boolean;
}

async function setup(options: SetupOptions = {}) {
  const user: User = {
    userName: 'zeus',
    email: 'zeus@olympus.org',
    firstName: 'Zeus',
    lastName: 'Olympian',
    roles: options.roles ?? ['admin'],
  } as User;
  const authService = {
    currentUserValue: user,
    currentUser$: new BehaviorSubject<User | null>(user),
  };
  const appRepository = {
    getSettingFor: vi.fn().mockResolvedValue({
      lookupProviderOptions: { scopes: {} },
    }),
    getTypeThesaurus: vi.fn().mockReturnValue(undefined),
  };
  const dialogService = {
    confirm: vi.fn(options.confirm ?? (() => of(true))),
  };

  const dataChange = vi.fn();
  const editorClose = vi.fn();
  const dirtyChange = vi.fn();

  const data: EditedObject<SiteResourcesPart> = {
    value: createPart(structuredClone(options.resources ?? RESOURCES)),
    thesauri: options.thesauri ?? THESAURI,
  };

  const providers = [
    { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
    { provide: AuthJwtService, useValue: authService },
    { provide: AppRepository, useValue: appRepository },
    { provide: DialogService, useValue: dialogService },
    { provide: EditorHelpService, useValue: { resolveUrl: () => Promise.resolve(undefined) } },
  ];

  const result = options.hosted
    ? await render(
        `<cadmus-site-resources-part
          [data]="data"
          (dataChange)="dataChange($event)"
          (editorClose)="editorClose()"
          (dirtyChange)="dirtyChange($event)"
        />`,
        {
          imports: [SiteResourcesPartComponent],
          providers,
          componentProperties: { data, dataChange, editorClose, dirtyChange },
        },
      )
    : await render(SiteResourcesPartComponent, {
        providers,
        inputs: {
          data,
          ...(options.identity ? { identity: options.identity } : {}),
        },
        on: { editorClose, dirtyChange },
      });
  if (!options.hosted) {
    // data is a model: its change output is not accepted by "on"
    (result.fixture.componentInstance as SiteResourcesPartComponent).data.subscribe(dataChange);
  }
  await result.fixture.whenStable();

  return {
    ...result,
    user: userEvent.setup(),
    appRepository,
    dialogService,
    dataChange,
    editorClose,
    dirtyChange,
  };
}

/** Get the body rows of the resources table, as arrays of cell texts. */
function getRows(): string[][] {
  const table = screen.queryByRole('table');
  if (!table) {
    return [];
  }
  const [, body] = within(table).getAllByRole('rowgroup');
  return within(body)
    .queryAllByRole('row')
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .slice(1)
        .map((cell) => cell.textContent?.trim() ?? ''),
    );
}

function getRowButton(rowIndex: number, name: string): HTMLButtonElement {
  const table = screen.getByRole('table');
  const [, body] = within(table).getAllByRole('rowgroup');
  const row = within(body).getAllByRole('row')[rowIndex];
  return within(row).getByRole('button', { name }) as HTMLButtonElement;
}

function getSavedResources(dataChange: ReturnType<typeof vi.fn>): SiteResource[] {
  const data = dataChange.mock.calls.at(-1)![0] as EditedObject<SiteResourcesPart>;
  return data.value!.resources;
}

describe('SiteResourcesPartComponent', () => {
  describe('display', () => {
    it('shows the default title', async () => {
      await setup();
      expect(screen.getByText('Site Resources Part')).toBeTruthy();
    });

    it('lists resources with thesaurus labels for type and tag', async () => {
      await setup();
      const rows = getRows();
      expect(rows.length).toBe(3);
      expect(rows[0].slice(0, 4)).toEqual(['r1', 'Quarry', 'Ancient', 'Mount Pentelicus']);
      expect(rows[0][4]).toMatch(/200/);
      expect(rows[1].slice(0, 3)).toEqual(['r2', 'Mine', '']);
      // IDs not found in thesauri are shown as they are
      expect(rows[2].slice(0, 3)).toEqual(['r3', 'other', 'unlisted']);
    });

    it('shows raw IDs without thesauri', async () => {
      await setup({ thesauri: {} });
      expect(getRows()[0].slice(0, 3)).toEqual(['r1', 'quarry', 'ancient']);
    });

    it('shows no table without resources', async () => {
      await setup({ resources: [] });
      expect(screen.queryByRole('table')).toBeNull();
    });

    it('disables the first move up and last move down buttons', async () => {
      await setup();
      expect(getRowButton(0, 'Move this resource up').disabled).toBe(true);
      expect(getRowButton(0, 'Move this resource down').disabled).toBe(false);
      expect(getRowButton(2, 'Move this resource up').disabled).toBe(false);
      expect(getRowButton(2, 'Move this resource down').disabled).toBe(true);
    });

    it('does not show the editor initially', async () => {
      await setup();
      expect(screen.queryByText(/resource #/)).toBeNull();
    });
  });

  describe('settings', () => {
    it('loads settings for the part type and role', async () => {
      const { appRepository } = await setup({
        identity: {
          itemId: 'b0b0b0b0-0000-0000-0000-000000000001',
          typeId: SITE_RESOURCES_PART_TYPEID,
          partId: 'a0a0a0a0-0000-0000-0000-000000000001',
          roleId: 'role',
        } as PartIdentity,
      });
      expect(appRepository.getSettingFor).toHaveBeenCalledWith(SITE_RESOURCES_PART_TYPEID, 'role');
    });
  });

  describe('adding', () => {
    it('opens a new resource with the first type', async () => {
      const { user } = await setup();

      await user.click(screen.getByRole('button', { name: 'resource' }));

      expect(screen.getByText('resource #0')).toBeTruthy();
      expect(screen.getByRole('combobox', { name: 'type' }).textContent).toContain('Quarry');
    });

    it('opens a new resource with an empty type without thesaurus', async () => {
      const { user } = await setup({ thesauri: {} });

      await user.click(screen.getByRole('button', { name: 'resource' }));

      expect(screen.getByRole('textbox', { name: 'type' })).toHaveProperty('value', '');
    });

    it('appends the accepted new resource', async () => {
      const { user, dirtyChange, dataChange } = await setup({ resources: [], thesauri: {} });

      await user.click(screen.getByRole('button', { name: 'resource' }));
      await user.type(screen.getByRole('textbox', { name: 'type' }), 'spring');
      await user.type(screen.getByRole('textbox', { name: 'EID' }), 's1');
      await user.click(screen.getByRole('button', { name: 'Accept changes' }));

      expect(getRows().map((r) => r.slice(0, 2))).toEqual([['s1', 'spring']]);
      // editor closed
      expect(screen.queryByText(/resource #/)).toBeNull();
      expect(dirtyChange).toHaveBeenLastCalledWith(true);
      // accepting the resource must not save the whole part
      expect(dataChange).not.toHaveBeenCalled();
    });

    it('discards the new resource on cancel', async () => {
      const { user } = await setup();

      await user.click(screen.getByRole('button', { name: 'resource' }));
      await user.click(screen.getByRole('button', { name: 'Discard changes' }));

      expect(screen.queryByText(/resource #/)).toBeNull();
      expect(getRows().length).toBe(3);
    });
  });

  describe('editing', () => {
    it('opens the clicked resource and highlights its row', async () => {
      const { user } = await setup();

      await user.click(getRowButton(1, 'Edit this resource'));

      expect(screen.getByText('resource #2')).toBeTruthy();
      expect(screen.getByRole('textbox', { name: 'EID' })).toHaveProperty('value', 'r2');
      const [, body] = within(screen.getByRole('table')).getAllByRole('rowgroup');
      const rows = within(body).getAllByRole('row');
      expect(rows.map((r) => r.classList.contains('selected'))).toEqual([false, true, false]);
    });

    it('replaces the edited resource in place', async () => {
      const { user, dataChange } = await setup();

      await user.click(getRowButton(1, 'Edit this resource'));
      const eid = screen.getByRole('textbox', { name: 'EID' });
      await user.clear(eid);
      await user.type(eid, 'r2-edited');
      await user.click(screen.getByRole('button', { name: 'Accept changes' }));

      expect(getRows().map((r) => r[0])).toEqual(['r1', 'r2-edited', 'r3']);
      expect(dataChange).not.toHaveBeenCalled();
    });

    it('does not change the resource on cancel', async () => {
      const { user } = await setup();

      await user.click(getRowButton(1, 'Edit this resource'));
      await user.type(screen.getByRole('textbox', { name: 'EID' }), 'xxx');
      await user.click(screen.getByRole('button', { name: 'Discard changes' }));

      expect(getRows().map((r) => r[0])).toEqual(['r1', 'r2', 'r3']);
    });

    it('keeps tracking the edited resource when it is moved', async () => {
      const { user } = await setup();

      await user.click(getRowButton(1, 'Edit this resource'));
      await user.click(getRowButton(1, 'Move this resource up'));
      expect(screen.getByText('resource #1')).toBeTruthy();

      const eid = screen.getByRole('textbox', { name: 'EID' });
      await user.clear(eid);
      await user.type(eid, 'r2-edited');
      await user.click(screen.getByRole('button', { name: 'Accept changes' }));

      expect(getRows().map((r) => r[0])).toEqual(['r2-edited', 'r1', 'r3']);
    });

    it('keeps tracking the edited resource when a neighbor is moved over it', async () => {
      const { user } = await setup();

      await user.click(getRowButton(1, 'Edit this resource'));
      await user.click(getRowButton(2, 'Move this resource up'));
      expect(screen.getByText('resource #3')).toBeTruthy();

      const eid = screen.getByRole('textbox', { name: 'EID' });
      await user.clear(eid);
      await user.type(eid, 'r2-edited');
      await user.click(screen.getByRole('button', { name: 'Accept changes' }));

      expect(getRows().map((r) => r[0])).toEqual(['r1', 'r3', 'r2-edited']);
    });

    it('keeps tracking the edited resource when a previous one is deleted', async () => {
      const { user } = await setup();

      await user.click(getRowButton(2, 'Edit this resource'));
      await user.click(getRowButton(0, 'Delete this resource'));
      expect(screen.getByText('resource #2')).toBeTruthy();

      const eid = screen.getByRole('textbox', { name: 'EID' });
      await user.clear(eid);
      await user.type(eid, 'r3-edited');
      await user.click(screen.getByRole('button', { name: 'Accept changes' }));

      expect(getRows().map((r) => r[0])).toEqual(['r2', 'r3-edited']);
    });
  });

  describe('moving', () => {
    it('moves a resource up', async () => {
      const { user, dirtyChange } = await setup();

      await user.click(getRowButton(2, 'Move this resource up'));

      expect(getRows().map((r) => r[0])).toEqual(['r1', 'r3', 'r2']);
      expect(dirtyChange).toHaveBeenLastCalledWith(true);
    });

    it('moves a resource down', async () => {
      const { user } = await setup();

      await user.click(getRowButton(0, 'Move this resource down'));

      expect(getRows().map((r) => r[0])).toEqual(['r2', 'r1', 'r3']);
    });
  });

  describe('deleting', () => {
    it('deletes a resource after confirmation', async () => {
      const { user, dialogService, dirtyChange } = await setup();

      await user.click(getRowButton(1, 'Delete this resource'));

      expect(dialogService.confirm).toHaveBeenCalledWith('Confirmation', 'Delete resource?');
      expect(getRows().map((r) => r[0])).toEqual(['r1', 'r3']);
      expect(dirtyChange).toHaveBeenLastCalledWith(true);
    });

    it('does not delete a resource when not confirmed', async () => {
      const { user } = await setup({ confirm: () => of(false) });

      await user.click(getRowButton(1, 'Delete this resource'));

      expect(getRows().map((r) => r[0])).toEqual(['r1', 'r2', 'r3']);
    });

    it('refreshes the list when confirmation arrives later', async () => {
      const answer$ = new Subject<boolean>();
      const { user, fixture } = await setup({ confirm: () => answer$, hosted: true });

      // make the form dirty first, so that deleting emits no dirty change
      await user.click(getRowButton(0, 'Move this resource down'));
      await user.click(getRowButton(1, 'Delete this resource'));
      expect(getRows().length).toBe(3);

      answer$.next(true);
      answer$.complete();
      await fixture.whenStable();

      expect(getRows().map((r) => r[0])).toEqual(['r2', 'r3']);
    });

    it('closes the editor when deleting the edited resource', async () => {
      const { user } = await setup();

      await user.click(getRowButton(1, 'Edit this resource'));
      await user.click(getRowButton(1, 'Delete this resource'));

      expect(screen.queryByText(/resource #/)).toBeNull();
    });
  });

  describe('saving and closing', () => {
    it('disables save without resources', async () => {
      await setup({ resources: [] });
      expect((screen.getByRole('button', { name: 'save' }) as HTMLButtonElement).disabled).toBe(
        true,
      );
    });

    it('saves the part with its resources', async () => {
      const { user, dataChange, dirtyChange } = await setup();

      await user.click(getRowButton(0, 'Move this resource down'));
      await user.click(screen.getByRole('button', { name: 'save' }));

      expect(dataChange).toHaveBeenCalledTimes(1);
      expect(getSavedResources(dataChange).map((r) => r.eid)).toEqual(['r2', 'r1', 'r3']);
      const saved = dataChange.mock.calls[0][0] as EditedObject<SiteResourcesPart>;
      expect(saved.value!.typeId).toBe(SITE_RESOURCES_PART_TYPEID);
      expect(dirtyChange).toHaveBeenLastCalledWith(false);
    });

    it('hides save for users below operator level', async () => {
      await setup({ roles: ['visitor'] });
      expect(screen.queryByRole('button', { name: 'save' })).toBeNull();
      expect(screen.getByRole('button', { name: 'close' })).toBeTruthy();
    });

    it('emits editorClose on close', async () => {
      const { user, editorClose } = await setup();

      await user.click(screen.getByRole('button', { name: 'close' }));

      expect(editorClose).toHaveBeenCalledTimes(1);
    });

    it('resets the resources when data is cleared', async () => {
      const { fixture } = await setup();

      fixture.componentRef.setInput('data', undefined);
      await fixture.whenStable();

      expect(screen.queryByRole('table')).toBeNull();
    });
  });
});
