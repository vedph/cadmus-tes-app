import { Component, input, model, output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';

import { ItemService, ThesaurusService } from '@myrmidon/cadmus-api';
import { EditedObject, PartIdentity } from '@myrmidon/cadmus-core';
import { PartEditorService } from '@myrmidon/cadmus-state';

import { SITE_RESOURCES_PART_TYPEID, SiteResourcesPart } from '../../site-resources-part';
import { SiteResourcesPartFeature } from './site-resources-part-feature';

const THESAURI_IDS = [
  'site-resource-types',
  'site-resource-tags',
  'site-resource-features',
  'asserted-historical-date-tags',
  'doc-reference-types',
  'doc-reference-tags',
  'site-resource-count-ids',
  'site-resource-count-tags',
  'geo-location-tags',
  'assertion-tags',
];

@Component({
  selector: 'cadmus-current-item-bar',
  template: '<p>item bar</p>',
})
class CurrentItemBarStub {}

@Component({
  selector: 'cadmus-site-resources-part',
  template: `<p>item: {{ identity()?.itemId }}</p>
    <p>type: {{ identity()?.typeId }}</p>
    <p>part: {{ identity()?.partId ?? 'none' }}</p>
    <p>role: {{ identity()?.roleId ?? 'none' }}</p>
    <p>resources: {{ data()?.value?.resources?.length ?? 'no data' }}</p>
    <button type="button" (click)="save()">save part</button>
    <button type="button" (click)="editorClose.emit()">close part</button>
    <button type="button" (click)="dirtyChange.emit(true)">make dirty</button>`,
})
class SiteResourcesPartStub {
  public readonly identity = input<PartIdentity>();
  public readonly data = model<EditedObject<SiteResourcesPart>>();
  public readonly editorClose = output();
  public readonly dirtyChange = output<boolean>();

  public save(): void {
    this.data.set({ ...this.data()! });
  }
}

function createPart(): SiteResourcesPart {
  return {
    id: 'p1',
    itemId: 'i1',
    typeId: SITE_RESOURCES_PART_TYPEID,
    timeCreated: new Date(),
    creatorId: 'zeus',
    timeModified: new Date(),
    userId: 'zeus',
    resources: [{ type: 'quarry' }, { type: 'mine' }],
  };
}

interface SetupOptions {
  pid?: string;
  rid?: string;
  load?: () => Promise<EditedObject<SiteResourcesPart> | null>;
  save?: () => Promise<SiteResourcesPart>;
}

async function setup(options: SetupOptions = {}) {
  const part = createPart();
  const router = { navigate: vi.fn() };
  const snackbar = { open: vi.fn() };
  const editorService = {
    loading$: of(false),
    saving$: of(false),
    load: vi.fn<
      (identity: PartIdentity, ids: string[]) => Promise<EditedObject<SiteResourcesPart> | null>
    >(
      options.load ??
        (() =>
          Promise.resolve({
            value: part,
            thesauri: {},
          })),
    ),
    save: vi.fn<(part: SiteResourcesPart) => Promise<SiteResourcesPart>>(options.save ?? (() => Promise.resolve({ ...part, id: 'saved-id' }))),
  };
  const route = {
    snapshot: {
      params: { iid: 'i1', pid: options.pid ?? 'p1' },
      queryParams: options.rid !== undefined ? { rid: options.rid } : {},
      routeConfig: { path: `${SITE_RESOURCES_PART_TYPEID}/:pid` },
    },
  };

  const result = await render(SiteResourcesPartFeature, {
    componentImports: [CurrentItemBarStub, SiteResourcesPartStub],
    providers: [
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: route },
      { provide: MatSnackBar, useValue: snackbar },
      { provide: ItemService, useValue: {} },
      { provide: ThesaurusService, useValue: {} },
      { provide: PartEditorService, useValue: editorService },
    ],
  });
  await result.fixture.whenStable();
  return { ...result, router, snackbar, editorService, user: userEvent.setup() };
}

describe('SiteResourcesPartFeature', () => {
  it('renders the item bar and the part editor', async () => {
    await setup();
    expect(screen.getByText('item bar')).toBeTruthy();
    expect(screen.getByText('resources: 2')).toBeTruthy();
  });

  it('builds the part identity from the route', async () => {
    await setup({ rid: 'r' });
    expect(screen.getByText('item: i1')).toBeTruthy();
    expect(screen.getByText(`type: ${SITE_RESOURCES_PART_TYPEID}`)).toBeTruthy();
    expect(screen.getByText('part: p1')).toBeTruthy();
    expect(screen.getByText('role: r')).toBeTruthy();
  });

  it('treats "new" part and "default" role as null', async () => {
    await setup({ pid: 'new', rid: 'default' });
    expect(screen.getByText('part: none')).toBeTruthy();
    expect(screen.getByText('role: none')).toBeTruthy();
  });

  it('loads the part with all its thesauri', async () => {
    const { editorService } = await setup();
    expect(editorService.load).toHaveBeenCalledTimes(1);
    const [identity, ids] = editorService.load.mock.calls[0];
    expect(identity.partId).toBe('p1');
    expect(ids).toEqual(THESAURI_IDS);
  });

  it('suffixes thesauri IDs with the role and aliases them', async () => {
    const thesaurus = { id: 'x', language: 'en', entries: [{ id: 'a', value: 'a' }] };
    const { editorService } = await setup({
      rid: 'r',
      load: () =>
        Promise.resolve({
          value: createPart(),
          thesauri: { 'site-resource-types_r': thesaurus },
        }),
    });
    const ids = editorService.load.mock.calls[0][1];
    expect(ids).toEqual(THESAURI_IDS.map((id) => id + '_r'));
  });

  it('notifies load errors', async () => {
    const { snackbar } = await setup({
      load: () => Promise.reject({ message: 'load failed' }),
    });
    expect(snackbar.open).toHaveBeenCalledWith('load failed', 'OK');
    expect(screen.getByText('resources: no data')).toBeTruthy();
  });

  it('saves the part when the editor changes its data', async () => {
    const { user, editorService, snackbar, fixture } = await setup();

    await user.click(screen.getByRole('button', { name: 'save part' }));
    await fixture.whenStable();

    expect(editorService.save).toHaveBeenCalledTimes(1);
    const saved = editorService.save.mock.calls[0][0];
    expect(saved.resources.length).toBe(2);
    expect(snackbar.open).toHaveBeenCalledWith('Part saved', 'OK', { duration: 3000 });
  });

  it('updates the identity of a new part once saved', async () => {
    const { user, fixture } = await setup({ pid: 'new' });

    await user.click(screen.getByRole('button', { name: 'save part' }));
    await fixture.whenStable();

    expect(screen.getByText('part: saved-id')).toBeTruthy();
  });

  it('notifies save errors and stays dirty', async () => {
    const { user, snackbar, fixture } = await setup({
      save: () => Promise.reject({ message: 'save failed' }),
    });

    await user.click(screen.getByRole('button', { name: 'save part' }));
    await fixture.whenStable();

    expect(snackbar.open).toHaveBeenCalledWith('save failed', 'OK');
    expect(fixture.componentInstance.canDeactivate()).toBe(false);
  });

  it('navigates back to the item on close', async () => {
    const { user, router } = await setup();

    await user.click(screen.getByRole('button', { name: 'close part' }));

    expect(router.navigate).toHaveBeenCalledWith(['items', 'i1']);
  });

  it('blocks deactivation while the editor is dirty', async () => {
    const { user, fixture } = await setup();
    expect(fixture.componentInstance.canDeactivate()).toBe(true);

    await user.click(screen.getByRole('button', { name: 'make dirty' }));

    expect(fixture.componentInstance.canDeactivate()).toBe(false);
  });
});
